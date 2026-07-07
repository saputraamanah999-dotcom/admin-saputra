# 💍 Wedding Invitation CMS — Master Control

Admin panel untuk mengelola **2 website undangan pernikahan** sekaligus, dengan realtime sync ke website tamu lewat Firebase Firestore + Supabase.

> **Status**: Production-ready. Sudah terverifikasi via browser automation. Lihat [SETUP.md](./SETUP.md) dan [DEPLOY.md](./DEPLOY.md) untuk panduan lengkap.

## ✨ Fitur Utama

- 🎛️ **1 Admin Panel untuk 2 Website** — Switch antara `site-1` (Wayan & Putri) dan `site-2` (Made & Kadek) lewat sidebar
- 📡 **Realtime Sync** — Semua perubahan (konten, galeri, pengumuman) langsung muncul di website tamu tanpa redeploy, via Firestore `onSnapshot`
- 🔔 **Push Notification (FCM)** — Pengumuman baru otomatis kirim push notification ke tamu yang sudah subscribe
- 📢 **Broadcast ke 2 Website** — Buat pengumuman sekali, kirim ke kedua website sekaligus
- 🔐 **Multi-layer Security** — Allowlist email + Firebase Auth + Firestore Rules + `verifyAdminToken` di setiap API route
- 📊 **Analytics Realtime** — Live visitor count + grafik kunjungan 14 hari + distribusi RSVP
- 📤 **CSV Export** — Export daftar RSVP ke Excel/Google Sheets (UTF-8 BOM)
- 🎨 **Dark Elegant Theme** — Tema "command center" dengan aksen emas + ungu Bali

## 📂 Halaman Admin

| Route | Fungsi |
|---|---|
| `/login` | Login Google + demo fallback |
| `/dashboard` | Ringkasan statistik + aktivitas terkini |
| `/content` | Edit konten utama (nama, tanggal, venue, maps, music, dll) |
| `/gallery` | Upload & atur urutan foto galeri |
| `/music-maps` | Atur lagu background + Google Maps embed |
| `/gift` | QRIS + daftar rekening + rekap transaksi kado |
| `/guests` | CRUD tamu + generate link personal + Kirim WA |
| `/rsvp` | Rekap RSVP + guestbook + filter + CSV export |
| `/announcements` | Buat pengumuman + broadcast ke 2 website + FCM trigger |
| `/analytics` | Live visitor + chart kunjungan + pie chart RSVP |
| `/settings` | Allowlist email admin + dev credit badge config |

## 🌐 API Endpoints

### Admin (butuh `Authorization: Bearer <Firebase_ID_Token>`)
- `GET/PUT /api/content?siteId=` — baca/simpan config utama
- `POST/PUT /api/gallery?siteId=` — tambah/update foto galeri
- `DELETE /api/gallery/[id]?siteId=` — hapus foto + file storage
- `GET/POST /api/guests?siteId=` — list/tambah tamu (Supabase)
- `PUT/DELETE /api/guests/[id]?siteId=` — update/hapus tamu
- `DELETE /api/rsvp/[id]?siteId=` — hapus RSVP
- `DELETE /api/rsvp/guestbook/[id]?siteId=` — hapus ucapan
- `POST/PUT /api/announcements?siteId=` — buat/update pengumuman
- `DELETE /api/announcements/[id]?siteId=` — hapus pengumuman
- `POST /api/notify?siteId=` — kirim FCM push notification
- `POST /api/provision` — auto-buat config default untuk site baru
- `GET/PUT /api/settings` — global settings (allowlist, dev credit)
- `GET /api/analytics?siteId=` — statistik kunjungan + RSVP

### Publik (tanpa auth — dipanggil website tamu)
- `GET /api/public/config?siteId=` — ambil config utama
- `GET /api/public/gallery?siteId=` — ambil daftar foto galeri
- `GET /api/public/announcements?siteId=` — ambil pengumuman aktif
- `POST /api/rsvp/submit` — tamu submit RSVP
- `POST /api/guestbook/submit` — tamu kirim ucapan
- `POST /api/fcm-token` — daftarkan FCM token push notification
- `POST /api/visit-log` — log kunjungan website tamu
- `POST /api/live-visitor` — heartbeat live visitor tracking

## 🛠️ Tech Stack

- **Framework**: Next.js 16 (App Router) + TypeScript
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Auth**: Firebase Auth (Google Sign-In)
- **Realtime DB**: Firestore (Firebase Admin SDK di server)
- **Relational DB**: Supabase Postgres (service_role key server-only)
- **Storage**: Supabase Storage (untuk foto galeri)
- **Push Notif**: Firebase Cloud Messaging (FCM)
- **State**: Zustand (site switcher) + React Hook Form + Zod
- **Charts**: Recharts
- **Animation**: Framer Motion

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env example & isi
cp .env.example .env.local
# Edit .env.local dengan kredensial Firebase + Supabase kamu

