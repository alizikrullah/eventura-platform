# Issue: Transaction Email Notifications and Rejection Rollback

## Ringkasan
Saat ini project sudah memiliki alur transaksi customer, rollback resource untuk transaksi yang dibatalkan atau expired, dan mail service untuk reset password.

Namun, belum ada planning khusus untuk fitur notifikasi email transaksi ke customer ketika transaksi diterima atau ditolak oleh organizer.

Karena project ini menggunakan Midtrans Snap, issue ini perlu dibaca dalam konteks bahwa status pembayaran tidak boleh dianggap berasal dari klik UI organizer semata. Untuk transaksi Midtrans, source of truth utama untuk status accepted / rejected tetap berasal dari webhook Midtrans yang sudah diverifikasi.

Issue ini dibuat agar mudah dipahami oleh junior developer atau model AI yang lebih murah. Fokus utamanya adalah:
- menjelaskan kebutuhan bisnis dengan bahasa yang konkret
- memetakan bagian backend dan frontend yang terdampak
- menjelaskan hubungan antara perubahan status transaksi, rollback resource, dan email notification
- mengurangi risiko implementasi yang setengah jalan, misalnya status berubah tetapi email tidak terkirim, atau reject terjadi tetapi seat / point / voucher / coupon tidak kembali

---

## Tujuan utama
Fitur yang dibutuhkan adalah notifikasi email transaksi dengan ketentuan berikut:
1. Customer menerima email saat transaksi diterima.
2. Customer menerima email saat transaksi ditolak.
3. Jika transaksi ditolak, resource yang sudah dipakai harus dikembalikan.
4. Resource yang wajib dikembalikan saat reject:
- available seats
- ticket type available quantity
- points yang dipakai
- voucher usage jika ada
- coupon / user coupon jika ada

### Tujuan tambahan untuk konteks Midtrans
Karena payment gateway yang dipakai adalah Midtrans, implementasi wajib memastikan:
- accepted email dikirim berdasarkan status sukses dari Midtrans, bukan sekadar action frontend organizer
- rollback reject mengikuti status gagal / batal dari Midtrans atau cancel manual yang memang diizinkan bisnis
- tidak terjadi double processing antara webhook Midtrans dan action manual backend
- signature webhook tetap menjadi checkpoint keamanan utama

---

## Kebutuhan bisnis
### Saat transaksi diterima
Customer harus menerima email yang memberi tahu bahwa transaksi berhasil diterima / dikonfirmasi.

Isi email minimum:
- nama customer
- invoice number
- nama event
- total pembayaran
- status akhir transaksi

### Saat transaksi ditolak
Customer harus menerima email bahwa transaksi ditolak oleh organizer.

Selain email, sistem juga harus memastikan rollback dilakukan dengan benar:
- kursi event kembali
- stok ticket type kembali
- points kembali jika sebelumnya dipakai
- coupon dikembalikan jika sebelumnya dipakai
- voucher usage dikurangi jika sebelumnya dipakai

---

## Kondisi project saat ini
### Backend
Yang sudah ada:
- route transaksi customer sudah ada di `backend/src/routes/transaction.ts`
- transaction controller sudah ada di `backend/src/controllers/transactionController.ts`
- transaction service sudah ada di `backend/src/services/transactionService.ts`
- rollback logic sudah ada di `backend/src/services/rollbackService.ts`
- cron untuk transaksi expired sudah ada di `backend/src/jobs/transactionJobs.ts`
- mail service sudah ada di `backend/src/services/mailService.ts`

Yang sudah berjalan saat ini:
- transaksi dibuat oleh customer
- status transaksi saat ini memakai flow `waiting_payment -> paid / expired / canceled`
- rollback sudah dilakukan untuk transaksi expired atau canceled
- email reset password sudah bisa dikirim
- Midtrans Snap dipakai untuk membuat payment transaction
- webhook Midtrans sudah ada untuk update status pembayaran

Yang belum ada atau belum cukup untuk fitur ini:
- template email untuk transaksi accepted
- template email untuk transaksi rejected
- aturan yang jelas kapan organizer boleh melakukan action manual dalam flow Midtrans
- guard agar email accepted / rejected tidak terkirim dua kali dari webhook dan action manual
- pengiriman email setelah transaksi accepted / rejected
- contract response yang jelas untuk frontend organizer transaction management

### Frontend
Yang sudah ada:
- halaman organizer transaction management placeholder sudah ada di `frontend/src/pages/organizer/TransactionsManagementPage.tsx`
- UI placeholder sudah menunjukkan intent approve / reject transaksi

