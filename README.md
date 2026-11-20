# Đảo Đèn Lồng (Lantern Island) — Phát hành v1.0.0

> **Dự án Lab AI SDLC - Khóa 5**  
> **Sinh viên:** Mai Tuấn Anh  
> **MSSV:** 2A202603574  
> **Phiên bản:** v1.0.0 (Tag: phase-4)  
> **Test Contract:** v1.3 (game.contract.json)  

---

## 1. Giới thiệu trò chơi

**Đảo Đèn Lồng** là một trò chơi 3D góc nhìn thứ ba mang không khí đêm cổ tích ấm áp và huyền ảo. Người chơi hóa thân thành **Mây**, người giữ đèn nhỏ tuổi của quần đảo giữa biển mây.

Nhiệm vụ cốt lõi:
- **Thu thập Đom đóm:** Di chuyển, lướt và nhảy nhặt đom đóm rải rác trên các hòn đảo.
- **Thắp và Duy trì Đèn Lồng:** Thắp sáng các ngọn đèn cổ kính (chi phí 10 đom đóm lần đầu, 5 đom đóm khi thắp lại). Đèn tự tiêu hao dầu (1.0 fuel/s) và cần được châm dầu định kỳ bằng phím F.
- **Chống lại Bóng Mực:** Xua đuổi quái vật bằng kỹ năng Tỏa Sáng (E). Cảnh giác khi đèn dưới 30 fuel vì đèn sẽ mất vùng an toàn và Bóng Mực sẽ tiến đến hút dầu liên tục (drain).
- **Sống sót tới Bình Minh (dawn_survived):** Giữ sáng tối thiểu 60% tổng số đèn trên đảo cho tới khi hết thời gian đêm để giành chiến thắng.

---

## 2. Yêu cầu hệ thống (System Requirements)

- **Hệ điều hành:** Windows 10/11, macOS hoặc Linux.
- **Môi trường chạy:** Node.js phiên bản >= 18.0.0.
- **Trình duyệt Web (nếu chơi 3D):** Google Chrome, Microsoft Edge, Firefox, Brave (hỗ trợ WebGL 1.0/2.0).
- **Phần cứng đề xuất:** CPU 2 nhân, RAM tối thiểu 2 GB, GPU tích hợp hoặc rời hỗ trợ WebGL.

---

## 3. Cài đặt & Khởi động nhanh (Tối đa 3 lệnh)

Clone repo về máy sạch và thực thi tối đa 3 lệnh sau:

`ash
# 1. Đồng bộ và build mã nguồn lõi
npm run build

# 2. Khởi chạy máy chủ Web 3D
npm start

# 3. Chạy toàn bộ bộ test kiểm thử tự động
npm test
`

Mở trình duyệt truy cập: **http://localhost:3000** để chơi trực tiếp!

---

## 4. Bảng điều khiển (Controls)

| Hành động | Phím mặc định | Chức năng |
|---|---|---|
| **Di chuyển** | W, A, S, D hoặc Mũi tên | Chạy trên đảo và điều hướng trên không |
| **Lướt (Dash)** | Shift hoặc Q | Lướt tốc độ cao 14 m/s trong 0.2s, hồi chiêu 1.5s |
| **Nhảy** | Space | Nhảy cao 7.0 m/s khi đang chạm đất |
| **Tỏa sáng (Pulse)** | E | Tiêu tốn 3 đom đóm tạo sóng xua đuổi và làm choáng Bóng Mực |
| **Nạp / Châm dầu** | F hoặc Enter | Nạp đom đóm thắp đèn, thắp lại hoặc châm dầu |
| **Xoay Camera** | Kéo chuột | Xoay góc nhìn 360 độ quanh nhân vật |
| **Tạm dừng (Pause)** | P hoặc Escape | Tạm dừng mô phỏng vật lý và bộ đếm thời gian |

> **Lưu ý:** Bạn có thể tự do đổi mọi phím bấm trong giao diện **'⌨️ Đổi Phím'** ở thanh menu trên cùng.

---

## 5. Các lệnh kiểm thử & Thước đo chất lượng (Phase 4 DoD)

### 5.1. Chạy toàn bộ Test tự động:
`ash
npm test
`
*(Bao gồm: Unit Tests v1.3, Scenario Tests 3 Đêm, Determinism Test tất định 100%, Performance Test 14.400 tick < 1s).*

### 5.2. Chế độ Benchmark hiệu năng (Contract v1.3):
Đo hiệu năng cảnh chuẩn Đêm 1 với 200 Bóng Mực, 100 đom đóm, 3 đèn thắp sáng, camera bay tròn:
`ash
npm run bench
# Hoặc: node src/cli/benchmark.js --seed 42 --duration 30 --out bench.json
`
- Ngưỡng đạt: vg_fps >= 60, p1_low_fps >= 30, load_ms <= 10000.

### 5.3. Chế độ Soak Test kiểm tra ổn định lâu dài:
Chạy headless 10 Đêm liên tiếp kiểm tra rò rỉ bộ nhớ:
`ash
npm run soak
# Hoặc: node src/cli/soak.js --seed 7 --nights 10 --out soak.json
`
- Ngưỡng đạt: crashes = 0, mem_end_mb <= 1.2 * mem_start_mb.

### 5.4. Xuất Bảng xếp hạng cục bộ:
`ash
npm run export-leaderboard
# Hoặc: node src/server.js --export-leaderboard leaderboard.json
`

### 5.5. Chạy Headless theo kịch bản:
`ash
node src/cli/headless.js --seed 42 --night 1 --ticks 240 --out out.jsonl
`

---

## 6. Tính năng Trợ năng (Accessibility)

1. **Đổi phím tự do (Key Rebinding):** Tùy biến mọi hành động, tự động phát hiện và cảnh báo trùng phím, có nút khôi phục mặc định, lưu vào localStorage.
2. **Chỉ báo hình ảnh định hướng:** Mũi tên và biểu tượng hiển thị tại mép màn hình cảnh báo khi có Bóng Mực tiếp cận từ ngoài góc nhìn.
3. **Cảnh báo sớm gió bão:** Banner cảnh báo trước 2 giây khi gió bão sắp nổi lên ở Đêm 3.
4. **Đồng hồ đếm ngược 10 giây cuối:** Hiển thị số đếm lớn nổi bật giữa màn hình.
5. **Chế độ Mù màu (Colorblind Mode):** Bảng màu tương phản cao, chuyển viền mắt Bóng Mực sang màu xanh dương sáng #00B3FF và bổ sung ký tự cảnh báo ⚠️.
6. **Giảm chuyển động (Reduced Motion):** Làm dịu các hiệu ứng chớp sáng và khử rung lắc camera.
7. **Cỡ chữ chuẩn và Tùy chọn phóng to:** Đảm bảo tối thiểu 18px ở 1280x720 và hỗ trợ nút phóng to x1.25 cho toàn bộ giao diện.

---

## 7. Tài liệu & Lưu trữ dự án

- [CHANGELOG.md](CHANGELOG.md): Nhật ký thay đổi qua cả 4 Phase.
- [CREDITS.md](CREDITS.md): Danh sách đóng góp, công nghệ và công cụ AI.
- [LICENSE](LICENSE): Giấy phép sử dụng.
- [game.contract.json](game.contract.json): Test Contract v1.3.
- [Báo cáo Retrospective](docs/notes/phase-4-retro.md): Tổng kết đánh giá 4 phase phát triển cùng AI SDLC.
- [Bằng chứng nghiệm thu](docs/proof/phase-4-proof.md): Bằng chứng nghiệm thu số liệu đo benchmark và soak test.
