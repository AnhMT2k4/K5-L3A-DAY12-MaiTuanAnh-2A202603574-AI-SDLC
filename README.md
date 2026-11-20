# Đảo Đèn Lồng (Lantern Island)

> **Dự án Lab AI SDLC - Khóa 5**  
> **Sinh viên:** Mai Tuấn Anh  
> **MSSV:** 2A202603574  
> **Tag Phase 3:** `phase-3`  
> **Bản hợp đồng:** Test Contract v1.2 (TICKET-03: Change Request "Đèn cạn dầu")  

---

## 1. Giới thiệu trò chơi (Phase 3 Updates)

**Đảo Đèn Lồng** là một trò chơi 3D góc nhìn thứ ba mang không khí đêm cổ tích, ấm áp. Người chơi điều khiển **Mây**, người giữ đèn nhỏ tuổi của quần đảo giữa biển mây.

Trong Phase 3, mục tiêu cốt lõi chuyển dịch từ *"chạy đua thắp hết đèn"* sang **"quản lý nhiên liệu và bảo vệ đảo sáng tới bình minh"**:
- **Nhiên liệu Đèn (Fuel):** Mỗi Đèn Lồng sau khi thắp có 100 điểm dầu, tự hao hụt 1.0 fuel/giây. Khi hết dầu, đèn tắt và mất vùng an toàn.
- **Châm dầu & Thắp lại:** Người chơi có thể châm dầu cho đèn đang sáng bằng phím `F`. Đèn từng sáng (`ever_lit`) chỉ tốn 5 đom đóm để thắp lại (thay vì 10).
- **Bóng Mực hút dầu (`drain`):** Khi đèn có `fuel < 30`, đèn mất vùng an toàn. Bóng Mực wander sẽ tiến đến đứng hút dầu với tốc độ 5.0 fuel/giây.
- **Sức chứa đom đóm tăng dần:** Khởi đầu 10, tăng +2 sau mỗi lần thắp đèn thành công (tối đa 20).
- **Luật Thắng Mới:** Bãi bỏ thắng sớm! Người chơi phải sống sót tới bình minh (`time_left_s <= 0`) và giữ sáng ít nhất 60% tổng số đèn trên đảo (Đêm 1: ≥3/5, Đêm 2: ≥4/6, Đêm 3: ≥5/7).

---

## 2. Hướng dẫn Cài đặt & Chạy Game (Tối đa 3 lệnh)

Chỉ cần máy tính có cài sẵn **Node.js (>= 18)**, thực thi tối đa 3 lệnh sau:

```bash
# 1. Cài đặt các gói phụ thuộc và đồng bộ build lõi
npm run build

# 2. Khởi động game 3D có giao diện trên trình duyệt
npm start

# 3. Chạy toàn bộ bộ test kiểm chứng tự động (Unit, Scenarios, Determinism, Perf)
npm test
```

Truy cập giao diện game tại: **http://localhost:3000**

---

## 3. Điều khiển (Controls)

| Thao tác | Phím điều khiển | Chức năng |
|---|---|---|
| **Di chuyển** | `W`, `A`, `S`, `D` hoặc `Phím mũi tên` | Chạy trên mặt đất và điều khiển trên không |
| **Lướt (Dash)** | `Shift` hoặc `Q` | Lướt nhanh 14 m/s trong 0.2s, giữ độ cao Y trên không |
| **Nhảy** | `Space` | Nhảy cao với vận tốc 7.0 m/s (chỉ khi chạm đất) |
| **Xoay Camera 3D** | `Kéo chuột trái / Chuột phải` | Điều chỉnh góc nhìn tự do 360 độ |
| **Tỏa sáng (Pulse)** | `E` | Tiêu tốn 3 đom đóm để xua đuổi, choáng Bóng Mực (+15 điểm nếu bóng đang hút dầu) |
| **Nạp / Châm dầu** | `F` hoặc `Enter` | Nạp đom đóm để thắp mới (10), thắp lại (5) hoặc châm dầu cho đèn đang sáng |
| **Tạm dừng (Pause)** | `P` hoặc `Escape` | Tạm dừng mô phỏng: sim tick và bộ đếm đứng yên |
| **Chế độ Mù màu** | Nút `👁️ Bảng màu dễ phân biệt` | Bật/tắt bảng màu tương phản cao, biểu tượng cảnh báo ⚠, viền bóng xanh dương |