Yang belum ada:
- integrasi real API approve / reject transaksi
- tampilan daftar transaksi organizer dari backend
- action approve / reject yang benar-benar mengubah status transaksi
- feedback UI ketika action berhasil / gagal

---

## Fakta penting dari codebase saat ini
### Status transaksi yang ada saat ini
Di backend, status transaksi saat ini adalah:
- `waiting_payment`
- `paid`
- `expired`
- `canceled`

Artinya, istilah bisnis `accepted` dan `rejected` perlu dipetakan dengan jelas ke status database yang nyata.

### Midtrans sebagai sumber status pembayaran
Project ini memakai Midtrans Snap dan webhook Midtrans. Itu berarti:
- customer melakukan pembayaran melalui Midtrans
- backend menerima notifikasi status dari Midtrans
- backend harus memetakan `transaction_status` Midtrans ke status internal transaksi
- perubahan ke status `paid` idealnya dipicu oleh webhook Midtrans, bukan keputusan organizer di UI

Dalam konteks ini, action organizer harus diposisikan hati-hati. Jika sistem benar-benar full Midtrans tanpa manual verification, maka organizer approve manual bukan source utama accepted state.

### Rollback yang sudah ada
Service `rollbackTransaction(transactionId)` saat ini sudah menangani:
- restore event seats
- restore ticket type quantities
- restore points
- restore coupon
- decrement voucher usage

Ini penting karena fitur reject sebaiknya tidak menulis ulang rollback dari nol bila logic existing sudah cukup.

### Email yang sudah ada
`mailService.ts` saat ini sudah punya flow email reset password.

Ini berarti implementasi email accepted / rejected sebaiknya memakai pola yang sama:
- helper builder HTML
- function `send...Email()`
- tetap pakai mailer config yang sudah ada

### Catatan Midtrans yang perlu dimasukkan ke requirement
Karena webhook Midtrans bisa datang lebih dari sekali atau di-retry, requirement harus menganggap email sebagai side effect yang perlu idempotent. Jangan sampai satu pembayaran sukses menghasilkan accepted email berkali-kali.

---

## Asumsi bisnis default
Gunakan asumsi berikut jika belum ada keputusan lain:

### Mapping accepted / rejected
- `accepted` = status transaksi berubah menjadi `paid`
- `rejected` = status transaksi berubah menjadi `canceled` atau `expired`, tergantung hasil akhir dari Midtrans / keputusan bisnis

Catatan penting:
Saat ini schema belum punya status `rejected`, jadi issue ini menyarankan memakai `canceled` untuk reject manual organizer, kecuali tim memang ingin menambah enum status baru.

Untuk konteks Midtrans, istilah bisnis `accepted` lebih tepat dibaca sebagai `payment confirmed by Midtrans`.

### Rollback saat reject
Jika organizer menolak transaksi yang sebelumnya sudah reserve resource, maka rollback wajib dipanggil.

Untuk konteks Midtrans, rollback juga wajib dipanggil saat webhook atau proses sinkronisasi internal menetapkan transaksi menjadi `expired` atau `canceled`.

### Email sending rule
- email dikirim hanya setelah update status berhasil
- jika reject but rollback gagal, transaksi tidak boleh dianggap selesai secara diam-diam
- idealnya status update + rollback berada dalam flow yang konsisten, lalu email dikirim setelah operasi utama sukses
- jika webhook Midtrans dikirim ulang, sistem tidak boleh mengirim email accepted / rejected berulang untuk status final yang sama
- accepted email hanya dikirim ketika status benar-benar berpindah ke `paid`
- rejected email hanya dikirim ketika status benar-benar berpindah ke final failed state yang dipilih bisnis

---

## Rekomendasi implementasi
### Opsi yang paling aman untuk project saat ini
Gunakan status existing yang sudah ada dan jadikan Midtrans webhook sebagai sumber utama accepted state.

Mapping yang disarankan:
- Midtrans `capture` / `settlement` yang valid -> `paid`
- Midtrans `expire` -> `expired`
- Midtrans `cancel` / `deny` atau reject manual yang memang diperbolehkan bisnis -> `canceled`

Keuntungan pendekatan ini:
- tidak perlu ubah enum Prisma dulu
- bisa reuse rollback service yang sudah ada
- lebih kecil risiko breaking change
- sejalan dengan arsitektur payment gateway yang sudah dipakai

### Posisi action organizer dalam flow Midtrans
Jika product memang masih membutuhkan tombol approve / reject di dashboard organizer, action itu harus dibatasi dengan jelas:
- approve manual hanya boleh dipakai bila ada skenario manual verification yang belum ditangani Midtrans secara otomatis
- untuk flow Snap biasa, organizer approve tidak boleh menjadi satu-satunya pemicu status `paid`
- reject manual hanya boleh dilakukan untuk transaksi yang belum final dan belum dikonfirmasi sukses oleh Midtrans

