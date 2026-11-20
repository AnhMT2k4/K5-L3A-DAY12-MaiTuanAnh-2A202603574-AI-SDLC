# Changelog: Phase 3 Breaking Changes (TICKET-03 - Contract v1.2)

Tài liệu liệt kê chi tiết các thay đổi phá vỡ tương thích (breaking changes) và lý do cập nhật bộ test trong **Phase 3: Đèn cạn dầu**.

---

## 1. Các Thay Đổi Phá Vỡ Tương Thích (Breaking Changes)

### 1.1. Luật Thắng Thua
- **Xóa bỏ sự kiện kết thúc sớm `all_lit`:**
  - *Cũ (v1.1):* Trò chơi lập tức chuyển trạng thái `won` với `reason: "all_lit"` ngay khi tất cả đèn trên đảo được thắp.
  - *Mới (v1.2):* Thắp toàn bộ đèn không làm game kết thúc. Game tiếp tục mô phỏng cho tới khi hết giờ (bình minh).
  - *Lý do:* Tăng độ căng thẳng, chuyển trọng tâm gameplay sang "giữ đảo sáng tới bình minh".
- **Lý do Thắng mới `dawn_survived`:**
  - Chỉ thắng khi thời gian đếm ngược về 0 (`time_left_s <= 0`) và số lượng đèn đang sáng `≥ ceil(0.6 * tổng_đèn)`.
  - Nếu số đèn đang sáng < ngưỡng quy định khi hết giờ: bị xử thua với `reason: "dawn"`.

### 1.2. Trạng thái và Dữ liệu Đèn Lồng
- **Đèn có thể bị tắt:**
  - Đèn đang sáng tự hao hụt `1.0 fuel/giây` và bị Bóng Mực hút `5.0 fuel/giây`.
  - Khi `fuel <= 0`, đèn tắt (`lit: false`, `fuel: 0`), phát sự kiện `lantern_out`.
- **Thêm trường vào Snapshot:**
  - Mỗi phần tử trong mảng `lanterns` có thêm: `fuel` (float 1 chữ số thập phân), `ever_lit` (boolean), `relit_count` (integer).
- **Thắp lại chỉ tốn 5 đom đóm:**
  - Đèn có `ever_lit === true` chỉ cần 5 đom đóm để thắp lại (`relight_cost = 5`). Sự kiện `lantern_lit` có thêm thuộc tính `relight: true | false`.

### 1.3. Hành vi và Trạng thái Bóng Mực
- **Trạng thái mới `drain`:**
  - Bóng Mực có thêm trạng thái `drain` khi tiếp cận đèn yếu (XZ ≤ 2.0m, `fuel < 30`).
  - Trạng thái `drain` đứng yên và hút 5 fuel/giây. Phát sự kiện `fuel_drain {lantern_id, shade_id, fuel}` mỗi 60 tick.
- **Hết choáng về `wander`:**
  - Ở v1.1, Bóng Mực sau khi hết choáng chuyển sang `chase`. Ở v1.2, theo quy định chuẩn, hết choáng chuyển về `wander`.

### 1.4. Công thức Điểm số
- **Bãi bỏ thưởng thời gian:** Không còn cộng điểm `time_left_s * 2`.
- **Thay đổi toàn bộ cơ chế điểm:**
  - Nạp đom đóm vào đèn: `+5` điểm / con (thay vì +10 cũ).
  - Thắp lần đầu: `+100` điểm; Thắp lại: `+40` điểm.
  - Choáng bóng thường: `+5` điểm; Choáng bóng đang hút dầu (`drain`): `+15` điểm.
  - Thưởng bình minh khi thắng: `+50 + floor(fuel)` cho mỗi đèn đang sáng; `+50` cho mỗi ngọn lửa còn lại.

### 1.5. Sức chứa đom đóm của người chơi
- Sức chứa không còn cố định ở 10: khởi đầu 10, tăng thêm 2 sau mỗi lần thắp thành công (tính cả thắp lại), tối đa 20 (`capacity = min(20, 10 + 2 * successful_lights)`).
- Snapshot thêm trường `player.capacity`.

---

## 2. Ghi chép Cập nhật Bộ Kiểm thử (Test Updates Log)

| Tên Test | Tệp | Thay đổi thực hiện | Lý do |
|---|---|---|---|
| **Test 8: Win Condition & Scoring** | `tests/unit.test.js` | Cập nhật logic: thắp đèn cuối không kết thúc game (`sim.state === 'playing'`), kiểm tra sức chứa tăng lên 12, kiểm tra điểm nạp và thắp lần đầu. | Luật mới không cho phép thắng sớm bằng `all_lit`. |
| **Test 9: Fuel Decay & lantern_out** | `tests/unit.test.js` | **Thêm mới**: Kiểm tra đèn hao hụt dầu và phát sự kiện `lantern_out` khi dầu về 0. | Kiểm chứng tính năng cốt lõi của TICKET-03. |
| **Test 10: Refuel (châm dầu)** | `tests/unit.test.js` | **Thêm mới**: Kiểm tra nạp dầu vào đèn đang sáng với `used = min(carried, ceil((100-fuel)/10))`. | Kiểm chứng cơ chế châm dầu mới. |
| **Test 11: Relight with 5 motes** | `tests/unit.test.js` | **Thêm mới**: Kiểm tra đèn `ever_lit` thắp lại chỉ tốn 5 đom đóm và phát `lantern_lit {relight: true}`. | Kiểm chứng cơ chế thắp lại. |
| **Test 12: Shade Drain & Pulse +15** | `tests/unit.test.js` | **Thêm mới**: Kiểm tra trạng thái `drain`, sự kiện `fuel_drain` mỗi 60 tick, và thưởng +15 khi Pulse bóng đang drain. | Kiểm chứng cơ chế hút dầu và thưởng choáng. |
| **Test 13: Dawn Win & Lose** | `tests/unit.test.js` | **Thêm mới**: Kiểm tra thắng khi ≥ 60% đèn sáng (`dawn_survived` + điểm thưởng dầu/lửa) và thua khi < 60% đèn sáng (`dawn`). | Kiểm chứng luật thắng thua mới tại bình minh. |
| **Scenario Night 1 Snapshot Validation** | `tests/scenarios.test.js` | Cập nhật assertion kiểm tra các trường snapshot mới: `player.capacity`, `lantern.fuel`, `ever_lit`, `relit_count`. | Tuân thủ định dạng Test Contract v1.2. |