---

## 4. Cách tính điểm chuẩn hóa (Scoring System v1.2)

Điểm số được tính toán chính xác theo Test Contract v1.2:

- **Nạp đom đóm vào đèn:** `+5 điểm` cho mỗi đom đóm nạp (thắp mới, thắp lại hoặc châm dầu).
- **Thắp lần đầu:** `+100 điểm`.
- **Thắp lại:** `+40 điểm`.
- **Choáng Bóng Mực:** `+5 điểm` cho bóng thường, `+15 điểm` cho bóng đang hút dầu (`drain`).
- **Thưởng Bình Minh (chỉ khi Thắng `dawn_survived`):**
  - `+50 + floor(fuel)` cho mỗi đèn đang sáng tại thời khắc bình minh.
  - `+50 điểm` cho mỗi Ngọn Lửa (máu) còn nguyên vẹn.
  - *(Bãi bỏ thưởng thời gian còn lại)*.

---

## 5. Chế độ Headless & Test Contract v1.2

Game tuân thủ nghiêm ngặt **Test Contract v1.2** với tệp khai báo [game.contract.json](game.contract.json). Chế độ headless chạy độc lập 60 tick/giây, không cần GPU hay trình duyệt, đảm bảo tính tất định 100%.

### Cú pháp chạy headless:
```bash
node src/cli/headless.js --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]
```

### Ví dụ chạy kiểm thử:
```bash
# Đêm 1 (Đảo Bến - 240s)
node src/cli/headless.js --seed 42 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 250 --out out.jsonl

# Đêm 2 (Đảo Cau - 270s)
node src/cli/headless.js --seed 42 --night 2 --scenario tests/fixtures/scenario-night2.json --ticks 100 --out out-n2.jsonl

# Đêm 3 (Đảo Chuông - 300s)
node src/cli/headless.js --seed 42 --night 3 --scenario tests/fixtures/scenario-night3.json --ticks 150 --out out-n3.jsonl
```

### Mã thoát (Exit Codes):
- `0`: Chạy hoàn tất đủ số ticks hoặc trò chơi kết thúc (Thắng: `dawn_survived` / Thua: `dawn`, `no_flames`).
- `2`: Tệp đầu vào `--inputs` hoặc `--scenario` sai định dạng JSON / logic tick.
- Khác `0`: Có lỗi phát sinh trong quá trình thực thi.

---

## 6. Sáng tạo của tôi & Khả năng Tiếp cận (Accessibility)

1. **Thanh nhiên liệu 3D trực quan trên Đèn Lồng:**
   - Hiển thị thanh máu/dầu 3D quay mặt về camera phía trên từng đèn lồng; khi dầu xuống dưới 30, đèn và thanh dầu nhấp nháy chậm 1 Hz. Đèn tắt bị xẹp 20% giúp phân biệt ngay cả khi không nhìn màu.
2. **Chế độ Mù màu & Dễ phân biệt (Colorblind Mode):**
   - Hỗ trợ lưu trữ cài đặt vào `localStorage`. Khi kích hoạt: viền mắt Bóng Mực chuyển sang xanh dương `#00B3FF`, toàn bộ cảnh báo HUD nguy hiểm chuyển sang màu trắng kèm ký tự cảnh báo `⚠️`.
3. **Hiệu ứng Hút dầu huyền ảo (Drain Visual Effect):**
   - Khi Bóng Mực tiếp cận hút dầu, luồng năng lượng tím đan xen phát sáng nối giữa quái vật và đèn lồng.
4. **Hệ thống âm thanh Procedural Web Audio API:**
   - Cảnh báo âm thanh khi đèn sắp tắt, âm nạp dầu và hợp âm chiến thắng bình minh rạng rỡ.
