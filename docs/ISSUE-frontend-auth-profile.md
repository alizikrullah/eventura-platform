# Issue: Frontend Auth Pages, Profile, Route Guard, and Referral Reward Flow

## Ringkasan
Buat halaman frontend untuk `login`, `register`, dan `profile` dengan gaya visual yang mengikuti referensi project saat ini.

Issue ini ditulis agar mudah dipahami oleh junior developer atau model AI yang lebih murah. Fokusnya adalah:
- menyusun pekerjaan langkah demi langkah
- memisahkan tanggung jawab frontend dan backend
- menjelaskan dependency yang perlu dipasang
- memberi acceptance criteria yang jelas

---

## Referensi visual yang wajib diikuti
Gunakan file existing sebagai referensi warna, font, dan bentuk:
- font: `Plus Jakarta Sans`
- warna utama: `primary` biru tua dan `secondary` coral dari konfigurasi Tailwind
- bentuk UI: rounded card, rounded button, clean panel, soft gradient background

Referensi yang dipakai saat ini:
- `frontend/src/App.tsx`
- `frontend/src/index.css`
- `frontend/tailwind-config.js`

### Arah visual yang harus dipertahankan
- gunakan `Plus Jakarta Sans` sebagai font utama
- gunakan kombinasi warna biru tua `primary` untuk elemen utama dan coral `secondary` untuk CTA sekunder/highlight
- gunakan card putih dengan radius besar, shadow lembut, dan background gradient halus
- hindari desain default shadcn yang polos tanpa adaptasi warna project

---

## Kondisi project saat ini
### Frontend
Yang sudah ada:
- React + Vite + TypeScript
- Tailwind CSS
- Zustand sudah terpasang
- React Router DOM sudah terpasang
- beberapa package Radix UI sudah ada

Yang belum sesuai requirement issue ini:
- `formik` belum terpasang
- `yup` belum terpasang
- setup `shadcn/ui` belum terlihat lengkap
- halaman auth/profile belum ada
- route guard belum ada

### Backend
Yang sudah ada:
- endpoint `POST /api/auth/register`
- endpoint `POST /api/auth/login`
- auth middleware dan role middleware dasar
- model Prisma untuk `User`, `Referral`, `Point`, `Coupon`, `UserCoupon`

Yang belum ada atau belum cukup untuk fitur ini:
- forgot password endpoint
- reset password endpoint
- endpoint profile user (`GET /me`, `PATCH /me`, update photo)
- endpoint upload profile image
- logic pemberian coupon untuk user yang register memakai referral
- logic pemberian 10000 point ke referrer
- scheduler untuk menangani expiry atau housekeeping berbasis waktu

---

## Tujuan utama
### Frontend pages
Buat halaman berikut:
1. `LoginPage`
2. `RegisterPage`
3. `ForgotPasswordPage`
4. `ProfilePage`

### Frontend state & forms
- gunakan `zustand` untuk global auth state
- gunakan `formik` + `yup` untuk seluruh form auth/profile
- gunakan komponen berbasis `shadcn/ui` yang disesuaikan dengan visual project

### Integrasi backend
Integrasikan `login` dan `register` ke endpoint backend yang sudah ada.

### Route guard
Buat guard berikut:
- user yang sudah login tidak bisa akses `/login` dan `/register`
- route tertentu hanya bisa diakses `organizer`
- route tertentu hanya bisa diakses `customer`

### Business rule referral reward
Saat customer register menggunakan referral code:
- user baru mendapat discount coupon
- referrer mendapat `10000` point
- point expired `3 bulan` setelah credited
- coupon expired `3 bulan` setelah user register

---

## Dependency yang harus ditambahkan
### Frontend
Tambahkan package berikut di `frontend`:
```bash
npm install formik yup
```

Jika `shadcn/ui` belum disetup, tambahkan setup minimal sesuai struktur project.
Komponen yang kemungkinan dibutuhkan:
- button
- input
- label
- card
- avatar
- dialog
- dropdown-menu
- separator
- toast atau alert

### Backend
Package penting yang sudah ada dan relevan:
- `node-cron`
- `multer`

