# Issue: Perbaikan Hasil Code Review Utama

## Ringkasan
Project ini sudah punya dasar yang cukup baik, terutama untuk route guard dan beberapa empty state.

Tetapi masih ada beberapa bagian penting yang belum konsisten atau belum aman untuk production, yaitu:
- debounce search belum konsisten di semua search bar
- dialog konfirmasi modify data belum konsisten
- beberapa empty state untuk filter/search masih menyesatkan
- beberapa proses backend yang mengubah banyak data belum benar-benar atomic
- seed data belum cukup untuk mendemokan flow utama project
- responsiveness belum tervalidasi dengan baik di halaman organizer dan tabel data

Issue ini dibuat dengan bahasa yang mudah dipahami oleh junior developer atau model AI yang murah. Kerjakan per fase, jangan semua sekaligus dalam satu PR besar.

---

## Tujuan utama
Setelah issue ini selesai, project harus memenuhi panduan berikut:

1. Protected route tetap berjalan dengan benar
2. UI responsive di halaman utama dan halaman organizer
3. Search bar yang relevan memakai debounce yang benar
4. Modify data memakai popup dialog konfirmasi yang konsisten
5. Jika hasil filter atau search kosong, user melihat empty state yang tepat
6. Modify action yang mengubah banyak data memakai SQL transaction yang aman
7. Project punya seed data yang relevan untuk demo dan testing manual

---

## Kondisi saat ini

### Yang sudah baik
- Protected route sudah ada untuk auth dan role
- Beberapa halaman sudah punya empty state dasar
- Event list page sudah punya debounce sederhana yang cukup dekat dengan requirement

### Yang masih bermasalah
- Landing page search belum debounce yang benar, hanya menahan spam click
- Organizer attendee search masih submit manual, belum debounce
- Confirm modify data masih campur antara `window.confirm`, panel inline, dan modal custom
- Empty state organizer transactions dan attendee belum membedakan antara "belum ada data" dan "hasil filter kosong"
- Beberapa flow backend mengubah status transaksi, seats, points, voucher, dan coupon di operasi yang terpisah
- Seed data hanya category, belum ada data demo yang bisa dipakai untuk mengecek flow utama

---

## Acceptance Criteria
- Route guard tetap aman dan tidak rusak setelah refactor
- Landing page search dan organizer attendee search memakai debounce yang benar
- Semua action modify data penting memakai popup dialog yang konsisten
- Empty state untuk filter/search menjelaskan bahwa data kosong karena filter, bukan karena data belum pernah ada
- Flow backend yang mengubah banyak tabel memakai satu transaction database yang jelas
- Jika proses external gagal, sistem punya cara aman untuk recovery atau compensation
- Seed data minimal berisi organizer, customer, category, event, ticket type, voucher, transaction, dan review
- Halaman organizer utama tetap usable di mobile dan tablet

---

## Quick Checklist
- [ ] Audit dan rapikan semua search bar
- [ ] Standarkan semua confirm modify action ke dialog component yang sama
- [ ] Bedakan empty state default vs empty state hasil filter/search
- [ ] Rapikan flow transaction backend agar atomic
- [ ] Tambah seed data demo yang realistis
- [ ] Cek responsiveness di page organizer dan tabel
- [ ] Tambah test/regression check untuk area yang paling riskan

---

## Urutan kerja yang disarankan

## Fase 1 - Rapikan frontend behavior yang paling terlihat user
Fase ini fokus ke hal yang paling cepat terlihat oleh user.

### 1. Debounce search bar
Target file yang kemungkinan perlu diubah:
- `frontend/src/pages/LandingPage.tsx`
- `frontend/src/pages/organizer/DashboardOverviewPage.tsx`
- jika perlu, pindahkan helper ke `frontend/src/hooks/` atau `frontend/src/utils/`

Yang harus dilakukan:
- buat satu helper debounce yang reusable
- gunakan helper itu di landing page search
- gunakan helper itu di organizer attendee search
- jangan pakai pattern "klik tombol lalu disable 500ms" sebagai pengganti debounce
- kalau search masih perlu tombol submit, debounce tetap harus jalan saat user mengetik atau saat value berubah

Definisi selesai:
- user mengetik cepat tidak memicu request atau navigation berkali-kali
- request atau perubahan query string baru jalan setelah jeda singkat, misalnya `300ms` sampai `500ms`

### 2. Popup dialog untuk modify data
Target file yang kemungkinan perlu diubah:
- `frontend/src/pages/organizer/TransactionsManagementPage.tsx`
- `frontend/src/pages/TransactionDetailPage.tsx`
- `frontend/src/pages/organizer/MyEventsPage.tsx`
- `frontend/src/pages/organizer/VoucherManagementPage.tsx`
- `frontend/src/components/ui/dialog.tsx`

