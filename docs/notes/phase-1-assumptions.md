# Giả định và Làm rõ Yêu cầu: Phase 1 (PRD-0)

Tài liệu ghi lại các giả định kỹ thuật và giá trị tham số được lựa chọn cho **Phase 1: Đảo Đèn Lồng** (PRD-0).

---

## 1. Bảng phân tích yêu cầu PRD-0 & Giả định

| Mục | Điểm PRD-0 còn mở / mơ hồ | Giả định và Quyết định kỹ thuật của nhóm |
|---|---|---|
| **Vị trí và Bán kính Đảo** | Đảo tròn giữa biển mây, có bến | Bán kính đảo cố định 40 mét. Bến tàu đặt tại mạn nam (+Z). Người chơi xuất phát tại tâm `(0, 0, 0)`. |
| **5 Đèn Lồng Lớn** | 5 Đèn Lồng Lớn trên Đảo Bến | Bố trí đều trên vòng tròn bán kính 25m với góc chia đều: `L1` tại `(0, 0, 25)`, `L2` tại `(23.776, 0, 7.725)`, `L3` tại `(14.695, 0, -20.225)`, `L4` tại `(-14.695, 0, -20.225)`, `L5` tại `(-23.776, 0, 7.725)`. |
| **Chi phí thắp đèn** | "Nạp ánh sáng vào đèn để thắp đèn" | Mỗi đèn cần nạp đủ 5 đom đóm (`lantern_cost = 5`). Đèn nạp dần, khi đủ 5 thì chuyển trạng thái `lit = true`. |
| **Đom đóm (Motes)** | Đom đóm xuất hiện rải rác | Mặc định 25 đom đóm sinh ngẫu nhiên (dùng PRNG tất định) cách tâm từ 5m đến 35m. Sức chứa tối đa của Mây là 5 (`carry_capacity = 5`). |
| **Bóng Mực (Shades)** | Sinh vật bằng mực đen đuổi theo Mây | Tốc độ Bóng Mực là 3.5 m/s (`shade_speed = 3.5`), chậm hơn tốc độ người chơi (6.0 m/s) để người chơi có thể né tránh và cơ động. |
| **Vùng an toàn quanh Đèn** | "Bóng Mực sợ những chiếc đèn" | Khi đèn đã được thắp (`lit = true`), nó tạo ra vùng sáng an toàn bán kính 4m (`safe_radius = 4.0`). Bóng Mực không thể tiến vào vùng này. |
| **Tỏa sáng (Pulse)** | Tỏa sáng xua Bóng Mực, tốn ánh sáng | Tiêu tốn 1 đom đóm đang mang theo (`pulse_cost = 1`). Bán kính tỏa sáng 5.0m (`pulse_radius = 5.0`). Bóng Mực trong vùng bị đẩy lùi 2m (`pulse_push_m = 2.0`) và bị choáng 3.0s (`pulse_stun_s = 3.0`). Cooldown giữa các lần tỏa sáng là 1.0s (`pulse_cooldown_s = 1.0`). |
| **Mất máu (Flames)** | Bị chạm thì mất máu | Người chơi có 3 ngọn lửa (`flames = 3`). Khi bị Bóng Mực chạm: mất 1 ngọn lửa, làm rơi 50% số đom đóm đang giữ (`hit_drop_ratio = 0.5`), và nhận 2.0s bất tử tạm thời (`invuln_s = 2.0`). |
| **Thời lượng màn chơi** | Đêm 1 | Thời gian Đêm 1 kéo dài 180 giây (3 phút) (`night1_duration_s = 180`). Hết giờ là bình minh lên (thua do `"dawn"`). |
| **Rơi khỏi đảo** | Bị rơi | `fall_enabled = false` theo cho phép của hợp đồng để đảm bảo tính ổn định tối đa cho bài test Phase 1. |

---

## 2. Bảng tham số Tuning trong `game.contract.json`

```json
{
  "player_speed": 6.0,
  "carry_capacity": 5,
  "lantern_cost": 5,
  "lantern_count_night1": 5,
  "pickup_radius": 1.5,
  "interact_radius": 2.5,
  "pulse_cost": 1,
  "pulse_radius": 5.0,
  "night1_duration_s": 180,
  "flames": 3,
  "invuln_s": 2.0,
  "hit_drop_ratio": 0.5,
  "pulse_stun_s": 3.0,
  "pulse_push_m": 2.0,
  "pulse_cooldown_s": 1.0,
  "safe_radius": 4.0,
  "shade_speed": 3.5,
  "shade_hit_radius": 1.0,
  "fall_enabled": false,
  "score": {
    "per_mote": 10,
    "per_lantern": 100,
    "per_stun": 20,
    "per_second_left": 5,
    "per_flame_left": 50
  }
}
```
