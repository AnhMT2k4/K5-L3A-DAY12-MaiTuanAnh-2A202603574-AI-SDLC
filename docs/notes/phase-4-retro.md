# Bao cao Retrospective - Du an Dao Den Long (Phase 1 - 4)

- **Tac gia:** Mai Tuan Anh (MSSV: 2A202603574)
- **Hoc phan:** Lab AI SDLC - Khoa 5
- **Phien ban phat hanh:** v1.0.0 (Test Contract v1.3)

---

## 1. Tong hop danh gia qua 4 Phase phat trien

- **Phase 1 (Khoi tao va Test Contract v1.0):**
  Xay dung thanh cong loi mo phong vat ly tat dinh (deterministic) 60 tick/giay, chay hoan toan doc lap giua headless va 3D Web Three.js. Viec tach biet core simulation va visual renderer ngay tu dau giup tiet kiem thoi gian sua loi.
- **Phase 2 (Ba hon dao va Test Contract v1.1):**
  Mo rong map sang 3 Dem choi (Dao Ben, Dao Cau, Dao Chuong) voi dia hinh giat cap, buc nhay, bua gio va co che gio thoi. Viec bo sung cac co che moi phoi hop tot voi he thong PRNG da co.
- **Phase 3 (Change Request 'Den can dau' va Contract v1.2):**
  Doi luat choi cot loi tu chay dua sang quan ly dau den va song sot toi binh minh. Co che hao hut dau va Bong Muc hut dau (drain) tao do kich tinh cao.
- **Phase 4 (Phat hanh v1.0.0 va Contract v1.3):**
  Bo sung che do Benchmark do FPS chuan hoa, Soak Test chay 10 dem lien tiep do ro ri bo nho, Bang xep hang cuc bo va he thong tro nang (Accessibility).

---

## 2. Nhung dieu hieu qua va khong hieu qua khi lam viec voi AI

- **Hieu qua:**
  - Quy tac 'Loi truoc, UI sau' (Core-first TDD) giup AI tap trung vao logic toan hoc va vat ly truoc khi dung hinh.
  - Test Contract ro rang voi snapshot schema va tick rate chuan hoa giup AI de dang viet unit test va scenario test chinh xac.
  - Su dung file AGENTS.md lam quy uoc chuan giup cac turn sau luon tuan thu luat le chung.
- **Khong hieu qua:**
  - Giao toan bo ca UI va Core cung mot luc de lam AI bi qua tai context va de bo sot cac yeu cau nho.
  - Cac lenh shell tren Windows phai chu y cu phap PowerShell thay vi Bash de tranh loi ngat dong.

---

## 3. Cac loi AI tung gap va cach phat hien, xu ly

- **Loi 1: Reset nut bam dau vao o headless runner (Phase 2):**
  Khi doc cac frame input, nut pause khong duoc reset sau moi tick dan den viec sim bi nhan pause lien tuc. Phat hien qua unit test pause/resume bi treo. Khac phuc bang cach reset toan bo nut bam ve false truoc moi frame doc.
- **Loi 2: Sai lech thoi gian time_left_s (Phase 2):**
  Ket qua time_left_s giam o tick 1 la 199.983 thay vi 200.0 tron. Phat hien qua assertion loi tinh diem thuong thoi gian. Khac phuc bang cach tinh diem dua tren floor(time_left_s).
- **Loi 3: Do bo nho Soak test bi vuot nguong 1.2x do co che V8 Garbage Collection (Phase 4):**
  Khi chay 10 dem trong 1 process, Node.js chua tu dong don bo nho ngay lap tuc nen bo nho bao tang 1.48x. Phat hien khi chay 
pm run soak. Khac phuc bang cach bo sung flag --expose-gc va goi don bo nho sach se sau moi dem.

---

## 4. Danh gia AI Harness nao giup ich nhieu nhat

- **AGENTS.md:** Day la harness quan trong nhat, dinh huong toan bo cac lenh build, test, headless runner va quy uoc khong duoc sua test do.
- **Test Contract Schema (game.contract.json):** Giup rang buoc chuan dau vao, dau ra, hang so vat ly va cac event name thong nhat giua moi phase.
- **Bo test tu dong hoa (run-all.js):** Voi unit test, scenarios test, determinism test va perf test giup phat hien ngay lap tuc moi breaking change.

---

## 5. Uoc tinh Token, Chi phi va Ky thuat tiet kiem Token

- **Tong token uoc tinh:** Khoang 250,000 - 350,000 token qua ca 4 phase.
- **Cach tiet kiem token:**
  - Doc tap trung vao cac dong can sua (line range) thay vi doc ca file lon.
  - Chay test bang CLI va tom tat ngan gon ket qua thay vi in toan bo dump log.
  - Gop cac thao tac kiem tra lien quan vao mot luot goi tool.

---

## 6. Neu lam lai tu dau thi se thay doi gi

- Se thiet ke ngay tu dau co che fuel va timer theo dang integer ticks thay vi float seconds de tranh moi sai so so thuc.
- Bo sung san module Leaderboard va Settings ngay tu Phase 1 de tai su dung UI modal xuyen suot.
