# Bang chung nghiem thu Phase 4 - Phat hanh v1.0.0 (Contract v1.3)

- **Ngay nghiem thu:** 2026-11-20
- **Phien ban:** v1.0.0
- **Test Contract:** v1.3

---

## 1. Ket qua Benchmark (
ode src/cli/benchmark.js --seed 42 --duration 30 --out bench.json)
- **Tep ket qua:** ench.json
- **Khung hinh (Frames):** 2772
- **FPS trung binh (avg_fps):** 91.1 (Yeu cau: >= 60) -> DAT
- **1% Low FPS (p1_low_fps):** 49.5 (Yeu cau: >= 30) -> DAT
- **Frame ms P95:** 12.9 ms
- **Load time (load_ms):** 1850 ms (Yeu cau: <= 10000) -> DAT
- **Peak Memory:** 46 MB
- **Renderer:** Three.js r170 (WebGL / Chromium 1280x720)

---

## 2. Ket qua Soak Test (
ode src/cli/soak.js --seed 7 --nights 10 --out soak.json)
- **Tep ket qua:** soak.json
- **So dem chay lien tuc:** 10 dem (xoay vong Dem 1-2-3)
- **So lan crash:** 0 (Yeu cau: 0) -> DAT
- **Bo nho bat dau (mem_start_mb):** 43 MB
- **Bo nho ket thuc (mem_end_mb):** 49 MB (Ti le: 1.14x <= 1.2x) -> DAT
- **Thoi gian thuc thi:** 1.3s

---

## 3. Bang xep hang cuc bo (Local Leaderboard)
- **Lenh xuat CLI:** 
ode src/server.js --export-leaderboard leaderboard.json
- **Giao dien Web:** Co modal xem Top 10 bang xep hang va form luu ten sau khi ket thuc van choi (kiem tra hop le 3-12 ky tu).

---

## 4. Kha nang tiep can (Accessibility)
- **Doi phim:** Giao dien modal tuy bien 9 hanh dong, phat hien trung phim va luu localStorage.
- **Chi bao hinh anh:** Mui ten chi huong Bong Muc ngoai man hinh, banner canh bao gio truoc 2 giay o Dem 3, dong ho dem nguoc 10 giay cuoi.
- **Giam chuyen dong:** Nut bat/tat giam rung camera va chop sang man hinh.
- **Co chu:** Co chu mac dinh >= 18px va nut bat/tat co chu lon (x1.25).

---

## 5. Bo test tu dong
Toan bo cac bai test Phase 1-3 va bo sung test Phase 4 deu dat 100% thanh cong (
pm test).
