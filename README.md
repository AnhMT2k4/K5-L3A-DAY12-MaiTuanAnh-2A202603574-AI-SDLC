# Đảo Đèn Lồng (Lantern Island)

> **Dự án Lab AI SDLC - Khóa 5**  
> **Sinh viên:** Mai Tuấn Anh  
> **MSSV:** 2A202603574  
> **Tag Phase 2:** `phase-2`  
> **Bản hợp đồng:** Test Contract v1.1 (TICKET-02: "Ba hòn đảo")  

---

## 1. Giới thiệu trò chơi

**Đảo Đèn Lồng** là một trò chơi 3D góc nhìn thứ ba mang không khí đêm cổ tích, ấm áp. Người chơi điều khiển **Mây**, người giữ đèn nhỏ tuổi của quần đảo giữa biển mây. Trong đêm tối mù mịt do sương đen nuốt chửng ánh sáng, Mây phải chạy khắp các đảo thu thập các đốm sáng (đom đóm) và mang về thắp lại các **Đèn Lồng Lớn**.

### Ba Hòn Đảo (3 Đêm):
- **Đêm 1: Đảo Bến** – Hòn đảo tròn khởi đầu (R = 40m) với 5 Đèn Lồng Lớn.
- **Đêm 2: Đảo Cau** – Cụm 2 hòn đảo tròn (R = 28m) nối bằng cầu gỗ dài 18m, 2 bục nhảy (Jump Pad), 1 Bùa Gió, và sự xuất hiện của sinh vật tinh quái **Gió Lạc (Drifter)**.
- **Đêm 3: Đảo Chuông** – Đảo 3 tầng địa hình (Tầng 0: Y=0 R=45m, Tầng 1: Y=3m, Tầng 2: Y=6m R=8m), 2 đường dốc thoai thoải, chướng ngại vật Tháp Chuông cổ kính, 1 bục nhảy, 2 Bùa Gió, và những cơn **Gió Mạnh** đổi hướng định kỳ.

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
| **Di chuyển** | `W`, `A`, `S`, `D` hoặc `Phím mũi tên` | Chạy trên mặt đất và điều khiển trên không (6.0 m/s, Bùa Gió: 7.2 m/s) |
| **Lướt (Dash)** | `Shift` hoặc `Q` | Lướt nhanh 14 m/s trong 0.2s, giữ độ cao Y trên không (hồi chiêu 1.5s, Bùa Gió: 0s) |
| **Nhảy** | `Space` | Nhảy cao với vận tốc 7.0 m/s (chỉ khi chạm đất) |
| **Xoay Camera 3D** | `Kéo chuột trái / Chuột phải` | Điều chỉnh góc nhìn tự do 360 độ |
| **Tỏa sáng (Pulse)** | `E` | Tiêu tốn 3 đom đóm để xua đuổi, choáng Bóng Mực trong 5m và buộc Gió Lạc nhả đom đóm |
| **Nạp đèn (Interact)** | `F` hoặc `Enter` | Nạp đom đóm vào Đèn Lồng Lớn khi đứng gần (bán kính 2.0m) |
| **Tạm dừng (Pause)** | `P` hoặc `Escape` | Tạm dừng mô phỏng: sim tick và bộ đếm đứng yên |
| **Chọn Đêm** | Thanh nút bấm trên đỉnh màn hình | Chuyển đổi linh hoạt giữa Đêm 1, Đêm 2, và Đêm 3 |

---

## 4. Cách tính điểm chuẩn hóa (Scoring System v1.1)

Điểm số được tính toán chính xác theo Test Contract v1.1:

- **Nạp đom đóm:** `+10 điểm` cho mỗi đom đóm nạp thành công vào Đèn Lồng.
- **Thắp sáng Đèn Lồng:** `+100 điểm` cho mỗi Đèn Lồng được thắp sáng.
- **Choáng Bóng Mực:** `+5 điểm` cho mỗi Bóng Mực bị trúng chiêu Tỏa Sáng.
- **Thưởng Chiến Thắng:** Khi thắp sáng toàn bộ đèn trước bình minh:
  - `+2 điểm` cho mỗi giây còn lại (`floor(time_left_s) * 2`).
  - `+50 điểm` cho mỗi ngọn lửa (máu) còn nguyên vẹn.

---

## 5. Chế độ Headless & Test Contract v1.1

Game tuân thủ nghiêm ngặt **Test Contract v1.1** với tệp khai báo [game.contract.json](game.contract.json). Chế độ headless chạy độc lập 60 tick/giây, không cần GPU hay trình duyệt, đảm bảo tính tất định 100%.

### Cú pháp chạy headless:
```bash
node src/cli/headless.js --seed <int> --night <1|2|3> [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]
```

### Ví dụ chạy kiểm thử:
```bash
# Đêm 1 (Đảo Bến)
node src/cli/headless.js --seed 42 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 250 --out out.jsonl

# Đêm 2 (Đảo Cau)
node src/cli/headless.js --seed 42 --night 2 --scenario tests/fixtures/scenario-night2.json --ticks 100 --out out-n2.jsonl

# Đêm 3 (Đảo Chuông)
node src/cli/headless.js --seed 42 --night 3 --scenario tests/fixtures/scenario-night3.json --ticks 150 --out out-n3.jsonl
```

### Mã thoát (Exit Codes):
- `0`: Chạy hoàn tất đủ số ticks hoặc trò chơi kết thúc (Thắng / Thua).
- `2`: Tệp đầu vào `--inputs` hoặc `--scenario` sai định dạng JSON / logic tick.
- Khác `0`: Có lỗi phát sinh trong quá trình thực thi.

---

## 6. Sáng tạo của tôi (My Creativity)

1. **Tạo hình 3D nhân vật Mây mang Nón Lá và Đèn Lồng nhỏ:**
   - Mây đội nón lá truyền thống với chiếc đèn lồng nhỏ đung đưa trước mũ phát ra ánh sáng vàng ấm áp soi đường trong đêm.
2. **Cơ chế Bục nhảy và Bùa Gió 3D sống động:**
   - Bục nhảy khắc cổ tự phát sáng ngọc bích, Bùa Gió là phiến lá đỏ viền vàng bay lơ lửng, tạo hiệu ứng vệt sáng tốc độ khi lướt.
3. **Sinh vật sương đêm: Gió Lạc (Drifter):**
   - Dải lụa xanh xám bay lơ lửng, tinh nghịch rình rập người chơi để cướp đom đóm khi người chơi mang nhiều ánh sáng.
4. **Hệ thống âm thanh Procedural Web Audio API:**
   - Tạo trực tiếp hiệu ứng chuông ngũ cung cổ tích khi nhặt đom đóm, hợp âm khi thắp đèn, tiếng gió rít khi lướt và sóng xung kích khi tỏa sáng.
5. **Hiệu ứng ánh sáng đảo động (Ambient Dynamic Lighting):**
   - Ánh sáng của đảo sáng dần theo công thức chuẩn `intensity = 0.15 + 0.55 * (đèn đã thắp / tổng đèn)`, đem lại cảm giác ấm áp dần khi người chơi cứu rỗi hòn đảo.