Jika tidak ada manual verification step di product, maka rekomendasi yang lebih tepat adalah:
- hapus konsep approve manual dari requirement
- ubah halaman organizer transactions menjadi monitoring + optional cancel/reject sebelum payment success, jika bisnis memang mengizinkan

### Alternatif
Tambah enum status baru seperti `rejected` atau `accepted_by_organizer`.

Namun alternatif ini lebih mahal karena:
- butuh migration schema
- butuh update semua filter status
- butuh update frontend customer dan organizer
- butuh review semua tempat yang saat ini menganggap `canceled` sebagai penolakan / pembatalan umum

Untuk issue ini, default yang disarankan adalah tetap memakai status existing dulu.

---

## Bagian backend yang terdampak
### Route
Route yang wajib dianggap utama dalam konteks Midtrans adalah:
- `POST /api/transactions/webhook`

Jika bisnis tetap ingin action manual organizer, route tambahan bisa berupa:
- `PATCH /api/transactions/:id/reject`
- `PATCH /api/transactions/:id/approve` hanya jika benar-benar ada manual review flow

Atau jika ingin lebih umum:
- `PATCH /api/transactions/:id/status`

Untuk project Midtrans, issue ini menyarankan endpoint eksplisit dan konservatif:
- webhook tetap sebagai source utama accepted state
- endpoint manual hanya untuk action yang memang tidak bentrok dengan Midtrans

### Controller
Tambahkan handler minimal:
- `handleWebhook` yang lebih tegas soal accepted / rejected email side effects
- `rejectTransactionByOrganizer` jika manual reject memang masih dibutuhkan
- `approveTransactionByOrganizer` hanya jika manual verification benar-benar bagian dari bisnis

### Service
Tambahkan service khusus organizer transaction action, misalnya di:
- `backend/src/services/transactionApprovalService.ts`

Atau jika tim ingin sederhana, boleh diletakkan di `transactionService.ts`, tetapi file itu sudah cukup besar sehingga service terpisah lebih disarankan.

### Mail service
Tambahkan function baru:
- `sendTransactionAcceptedEmail()`
- `sendTransactionRejectedEmail()`

### Sinkronisasi Midtrans yang harus dipertimbangkan
Controller / service webhook minimal perlu memetakan status Midtrans berikut:
- `capture`
- `settlement`
- `pending`
- `deny`
- `cancel`
- `expire`
- `failure`

Untuk `capture`, tetap pertimbangkan `fraud_status` jika codebase memakainya.

---

## Folder structure yang disarankan
### Backend
```txt
backend/src/
  routes/
    transaction.ts
  controllers/
    transactionController.ts
  services/
    transactionService.ts
    rollbackService.ts
    mailService.ts
    transactionApprovalService.ts   # jika ingin dipisah
  types/
    transaction.ts
```

### Frontend
```txt
frontend/src/
  pages/
    organizer/
      TransactionsManagementPage.tsx
  services/
    transactionService.ts            # atau organizerTransactionService.ts
  types/
    transaction.ts
```

---

## Flow backend yang disarankan
### Approve flow
1. Customer menyelesaikan pembayaran di Midtrans.
2. Midtrans mengirim webhook ke backend.
3. Backend verifikasi signature Midtrans.
4. Backend cek transaksi lokal berdasarkan `order_id` / `invoice_number`.
5. Backend petakan status Midtrans ke status internal.
6. Jika status benar-benar berubah menjadi `paid`, backend update transaksi.
7. Backend kirim accepted email satu kali.
8. Response webhook sukses dikembalikan ke Midtrans.

### Optional manual approve flow
Flow ini hanya berlaku jika product memang punya manual verification step di luar Midtrans.
1. Organizer klik approve.
2. Backend cek transaksi ada atau tidak.
3. Backend cek transaksi memang milik event organizer tersebut.
4. Backend cek transaksi belum final dan belum dikonfirmasi sukses oleh Midtrans.
5. Backend update status transaksi menjadi final accepted state sesuai aturan bisnis.
6. Backend kirim accepted email jika belum pernah dikirim untuk final state ini.
7. Response sukses dikembalikan ke frontend.

### Reject flow
1. Midtrans mengirim status gagal akhir seperti `cancel`, `deny`, atau `expire`, atau organizer menjalankan reject manual yang memang diizinkan.
2. Backend verifikasi bahwa transaksi masih boleh masuk ke failed final state.
3. Backend update status transaksi menjadi `canceled` atau `expired` sesuai mapping bisnis.
4. Backend jalankan rollback resource.
5. Backend kirim rejected email satu kali.
6. Response sukses dikembalikan.