Yang harus dilakukan:
- pilih satu pola dialog saja untuk konfirmasi modify data
- jangan gunakan `window.confirm`
- jangan campur antara panel inline dan dialog popup untuk action yang setara
- buat isi dialog sederhana: judul, deskripsi singkat, tombol batal, tombol lanjut
- tampilkan loading state di tombol confirm

Action yang wajib dicek:
- cancel transaction
- delete event
- delete voucher
- action modify penting lain yang mengubah data backend

Definisi selesai:
- semua confirm action penting punya UX yang konsisten
- tidak ada lagi `window.confirm` untuk flow utama

### 3. Empty state hasil filter dan search
Target file yang kemungkinan perlu diubah:
- `frontend/src/pages/organizer/TransactionsManagementPage.tsx`
- `frontend/src/components/organizer/AttendeeTable.tsx`
- `frontend/src/pages/organizer/DashboardOverviewPage.tsx`
- file lain yang punya filter/search serupa

Yang harus dilakukan:
- bedakan 2 kondisi berikut:
  - data memang belum ada sama sekali
  - data ada, tapi hasil filter/search kosong
- kalau status filter aktif dan hasil kosong, tampilkan pesan seperti:
  - "Tidak ada transaksi yang cocok dengan filter ini"
  - "Tidak ada attendee yang cocok dengan kata kunci ini"
- jika cocok, tambahkan tombol reset filter atau clear search

Definisi selesai:
- user paham kenapa list kosong
- pesan empty state tidak menyesatkan

---

## Fase 2 - Perbaiki keamanan data di backend
Fase ini paling penting untuk mencegah data rusak.

### 4. Rapikan flow create transaction agar atomic
Target file yang kemungkinan perlu diubah:
- `backend/src/services/transactionService.ts`
- `backend/src/services/pointService.ts`

Masalah saat ini:
- sebagian proses sudah ada di `prisma.$transaction`
- tetapi `usePoints()` masih memakai prisma global sendiri
- update transaction dengan snap token juga terjadi di luar transaction utama

Yang harus dilakukan:
- ubah helper point agar bisa menerima prisma transaction client, bukan selalu prisma global
- semua update yang masih satu unit bisnis harus memakai transaction client yang sama
- tentukan strategi aman untuk call Midtrans yang berada di luar database transaction

Strategi yang disarankan:
- buat record transaction database lebih dulu dengan status awal yang jelas
- simpan bahwa token payment belum tersedia jika memang Midtrans call belum selesai
- setelah Midtrans sukses, update snap token dengan flow yang aman
- jika Midtrans gagal, sistem harus punya recovery yang jelas, misalnya rollback internal atau tandai transaction sebagai gagal dan restore resource

Catatan penting:
- database transaction tidak bisa membungkus network call external secara sempurna
- karena itu, fokusnya adalah membuat state internal tetap konsisten walaupun Midtrans gagal

Definisi selesai:
- seat, ticket stock, point, coupon, voucher, dan transaction record tidak bisa berhenti di kondisi setengah jadi

### 5. Rapikan flow reject, expire, dan rollback
Target file yang kemungkinan perlu diubah:
- `backend/src/services/transactionService.ts`
- `backend/src/services/rollbackService.ts`
- jika perlu, `backend/src/jobs/transactionJobs.ts`

Masalah saat ini:
- status transaction bisa berubah dulu
- rollback resource dijalankan belakangan di luar unit transaction yang sama

Yang harus dilakukan:
- satukan update status gagal dan rollback resource dalam satu flow yang konsisten
- hindari kondisi status sudah `canceled` atau `expired`, tapi seats/points belum kembali
- helper restore points juga harus bisa memakai transaction client bila dipanggil dari rollback flow
- email notifikasi harus diperlakukan sebagai side effect setelah operasi utama aman

Urutan yang disarankan:
1. validasi apakah transaction boleh diproses
2. jalankan database transaction untuk update status + restore resource
3. setelah commit sukses, baru kirim email
4. jika email gagal, jangan rollback database lagi, tapi log error dan siapkan retry mechanism jika diperlukan

Definisi selesai:
- state final transaction dan resource selalu sinkron

---

## Fase 3 - Seed data yang relevan
Fase ini penting supaya project mudah didemo dan diuji manual.

### 6. Tambahkan seed data demo
Target file yang kemungkinan perlu diubah:
- `backend/prisma/seed.ts`
- file helper baru di `backend/src/utils/` atau `backend/prisma/`

