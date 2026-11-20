# Nhật ký Sử dụng AI & Đánh giá Quá trình (Phase 1)

## 1. Nhật ký tương tác AI
- **Giai đoạn chuẩn bị (CP0):**
  - Rà soát yêu cầu chung, Test Contract v1.0 và Rubric đánh giá.
  - Thiết kế kiến trúc phân tách nghiêm ngặt: Lõi mô phỏng thuần Node.js (`src/core/`) độc lập hoàn toàn với lớp hiển thị Three.js (`src/web/`), giúp chế độ headless chạy siêu tốc không cần GPU, đồng thời 100% tất định trên cả macOS, Linux, Windows.
- **Giai đoạn xây dựng (CP1):**
  - Khởi tạo seedable Mulberry32 PRNG.
  - Hiện thực hóa cỗ máy trạng thái 60 ticks/s với đầy đủ mô hình toán học: vector di chuyển theo yaw, va chạm hình tròn trong mặt phẳng XZ, kích hoạt hành động theo sườn xung (`false -> true`), đẩy lùi và choáng bóng mực, thu nhặt đom đóm và nạp đèn lồng.
  - Xây dựng CLI headless tuân thủ đầy đủ định dạng Snapshot, Event và End JSONL cùng quy ước mã thoát (0 khi thành công, 2 khi sai định dạng input/scenario).
  - Tích hợp giao diện 3D Three.js và Web Audio API synth cho trải nghiệm trực quan.

## 2. Các lỗi AI phát hiện & Xử lý (AI Error Analysis)
1. **Lỗi mạng trong môi trường Sandbox Windows:**
   - *Phát hiện:* Lệnh `npm install` chạy ngầm bị treo do sandbox mặc định ngắt mạng bên ngoài.
   - *Khắc phục:* Nhận diện cơ chế sandbox ngay lập tức; chuyển sang chạy cài đặt với cờ cần thiết, đồng thời sao lưu trực tiếp `three.module.js` vào thư mục `src/web/vendor/` để mã nguồn có thể chạy offline độc lập hoàn toàn mà không cần tải mạng khi chấm bài.
2. **Quy tắc sườn xung (Edge Detection) của nút điều khiển:**
   - *Phát hiện:* Nếu không lưu trạng thái nút tick trước (`prevInput`), các hành động như nạp đèn (`interact`) và tỏa sáng (`pulse`) sẽ bị kích hoạt liên tục ở mọi tick khi nút còn giữ.
   - *Khắc phục:* Triển khai so sánh `currentInput.btn && !prevInput.btn` để kích hoạt chính xác theo hợp đồng test (`hành động kích hoạt khi giá trị chuyển từ false sang true`).

## 3. Thống kê & Quản lý Token
- **Chiến lược tiết kiệm token:**
  - Batching các thao tác đọc và ghi song song trong cùng 1 lượt (parallel tools execution).
  - Viết tài liệu quy ước `AGENTS.md` súc tích, ngắn gọn, tránh nạp context dư thừa.
  - Sử dụng script tự động hóa test cục bộ để kiểm chứng tính đúng đắn trước khi commit.
- **Ước tính tiêu thụ:**
  - Khoảng ~35k prompt tokens và ~15k output tokens cho toàn bộ Phase 1.
  - Chi phí ước tính: < $0.05.
