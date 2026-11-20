# AI Harness & Project Conventions: Đảo Đèn Lồng

Tài liệu hướng dẫn và quy ước làm việc cùng AI Agent cho dự án **Đảo Đèn Lồng**.

## 1. Lệnh cơ bản
- **Cài đặt & Build:** `npm run build`
- **Mở game 3D có giao diện:** `npm start` (hoặc `node src/server.js`)
- **Chạy toàn bộ test tự động:** `npm test` (hoặc `node tests/run-all.js`)
- **Chạy Test Contract headless:** `node src/cli/headless.js [tham số]`

## 2. Cấu trúc dự án
- `src/core/`: Lõi logic thuần túy (deterministic, 60 tick/s, không phụ thuộc UI, không phụ thuộc DOM hay WebGL).
- `src/cli/`: Headless runner cho Test Contract v1.0.
- `src/web/`: Giao diện 3D WebGL với Three.js và tổng hợp âm thanh Web Audio API.
- `src/server.js`: Web server phục vụ game cục bộ.
- `tests/`: Bộ test đơn vị, scenario tests, determinism tests.
- `docs/notes/`: Giả định, nhật ký AI và retro của từng phase.
- `docs/proof/`: Bằng chứng nghiệm thu của từng phase.
- `game.contract.json`: Khai báo bắt buộc của Test Contract.

## 3. Quy ước phát triển & SDLC
1. **Lõi trước, UI sau:** Mọi cơ chế gameplay phải được xây dựng và kiểm thử trong `src/core/` trước khi ghép vào 3D.
2. **Tuân thủ Test Contract v1.0:**
   - Đơn vị độ dài: mét; Y hướng lên; mặt phẳng ngang XZ.
   - Không được thay đổi định dạng JSONL (Snapshot, Event, End).
   - Mã thoát: 0 khi thành công, 2 khi sai định dạng input/scenario, khác 0 khi lỗi khác.
   - Tính tất định: cùng seed, cùng scenario, cùng inputs phải cho output đồng nhất 100%.
3. **Sáng tạo không phá vỡ hợp đồng:** Bất kỳ tính năng sáng tạo nào (âm thanh, hiệu ứng hạt, trang phục nón lá) chỉ nằm ở tầng hiển thị/âm thanh, không được làm sai lệch kết quả headless của Test Contract.
4. **Không kết thúc khi test đỏ:** Mọi thay đổi phải vượt qua `npm test` trước khi commit.
