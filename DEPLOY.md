# 🚀 DEPLOY KE VERCEL — Wedding Invitation CMS

Panduan deploy admin panel ke Vercel production.

> **Prasyarat**: Akun Vercel (https://vercel.com — gratis), repo sudah di-push ke GitHub/GitLab/Bitbucket, setup Firebase + Supabase sudah selesai (lihat [SETUP.md](./SETUP.md)).

---

## LANGKAH 1: Push ke GitHub

```bash
# Inisialisasi repo (kalau belum)
git init
git add .
git commit -m "Initial commit — Wedding CMS Admin Panel"

# Push ke GitHub (buat repo kosong dulu di github.com)
git remote add origin https://github.com/USERNAME/wedding-admin-cms.git
git branch -M main
git push -u origin main
```

### ⚠️ PENTING: Cek `.gitignore`

Pastikan file berikut TIDAK di-commit:
```gitignore
# .gitignore (sudah default Next.js)
.env.local
.env*.local
firebase-service-account.json
*.json # kecuali package.json, tsconfig.json, dll yang sudah ada
node_modules/
.next/
```

> File `firestore.rules`, `firestore.indexes.json`, `firebase.json`, `supabase/schema.sql`, `.env.example` **BOLEH** di-commit (tidak mengandung secret).

---

## LANGKAH 2: Import Project ke Vercel

1. Buka https://vercel.com → **Login** (pakai akun GitHub)
2. Klik **Add New → Project**
3. Pilih repo `wedding-admin-cms` dari daftar
4. Vercel auto-detect sebagai Next.js project — biarkan default:
   - **Framework Preset**: Next.js
   - **Build Command**: `next build` (otomatis)
   - **Output Directory**: `.next` (otomatis)
   - **Install Command**: `npm install` (otomatis)
5. **JANGAN klik Deploy dulu** → klik **Environment Variables** dulu (lihat Langkah 3)

---

## LANGKAH 3: Set Environment Variables di Vercel

Di halaman konfigurasi project, scroll ke **Environment Variables**. Tambahkan satu per satu:

### 3.1 Firebase Client (publik — centang semua environment: Production + Preview + Development)

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSy...` | ☑️ All |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `wedding-cms.firebaseapp.com` | ☑️ All |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `wedding-cms` | ☑️ All |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `wedding-cms.appspot.com` | ☑️ All |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `123456789012` | ☑️ All |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:123456789012:web:abcdef` | ☑️ All |

### 3.2 Firebase Admin (SERVER ONLY — centang Production + Preview, JANGAN Development)

| Key | Value | Environments |
|---|---|---|
| `FIREBASE_ADMIN_PROJECT_ID` | `wedding-cms` | ☑️ Prod, Preview |
| `FIREBASE_ADMIN_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@wedding-cms.iam.gserviceaccount.com` | ☑️ Prod, Preview |
| `FIREBASE_ADMIN_PRIVATE_KEY` | `"-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"` | ☑️ Prod, Preview |

> ⚠️ **PENTING untuk `FIREBASE_ADMIN_PRIVATE_KEY`**:
> - Buka file JSON Service Account yang sudah didownload
> - Copy seluruh value `private_key` **termasuk tanda kutip**
> - Newline (`\n`) sudah ada di JSON asli — pertahankan apa adanya
> - Di Vercel dashboard, paste langsung (Vercel akan handle escape dengan benar)

### 3.3 Supabase (campuran publik + server)

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxx.supabase.co` | ☑️ All |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGc...` | ☑️ All |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJhbGc...` | ☑️ Prod, Preview only |

### 3.4 Allowlist & Base URL

| Key | Value | Environments |
|---|---|---|
| `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` | `admin@x.com,pasangan@x.com` | ☑️ All |
| `ADMIN_ALLOWED_EMAILS` | `admin@x.com,pasangan@x.com` | ☑️ Prod, Preview |
| `NEXT_PUBLIC_WEDDING_SITE_BASE_URL_SITE_1` | `https://undangan-wayan-putri.vercel.app` | ☑️ All |
| `NEXT_PUBLIC_WEDDING_SITE_BASE_URL_SITE_2` | `https://undangan-made-kadek.vercel.app` | ☑️ All |

### 3.5 Verifikasi

Pastikan:
- ✅ Variabel dengan prefix `NEXT_PUBLIC_` dicentang untuk **Production + Preview + Development**
- ✅ Variabel sensitif (FIREBASE_ADMIN_*, SUPABASE_SERVICE_ROLE_KEY, ADMIN_ALLOWED_EMAILS) **HANYA** Production + Preview
- ✅ Tidak ada typo — copy-paste langsung dari Firebase/Supabase Console

---

## LANGKAH 4: Deploy!

1. Klik **Deploy** di Vercel
2. Tunggu 2-3 menit — Vercel build:
   ```
   $ npm install
   $ next build
   ✓ Compiled successfully
   ✓ Deployed to https://wedding-admin-cms.vercel.app
   ```
3. Setelah selesai, klik **Visit** → harus redirect ke `/login`

---

## LANGKAH 5: Setup Custom Domain (opsional)

1. Vercel dashboard → pilih project → **Settings → Domains**
2. Tambahkan domain, misal `admin.namakamu.com`
3. Tambahkan DNS record di provider domain kamu:
   - Type: `CNAME`
   - Name: `admin`
   - Value: `cname.vercel-dns.com`
4. Tunggu DNS propagate (5-30 menit) → Vercel otomatis issue SSL certificate

---

## LANGKAH 6: Setup Firebase Authorized Domains

Agar Google Sign-In bekerja di domain Vercel:

1. Firebase Console → **Authentication → Settings → Authorized domains**
2. Tambahkan:
   - `wedding-admin-cms.vercel.app`
   - `admin.namakamu.com` (kalau pakai custom domain)
   - `wedding-admin-cms-*.vercel.app` (untuk preview deployments — Vercel auto-generate)

> Tanpa ini, login Google akan error: `auth/unauthorized-domain`.

---

## LANGKAH 7: Tambah Lapisan Keamanan (Disarankan)

### 7.1 Vercel Password Protection (untuk preview deployments)
- Hanya tersedia di Vercel Pro plan ($20/bln)
- Aktifkan: Project Settings → Password Protection → Enable

### 7.2 Vercel DDoS Protection
- Otomatis aktif di semua plan (gratis)

### 7.3 IP Allowlist (kalau admin hanya akses dari IP tertentu)
- Tambah middleware check di `src/middleware.ts`:
```ts
const ALLOWED_IPS = ['202.xxx.xxx.xxx'];
const ip = req.headers.get('x-forwarded-for')?.split(',')[0];
if (!ALLOWED_IPS.includes(ip ?? '')) {
  return NextResponse.json({ error: 'IP not allowed' }, { status: 403 });
}
```

---

## LANGKAH 8: Setup Database Indexes Firestore

Beberapa query butuh composite indexes untuk performa optimal. Deploy:

```bash
firebase deploy --only firestore:indexes
```

Atau buat manual di Firebase Console → Firestore → Indexes → Composite:
- Collection: `gallery` → Fields: `order` ASC
- Collection: `rsvp` → Fields: `createdAt` DESC
- Collection: `guestbook` → Fields: `createdAt` DESC
- Collection: `announcements` → Fields: `active` ASC, `createdAt` DESC

---

## LANGKAH 9: Deploy Updates

Setiap kali kamu ubah kode:

```bash
git add .
git commit -m "feat: tambah fitur X"
git push origin main
```

Vercel auto-deploy setiap push ke `main` branch. Untuk preview, push ke branch lain (misal `feat/announcement-broadcast`) → Vercel buat preview deployment dengan URL berbeda.

---

## LANGKAH 10: Monitor & Logging

1. Vercel dashboard → project → **Logs** → lihat request log + error
2. Tambah Sentry (opsional) untuk error tracking:
   ```bash
   npm install @sentry/nextjs
   npx @sentry/wizard@latest -i nextjs
   ```
3. Firebase Console → **Firestore → Usage** → lihat read/write quota
4. Supabase Dashboard → **Reports** → lihat API usage + database size

---

## 🚨 TROUBLESHOOTING DEPLOY

### Error: `Module not found: Can't resolve 'firebase-admin'`
**Penyebab**: File dengan `'use client'` mengimpor `lib/firebase/admin.ts`.
**Solusi**: Cek dengan `grep -r "use client" src/app/ | xargs grep -l "firebase/admin"`. Harus kosong.

### Error: `FIREBASE_ADMIN_PRIVATE_KEY` tidak valid
**Solusi**: 
- Pastikan value di Vercel diawali & diakhiri tanda kutip ganda `"..."`
- Newline harus literal `\n` (2 karakter), bukan newline asli
- Test di local dulu: `node -e "console.log(process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length)"`

### Error: `auth/unauthorized-domain` saat login Google
**Solusi**: Tambahkan domain Vercel ke Firebase Console → Authentication → Settings → Authorized domains (lihat Langkah 6).

### Error: `Build failed: Type error`
**Solusi**: 
- Lihat error di Vercel build log
- Fix di local, `bun run lint` dulu sebelum push
- Atau temporary set `typescript.ignoreBuildErrors: true` di `next.config.ts` (tidak disarankan)

### Error: `Function terminated` di API route
**Solusi**: Cek log Vercel. Biasanya karena:
- Env var belum di-set (Production vs Preview mismatch)
- Service role key salah format
- Firestore rules menolak akses

### Performance: API route lambat (cold start)
**Solusi**: Vercel serverless function cold start ~3-5 detik. Untuk ngakalin:
- Pakai Vercel Edge Functions (kalau tidak butuh Firebase Admin SDK)
- Atau upgrade ke Vercel Pro untuk lebih banyak compute hours

---

## ✅ CHECKLIST FINAL SEBELUM GO-LIVE

- [ ] Semua env vars di-set di Vercel (Production)
- [ ] Domain Vercel ditambahkan ke Firebase Authorized Domains
- [ ] Firestore Rules sudah di-deploy (`firebase deploy --only firestore:rules`)
- [ ] Firestore Indexes sudah di-deploy (`firebase deploy --only firestore:indexes`)
- [ ] Supabase schema.sql sudah di-run
- [ ] Supabase Storage bucket `gallery` sudah dibuat + policy
- [ ] Email admin sudah ditambahkan ke allowlist di env + firestore.rules
- [ ] Custom claim `role: admin` sudah di-set ke email admin (opsional)
- [ ] Test login Google di production domain
- [ ] Test semua halaman CRUD di production
- [ ] Test endpoint publik dari website tamu
- [ ] Test push notification (FCM)
- [ ] Setup Sentry / monitoring (opsional)
- [ ] **Rotasi semua key sensitif** yang pernah terekspos di chat/instructions
- [ ] Backup Firestore + Supabase (Vercel tidak backup otomatis)

---

## 💰 ESTIMASI BIAYA (untuk 2 website undangan)

| Service | Free Tier | Estimasi Pakai |
|---|---|---|
| **Vercel** (Hobby) | 100GB bandwidth, 100GB-hours serverless | Cukup untuk ~1000 tamu |
| **Firebase** (Spark) | 1GB Firestore, 10GB Storage, 10k auth/day | Cukup untuk 2 wedding |
| **Supabase** (Free) | 500MB database, 1GB storage, 50k MAU | Cukup untuk 2 wedding |

**Total: Rp 0** untuk skala 2 website undangan dengan total ~1000 tamu. 🎉

Kalau butuh lebih (banyak klien), upgrade ke:
- Vercel Pro: $20/bulan
- Firebase Blaze: pay-as-you-go (mulai ~$0)
- Supabase Pro: $25/bulan
