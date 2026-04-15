# Issue: Organizer Dashboard Analytics and Attendee Data

## Ringkasan
Saat ini dashboard organizer masih menampilkan data statis dan placeholder.

Issue ini bertujuan untuk mengubah dashboard organizer agar menampilkan data nyata berdasarkan organizer yang sedang login.

Planning ini ditulis agar mudah dipahami oleh junior developer atau model AI yang lebih murah. Fokus utamanya adalah:
- menjelaskan kebutuhan bisnis secara konkret
- memisahkan pekerjaan backend dan frontend
- menentukan source data yang tepat dari schema yang sudah ada
- memberi acceptance criteria yang jelas
- mengurangi risiko implementasi salah hitung pada statistik organizer

---

## Tujuan utama
Dashboard organizer harus diupdate dengan ketentuan berikut:
1. Semua data hanya boleh berasal dari event milik organizer yang sedang login.
2. Dashboard menampilkan basic statistic.
3. Dashboard menampilkan statistik visual by year, month, dan day menggunakan `recharts`.
4. Dashboard menampilkan list attendees untuk setiap event, minimal berisi nama peserta, ticket quantity, dan total price paid.

---

## Kondisi project saat ini
### Frontend
Yang sudah ada:
- route organizer dashboard sudah ada di `frontend/src/App.tsx`
- layout organizer dengan sidebar sudah ada
- halaman overview organizer sudah ada di `frontend/src/pages/organizer/DashboardOverviewPage.tsx`
- package `recharts` sudah terpasang di `frontend/package.json`

Yang belum sesuai requirement issue ini:
- overview dashboard masih memakai data statis
- chart masih placeholder
- tidak ada filter period yang benar-benar terhubung ke backend
- belum ada tampilan attendee list berdasarkan event organizer

### Backend
Yang sudah ada:
- auth middleware dan role check organizer sudah tersedia
- schema Prisma sudah memiliki relasi `User`, `Event`, `Transaction`, dan `TransactionItem`
- event sudah terkait dengan organizer melalui `organizer_id`

Yang belum ada atau belum cukup untuk fitur ini:
- endpoint analytics khusus organizer
- service ringkasan statistik organizer
- service agregasi revenue dan attendee berdasarkan periode
- service attendee list per event
- response type yang rapi untuk dipakai frontend dashboard

---

## Referensi source data dari schema
Dashboard organizer harus menggunakan source data dari model yang sudah ada:

- `User.organized_events`
- `Event.organizer_id`
- `Transaction.event_id`
- `Transaction.user_id`
- `Transaction.final_price`
- `Transaction.status`
- `Transaction.created_at`
- `TransactionItem.transaction_id`
- `TransactionItem.quantity`
- `TransactionItem.subtotal`

### Asumsi bisnis default
Gunakan asumsi berikut agar implementasi tidak ambigu:
- revenue dihitung dari `Transaction.final_price`
- attendee dan revenue hanya dihitung dari transaksi yang status-nya `paid`
- transaksi `waiting_payment`, `expired`, dan `canceled` tidak dihitung sebagai revenue sukses
- attendee list mengambil buyer dari relasi `Transaction.user`
- ticket quantity attendee dihitung dari total quantity semua `TransactionItem` dalam satu transaksi untuk event terkait

Jika di kemudian hari definisi bisnis berubah, logic service boleh disesuaikan, tetapi default issue ini adalah menggunakan transaksi `paid` saja.

---

## Halaman yang terdampak
### Frontend utama
- `frontend/src/pages/organizer/DashboardOverviewPage.tsx`

### Frontend pendukung yang kemungkinan perlu ditambah
- `frontend/src/services/organizerDashboardService.ts`
- `frontend/src/types/organizerDashboard.ts`
- `frontend/src/hooks/useOrganizerDashboard.ts` atau pola serupa jika diperlukan
- `frontend/src/components/organizer/` untuk chart card, stats card, atau attendee table bila ingin dipisah

### Backend utama
- `backend/src/routes/` untuk route analytics organizer
- `backend/src/controllers/` untuk request handler dashboard organizer
- `backend/src/services/` untuk agregasi statistik organizer
- `backend/src/types/` untuk response type analytics organizer bila diperlukan

---

## Basic statistic yang harus ditampilkan
Minimal tampilkan statistik berikut pada dashboard organizer:
- total events milik organizer
- total active events milik organizer
- total paid transactions
- total revenue dari paid transactions
- total attendees dari paid transactions

### Definisi yang disarankan
- `totalEvents`: jumlah semua event dengan `organizer_id = currentUser.id`
- `activeEvents`: jumlah event organizer yang `is_active = true`
- `totalPaidTransactions`: jumlah transaksi organizer dengan status `paid`
- `totalRevenue`: penjumlahan `final_price` untuk transaksi `paid`
- `totalAttendees`: penjumlahan seluruh `TransactionItem.quantity` untuk transaksi `paid` pada event organizer

---

