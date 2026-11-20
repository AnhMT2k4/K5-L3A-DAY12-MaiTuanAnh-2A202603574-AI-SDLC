# Đảo Đèn Lồng (Lantern Island)

> **Dự án Lab AI SDLC - Khóa 5**  
> **Sinh viên:** Mai Tuấn Anh  
> **MSSV:** 2A202603574  
> **Tag Phase 1:** `phase-1`  
> **Bản hợp đồng:** Test Contract v1.0  

---

## 1. Giới thiệu trò chơi

**Đảo Đèn Lồng** là một trò chơi 3D góc nhìn thứ ba mang phong cách cổ tích, ấm áp. Người chơi điều khiển **Mây**, người giữ đèn nhỏ tuổi của một hòn đảo tròn giữa biển mây bồng bềnh. Trong đêm tối mù mịt do sương đen nuốt chửng ánh sáng, Mây phải chạy khắp đảo thu thập các đốm sáng (đom đóm) và mang về thắp lại **5 Đèn Lồng Lớn**.

Tuy nhiên, trong bóng sương ẩn nấp những sinh vật mực đen gọi là **Bóng Mực** luôn bám đuổi Mây. Mây có thể tỏa sáng (Pulse) để đẩy lùi và làm choáng chúng, nhưng hành động này tiêu tốn ánh sáng mang theo. Bóng Mực cũng sợ ánh sáng từ những Đèn Lồng Lớn đã được thắp.

---

## 2. Hướng dẫn Cài đặt & Chạy Game (Tối đa 3 lệnh)

Chỉ cần máy tính có cài sẵn **Node.js (>= 18)**, thực thi tối đa 3 lệnh sau:

```bash
# 1. Cài đặt các gói phụ thuộc (hoặc kiểm tra build)
npm run build

# 2. Khởi động game 3D có giao diện trên trình duyệt
npm start

# 3. Chạy toàn bộ bộ test kiểm chứng tự động (Unit, Scenarios, Determinism)
npm test
```

Truy cập giao diện game tại: **http://localhost:3000**

---

## 3. Điều khiển (Controls)

| Thao tác | Phím điều khiển | Chức năng |
|---|---|---|
| **Di chuyển** | `W`, `A`, `S`, `D` hoặc `Phím mũi tên` | Điều khiển Mây chạy khắp đảo |
| **Nhảy** | `Space` | Nhảy lên |
| **Xoay Camera 3D** | `Kéo chuột trái / Chuột phải` | Điều chỉnh góc nhìn tự do 360 độ |
| **Tỏa sáng (Pulse)** | `E` | Tiêu tốn 1 đom đóm để xua đuổi & làm choáng Bóng Mực lân cận |
| **Nạp đèn (Interact)** | `F` hoặc `Enter` | Nạp đom đóm đang giữ vào Đèn Lồng Lớn khi đứng gần |
| **Chơi lại** | Nhấn nút **"CHƠI LẠI ĐÊM 1"** | Tải lại màn chơi khi Thắng hoặc Thua |

---

## 4. Cách tính điểm (Scoring System)

Điểm số trong game được tính toán dựa trên các sự kiện sau:

- **Thu thập đom đóm:** `+10 điểm` cho mỗi đốm sáng nhặt được (`score.per_mote = 10`).
- **Thắp sáng Đèn Lồng Lớn:** `+100 điểm` cho mỗi chiếc đèn được nạp đủ 5 đom đóm (`score.per_lantern = 100`).
- **Làm choáng Bóng Mực:** `+20 điểm` cho mỗi Bóng Mực bị choáng khi Mây tỏa sáng (`score.per_stun = 20`).
- **Thưởng Chiến Thắng:** Khi thắp sáng toàn bộ 5 đèn:
  - `+5 điểm` cho mỗi giây còn lại trước bình minh (`score.per_second_left = 5`).
  - `+50 điểm` cho mỗi ngọn lửa (máu) còn giữ được (`score.per_flame_left = 50`).

---

## 5. Chế độ Headless & Test Contract v1.0

Game tuân thủ nghiêm ngặt **Test Contract v1.0** với tệp cấu hình [game.contract.json](game.contract.json). Chế độ headless chạy độc lập 60 tick/giây, không cần GPU hay giao diện, đảm bảo tính tất định 100%.

### Cú pháp chạy headless:
```bash
node src/cli/headless.js --seed <int> --night 1 [--scenario <file.json>] [--inputs <file.json>] --ticks <int> --out <file.jsonl> [--snapshot-every <int>]
```

### Ví dụ chạy kiểm thử:
```bash
node src/cli/headless.js --seed 42 --night 1 --scenario tests/fixtures/scenario-basic.json --inputs tests/fixtures/inputs-basic.json --ticks 250 --out out.jsonl
```

### Mã thoát (Exit Codes):
- `0`: Chạy hoàn tất đủ số ticks hoặc trò chơi kết thúc (Thắng / Thua).
- `2`: Tệp đầu vào `--inputs` hoặc `--scenario` sai định dạng JSON / logic tick.
- Khác `0`: Có lỗi phát sinh trong quá trình thực thi.

---

## 6. Sáng tạo của tôi (My Creativity)

Ngoài việc đảm bảo 100% các yêu cầu cốt lõi của PRD-0 và Test Contract v1.0, tôi đã đưa thêm các yếu tố sáng tạo đậm nét cổ tích Việt Nam:

1. **Tạo hình nhân vật Mây mang Nón Lá và Đèn Lồng nhỏ:**
   - Mây đội nón lá truyền thống cách điệu với một chiếc đèn lồng nhỏ đung đưa trước mũ phát ra ánh sáng vàng ấm áp.
2. **Tổng hợp âm thanh Procedural Web Audio API:**
   - Tạo trực tiếp hiệu ứng chuông ngũ cung trong trẻo khi nhặt đom đóm, hợp âm ấm áp khi thắp đèn, tiếng sóng xung kích khi tỏa sáng, và âm trầm sương đêm huyền bí mà không cần tải file âm thanh nặng từ ngoài.
3. **Hiệu ứng Biển mây & Ánh sáng hòn đảo:**
   - Hòn đảo tròn ngự trên một biển mây mờ ảo. Khi từng Đèn Lồng Lớn được thắp, ánh sáng đảo sáng dần lên xua tan sương tím đen.
4. **Hiệu ứng sóng xung kích (Pulse Shockwave):**
   - Vòng tròn ánh sáng vàng cam nở rộng trên mặt đất mỗi khi Mây tỏa sáng.

> **Bằng chứng không phá vỡ Test Contract:**  
> Toàn bộ logic hiển thị 3D và âm thanh được tách rời hoàn toàn trong tầng `src/web/`. Tầng mô phỏng `src/core/` và runner `src/cli/headless.js` chạy độc lập thuần Node.js, không gọi bất kỳ API trình duyệt nào. Bộ kiểm thử tự động `npm test` chứng minh mọi scenario và tính tất định của Test Contract vẫn chính xác 100%.

---

## 7. Tài liệu & Bằng chứng Kiểm chứng
- [AGENTS.md](AGENTS.md): Quy ước phát triển & hướng dẫn dành cho AI Agent.
- [Giả định kỹ thuật & Tuning](docs/notes/phase-1-assumptions.md): Phân tích PRD-0 và các con số tuning.
- [Nhật ký Sử dụng AI & Retro](docs/notes/phase-1-ai-log.md): Quá trình hợp tác với AI, xử lý lỗi và quản lý token.
- [Bằng chứng Kiểm chứng](docs/proof/phase-1-proof.md): Bảng ma trận nghiệm thu yêu cầu và kết quả test tự động.
