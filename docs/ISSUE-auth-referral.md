# Issue: Implement Account Creation, Roles, Referral, Role-Based Access

## Ringkasan singkat
Fitur ini menambahkan pendaftaran akun, dua role (`customer`, `organizer`), pendaftaran menggunakan `referral_code`, pembuatan `referral_code` unik yang tidak dapat diubah, dan proteksi route/halaman berdasarkan role.

Ditujukan untuk: junior developer atau model AI yang murah — instruksi langkah demi langkah, contoh kode, dan checklist.

---

## Acceptance Criteria (Kriteria Penerimaan)
- Endpoint `POST /api/auth/register` membuat user baru dengan `referral_code` unik, menyimpan password ter-hash, dan mengembalikan token + user (tanpa password).
- Endpoint `POST /api/auth/login` mengembalikan token JWT yang memuat `userId` dan `role`.
- Jika user mengirim `referralCode` saat register:
  - Referrer dicari berdasarkan `referral_code`.
  - Dibuat record `Referral` (`referrer_id`, `referee_id`).
  - `referee_id` wajib unik (schema saat ini sudah menggunakan `@unique`).
- `referral_code` dibuat sekali saat user dibuat dan tidak bisa diubah.
- Middleware `auth` dan `requireRole(['organizer'])` melindungi route yang hanya boleh diakses organizer.
- Tersedia tests (unit/integration) untuk kasus register (dengan/ tanpa referral) dan role guard.

---

## Quick Checklist (untuk PR)
- [ ] File perencanaan ini (docs/ISSUE-auth-referral.md)
- [ ] Backend: register + login
- [ ] Backend: referral generation + registration
- [ ] Backend: auth middleware + role guard
- [ ] DB: migration + prisma generate
- [ ] Frontend: register form + role-based routes
- [ ] Tests: unit + integration
- [ ] Update README.md dan .env.example

---

## Struktur tugas yang disarankan (langkah demi langkah)
1. Buat issue file ini (sudah dilakukan).
2. Backend scaffolding untuk auth:
   - File: `backend/src/routes/auth.ts`
   - File: `backend/src/controllers/authController.ts`
   - File: `backend/src/services/authService.ts`
   - Gunakan `bcrypt` untuk hash password dan `jsonwebtoken` untuk token.
3. Implement `generateUniqueReferralCode` pada service user.
4. Register flow:
   - Terima `name`, `email`, `password`, `role?`, `referralCode?` dari client.
   - Jika ada `referralCode`, cari user referrer.
   - Create user (dengan referral_code baru).
   - Jika referrer ditemukan, buat `Referral` record.
5. Middleware:
   - `auth` (verifikasi JWT, attach `req.user`)
   - `requireRole(roles: string[])` (cek `req.user.role`)
6. DB & Migration:
   - Pastikan `referral_code` di `User` model bertanda `@unique`.
   - Jalankan migrations dan `prisma generate`.
7. Frontend:
   - Tambah field `referralCode` (opsional) di form register.
   - Implement route guard (`RoleRoute`) untuk proteksi halaman.
8. Tests:
   - Unit tests untuk service generate code & immutability.
   - Integration tests untuk register endpoint (supertest / test DB sqlite).
9. Docs & Env:
   - Update `README.md` cara menjalankan migrate + generate.
   - Tambah `.env.example` (`DATABASE_URL`, `JWT_SECRET`).

---

## API Spec (ringkas)

### POST /api/auth/register
- Body JSON:
```json
{
  "name": "string",
  "email": "string",
  "password": "string",
  "role": "customer | organizer", // optional, default: customer
  "referralCode": "string" // optional
}
```
- Response `201`:
```json
{
  "user": { "id": 1, "email": "..", "name": "..", "role": "customer", "referral_code": "ABC123" },
  "token": "<jwt>"
}
```

### POST /api/auth/login
- Body JSON: `{ "email": "..", "password": ".." }`
- Response `200`: `{ user, token }`

---

## DB Notes / Prisma
- Periksa `backend/prisma/schema.prisma` dan pastikan `User.referral_code String @unique`.
- Migration (dev):
```bash
cd backend
npx prisma migrate dev --name add_auth_referral
npx prisma generate
```
- Catatan: Jika menggunakan Prisma v7, pindahkan connection URL ke `prisma.config.ts` dan gunakan konfigurasi client baru (lihat https://pris.ly/d/config-datasource dan https://pris.ly/d/prisma7-client-config).

---

## Contoh kode (backend)

### Generate referral code (service)
```ts
function generateReferralCode(len = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < len; i++) code += chars[Math.floor(Math.random()*chars.length)];
  return code;
}

async function createUniqueReferralCode(prisma) {
  for (let i = 0; i < 6; i++) {
    const code = generateReferralCode();
    const exists = await prisma.user.findUnique({ where: { referral_code: code }});
    if (!exists) return code;
  }
  throw new Error('Cannot generate unique referral code');
}
```

### Reject `referral_code` update (service)
```ts
async function updateUser(prisma, userId, payload) {
  const existing = await prisma.user.findUnique({ where: { id: userId }});
  if (!existing) throw new Error('User not found');
  if (payload.referral_code && payload.referral_code !== existing.referral_code) {
    throw new Error('referral_code cannot be changed');
  }
  // apply other updates
}
```

### Middleware `requireRole`
```ts
function requireRole(allowedRoles: string[]) {
  return (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'Unauthorized' });
    if (!allowedRoles.includes(req.user.role)) return res.status(403).json({ message: 'Forbidden' });
    next();
  };
}
```

---

## Testing (saran)
- Gunakan `jest` + `supertest`.
- Test cases utama:
  - Register tanpa referral => sukses + referral_code ter-generate
  - Register dengan referral valid => sukses + entry `Referral` ada
  - Gagal saat `referee_id` sudah pernah terpakai (unique constraint)
  - Role-guard menolak akses ketika role tidak sesuai

---

## Estimasi waktu (perkiraan untuk developer junior)
- Backend auth + referral core: 8–12 jam
- Middleware + tests: 4–6 jam
- Frontend form + guards: 4–6 jam
- Docs & minor fixes: 1–2 jam

---

## Labels yang direkomendasikan
`feature`, `backend`, `frontend`, `good first issue`, `priority:high`

---

## Notes untuk reviewer / implementer junior
- Ikuti struktur folder yang sudah ada: `backend/src/routes`, `controllers`, `services`, `middlewares`.
- Gunakan `prisma` client yang sudah tersedia di project (import dari `backend/src/config/prisma` kalau ada).
- Jangan commit `.env` — gunakan `.env.example`.
- Jika menemukan masalah unik pada generate kode (kolisi), tambahkan logging dan ulangi percobaan beberapa kali sebelum gagal.

---

Jika ingin, saya bisa membuat PR awal dengan skeleton routes + controllers + contoh tests. Mau saya lanjutkan implementasi backend pertama (`register` + referral generation)?