Tidak perlu menambah package backend baru untuk issue ini kecuali memang dibutuhkan saat implementasi detail.

---

## Struktur folder yang disarankan
### Frontend
```txt
frontend/src/
  components/
    ui/
    auth/
    guards/
    profile/
    layout/
  hooks/
    useAuth.ts
  pages/
    LoginPage.tsx
    RegisterPage.tsx
    ForgotPasswordPage.tsx
    ProfilePage.tsx
    ForbiddenPage.tsx
  services/
    authService.ts
    userService.ts
  store/
    authStore.ts
  types/
    auth.ts
    user.ts
  utils/
    api.ts
    storage.ts
    constants.ts
  App.tsx
  main.tsx
```

### Backend
```txt
backend/src/
  routes/
    auth.ts
    user.ts
  controllers/
    authController.ts
    userController.ts
  services/
    authService.ts
    userService.ts
    referralRewardService.ts
  middlewares/
    auth.ts
    upload.ts
  validators/
    authValidator.ts
    userValidator.ts
  config/
    multer.ts
    prisma.ts
  utils/
    date.ts
    coupon.ts
    referral.ts
    token.ts
```

---

## Rincian halaman frontend

## 1. Login Page
### Tujuan
User bisa login menggunakan email dan password.

### UI minimal
- judul brand `Eventura`
- subtitle singkat
- input email
- input password
- tombol login
- link ke register
- link ke forgot password
- area error message
- loading state pada submit button

### Integrasi
Gunakan endpoint:
- `POST /api/auth/login`

### Expected response
```json
{
  "user": {
    "id": 1,
    "email": "user@mail.com",
    "name": "User",
    "role": "customer",
    "referral_code": "ABC12345"
  },
  "token": "jwt-token"
}
```

### Validation
- email wajib dan format valid
- password wajib minimal 6 karakter

---

## 2. Register Page
### Tujuan
User bisa daftar akun baru sebagai `customer` atau `organizer`.

### UI minimal
- input name
- input email
- input password
- input confirm password
- select role
- input referral code opsional
- tombol register
- link ke login
- area info referral benefit singkat

### Integrasi
Gunakan endpoint:
- `POST /api/auth/register`

### Payload
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "customer",
  "referralCode": "OPTIONAL"
}
```

### Validation
- name wajib
- email wajib dan valid
- password wajib minimal 6 karakter
- confirm password harus sama dengan password
- role wajib salah satu dari `customer` atau `organizer`
- referral code opsional

### Catatan UX
Jika role `organizer`, field referral code tetap boleh tampil tetapi info benefit referral hanya berlaku untuk customer.

---

## 3. Forgot Password Page
### Tujuan
User bisa meminta reset password melalui email.

### UI minimal
- input email
- tombol kirim reset link
- state sukses: info bahwa email telah dikirim jika akun ditemukan

### Backend dependency
Butuh endpoint baru:
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`

### Catatan penting
Karena endpoint backend belum tersedia, frontend page boleh dibuat lebih dulu dengan mock success state, tetapi issue implementasi penuh harus mencakup backend endpoint tersebut.

---

## 4. Profile Page
### Tujuan
User yang sudah login bisa:
- melihat info profil
- mengganti foto profile
- mengganti password

### UI minimal
Section 1: profile summary
- avatar
- name
- email
- role
- referral code readonly

Section 2: change photo
- upload image input
- preview image
- tombol simpan foto

Section 3: change password
- current password
- new password
- confirm new password
- tombol update password

### Backend dependency
Butuh endpoint baru:
- `GET /api/users/me`
- `PATCH /api/users/me`
- `PATCH /api/users/me/password`
- `PATCH /api/users/me/photo` atau `POST /api/users/me/photo`

### File upload
- backend gunakan `multer`
- frontend kirim `multipart/form-data` untuk upload foto profile

---

## Global auth state dengan Zustand
Buat `authStore` dengan state minimal berikut:
```ts
user: User | null
token: string | null
isAuthenticated: boolean
isHydrated: boolean
login: (payload) => Promise<void>
logout: () => void
setAuth: (user, token) => void
hydrate: () => void
```

### Tanggung jawab store
- simpan `token` dan `user`
- persist ke localStorage
- restore state saat app reload
- expose helper untuk cek role user

