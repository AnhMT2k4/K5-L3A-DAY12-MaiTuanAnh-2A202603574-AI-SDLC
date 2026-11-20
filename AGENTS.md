# AI Harness & Project Conventions: Đảo Đèn Lồng

Tài liệu hướng dẫn và quy ước làm việc cùng AI Agent cho dự án **Đảo Đèn Lồng** (Phase 2 - Test Contract v1.1).

## 1. Lệnh cơ bản
- **Cài đặt & Build:** `npm run build`
- **Mở game 3D có giao diện:** `npm start` (hoặc `node src/server.js`)
- **Chạy toàn bộ test tự động:** `npm test` (hoặc `node tests/run-all.js`)
- **Chạy Test Contract headless:** `node src/cli/headless.js [tham số]`

## 2. Cấu trúc dự án
- `src/core/`: Lõi mô phỏng vật lý & gameplay thuần túy (deterministic, 60 tick/s, Contract v1.1, hỗ trợ Đêm 1, 2, 3).
- `src/cli/`: Headless runner cho Test Contract v1.1.
- `src/web/`: Giao diện 3D Three.js cho 3 Đảo, Gió Lạc, Bùa Gió, Bục nhảy, và Web Audio API.
- `src/server.js`: Web server nội bộ phục vụ game cục bộ có cơ chế chống kẹt cổng.
- `tests/`: Bộ test đơn vị, scenario tests v1.1, determinism tests.
- `docs/notes/`: Giả định, nhật ký AI và retro của từng phase.
- `docs/proof/`: Bằng chứng nghiệm thu của từng phase.
- `game.contract.json`: Khai báo bắt buộc của Test Contract v1.1.

## 3. Quy ước phát triển Phase 2
1. **Lõi trước, UI sau:** Toàn bộ tính năng mới (Lướt, Gió Lạc, Bùa Gió, Bục nhảy, Rơi Y < -10, Gió mạnh, Pause) phải được kiểm chứng trong `src/core/` trước.
2. **Tuân thủ Test Contract v1.1:**
   - Trạng thái Bóng Mực: `spawning`, `wander`, `chase`, `recoil`, `stunned`.
   - Snapshot v1.1: `night`, `wind`, `player` (thêm `vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`), mảng `motes` (có `kind`, `ttl_s`), mảng `drifters` (`stolen`), mảng `charms` (`available`, `respawn_s`).
   - Thứ tự xử lý trong 1 tick bắt buộc theo 12 bước trong TICKET-02.
   - Khi Pause: tick tăng, sim_tick và mọi timer đứng yên, state: "paused".
3. **Hiệu năng Headless:** 21.600 tick (1 Đêm đầy đủ) phải chạy xong trong ≤ 30s.
4. **Không kết thúc khi test đỏ:** Mọi thay đổi phải vượt qua `npm test` trước khi commit.
