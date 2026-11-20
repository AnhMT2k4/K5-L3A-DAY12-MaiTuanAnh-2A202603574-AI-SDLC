# Bằng chứng Kiểm chứng (Proof of Verification): Phase 1

Bài nộp: **Tag phase-1**  
Họ tên: **Mai Tuấn Anh** - MSSV: **2A202603574**  
Đề bài: **Đảo Đèn Lồng - Đêm 1**

---

## 1. Ma trận Truy vết Yêu cầu đến Bằng chứng (Traceability Matrix)

| STT | Yêu cầu PRD-0 & Contract v1.0 | Cách kiểm chứng | Bằng chứng | Kết quả |
|---|---|---|---|:---:|
| 1 | **Di chuyển 3D, camera yaw, chuẩn hóa vector** | Unit test: thử nghiệm góc quay camera 0° và 90°, kiểm tra tọa độ di chuyển. | `tests/unit.test.js` (Test 2) | **ĐẠT** |
| 2 | **Nhặt đom đóm & Giới hạn sức chứa** | Scenario test: đặt đom đóm trong bán kính nhặt, thử vượt quá sức chứa 5. | `tests/unit.test.js` (Test 3) | **ĐẠT** |
| 3 | **Nạp đom đóm vào đèn & Thắp sáng** | Scenario test: tương tác với đèn khi có đom đóm, phát hiện event `deposit` và `lantern_lit`. | `tests/unit.test.js` (Test 4) | **ĐẠT** |
| 4 | **Tỏa sáng (Pulse): Đẩy lùi & Choáng Bóng Mực** | Scenario test: phát lệnh pulse, kiểm tra event `pulse`, trạng thái `stunned` và khoảng cách bị đẩy lùi. | `tests/unit.test.js` (Test 5) | **ĐẠT** |
| 5 | **Bóng Mực tấn công: Mất lửa, rơi đom đóm, bất tử tạm thời** | Scenario test: bóng mực chạm người chơi, phát event `player_hit`, mất 1 lửa và rơi 50% đom đóm. | `tests/unit.test.js` (Test 6) | **ĐẠT** |
| 6 | **Điều kiện Thắng (Thắp đủ 5 đèn)** | Scenario test: thắp sáng toàn bộ 5 đèn, nhận event `game_over` với `reason: "all_lit"`, cộng điểm thưởng thời gian và ngọn lửa. | `tests/unit.test.js` (Test 7) | **ĐẠT** |
| 7 | **Đầu ra Headless JSONL (Snapshot, Event, End)** | Headless run test: chạy kịch bản scenario chuẩn, đọc và phân tích từng dòng output JSONL. | `tests/scenarios.test.js` (Test 1) | **ĐẠT** |
| 8 | **Xử lý lỗi định dạng (Mã thoát 2)** | Headless format test: cung cấp file inputs sai thứ tự tick, kiểm tra tiến trình thoát mã 2. | `tests/scenarios.test.js` (Test 2) | **ĐẠT** |
| 9 | **Tính tất định 100% (Determinism)** | Determinism test: chạy 2 lần với cùng seed, cùng scenario, cùng inputs; so sánh chuỗi byte output. | `tests/determinism.test.js` | **ĐẠT** |
| 10 | **Giao diện 3D và Điều khiển trực tiếp** | Khởi chạy server web, kiểm tra HTTP 200 và giao diện Canvas WebGL với Three.js. | `src/server.js`, `src/web/` | **ĐẠT** |

---

## 2. Kết quả Chạy Bộ Kiểm tra Tự động (`npm test`)

```text
====================================
 RUNNING ALL VERIFICATION TEST SUITES
====================================

--- Running Unit Tests ---
✓ PRNG determinism passed
✓ Player movement (yaw 0) passed
✓ Player movement (yaw 90) passed
✓ Mote pickup and carry capacity passed
✓ Deposit and lantern_lit passed
✓ Pulse action passed
✓ Shade damage and hit_drop_ratio passed
✓ Win condition passed
ALL UNIT TESTS PASSED!

--- Running Scenarios Tests ---
✓ Scenario basic test passed
✓ Inputs format error validation (exit code 2) passed
ALL SCENARIOS TESTS PASSED!

--- Running Determinism Tests ---
✓ Determinism verified: 100% identical outputs for same seed and inputs
ALL DETERMINISM TESTS PASSED!

====================================
 ALL SUITES PASSED SUCCESSFULLY (100%)
====================================
```

---

## 3. Mẫu Output Headless JSONL Thực tế (Tick 0 đến End)

```jsonl
{"type":"snapshot","tick":0,"sim_tick":0,"state":"playing","time_left_s":180,"score":0,"player":{"pos":[0,0,0],"flames":3,"carried":0},"lanterns":[{"id":"L1","pos":[0,0,25],"lit":false,"deposited":0},{"id":"L2","pos":[23.776,0,7.725],"lit":false,"deposited":0},{"id":"L3","pos":[14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L4","pos":[-14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L5","pos":[-23.776,0,7.725],"lit":false,"deposited":0}],"shades":[{"id":"S1","pos":[-12.263,0,17.195],"state":"chase"},{"id":"S2","pos":[-11.98,0,-27.735],"state":"chase"},{"id":"S3","pos":[32.886,0,-8.3],"state":"chase"}],"motes_active":25}
{"type":"snapshot","tick":10,"sim_tick":10,"state":"playing","time_left_s":179.8,"score":0,"player":{"pos":[0,0,0],"flames":3,"carried":0},"lanterns":[{"id":"L1","pos":[0,0,25],"lit":false,"deposited":0},{"id":"L2","pos":[23.776,0,7.725],"lit":false,"deposited":0},{"id":"L3","pos":[14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L4","pos":[-14.695,0,-20.225],"lit":false,"deposited":0},{"id":"L5","pos":[-23.776,0,7.725],"lit":false,"deposited":0}],"shades":[{"id":"S1","pos":[-11.924,0,16.72],"state":"chase"},{"id":"S2","pos":[-11.749,0,-27.199],"state":"chase"},{"id":"S3","pos":[32.32,0,-8.157],"state":"chase"}],"motes_active":25}
...
{"type":"end","ticks":60,"state":"playing","score":0}
```