### Helper yang disarankan
```ts
hasRole(role: 'customer' | 'organizer')
isGuest()
isCustomer()
isOrganizer()
```

---

## Route guard yang harus dibuat
### 1. GuestOnlyGuard
Tujuan: user yang sudah login tidak boleh buka `/login`, `/register`, `/forgot-password`

Perilaku:
- jika belum login -> izinkan akses
- jika sudah login -> redirect ke dashboard/default page sesuai role

### 2. AuthGuard
Tujuan: hanya user login yang boleh masuk route tertentu

Perilaku:
- jika belum login -> redirect ke `/login`

### 3. RoleGuard
Tujuan: membatasi route berdasarkan role

Perilaku:
- jika role tidak sesuai -> redirect ke `/403` atau halaman aman lain

### Mapping route minimum
- `/login` -> guest only
- `/register` -> guest only
- `/forgot-password` -> guest only
- `/profile` -> authenticated user
- `/organizer/*` -> organizer only
- `/customer/*` -> customer only

---

## API service frontend yang perlu dibuat
### `authService.ts`
Minimal function:
- `login(payload)`
- `register(payload)`
- `forgotPassword(payload)`
- `resetPassword(payload)`

### `userService.ts`
Minimal function:
- `getMe()`
- `updateProfile(payload)`
- `updatePassword(payload)`
- `updateProfilePhoto(formData)`

### `api.ts`
Buat axios instance dengan:
- `baseURL` dari env Vite
- auto attach bearer token
- response interceptor untuk logout saat token invalid jika diperlukan

---

## Business rule backend yang wajib masuk issue ini
Bagian ini penting karena frontend bergantung pada hasil backend.

### Register dengan referral code
Jika user baru register memakai `referralCode` valid:
1. buat user baru
2. buat data `Referral`
3. beri `10000` point ke referrer
4. point disimpan ke tabel `Point`
5. `expired_at` point = tanggal kredit + 3 bulan
6. buat coupon untuk user baru atau assign coupon existing ke `UserCoupon`
7. `expired_at` coupon = tanggal register + 3 bulan

### Detail implementasi yang disarankan
#### Point reward
- `amount = 10000`
- `amount_remaining = 10000`
- `source = referral_reward`
- `reference_id = referee_id` atau referral id

#### Coupon reward
Pilih salah satu pendekatan dan konsisten:
- pendekatan A: buat satu `Coupon` template untuk referral reward, lalu assign ke `UserCoupon`
- pendekatan B: generate `Coupon` baru per user

Saran: gunakan pendekatan A jika reward coupon selalu sama, agar data lebih rapi.

---

## Scheduler / expiry handling
Gunakan `node-cron` untuk housekeeping berkala di backend.

### Tugas scheduler yang disarankan
- menandai coupon yang sudah expired sebagai tidak valid untuk pemakaian
- memastikan point yang expired tidak ikut dihitung sebagai point aktif

### Catatan penting
Karena schema `Point` dan `UserCoupon` sudah memiliki `expired_at`, aplikasi tetap harus melakukan validasi waktu saat query. Scheduler adalah pelengkap, bukan satu-satunya mekanisme validasi.

---

## Acceptance criteria
### Visual/UI
- login, register, dan profile mengikuti gaya visual existing project
- font utama menggunakan `Plus Jakarta Sans`
- warna utama mengikuti `primary` dan `secondary`
- seluruh form responsive desktop dan mobile

### Frontend functionality
- form dibuat dengan `formik`
- validasi dibuat dengan `yup`
- auth state dikelola dengan `zustand`
- user login sukses disimpan ke global state dan localStorage
- user logout menghapus state dan token
- guest user tidak bisa masuk halaman profile
- logged-in user tidak bisa masuk halaman login/register lagi
- organizer-only route tidak bisa diakses customer
- customer-only route tidak bisa diakses organizer

### Backend/API
- login dan register endpoint terintegrasi ke frontend
- forgot password punya endpoint jelas atau dicatat sebagai backend dependency
- profile update photo menggunakan `multer`
- reward referral membuat point dan coupon dengan expiry 3 bulan