## Statistik visual yang harus ditampilkan
Gunakan `recharts` untuk menampilkan data statistik berdasarkan period:
- year
- month
- day

### Minimum chart yang disarankan
1. Revenue trend chart
2. Attendee trend chart

### Behavior filter period
Frontend perlu menyediakan pilihan periode, minimal:
- yearly
- monthly
- daily

### Arti masing-masing period
- `year`: group data per bulan dalam 1 tahun tertentu
- `month`: group data per hari dalam 1 bulan tertentu
- `day`: group data per jam dalam 1 hari tertentu

### Default behavior yang disarankan
- saat halaman pertama dibuka, tampilkan period `month` untuk bulan berjalan
- organizer bisa mengganti filter ke `year` atau `day`

---

## Attendee list yang harus ditampilkan
Dashboard organizer harus menampilkan list attendees untuk setiap event organizer.

### Data minimum per row
- event name
- attendee name
- ticket quantity
- total price paid

### Data tambahan yang disarankan
- invoice number
- transaction date
- transaction status

### Rule penting
- hanya tampilkan attendee dari transaksi organizer sendiri
- hanya transaksi `paid` yang masuk list utama attendee

---

## Rekomendasi endpoint backend
### Opsi yang disarankan
Buat endpoint terpisah khusus organizer dashboard, misalnya:

- `GET /api/organizer/dashboard/summary`
- `GET /api/organizer/dashboard/charts?period=month&year=2026&month=4&day=15`
- `GET /api/organizer/dashboard/attendees`

### Alasan dipisah
- summary lebih ringan dan mudah di-cache
- chart data bisa berubah sesuai filter period
- attendee list biasanya lebih besar dan bisa butuh pagination

### Alternatif
Kalau ingin lebih sederhana, bisa buat satu endpoint gabungan:
- `GET /api/organizer/dashboard/overview?period=month&year=2026&month=4&day=15`

Tetapi untuk maintainability, issue ini lebih menyarankan endpoint dipisah.

---

## Bentuk response backend yang disarankan
### 1. Summary response
```json
{
  "summary": {
    "totalEvents": 12,
    "activeEvents": 5,
    "totalPaidTransactions": 144,
    "totalRevenue": 45200000,
    "totalAttendees": 1234
  }
}
```

### 2. Chart response
```json
{
  "period": "month",
  "filters": {
    "year": 2026,
    "month": 4
  },
  "revenue": [
    { "label": "2026-04-01", "value": 1500000 },
    { "label": "2026-04-02", "value": 2000000 }
  ],
  "attendees": [
    { "label": "2026-04-01", "value": 24 },
    { "label": "2026-04-02", "value": 35 }
  ]
}
```

### 3. Attendee list response
```json
{
  "items": [
    {
      "eventId": 10,
      "eventName": "Music Festival 2026",
      "attendeeName": "Michael",
      "ticketQuantity": 2,
      "totalPricePaid": 300000,
      "invoiceNumber": "INV-001",
      "paidAt": "2026-04-15T10:00:00.000Z"
    }
  ],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 40
  }
}
```

---

## Query logic backend yang disarankan
### Summary
Gunakan query berdasarkan organizer id:
- ambil event organizer
- hitung jumlah event
- hitung active event
- ambil transaksi `paid` dari event organizer
- hitung revenue dari `final_price`
- hitung total attendee dari sum quantity pada `TransactionItem`

### Charts
Gunakan transaksi `paid` dari event organizer lalu group by waktu sesuai period:
- period `year` -> group by month
- period `month` -> group by date
- period `day` -> group by hour

### Attendee list
Gunakan transaksi `paid` + relation ke event organizer + relation ke user + relation ke transaction items.

---

## Pagination dan filter yang disarankan untuk attendee list
Tambahkan query params berikut:
- `page`
- `limit`
- `eventId` opsional
- `search` opsional untuk nama attendee atau invoice

### Default yang disarankan
- `page=1`
- `limit=10`

---

## Dependency frontend
### Sudah tersedia
- `recharts`

### Tidak perlu instal tambahan jika cukup dengan stack sekarang
Gunakan stack yang sudah ada:
- React
- TypeScript
- Axios
- Tailwind CSS

---

## Struktur folder yang disarankan
### Backend
```txt
backend/src/
  routes/
    organizerDashboard.ts
  controllers/
    organizerDashboardController.ts
  services/
    organizerDashboardService.ts
  types/
    organizerDashboard.ts
```

### Frontend
```txt
frontend/src/
  pages/
    organizer/
      DashboardOverviewPage.tsx
  services/
    organizerDashboardService.ts
  types/
    organizerDashboard.ts
  components/
    organizer/
      DashboardStatCard.tsx
      RevenueTrendChart.tsx
      AttendeeTrendChart.tsx
      AttendeeTable.tsx
```

---

## Rincian frontend yang harus dibuat
### DashboardOverviewPage
Update halaman agar tidak lagi memakai placeholder statis.

