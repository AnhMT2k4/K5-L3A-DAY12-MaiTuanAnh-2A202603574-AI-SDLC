# AI Harness & Project Conventions: Đảo Đèn Lồng

Tài liệu hướng dẫn và quy ước làm việc cùng AI Agent cho dự án **Đảo Đèn Lồng** (Phase 3 - Test Contract v1.2).

## 1. Lệnh cơ bản
- **Cài đặt & Build:** `npm run build`
- **Mở game 3D có giao diện:** `npm start` (hoặc `node src/server.js`)
- **Chạy toàn bộ test tự động:** `npm test` (hoặc `node tests/run-all.js`)
- **Chạy Test Contract headless:** `node src/cli/headless.js [tham số]`

## 2. Cấu trúc dự án
- `src/core/`: Lõi mô phỏng vật lý & gameplay thuần túy (deterministic, 60 tick/s, Contract v1.2, hỗ trợ 3 Đêm, quản lý dầu đèn, bóng hút dầu, luật thắng mới).
- `src/cli/`: Headless runner cho Test Contract v1.2.
- `src/web/`: Giao diện 3D Three.js cho 3 Đảo, thanh dầu đèn, bục nhảy, Bùa Gió, Gió Lạc, chế độ mù màu, Web Audio API.
- `src/server.js`: Web server nội bộ phục vụ game cục bộ có cơ chế chống kẹt cổng.
- `tests/`: Bộ test đơn vị, scenario tests v1.2, determinism tests, performance test.
- `docs/notes/`: ADR thay đổi thiết kế, changelog breaking changes, giả định và nhật ký AI.
- `docs/proof/`: Bằng chứng nghiệm thu của từng phase.
- `game.contract.json`: Khai báo bắt buộc của Test Contract v1.2.

## 3. Quy ước phát triển Phase 3 (Contract v1.2)
1. **Lõi trước, UI sau:** Toàn bộ tính năng mới (Hao hụt dầu, châm dầu, thắp lại 5 đom đóm, bóng hút dầu `drain`, bãi bỏ thắng sớm, sức chứa tăng dần, luật thắng `dawn_survived`) phải được kiểm chứng trong `src/core/` trước.
2. **Tuân thủ Test Contract v1.2:**
   - Trạng thái Bóng Mực: `spawning`, `wander`, `chase`, `recoil`, `stunned`, `drain`.
   - Snapshot v1.2: `night`, `wind`, `player` (thêm `capacity`, `vel`, `grounded`, `invuln`, `dash_cd_s`, `pulse_cd_s`, `charm_s`), `lanterns` (thêm `fuel`, `ever_lit`, `relit_count`), mảng `motes`, mảng `drifters`, mảng `charms`.
   - Sự kiện mới: `refuel`, `lantern_out`, `fuel_drain`, `lantern_lit {relight: true|false}`, `game_over {reason: "dawn_survived" | "dawn" | "no_flames"}`.
   - Không còn thắng sớm `all_lit`.
3. **Hiệu năng Headless:** 21.600 tick (1 Đêm đầy đủ) phải chạy xong trong ≤ 30s.
4. **Không kết thúc khi test đỏ:** Mọi thay đổi phải vượt qua `npm test` trước khi commit.