# 3. Run dev server
npm run dev
# Buka http://localhost:3000 → redirect ke /login

# 4. Login dengan email terdaftar di allowlist (default: saputraamanah999@gmail.com)
```

Lihat [SETUP.md](./SETUP.md) untuk setup Firebase + Supabase lengkap, dan [DEPLOY.md](./DEPLOY.md) untuk deploy ke Vercel.

## 📁 Struktur Project

```
.
├── src/
│   ├── app/
│   │   ├── (auth)/login/         # Halaman login
│   │   ├── (dashboard)/          # Semua halaman admin (protected)
│   │   │   ├── dashboard/
│   │   │   ├── content/
│   │   │   ├── gallery/
│   │   │   ├── music-maps/
│   │   │   ├── gift/
│   │   │   ├── guests/
│   │   │   ├── rsvp/
│   │   │   ├── announcements/
│   │   │   ├── analytics/
│   │   │   └── settings/
│   │   └── api/
│   │       ├── auth/             # Auth endpoints
│   │       ├── public/           # Public endpoints (website tamu)
│   │       ├── content/          # Admin: content CRUD
│   │       ├── gallery/          # Admin: gallery CRUD
│   │       ├── guests/           # Admin: guests CRUD (Supabase)
│   │       ├── rsvp/             # Admin: rsvp/guestbook delete + public submit
│   │       ├── guestbook/        # Public: guestbook submit
│   │       ├── announcements/    # Admin: announcement CRUD
│   │       ├── notify/           # Admin: FCM push notification
│   │       ├── fcm-token/        # Public: register FCM token
│   │       ├── visit-log/        # Public: log visit (analytics)
│   │       ├── live-visitor/     # Public: live visitor heartbeat
│   │       ├── analytics/        # Admin: aggregated stats
│   │       ├── provision/        # Admin: auto-provision new site
│   │       ├── settings/         # Admin: global settings
│   │       └── gift/             # Admin: gift config
│   ├── components/
│   │   ├── admin/                # Sidebar, SiteSwitcher, AuthProvider, etc.
│   │   ├── forms/                # Form components
│   │   ├── charts/               # Chart components
│   │   └── ui/                   # shadcn/ui components
│   ├── lib/
│   │   ├── firebase/             # client.ts, admin.ts, auth.ts, admin-verify.ts
│   │   ├── supabase/             # client.ts, admin.ts
│   │   ├── schemas.ts            # Zod schemas
│   │   ├── sites.ts              # Site registry
│   │   ├── site-store.ts         # Zustand store
│   │   ├── data-service.ts       # High-level CRUD service
│   │   ├── use-realtime.ts       # React hooks for Firestore onSnapshot
│   │   ├── api-client.ts         # Authed fetch helper
│   │   ├── mock-store.ts         # Demo fallback (localStorage)
│   │   └── types.ts              # TypeScript types
│   └── middleware.ts             # Route protection
├── firestore.rules               # Firestore Security Rules
├── firestore.indexes.json        # Firestore composite indexes
├── firebase.json                 # Firebase CLI config
├── supabase/schema.sql           # Supabase SQL schema
├── .env.example                  # Environment variables template
├── SETUP.md                      # Setup Firebase + Supabase guide
└── DEPLOY.md                     # Vercel deployment guide
```

## 🔒 Keamanan

Lapisan keamanan berlapis:
1. **Client UX**: Email di luar allowlist tidak bisa login
2. **Middleware**: Tanpa cookie session → redirect ke `/login`
3. **API Route**: `verifyAdminToken` verifikasi Firebase ID Token + allowlist di setiap request
4. **Firestore Rules**: Write hanya untuk admin (custom claim atau allowlist email)
5. **Supabase RLS**: Anon hanya bisa SELECT + INSERT visit_logs; write lainnya via service_role (server only)
6. **Service Role Key**: Hanya di env server (tanpa `NEXT_PUBLIC_` prefix), tidak pernah di-bundle ke browser

Lihat [SETUP.md → Ringkasan Keamanan](./SETUP.md#-ringkasan-keamanan) untuk detail.

## 📝 License

MIT — bebas dipakai untuk project komersial. Tinggal ganti branding "Saputra Developer" di `/settings`.

## 🆘 Troubleshooting

Lihat [SETUP.md → Troubleshooting](./SETUP.md#troubleshooting) dan [DEPLOY.md → Troubleshooting](./DEPLOY.md#-troubleshooting-deploy).