Halaman minimum harus memiliki:
- header dashboard organizer
- 4 sampai 5 stat cards
- filter period untuk chart
- chart revenue
- chart attendees
- attendee table
- loading state
- empty state
- error state

### Recharts
Gunakan komponen sederhana dan mudah dipahami:
- `ResponsiveContainer`
- `LineChart` atau `BarChart`
- `XAxis`
- `YAxis`
- `Tooltip`
- `CartesianGrid`
- `Legend`

---

## Rincian backend yang harus dibuat
### Service organizer dashboard
Minimal function yang disarankan:
- `getOrganizerSummary(organizerId)`
- `getOrganizerChartData(organizerId, filters)`
- `getOrganizerAttendees(organizerId, filters)`

### Controller organizer dashboard
Minimal handler:
- `getSummary`
- `getCharts`
- `getAttendees`

### Route organizer dashboard
Route harus memakai:
- `auth`
- `roleCheck(['organizer'])`

---

## Acceptance criteria
### Data ownership
- organizer hanya bisa melihat data miliknya sendiri
- organizer A tidak bisa melihat event, transaksi, atau attendee milik organizer B

### Basic statistics
- dashboard menampilkan total events organizer
- dashboard menampilkan active events organizer
- dashboard menampilkan total paid transactions
- dashboard menampilkan total revenue organizer
- dashboard menampilkan total attendees organizer

### Visual chart
- dashboard menampilkan chart revenue berbasis period
- dashboard menampilkan chart attendee berbasis period
- filter year, month, dan day bekerja dengan benar
- chart mengambil data dari backend, bukan hardcoded array

### Attendee list
- attendee list menampilkan nama attendee
- attendee list menampilkan ticket quantity
- attendee list menampilkan total price paid
- attendee list hanya mengambil transaksi organizer sendiri
- attendee list bisa difilter per event atau dipagination jika perlu

### UI/UX
- loading state terlihat jelas
- error state terlihat jelas
- empty state terlihat jelas jika organizer belum punya transaksi
- tampilan mengikuti gaya dashboard organizer yang sudah ada

---

## Urutan kerja yang disarankan
### Tahap 1: backend summary
1. buat type response organizer dashboard
2. buat service summary organizer
3. buat route dan controller summary
4. test response summary dengan organizer login

### Tahap 2: backend chart data
1. buat parsing query period
2. buat service chart revenue
3. buat service chart attendees
4. kembalikan format data yang siap dipakai Recharts

### Tahap 3: backend attendee list
1. buat query attendee list berdasarkan organizer
2. tambahkan pagination dan event filter jika perlu
3. pastikan hanya transaksi `paid` yang dipakai

### Tahap 4: frontend summary cards
1. ganti placeholder stat cards dengan data backend
2. buat loading dan error state

### Tahap 5: frontend charts
1. tambahkan filter period
2. integrasikan chart revenue
3. integrasikan chart attendees
4. gunakan `recharts`

### Tahap 6: frontend attendee list
1. tampilkan attendee table
2. tambahkan format angka dan currency
3. tambahkan empty state

---

## Checklist implementasi
- [x] Audit `DashboardOverviewPage` yang masih statis
- [x] Buat backend route organizer dashboard
- [x] Buat backend controller organizer dashboard
- [x] Buat backend service summary organizer
- [x] Buat backend service chart organizer
- [x] Buat backend service attendee list organizer
- [x] Pastikan semua query dibatasi oleh `organizer_id`
- [x] Buat frontend service organizer dashboard
- [x] Buat type organizer dashboard di frontend
- [x] Ganti stat cards placeholder dengan data nyata
- [x] Tambahkan filter period year/month/day
- [x] Tambahkan chart revenue dengan `recharts`
- [x] Tambahkan chart attendee dengan `recharts`
- [x] Tambahkan attendee table per event
- [x] Tambahkan loading, error, dan empty state
- [ ] Test organizer hanya melihat data miliknya sendiri
- [ ] Update README jika flow endpoint organizer dashboard perlu didokumentasikan

---

## Open question yang harus diputuskan jika ingin lebih detail
- apakah attendee list cukup menampilkan buyer per transaksi, atau perlu pecah per ticket type?
- apakah transaksi refunded/canceled perlu muncul di dashboard terpisah?
- apakah chart default lebih baik `month` atau `year`?
- apakah perlu export attendee list ke CSV di fase berikutnya?

Jika belum ada keputusan, gunakan default berikut:
- attendee list tampil per transaksi buyer
- hanya transaksi `paid` yang masuk summary utama
- default chart period = `month`
- tidak perlu export CSV pada issue ini

---

## Definition of done
Issue ini dianggap selesai jika:
- dashboard organizer tidak lagi memakai data statis
- seluruh data dashboard berasal dari organizer yang sedang login
- basic statistics tampil dengan benar
- chart revenue dan attendee tampil dengan `recharts`
- filter year, month, dan day bekerja
- attendee list tampil dengan nama, ticket quantity, dan total price paid
- query backend aman dari kebocoran data antar organizer