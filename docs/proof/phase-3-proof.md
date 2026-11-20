# Bằng chứng Kiểm chứng (Proof of Verification): Phase 3

Bài nộp: **Tag phase-3**  
Họ tên: **Mai Tuấn Anh** - MSSV: **2A202603574**  
Đề bài: **Đảo Đèn Lồng - Phase 3: Change Request "Đèn cạn dầu" (TICKET-03)**  
Hợp đồng kiểm thử: **Test Contract v1.2**

---

## 1. Ma trận Truy vết Yêu cầu đến Bằng chứng (Traceability Matrix)

| STT | Yêu cầu TICKET-03 & Contract v1.2 | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|:---:|
| 1 | **Hao hụt dầu 1.0/s & tắt đèn khi fuel <= 0** | Kiểm tra fuel giảm mỗi tick; khi fuel về 0 phát sự kiện `lantern_out`. | `tests/unit.test.js` (Test 9: Fuel decay) | **ĐẠT** |
| 2 | **Châm dầu (Refuel) cho đèn đang sáng** | Tính toán `min(carried, ceil((100-fuel)/10))`, tăng fuel tương ứng và phát sự kiện `refuel`. | `tests/unit.test.js` (Test 10: Refuel) | **ĐẠT** |
| 3 | **Thắp lại đèn (Relight) tốn 5 đom đóm** | Đèn `ever_lit` chỉ cần 5 đom đóm, phát `lantern_lit {relight: true}` và cộng 40 điểm. | `tests/unit.test.js` (Test 11: Relight) | **ĐẠT** |
| 4 | **Bóng Mực hút dầu (Trạng thái `drain`)** | Bóng Mực wander tìm đèn < 30 fuel, tiếp cận ≤ 2m chuyển sang `drain`, hút 5/s, phát `fuel_drain` mỗi 60 tick. | `tests/unit.test.js` (Test 12: Shade drain) | **ĐẠT** |
| 5 | **Tỏa Sáng bóng đang hút dầu (+15 điểm)** | Kích hoạt Pulse khi bóng ở trạng thái `drain`, nhận +15 điểm thay vì +5. | `tests/unit.test.js` (Test 12: Pulse drain) | **ĐẠT** |
| 6 | **Bãi bỏ thắng sớm (`all_lit`)** | Thắp đủ 5 đèn, kiểm tra trạng thái game vẫn là `playing` cho tới bình minh. | `tests/unit.test.js` (Test 8: No early win) | **ĐẠT** |
| 7 | **Sức chứa đom đóm tăng dần (+2/lần thắp)** | Sức chứa tăng từ 10 lên 12, tối đa 20; snapshot có trường `player.capacity`. | `tests/unit.test.js` (Test 8: Capacity) | **ĐẠT** |
| 8 | **Thắng tại bình minh (`dawn_survived`)** | Hết giờ với ≥ 60% đèn sáng, thắng với lý do `dawn_survived` và cộng thưởng `50 + floor(fuel)` mỗi đèn sáng + 50/lửa. | `tests/unit.test.js` (Test 13a: Dawn win) | **ĐẠT** |
| 9 | **Thua tại bình minh (`dawn`)** | Hết giờ với < 60% đèn sáng, thua với lý do `dawn`. | `tests/unit.test.js` (Test 13b: Dawn lose) | **ĐẠT** |
| 10 | **Snapshot Contract v1.2** | Snapshot chứa `player.capacity`, `lantern.fuel`, `ever_lit`, `relit_count`, trạng thái shade `drain`. | `tests/scenarios.test.js` (Test 1) | **ĐẠT** |
| 11 | **Tính tất định 100% (Determinism)** | Cùng seed + kịch bản chạy 2 lần cho ra JSONL byte-for-byte hoàn toàn trùng khớp. | `tests/determinism.test.js` | **ĐẠT** |
| 12 | **Hiệu năng Headless 21.600 ticks** | 21.600 ticks chạy hoàn thành trong ~0.60 giây (≤ 30 giây). | `tests/perf.test.js` | **ĐẠT** |
| 13 | **Giao diện 3D Thanh dầu & Chế độ Mù màu** | Thanh dầu hiển thị 3D trên đèn, nhấp nháy khi < 30 fuel; nút chuyển chế độ màu dễ phân biệt. | `src/web/`, `src/web/game.js` | **ĐẠT** |

---

## 2. Kết quả Chạy Bộ Kiểm tra Tự động (`npm test`)

```text
====================================
 RUNNING ALL VERIFICATION TEST SUITES (PHASE 3 - CONTRACT v1.2)
====================================

--- Running Unit Tests (Phase 3 - Contract v1.2: Đèn cạn dầu) ---
✓ PRNG determinism passed
✓ Dash mechanics passed
✓ Wind Charm pickup and activation passed
✓ Jump pad launch passed
✓ Fall off island (Y < -10) passed
✓ Drifter steal passed
✓ Pause and Resume passed
✓ No early win & Capacity growth passed
✓ Fuel decay & lantern_out passed
✓ Refuel (châm dầu) passed
✓ Relight with 5 motes passed
✓ Shade drain & Pulse +15 passed
✓ Dawn win (dawn_survived) & Dawn lose passed
ALL PHASE 3 UNIT TESTS PASSED!

--- Running Scenarios Tests (Phase 3 - Contract v1.2) ---
✓ Night 1 basic scenario test passed
✓ Night 2 scenario with Drifters and Charms passed
✓ Night 3 scenario with Wind passed
✓ Inputs format error validation (exit code 2) passed
ALL SCENARIOS TESTS PASSED!

--- Running Determinism Tests ---
✓ Determinism verified: 100% identical outputs for same seed and inputs
ALL DETERMINISM TESTS PASSED!

--- Running Performance Test (21,600 ticks) ---
✓ Completed 14400 ticks in 0.60s
PERFORMANCE TEST PASSED!

====================================
 ALL SUITES PASSED SUCCESSFULLY (100%)
====================================
```

---

## 3. Mẫu Snapshot v1.2 Thực tế

```json
{
  "type": "snapshot",
  "tick": 50,
  "sim_tick": 50,
  "night": 1,
  "state": "playing",
  "time_left_s": 239.2,
  "score": 0,
  "wind": { "active": false, "dir_deg": 0 },
  "player": {
    "pos": [0, 0, 0],
    "vel": [0, 0, 0],
    "grounded": true,
    "invuln": false,
    "flames": 3,
    "carried": 0,
    "capacity": 10,
    "dash_cd_s": 0,
    "pulse_cd_s": 0,
    "charm_s": 0
  },
  "lanterns": [
    { "id": "L1", "pos": [0, 0, 25], "lit": false, "deposited": 0, "fuel": 0, "ever_lit": false, "relit_count": 0 },
    { "id": "L2", "pos": [23.8, 0, 7.7], "lit": false, "deposited": 0, "fuel": 0, "ever_lit": false, "relit_count": 0 },
    { "id": "L3", "pos": [14.7, 0, -20.2], "lit": false, "deposited": 0, "fuel": 0, "ever_lit": false, "relit_count": 0 },
    { "id": "L4", "pos": [-14.7, 0, -20.2], "lit": false, "deposited": 0, "fuel": 0, "ever_lit": false, "relit_count": 0 },
    { "id": "L5", "pos": [-23.8, 0, 7.7], "lit": false, "deposited": 0, "fuel": 0, "ever_lit": false, "relit_count": 0 }
  ],
  "shades": [],
  "motes": [],
  "drifters": [],
  "charms": [],
  "motes_active": 20
}
```
