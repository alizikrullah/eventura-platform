# Eventura Platform

Event management platform - Marketplace untuk beli & jual tiket event.

## Tech Stack

### Backend
- Node.js + Express + TypeScript
- Prisma ORM
- PostgreSQL (Neon)
- JWT Authentication
- Multer + Cloudinary (file upload)
- Nodemailer (email notifications)
- Node-cron (scheduled tasks)

### Frontend
- React 18 + TypeScript
- Vite
- Tailwind CSS + Shadcn UI
- Zustand (state management)
- React Router v6
- Formik + Yup
- Axios

## Project Structure

```
eventura-platform/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── controllers/     # Request handlers
│   │   ├── services/        # Business logic
│   │   ├── middlewares/     # Auth, validation, etc
│   │   ├── validators/      # Request validation
│   │   ├── config/          # Config files
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript types
│   │   ├── app.ts           # Express app setup
│   │   └── server.ts        # Server entry point
│   ├── prisma/
│   │   ├── schema.prisma    # Database schema
│   │   └── seed.ts          # Seed data (optional)
│   ├── package.json
│   ├── tsconfig.json
│   └── .env
├── frontend/
│   ├── src/
│   │   ├── pages/           # Page components
│   │   ├── components/      # Reusable components
│   │   ├── hooks/           # Custom hooks
│   │   ├── store/           # Zustand stores
│   │   ├── services/        # API calls
│   │   ├── utils/           # Helper functions
│   │   ├── types/           # TypeScript types
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── public/
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
└── README.md
```

## Setup Instructions

### 1. Clone Repository

```bash
git clone https://github.com/alizikrullah/eventura-platform.git
cd eventura-platform
```

### 2. Backend Setup

```bash
cd backend
npm install
```

**Setup Environment Variables:**

```bash
cp .env.example .env
```

Edit `.env` and fill in:
- `DATABASE_URL` - Neon PostgreSQL connection string (will be shared)
- `JWT_SECRET` - Random secret string
- Other variables as needed

**Run Database Migration:**

```bash
npx prisma generate
npx prisma migrate dev --name init
```

**Start Backend:**

```bash
npm run dev
```

Backend will run on `http://localhost:5000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

**Setup Frontend Environment Variables:**

```bash
cp .env.example .env
```

Isi `.env` frontend:
- `VITE_API_BASE_URL=http://localhost:5000/api`

**Start Frontend:**

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

**Available auth/profile routes:**
```
/login
/register
/forgot-password
/reset-password?token=...
/profile
/organizer/dashboard
/customer/dashboard
```

## Development Workflow

### Michael - Week 1 (Auth System)

**Files to work on:**
```
backend/src/
├── routes/auth.routes.ts
├── controllers/auth.controller.ts
├── services/auth.service.ts
├── middlewares/auth.middleware.ts
├── middlewares/role.middleware.ts
└── validators/auth.validator.ts

frontend/src/
├── pages/Register.tsx
├── pages/Login.tsx
├── pages/Profile.tsx
├── services/auth.service.ts
└── store/authStore.ts
```

**Features:**
- Register (with referral code optional)
- Login (JWT token)
- Logout
- Protected routes
- Role-based access (customer/organizer)

**API Endpoints to implement:**
```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/forgot-password
POST   /api/auth/reset-password
GET    /api/users/me
PATCH  /api/users/me
PATCH  /api/users/me/password
PATCH  /api/users/me/photo
```

### Ali - Week 2 onwards

Will work on events, transactions, reviews after auth is complete.

## Git Workflow

```bash
# Create feature branch
git checkout -b michael/auth-system

# Make changes, commit
git add .
git commit -m "feat: implement JWT authentication"

# Push
git push origin michael/auth-system

# Create Pull Request on GitHub
# After review, merge to main/dev
```

## Database Schema Overview

- `users` - Customer & Organizer accounts
- `events` - Events created by organizers
- `transactions` - Ticket purchases
- `vouchers` - Event-specific discounts
- `coupons` - System-wide discount coupons
- `points` - User points from referrals
- `reviews` - Event reviews
- `referrals` - Referral tracking

See `prisma/schema.prisma` for full schema.

## Useful Commands

**Backend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Run production build
npx prisma studio    # Open Prisma Studio (database GUI)
npx prisma generate  # Generate Prisma Client
```

**Frontend:**
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
```

## Environment Variables

**Backend (.env):**
```
DATABASE_URL=          # Neon PostgreSQL URL
JWT_SECRET=            # JWT secret key
JWT_EXPIRES_IN=7d
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
UPLOAD_DIR=./uploads
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-cloudinary-api-key
CLOUDINARY_API_SECRET=your-cloudinary-api-secret
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM="Eventura <noreply@eventura.com>"
```

## Deployment

- Backend: Railway / Render
- Frontend: Vercel (`eventura-platform.vercel.app`)
- Database: Neon (already setup)

## Team

- Ali - Event features, Transactions, Reviews
- Michael - Auth system, Referral, Dashboard

## Support

Kalau stuck, hubungi di WhatsApp group atau GitHub Issues.
