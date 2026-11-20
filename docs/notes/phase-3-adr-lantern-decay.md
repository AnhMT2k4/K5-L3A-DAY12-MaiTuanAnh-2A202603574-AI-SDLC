# ADR: Thay đổi Mô hình Trạng thái Đèn Lồng và Luật Thắng (Phase 3 - Contract v1.2)

- **Trạng thái:** Đã chấp thuận (Accepted)
- **Ngày:** 2026-11-20
- **Tác giả:** Mai Tuấn Anh (2A202603574)
- **Vé yêu cầu:** TICKET-03 — CHANGE REQUEST "Đèn cạn dầu"

---

## 1. Bối cảnh (Context)
Trong Phase 1 và Phase 2, quy tắc trò chơi quy định:
- Khi một Đèn Lồng được nạp đủ đom đóm, nó sáng vĩnh viễn và không nhận thêm đom đóm.
- Người chơi thắng ngay lập tức khi toàn bộ các đèn trên đảo được thắp sáng (`all_lit`).
- Bóng Mực bị chặn tuyệt đối bên ngoài bán kính an toàn 6m của các đèn đã thắp.

Kết quả Playtest cho thấy những người chơi có kỹ năng cao hoàn thành thắp toàn bộ đèn chỉ trong 2 phút đầu, khiến giai đoạn cuối đêm bị thiếu kịch tính và độ căng thẳng cần thiết.

---

## 2. Quyết định Thiết kế (Decisions)

### 2.1. Mô hình Nhiên liệu và Hao hụt Đèn (Lantern Fuel Decay & Refuel)
1. **Nhiên liệu (Fuel):**
   - Đèn có dung lượng dầu tối đa `fuel_max = 100`.
   - Khi thắp (lần đầu hoặc thắp lại), đèn nhận `fuel = 100`.
   - Đèn đang sáng tự hao hụt `1.0 fuel/giây` (1/60 mỗi tick).
   - Để tránh sai số dấu phẩy động (float), nội bộ lưu trữ theo đơn vị nguyên `1/60` (`fuel_units = 0..6000`).
2. **Châm dầu (Refuel):**
   - Người chơi có thể tương tác với đèn đang sáng chưa đầy dầu (`fuel < 100`) để châm thêm:
     `used = min(carried, ceil((100 - fuel) / 10))`
     `fuel = min(100, fuel + 10 * used)`
     Tiêu tốn `used` đom đóm.
3. **Cạn dầu (Lantern Out) & Thắp lại (Relight):**
   - Khi `fuel <= 0`, đèn tắt (`lit = false`), `deposited = 0`, phát sinh sự kiện `lantern_out`.
   - Đèn ghi nhớ `ever_lit = true`. Khi thắp lại, chi phí giảm còn `relight_cost = 5` đom đóm (thay vì 10). Sự kiện thắp sáng mang cờ `relight: true`.

### 2.2. Trạng thái Bóng Mực Hút Dầu (Shade Drain State)
1. **Mất vùng an toàn:** Đèn có `fuel < 30` mất hoàn toàn vùng an toàn 6m.
2. **Hành vi Hút dầu (Drain):**
   - Bóng Mực đang ở trạng thái `wander` ưu tiên tìm đến đèn sáng có `fuel < 30` gần nhất.
   - Khi tiếp cận trong bán kính XZ ≤ 2.0m, Bóng Mực chuyển sang trạng thái mới `drain`, đứng yên và hút dầu với tốc độ `5.0 fuel/giây` (cộng dồn nếu nhiều con cùng hút).
   - Sự kiện `fuel_drain {lantern_id, shade_id, fuel}` được phát mỗi 60 tick khi đang hút.
3. **Chuyển trạng thái từ `drain`:**
   - Chuyển sang `chase` nếu Mây lại gần trong 6m.
   - Chuyển sang `stunned` nếu trúng chiêu Tỏa Sáng (Pulse). Thưởng điểm tăng lên `+15` (thay vì +5).
   - Chuyển về `wander` nếu đèn tắt, nếu đèn được châm dầu lên `≥ 30`, hoặc nếu bị đẩy lùi cách đèn > 2m.

### 2.3. Luật Thắng Mới: Giữ Đảo Sáng tới Bình Minh
1. **Bãi bỏ thắng sớm (`all_lit`):** Thắp đủ tất cả các đèn không làm kết thúc game. Game chỉ kết thúc khi bình minh ló rạng (`time_left_s <= 0`) hoặc hết Ngọn Lửa.
2. **Điều kiện Thắng (`dawn_survived`):**
   - Mây còn sống khi bình minh đến.
   - Số đèn đang sáng tại tick cuối cùng đạt ngưỡng: `≥ ceil(0.6 * tổng_đèn)`.
     - Đêm 1: cần ít nhất 3/5 đèn.
     - Đêm 2: cần ít nhất 4/6 đèn.
     - Đêm 3: cần ít nhất 5/7 đèn.
3. **Hệ thống Điểm số Mới:**
   - Nạp đom đóm vào đèn: `+5` điểm / đom đóm.
   - Thắp lần đầu: `+100` điểm; Thắp lại: `+40` điểm.
   - Tỏa sáng trúng bóng thường: `+5` điểm; trúng bóng đang hút dầu: `+15` điểm.
   - Thưởng bình minh khi thắng: mỗi đèn đang sáng nhận `+50 + floor(fuel)`; mỗi ngọn lửa còn lại nhận `+50`. Bãi bỏ thưởng thời gian còn lại.

---

## 3. Hệ quả (Consequences)
- Người chơi không thể chỉ chạy đua thắp đèn một chiều mà phải liên tục quản lý lộ trình tuần tra, phân bổ đom đóm giữa thắp mới và châm dầu.
- Độ kịch tính tăng mạnh ở 60 giây cuối cùng trước bình minh khi Bóng Mực tập trung vây quanh các ngọn đèn yếu.
- Phá vỡ tương thích với Contract v1.1 cũ: Test Suite cần được cập nhật toàn bộ sang định dạng Contract v1.2.
