# Nhật ký Tương tác AI (AI Interaction Log): Phase 2

Nhật ký ghi lại quá trình phát triển Phase 2 (TICKET-02 - "Ba hòn đảo") với AI Assistant.

---

## 1. Nhiệm vụ chính
- Chuẩn hóa toàn bộ số liệu theo thông số bắt buộc của TICKET-02 (thay thế mọi số liệu tự chọn ở Phase 1).
- Mở rộng game thành 3 Đêm với 3 bản đồ hoàn chỉnh:
  - **Đêm 1 - Đảo Bến:** Đảo tròn R=40m, 5 Đèn Lồng.
  - **Đêm 2 - Đảo Cau:** 2 đảo R=28m nối bằng cầu gỗ, 2 bục nhảy, 1 Bùa Gió, Gió Lạc.
  - **Đêm 3 - Đảo Chuông:** Đảo 3 tầng, 2 dốc nghiêng 30° và 150°, tháp chuông trung tâm cản đường, 1 bục nhảy, 2 Bùa Gió, gió thổi định kỳ.
- Bổ sung cơ chế: Lướt (Dash), Bùa Gió (Wind Charm), Bục nhảy (Jump Pad), Gió Lạc (Drifter), Rơi khỏi đảo (Y < -10), Tạm dừng (Pause).
- Cập nhật định dạng Test Contract v1.1 với snapshot mở rộng (`night`, `wind`, `player.vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`, `motes`, `drifters`, `charms`).
- Tuân thủ thứ tự 12 bước xử lý trong 1 tick.

---

## 2. Các vấn đề kỹ thuật phát hiện và cách xử lý

1. **Lỗi màn hình đen khi mở Web 3D:**
   - *Nguyên nhân:* File `src/web/game.js` import `{ ISLAND_RADIUS }` từ `core/constants.js`, nhưng trong Phase 2 hằng số này đã được tái cấu trúc thành `NIGHT1_CONFIG.islandRadius`. ES Module ném lỗi khiến Three.js không khởi tạo được scene.
   - *Khắc phục:* Viết lại hoàn chỉnh `src/web/game.js` hỗ trợ đầy đủ 3 Đêm, bộ chọn màn chơi, import chuẩn `MAPS`, `PALETTE`, `DEFAULT_TUNING`.

2. **Cách tính điểm đom đóm (+10 mỗi đom đóm nạp):**
   - *Nguyên nhân:* Trước đó điểm được cộng khi nhặt đom đóm (`mote_picked`), trong khi TICKET-02 quy định: `+10 mỗi đom đóm nạp` vào đèn lồng.
   - *Khắc phục:* Chuyển điểm `per_mote` vào bước tương tác nạp đèn (`deposit`), nhân với số lượng đom đóm thực tế nạp.

3. **Cơ chế Input cho Headless theo Test Contract:**
   - *Nguyên nhân:* Trong file kịch bản inputs, nếu một frame không có nút bấm thì các nút bấm (jump, pulse, interact, dash, pause) phải mặc định là `false`, chỉ có hướng di chuyển (`move`, `cam_yaw_deg`) được giữ nguyên. Nếu không reset, giá trị `pause: true` bị giữ nguyên khiến cơ chế phát hiện sườn lên (`triggerPause = current && !prev`) bị vô hiệu hóa.
   - *Khắc phục:* Thêm bước reset các cờ nút bấm về `false` mỗi tick trước khi đọc các frame của tick đó.

4. **Hiệu năng 21.600 ticks headless:**
   - *Kiểm tra:* File test `tests/perf.test.js` chạy giả lập 21.600 ticks (tương đương 6 phút thực tế 60 FPS) chỉ mất ~0.06 giây, vượt xa yêu cầu ≤ 30 giây.