Seed minimal yang harus ada:
- categories
- 1 organizer demo
- 1 customer demo
- beberapa event dari organizer
- beberapa ticket type untuk tiap event
- minimal 1 voucher
- minimal 1 transaksi `paid`
- minimal 1 transaksi `waiting_payment`
- minimal 1 transaksi `canceled` atau `expired`
- minimal 1 review untuk event yang sudah selesai

Data harus terasa realistis:
- nama event masuk akal
- tanggal event campuran antara upcoming dan past event
- harga tiket bervariasi
- status transaction bervariasi agar dashboard dan filter bisa dites

Definisi selesai:
- setelah seed dijalankan, frontend utama tidak terasa kosong
- organizer dashboard dan customer transaction page punya data yang cukup untuk demo

---

## Fase 4 - Responsiveness dan regression check
Fase ini untuk memastikan hasil perbaikan tetap nyaman dipakai.

### 7. Audit responsiveness
Target area yang wajib dicek:
- landing page
- events page
- transaction pages customer
- organizer dashboard overview
- organizer transactions management
- organizer voucher management
- organizer my events

Hal yang harus dicek manual:
- mobile width sekitar `360px`
- tablet width sekitar `768px`
- laptop width sekitar `1024px` ke atas

Masalah yang harus dicari:
- tombol terlalu rapat
- dialog terlalu besar di mobile
- tabel sulit dipakai tanpa petunjuk scroll
- header/action bar pecah dan tidak rapi
- card action menumpuk terlalu sempit

Perbaikan yang biasanya dibutuhkan:
- ubah layout flex menjadi stack di mobile
- rapikan spacing tombol action
- tambahkan heading atau helper text untuk area tabel yang scroll horizontal
- pastikan dialog punya max height dan bisa discroll di layar kecil

Definisi selesai:
- halaman utama tetap usable di mobile tanpa layout rusak berat

### 8. Tambahkan regression check ringan
Walaupun issue ini tidak mewajibkan test besar, area berikut sebaiknya punya pengaman:
- route guard tidak rusak
- debounce helper bekerja sesuai ekspektasi
- rollback flow tidak mengembalikan data dua kali
- seed berhasil jalan tanpa error

Kalau tim belum siap membuat test lengkap, minimal lakukan:
- checklist manual test yang ditulis di PR
- screenshot atau video singkat untuk mobile dan desktop

Kalau sempat, tambahkan test otomatis untuk:
- protected route behavior
- transaction rollback service
- seed sanity check sederhana

---

## Rekomendasi pecah PR
Supaya aman dan gampang direview, pecah menjadi beberapa PR kecil:

### PR 1
Frontend debounce + empty state

### PR 2
Dialog konfirmasi yang konsisten

### PR 3
Backend transaction integrity dan rollback

### PR 4
Seed data demo

### PR 5
Responsive cleanup dan regression check

---

## Risiko yang harus diperhatikan
- Jangan refactor semua halaman organizer sekaligus kalau belum ada visual check
- Jangan kirim email di tengah database transaction
- Jangan menganggap external API call bisa dibuat atomic seperti query database
- Jangan ubah seed data demo secara acak tanpa memastikan semua flow masih bisa dipakai
- Jangan memecah helper transaction tanpa memastikan type Prisma transaction client tetap benar

---

## Checklist QA manual setelah semua fase selesai
- [ ] Guest tidak bisa masuk halaman protected
- [ ] Customer tidak bisa masuk halaman organizer
- [ ] Organizer tidak bisa masuk halaman customer-only
- [ ] Landing page search tidak spam navigation saat user mengetik cepat
- [ ] Organizer attendee search terasa ringan dan tidak spam request
- [ ] Semua confirm modify action muncul sebagai popup dialog
- [ ] Empty state untuk hasil filter kosong sudah benar
- [ ] Cancel transaction mengembalikan resource dengan benar
- [ ] Expire transaction tidak meninggalkan data setengah jadi
- [ ] Seed data berhasil membuat project enak untuk demo
- [ ] Halaman organizer masih usable di mobile dan tablet

---

## Estimasi sederhana untuk developer junior
- Fase 1: 4 sampai 6 jam
- Fase 2: 6 sampai 10 jam
- Fase 3: 3 sampai 5 jam
- Fase 4: 3 sampai 5 jam

Total realistis: 16 sampai 26 jam kerja, tergantung seberapa banyak refactor yang dibutuhkan.

---

## Definition of Done
- semua acceptance criteria di issue ini terpenuhi
- tidak ada lagi `window.confirm` di flow utama
- flow transaction backend tidak meninggalkan state setengah jadi
- seed data cukup untuk demo end-to-end sederhana
- hasil QA manual dicatat di PR