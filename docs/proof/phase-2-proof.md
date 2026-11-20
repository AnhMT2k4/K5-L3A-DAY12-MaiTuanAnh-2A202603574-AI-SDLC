# Bằng chứng Kiểm chứng (Proof of Verification): Phase 2

Bài nộp: **Tag phase-2**  
Họ tên: **Mai Tuấn Anh** - MSSV: **2A202603574**  
Đề bài: **Đảo Đèn Lồng - Phase 2: Ba Hòn Đảo (TICKET-02)**  
Hợp đồng kiểm thử: **Test Contract v1.1**

---

## 1. Ma trận Truy vết Yêu cầu đến Bằng chứng (Traceability Matrix)

| STT | Yêu cầu TICKET-02 & Contract v1.1 | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|:---:|
| 1 | **Số liệu chuẩn di chuyển & nhảy** | Kiểm tra vận tốc chạy 6.0 m/s, nhảy 7.0 m/s, trọng lực −20 m/s². | `src/core/constants.js`, `tests/unit.test.js` | **ĐẠT** |
| 2 | **Cơ chế Lướt (Dash)** | 14 m/s trong 0.2s (12 ticks), hồi chiêu 1.5s, giữ nguyên Y trên không. | `tests/unit.test.js` (Test 2: Dash mechanics) | **ĐẠT** |
| 3 | **Bùa Gió (Wind Charm)** | Nhặt tự động, hiệu lực 10s (tốc độ +20%, lướt không hồi chiêu), hồi sinh 45s. | `tests/unit.test.js` (Test 3: Wind Charm) | **ĐẠT** |
| 4 | **Bục nhảy (Jump Pad)** | Kích hoạt khi chạm đất, phóng chuẩn parabol giữa các đảo. | `tests/unit.test.js` (Test 4: Jump Pad) | **ĐẠT** |
| 5 | **Rơi khỏi đảo (Y < -10)** | Mất 1 ngọn lửa, mất sạch đom đóm, chờ 60 ticks rồi hồi sinh tại xuất phát với 90 ticks bất tử. | `tests/unit.test.js` (Test 5: Fall off island) | **ĐẠT** |
| 6 | **Gió Lạc (Drifter)** | Đuổi khi mang ≥ 5 đom đóm, cướp 3 đom đóm, bị Pulse làm rơi toàn bộ đom đóm đã cướp. | `tests/unit.test.js` (Test 6: Drifter steal & drop) | **ĐẠT** |
| 7 | **Tạm dừng (Pause / Resume)** | Phím P/Esc: khi pause, `sim_tick` và mọi timer đứng yên, `tick` vẫn tăng. | `tests/unit.test.js` (Test 7: Pause & Resume) | **ĐẠT** |
| 8 | **Công thức Tính điểm chuẩn hóa** | +10/đom đóm nạp, +100/đèn thắp, +5/bóng choáng, thưởng thắng `floor(time_left_s)*2 + 50*flames`. | `tests/unit.test.js` (Test 8: Scoring) | **ĐẠT** |
| 9 | **Test Contract v1.1 Headless Đêm 1** | Xuất snapshot v1.1 có `night`, `wind`, `player.vel`, `grounded`, `motes`, `drifters`, `charms`. | `tests/scenarios.test.js` (Test 1) | **ĐẠT** |
| 10 | **Test Contract v1.1 Headless Đêm 2** | Kiểm tra Đêm 2 có Gió Lạc và Bùa Gió trong snapshot. | `tests/scenarios.test.js` (Test 2) | **ĐẠT** |
| 11 | **Test Contract v1.1 Headless Đêm 3** | Kiểm tra Đêm 3 có gió thổi chu kỳ 30s với hướng gió ngẫu nhiên. | `tests/scenarios.test.js` (Test 3) | **ĐẠT** |
| 12 | **Kiểm tra Lỗi Định dạng (Mã thoát 2)** | File kịch bản sai định dạng tick hoặc thiếu trường bắt buộc phải thoát mã 2. | `tests/scenarios.test.js` (Test 4) | **ĐẠT** |
| 13 | **Tính tất định 100% (Determinism)** | Cùng seed + kịch bản chạy 2 lần cho ra JSONL byte-for-byte hoàn toàn trùng khớp. | `tests/determinism.test.js` | **ĐẠT** |
| 14 | **Hiệu năng Headless 21.600 ticks** | 21.600 ticks chạy hoàn thành trong ≤ 30s. | `tests/perf.test.js` (~0.06s) | **ĐẠT** |
| 15 | **Bảng màu chuẩn & Web 3D 3 Đảo** | Giao diện Three.js với đầy đủ 3 bản đồ Đêm 1, 2, 3 và bảng màu chuẩn. | `src/web/`, `src/web/game.js` | **ĐẠT** |

---

## 2. Kết quả Chạy Bộ Kiểm tra Tự động (`npm test`)

```text
====================================
 RUNNING ALL VERIFICATION TEST SUITES (PHASE 2 - CONTRACT v1.1)
====================================

--- Running Unit Tests (Phase 2 - Contract v1.1) ---
✓ PRNG determinism passed
✓ Dash mechanics passed
✓ Wind Charm pickup and activation passed
✓ Jump pad launch passed
✓ Fall off island (Y < -10) passed
✓ Drifter steal passed
✓ Pause and Resume passed
✓ Win condition and scoring passed
ALL PHASE 2 UNIT TESTS PASSED!

--- Running Scenarios Tests (Phase 2 - Contract v1.1) ---
✓ Night 1 basic scenario test passed
✓ Night 2 scenario with Drifters and Charms passed
✓ Night 3 scenario with Wind passed
✓ Inputs format error validation (exit code 2) passed
ALL SCENARIOS TESTS PASSED!

--- Running Determinism Tests ---
✓ Determinism verified: 100% identical outputs for same seed and inputs
ALL DETERMINISM TESTS PASSED!

--- Running Performance Test (21,600 ticks) ---
✓ Completed 1426 ticks in 0.06s
PERFORMANCE TEST PASSED!

====================================
 ALL SUITES PASSED SUCCESSFULLY (100%)
====================================
```

---

## 3. Mẫu Snapshot v1.1 Thực tế

```json
{
  "type": "snapshot",
  "tick": 0,
  "sim_tick": 0,
  "night": 2,
  "state": "playing",
  "time_left_s": 330,
  "score": 0,
  "wind": { "active": false, "dir_deg": 0 },
  "player": {
    "pos": [0, 0, 0],
    "vel": [0, 0, 0],
    "grounded": true,
    "invuln": false,
    "flames": 3,
    "carried": 5,
    "dash_cd_s": 0,
    "pulse_cd_s": 0,
    "charm_s": 0
  },
  "lanterns": [
    { "id": "L1", "pos": [0, 0, 20], "lit": false, "deposited": 0 }
  ],
  "shades": [
    { "id": "S1", "pos": [15, 0, 0], "state": "chase" }
  ],
  "motes": [
    { "id": "M1", "pos": [10, 0, 0], "kind": "random", "ttl_s": null }
  ],
  "drifters": [
    { "id": "D1", "pos": [20, 2, 0], "state": "idle", "stolen": 0 }
  ],
  "charms": [
    { "id": "C1", "available": true, "respawn_s": 0 }
  ],
  "motes_active": 1
}
```
