# Giả định & Làm rõ Kỹ thuật: Phase 2 (TICKET-02 - "Ba hòn đảo")

Tài liệu ghi lại các phân tích, giả định kỹ thuật và việc tuân thủ các số liệu chuẩn của **Phase 2: Ba Hòn Đảo** (Test Contract v1.1).

---

## 1. Đồng bộ Số liệu chuẩn (TICKET-02)

| Thông số | Giá trị chuẩn | Áp dụng trong Game |
|---|---|---|
| **Tốc độ chạy** | 6.0 m/s; tăng tốc/dừng tức thì; điều khiển trên không | `tuning.player_speed = 6.0`, `getTerrainHeight()` kiểm tra độ cao mặt đất. |
| **Nhảy** | Vận tốc 7.0 m/s, trọng lực −20 m/s², chỉ nhảy khi chạm đất | `tuning.jump_vel = 7.0`, `gravity = -20.0 m/s²`, kiểm tra `player.grounded`. |
| **Lướt (Dash)** | 14 m/s / 0.2 s (12 ticks) / 1.5 s hồi chiêu | `tuning.dash_speed = 14.0`, `dash_timer = 12 ticks`, `dash_cooldown_s = 1.5`. Giữ nguyên độ cao Y khi lướt trên không. Không bất tử. |
| **Sức chứa đom đóm** | 10 đom đóm | `tuning.carry_capacity = 10`. |
| **Tự động nhặt** | XZ ≤ 1.0 m, chênh cao Y ≤ 1.5 m | Tự động nhặt khi tiếp cận mà không cần phím tương tác. |
| **Sinh đom đóm** | 20 điểm bắt đầu; trần 30; sinh tại ticks 240, 480... | `moteSpawnPoints` phân bố chuẩn; kiểm tra điểm trống và sinh nếu số lượng active < 30. |
| **Chi phí thắp đèn** | 10 đom đóm, nhớ tiến độ | `tuning.lantern_cost = 10`, nạp `min(carried, còn thiếu)` vào đèn gần nhất bán kính 2.0m. |
| **Vùng an toàn đèn** | Bán kính 6 m | Đèn thắp xong tạo vùng 6m ngăn bóng mực; đẩy bóng bên trong ra mép trong 30 ticks không gây sát thương. |
| **Tỏa Sáng (Pulse)** | 3 đom đóm / 5 m / 3 s hồi chiêu | Choáng 120 ticks, đẩy lùi 4 m trong 15 ticks đầu. Cập nhật mục tiêu ngay tick kích hoạt (khoảng cách 3D ≤ 5m). |
| **Bóng Mực** | 4.0 m/s (Đêm 3: 4.5 m/s); tầm phát hiện 12m, bỏ đuổi 18m | 5 trạng thái: `spawning`, `wander`, `chase`, `recoil`, `stunned`. Recoil lùi 2m trong 60 ticks. |
| **Lịch sinh Bóng** | 2 con tại tick 300, sau đó 1 con mỗi khoảng sinh | Đêm 1: mỗi 480 ticks (8s); Đêm 2: mỗi 420 ticks (7s); Đêm 3: mỗi 360 ticks (6s). |
| **Bị đánh** | Mất 1 lửa; rơi floor(đang mang / 2) đom đóm; bất tử 90 ticks | Đom đóm rơi ra vành 1.5–2.5m (tồn tại 480 ticks, chỉ nhặt lại từ tick sau). |
| **Rơi khỏi đảo (Y < -10)** | Mất 1 lửa, mất toàn bộ đom đóm, chờ 60 ticks rồi hồi sinh | Vận tốc 0, bất tử 90 ticks tại điểm xuất phát. Hết lửa thì thua ngay. |
| **Thời gian các Đêm** | Đêm 1: 300s, Đêm 2: 330s, Đêm 3: 360s | Hết giờ tính là bình minh lên (`dawn`). |
| **Gió Lạc (Drifter)** | Sinh ticks 1200, 2400 (max 2 con). Tốc độ 7 m/s | Đi lang thang (2 m/s). Khi Mây mang ≥ 5 đom đóm và cách ≤ 15m thì chuyển `chase`. Chạm cách ≤ 1.2m thì cướp tối đa 3 đom đóm rồi `flee` trong 240 ticks. Bị Pulse thì rơi toàn bộ đom đóm đã cướp. |
| **Bùa Gió (Wind Charm)** | Nhặt tự động, hồi sinh sau 45s (2700 ticks) | Kéo dài 10s (600 ticks): tăng tốc chạy +20% (7.2 m/s), lướt hồi chiêu 0s. |
| **Bục nhảy (Jump Pad)** | Bán kính 1.0 m | Kích hoạt khi chân Mây chạm đất; phóng theo quỹ đạo parabol chuẩn. |
| **Gió mạnh (Đêm 3)** | Chu kỳ 30s: 2s báo hiệu, 5s gió thổi (+2 m/s), 23s lặng | Hướng gió ngẫu nhiên mỗi chu kỳ. |

---

## 2. Quy trình 12 bước trong 1 tick

Tuân thủ nghiêm ngặt thứ tự ưu tiên xử lý của Test Contract v1.1:
1. Đọc input & xử lý pause (nếu pause: sim_tick đứng yên).
2. Giảm các bộ đếm (cooldown, invuln, charm, TTL đom đóm rơi, state timers).
3. Di chuyển Mây & Rơi khỏi đảo (Jump pad -> Dash -> Move -> Gravity -> Terrain -> Fall check).
4. Nhặt đom đóm và bùa (Bùa trước, đom đóm sau).
5. Tương tác với đèn (nạp đom đóm, thắp đèn, kích hoạt vùng an toàn 6m).
6. Cập nhật vùng an toàn.
7. Tỏa Sáng (Pulse).
8. Di chuyển Bóng Mực & Gió Lạc (Gió Lạc di chuyển trước, Bóng Mực di chuyển sau).
9. Chạm (Gió Lạc cướp trước, Bóng Mực gây hit sau theo id tăng dần).
10. Sinh thực thể theo lịch (Đom đóm -> Bóng Mực -> Gió Lạc).
11. Xét thắng / thua (Hết lửa -> Thua; Đèn sáng hết -> Thắng; Hết giờ -> Thua).
12. Xuất snapshot nếu đúng nhịp `snapshot_every`.