---

## Validasi penting di backend
Sebelum approve / reject, minimal validasi berikut harus ada:
- transaction id valid
- transaksi ada
- event dari transaksi milik organizer yang sedang login
- transaksi belum berada di final state yang tidak boleh diproses lagi

### Rule yang disarankan
- transaksi `expired` tidak bisa di-approve
- transaksi `canceled` tidak bisa di-approve ulang
- transaksi `paid` tidak bisa direject lagi tanpa aturan bisnis tambahan
- transaksi yang sudah `paid` dari webhook Midtrans tidak boleh ditimpa oleh reject manual organizer
- transaksi `pending` / `waiting_payment` bisa dipantau organizer, tetapi final success state tetap menunggu Midtrans bila flow-nya full gateway

Jika belum ada keputusan bisnis lain, gunakan rule konservatif di atas.

---

## Data email minimum yang disarankan
### Email accepted
Minimum data:
- customer name
- invoice number
- event name
- final price
- status accepted
- payment method / payment source opsional jika ingin memperjelas bahwa status berasal dari Midtrans

### Email rejected
Minimum data:
- customer name
- invoice number
- event name
- alasan umum transaksi ditolak jika tersedia
- status rejected / canceled
- informasi bahwa points / coupon / seat telah dikembalikan bila memang berlaku
- jika status berasal dari Midtrans expire / cancel, copy email sebaiknya memakai istilah yang sesuai, tidak selalu menyebut ditolak organizer

---

## Contoh response API yang disarankan
### Approve response
```json
{
  "success": true,
  "message": "Transaction approved successfully",
  "data": {
    "transactionId": 12,
    "status": "paid"
  }
}
```

### Reject response
```json
{
  "success": true,
  "message": "Transaction rejected successfully",
  "data": {
    "transactionId": 12,
    "status": "canceled",
    "rollback": {
      "seats_restored": 2,
      "points_restored": true,
      "coupon_restored": true,
      "voucher_usage_decremented": true
    }
  }
}
```

---

## Rincian frontend yang harus dibuat
### TransactionsManagementPage
Halaman organizer transaction management perlu diubah dari placeholder menjadi real integration.

Yang minimal harus ada:
- fetch data transaksi organizer
- tombol approve
- tombol reject
- loading state
- error state
- success feedback setelah action
- status badge yang sesuai dengan response backend

### Penyesuaian frontend untuk Midtrans
Karena project memakai Midtrans, UI organizer harus menampilkan status dengan model berikut:
- menunggu pembayaran Midtrans
- pembayaran berhasil
- pembayaran expired
- dibatalkan / gagal

Jika approve manual tetap dipertahankan di UI, label dan behavior-nya harus menjelaskan bahwa itu adalah action bisnis tambahan, bukan konfirmasi payment gateway standar.

### UX yang disarankan
- approve / reject sebaiknya memakai confirmation dialog
- tombol action disable saat request sedang berjalan
- setelah success, list transaksi refresh otomatis

---

## Rekomendasi type / service frontend
### Service frontend
Tambahkan method seperti:
- `getOrganizerTransactions()`
- `approveTransaction(transactionId)`
- `rejectTransaction(transactionId)`

### Type frontend
Minimal type yang dibutuhkan:
- organizer transaction list item
- approve transaction response
- reject transaction response

---

## Acceptance criteria
### Backend
- webhook Midtrans menjadi source utama perubahan status accepted
- signature Midtrans diverifikasi saat webhook diproses
- customer menerima email saat transaksi berubah ke `paid`
- customer menerima email saat transaksi berubah ke final failed state yang dipilih bisnis
- rollback berjalan saat transaksi masuk final failed state
- organizer tidak bisa melakukan action manual yang bertentangan dengan status final dari Midtrans
- jika manual reject dipakai, organizer hanya bisa reject transaksi milik event-nya sendiri

### Rollback
- available seats kembali saat transaksi di-reject
- ticket type available quantity kembali saat transaksi di-reject
- points kembali saat transaksi di-reject jika sebelumnya dipakai
- coupon kembali saat transaksi di-reject jika sebelumnya dipakai
- voucher usage berkurang saat transaksi di-reject jika sebelumnya dipakai
- rollback tidak dijalankan berulang untuk webhook retry dengan status final yang sama