### Data correctness
- referrer mendapat tepat `10000` point per referral sukses
- point expired tepat 3 bulan setelah credited
- user baru yang daftar dengan referral mendapat coupon valid 3 bulan
- referral reward tidak diberikan ganda untuk user yang sama

---

## Urutan kerja yang disarankan
### Tahap 1: setup dependency dan fondasi frontend
1. install `formik` dan `yup`
2. siapkan shadcn/ui components yang dibutuhkan
3. buat axios base client
4. buat type auth dan user
5. buat `authStore` dengan Zustand

### Tahap 2: routing dan guard
1. setup React Router structure
2. buat `GuestOnlyGuard`
3. buat `AuthGuard`
4. buat `RoleGuard`
5. siapkan halaman fallback `403`

### Tahap 3: auth pages
1. implement `LoginPage`
2. implement `RegisterPage`
3. integrasikan ke backend login/register
4. tangani loading, success, error state

### Tahap 4: forgot password
1. buat `ForgotPasswordPage`
2. integrasikan dengan backend jika endpoint sudah tersedia
3. jika belum tersedia, tandai sebagai dependency backend dan siapkan UI placeholder

### Tahap 5: profile page
1. tampilkan data user
2. implement update password
3. implement upload profile photo
4. handle preview image dan status upload

### Tahap 6: backend referral reward
1. lengkapi logic reward point
2. lengkapi logic reward coupon
3. pastikan expiry 3 bulan akurat
4. tambahkan scheduler `node-cron`

### Tahap 7: testing dan QA
1. test register tanpa referral
2. test register dengan referral
3. test login sukses/gagal
4. test guest-only route
5. test organizer-only route
6. test customer-only route
7. test profile photo upload
8. test forgot password flow

---

## Checklist implementasi
- [ ] Tambah dependency `formik` dan `yup`
- [ ] Setup komponen `shadcn/ui` yang dipakai auth/profile
- [ ] Buat `authStore` dengan Zustand
- [ ] Buat `api.ts` axios client
- [ ] Buat `LoginPage`
- [ ] Buat `RegisterPage`
- [ ] Buat `ForgotPasswordPage`
- [ ] Buat `ProfilePage`
- [ ] Buat `GuestOnlyGuard`
- [ ] Buat `AuthGuard`
- [ ] Buat `RoleGuard`
- [ ] Integrasi frontend ke `POST /api/auth/login`
- [ ] Integrasi frontend ke `POST /api/auth/register`
- [ ] Tambahkan endpoint backend forgot password
- [ ] Tambahkan endpoint backend profile update
- [ ] Tambahkan upload profile photo dengan `multer`
- [ ] Tambahkan referral reward: point 10000 ke referrer
- [ ] Tambahkan referral reward: coupon ke user baru
- [ ] Tambahkan expiry logic 3 bulan untuk point dan coupon
- [ ] Tambahkan scheduler `node-cron`
- [ ] Tambahkan test frontend/backend yang relevan
- [ ] Update `README.md` untuk flow auth frontend dan endpoint backend

---

## Open question yang harus diputuskan sebelum implementasi penuh
- format coupon referral: diskon nominal atau persentase?
- besar discount coupon referral berapa?
- halaman default setelah login untuk organizer dan customer ke mana?
- upload foto profile disimpan lokal, Cloudinary, atau storage lain?
- forgot password dikirim via email provider yang mana?

Jika belum ada keputusan, gunakan default berikut agar implementasi tetap jalan:
- coupon referral = nominal tetap
- value coupon = tentukan di constant backend
- redirect organizer -> `/organizer/dashboard`
- redirect customer -> `/customer/dashboard`
- foto profile disimpan via backend upload strategy existing

---

## Definition of done
Issue ini dianggap selesai jika:
- halaman login, register, forgot password, dan profile tersedia dan responsive
- route guard bekerja sesuai role dan status login
- login/register benar-benar terhubung ke backend
- profile update dan upload photo punya endpoint dan bekerja
- reward referral menghasilkan point + coupon dengan expiry 3 bulan
- developer lain bisa mengikuti issue ini tanpa perlu menebak langkah selanjutnya