### Frontend
- halaman organizer transactions tidak lagi placeholder
- organizer bisa memonitor status Midtrans dari UI
- jika bisnis memang mengizinkan action manual, organizer bisa menjalankan action itu dari UI dengan guard yang benar
- UI menampilkan status terbaru setelah action selesai
- UI menampilkan feedback error jika request gagal

---

## Urutan kerja yang disarankan
### Tahap 1: backend email template
1. buat template email accepted
2. buat template email rejected
3. tambahkan function pengirim email di mail service

### Tahap 2: backend webhook-driven status handling
1. tentukan mapping status Midtrans ke status DB
2. rapikan handler webhook agar update status final bersifat idempotent
3. kirim accepted email hanya saat transisi ke `paid`
4. kirim rejected email hanya saat transisi ke final failed state
5. reuse rollback service saat status final gagal

### Tahap 3: backend transaction action manual bila masih dibutuhkan
1. evaluasi apakah approve manual benar-benar diperlukan dalam flow Midtrans
2. jika tidak diperlukan, hilangkan dari scope issue
3. jika diperlukan, tambah guard ketat agar tidak bentrok dengan status Midtrans
4. tambah endpoint reject manual bila bisnis memang mengizinkan

### Tahap 4: frontend organizer transaction management
1. fetch transaksi organizer dari backend
2. tampilkan status Midtrans / status internal yang sudah dipetakan
3. hubungkan tombol manual action hanya bila action itu valid di flow bisnis
4. tampilkan feedback sukses / gagal

### Tahap 5: testing
1. test webhook payment success Midtrans
2. test webhook cancel / expire / deny
3. test rollback resource saat reject / expire
4. test email notification tidak terkirim ganda pada webhook retry
5. jika ada manual action, test conflict case dengan status Midtrans

---

## Checklist implementasi
- [ ] Tentukan mapping status Midtrans ke status DB sekarang
- [ ] Tambahkan template email accepted
- [ ] Tambahkan template email rejected
- [ ] Tambahkan function send accepted email
- [ ] Tambahkan function send rejected email
- [ ] Pastikan webhook Midtrans memicu transisi status final secara idempotent
- [ ] Reuse rollback service saat final failed state
- [ ] Aktifkan dan validasi signature verification Midtrans
- [ ] Evaluasi apakah approve manual organizer memang diperlukan
- [ ] Jika perlu, tambahkan service approve / reject manual dengan guard Midtrans-aware
- [ ] Jika perlu, tambahkan route manual action yang aman
- [ ] Jika perlu, tambahkan proteksi auth + role organizer untuk route manual
- [ ] Integrasikan halaman organizer transaction management ke real API
- [ ] Tambahkan loading / error / success state di frontend
- [ ] Test rollback seats, points, voucher, coupon saat final failed state
- [ ] Test accepted email terkirim setelah webhook sukses
- [ ] Test rejected email terkirim setelah failed final state
- [ ] Test webhook retry tidak menyebabkan duplicate email / duplicate rollback

---

## Open question yang harus diputuskan
- apakah reject manual organizer memang dibutuhkan dalam flow Midtrans ini?
- apakah reject manual organizer cukup memakai status `canceled`, atau perlu enum baru `rejected`?
- apakah email accepted dikirim saat organizer approve manual, atau saat Midtrans mengonfirmasi sukses?
- apakah reject membutuhkan alasan penolakan yang tampil di email?
- apakah organizer boleh reject transaksi yang sudah `paid`, atau hanya transaksi tertentu yang masih pending review?
- apakah transaksi `expired` dari Midtrans akan memakai template email rejected yang sama, atau perlu template khusus expired?

Jika belum ada keputusan, gunakan default berikut:
- webhook Midtrans adalah source utama accepted state
- reject manual dipakai hanya jika bisnis memang punya manual review flow
- reject manual memakai status `canceled`
- email accepted dikirim saat transisi ke `paid` setelah konfirmasi Midtrans
- alasan reject opsional
- organizer hanya boleh memproses transaksi yang memang status-nya masih menunggu keputusan bisnis dan belum final di Midtrans

---

## Definition of done
Issue ini dianggap selesai jika:
- webhook Midtrans menjadi source utama accepted state
- customer menerima email accepted saat transaksi dikonfirmasi sukses oleh Midtrans
- customer menerima email rejected saat transaksi masuk final failed state sesuai mapping bisnis
- rollback resource berjalan benar saat reject / cancel / expire yang membutuhkan rollback
- email dan rollback tidak terpanggil ganda saat webhook Midtrans retry
- frontend organizer transactions sudah memakai real API, bukan placeholder
- jika ada action manual organizer, action itu tidak bentrok dengan source of truth Midtrans
- sistem aman dari akses silang antar organizer