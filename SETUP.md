# 📋 SETUP LENGKAP — Wedding Invitation CMS

Panduan step-by-step untuk setup Firebase + Supabase dari nol sampai admin panel berjalan production.

> **Prasyarat**: Akun Google (untuk Firebase) + akun Supabase (gratis) + akun Vercel (gratis).

---

## TAHAP 1: Setup Firebase Project

### 1.1 Buat Project Firebase
1. Buka https://console.firebase.google.com/
2. Klik **Add project** → nama: `wedding-cms` (atau apa pun) → Continue
3. Disable Google Analytics (tidak perlu) → Create project

### 1.2 Aktifkan Firestore Database
1. Di sidebar kiri Firebase Console → **Build → Firestore Database**
2. Klik **Create database** → lokasi: `asia-southeast1` (Singapore, terdekat dengan Indonesia)
3. Mode: **Start in production mode** (kita akan set rules sendiri)

### 1.3 Aktifkan Firebase Auth (Google Sign-In)
1. Sidebar → **Build → Authentication → Get started**
2. Tab **Sign-in method** → enable **Google** → Save

### 1.4 Daftarkan Web App (untuk dapat client config)
1. Di halaman utama project, klik icon **`</>`** (Web)
2. App nickname: `wedding-cms-web` → Register app
3. Copy config yang muncul (apiKey, authDomain, projectId, dll) → simpan untuk `.env.local`

### 1.5 Buat Service Account Key (untuk Admin SDK)
1. Sidebar → **Project Settings** (gear icon) → **Service accounts** tab
2. Klik **Generate new private key** → simpan file JSON yang di-download
3. Buka file JSON itu, copy field `project_id`, `client_email`, `private_key` → simpan untuk `.env.local`

### 1.6 Deploy Firestore Security Rules
**Opsi A — via Firebase Console (paling mudah):**
1. Sidebar → **Firestore Database → Rules** tab
2. Copy isi file `firestore.rules` dari repo ini
3. Paste di editor → klik **Publish**

**Opsi B — via Firebase CLI:**
```bash
npm install -g firebase-tools
firebase login
firebase use --add  # pilih project yang baru dibuat
firebase deploy --only firestore:rules
firebase deploy --only firestore:indexes
```

### 1.7 Setup Custom Claims (opsional tapi disarankan)
Agar admin check lebih aman, set custom claim `role: admin` ke email admin:
1. Buka file `firebase.json` di Service Account yang sudah didownload
2. Jalankan script Node.js berikut (one-time):

```bash
# Buat file setup-claims.js
node -e "
const admin = require('firebase-admin');
const serviceAccount = require('./path-to-service-account.json');
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
admin.auth().setCustomUserClaims('UID_USER_ADMIN', { role: 'admin' })
  .then(() => console.log('Done!'))
  .then(() => process.exit());
"
```

Ganti `UID_USER_ADMIN` dengan UID user dari Firebase Console → Authentication → Users.

> Setelah ini, Firestore rules yang pakai `request.auth.token.role == 'admin'` akan bekerja.

---

## TAHAP 2: Setup Supabase Project

### 2.1 Buat Project Supabase
1. Buka https://supabase.com/ → Sign in → **New project**
2. Name: `wedding-cms` → Database password: generate kuat, simpan!
3. Region: `Southeast Asia (Singapore)` → Plan: Free → Create

### 2.2 Buat Tabel + Storage Bucket
1. Buka project Supabase → sidebar **SQL Editor**
2. Klik **New query** → copy isi file `supabase/schema.sql` dari repo ini → **Run**
3. Verifikasi: jalankan `select * from sites_registry;` → harus muncul 2 row (site-1, site-2)

### 2.3 Buat Storage Bucket untuk Gallery
1. Sidebar → **Storage** → **New bucket**
2. Name: `gallery` → **Public bucket**: ON → Save
3. Klik bucket `gallery` → **Policies** tab → **New policy**
4. Untuk SELECT (read): 
   - Allowed operation: `SELECT`
   - Target roles: `anon`
   - USING expression: `true` (semua bisa baca)
5. Untuk INSERT/UPDATE/DELETE (write):
   - Tidak perlu policy — pakai service_role key di server yang bypass RLS

### 2.4 Ambil API Keys
1. Sidebar → **Project Settings** (gear) → **API**
2. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role** key → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ RAHASIA — jangan share!)

---

## TAHAP 3: Konfigurasi Environment Variables

### 3.1 Untuk Development Lokal
```bash
cp .env.example .env.local
```
Edit `.env.local`, isi semua value dari Firebase Console + Supabase Dashboard.

### 3.2 Untuk Production (Vercel)
Lihat [DEPLOY.md](./DEPLOY.md) — semua env vars di-set di Vercel dashboard.

### 3.3 Verifikasi Konfigurasi
Setelah `.env.local` diisi, jalankan:
```bash
npm run dev
```
Buka http://localhost:3000 → harus redirect ke `/login` dan tombol **"Masuk dengan Google"** tidak disable lagi.

---

## TAHAP 4: Setup Allowlist Email Admin

Edit `.env.local`:
```env
NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=email-kamu@gmail.com,pasangan@gmail.com
ADMIN_ALLOWED_EMAILS=email-kamu@gmail.com,pasangan@gmail.com
```

Hanya email di daftar ini yang bisa:
1. Login via Google di admin panel
2. Memanggil API route (verifyAdminToken akan menolak email lain)
3. Write ke Firestore (rules mengecek email di allowlist)

> **PENTING**: Edit juga array email di `firestore.rules` baris ~40 supaya konsisten.

---

## TAHAP 5: Provisioning Site Pertama

Setelah login ke admin panel, kamu bisa:

1. **Edit konten** di `/content` — nama pasangan, tanggal, venue, dll.
2. **Upload foto** di `/gallery`
3. **Atur QRIS & rekening** di `/gift`
4. **Tambah tamu** di `/guests` — otomatis generate link personal
5. **Buat pengumuman** di `/announcements` — bisa broadcast ke 2 website sekaligus

Atau panggil API provision untuk auto-buat config default:
```bash
curl -X POST https://admin-panel-kamu.vercel.app/api/provision \
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"siteId":"site-1","coupleNames":"Wayan & Putri"}'
```

---

## TAHAP 6: Integrasi dengan Website Tamu

Website tamu (PROMPT 1) perlu memanggil endpoint publik berikut:

### 6.1 Ambil Config
```ts
// Di website tamu
const res = await fetch('https://admin-kamu.vercel.app/api/public/config?siteId=site-1');
const { data: config } = await res.json();
// config = { coupleNames, weddingDate, venue, mapsEmbed, musicUrl, ... }
```

### 6.2 Ambil Galeri
```ts
const res = await fetch('https://admin-kamu.vercel.app/api/public/gallery?siteId=site-1');
const { data: photos } = await res.json();
```

### 6.3 Ambil Pengumuman Aktif
```ts
const res = await fetch('https://admin-kamu.vercel.app/api/public/announcements?siteId=site-1');
const { data: announcements } = await res.json();
```

### 6.4 Submit RSVP (tamu klik "Konfirmasi Kehadiran")
```ts
await fetch('https://admin-kamu.vercel.app/api/rsvp/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site-1',
    name: 'Budi Santoso',
    attendance: 'hadir',
    guestCount: 2,
    message: 'Selamat menempuh hidup baru!',
    guestSlug: 'budi', // opsional, kalau tamu datang via link personal
  }),
});
```

### 6.5 Submit Guestbook (tamu kirim ucapan)
```ts
await fetch('https://admin-kamu.vercel.app/api/guestbook/submit', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site-1',
    name: 'Kadek Ari',
    message: 'Barakallah lakuma',
    guestSlug: 'kadek',
  }),
});
```

### 6.6 Daftarkan FCM Token (untuk push notification)
```ts
// Setelah user klik "Allow notifications"
import { getMessaging, getToken } from 'firebase/messaging';

const messaging = getMessaging(app);
const token = await getToken(messaging, { vapidKey: 'YOUR_VAPID_KEY' });

await fetch('https://admin-kamu.vercel.app/api/fcm-token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site-1',
    token,
    guestSlug: 'budi',
  }),
});
```

### 6.7 Log Visit (untuk analytics)
```ts
// Saat halaman tamu di-load
await fetch('https://admin-kamu.vercel.app/api/visit-log', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site-1',
    guestSlug: 'budi', // opsional
    userAgent: navigator.userAgent,
    referrer: document.referrer,
  }),
});
```

### 6.8 Live Visitor Heartbeat (untuk "X tamu online")
```ts
// Saat halaman tamu di-load, dan setiap 30 detik
const sessionId = sessionStorage.getItem('sessionId') ?? crypto.randomUUID();
sessionStorage.setItem('sessionId', sessionId);

await fetch('https://admin-kamu.vercel.app/api/live-visitor', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    siteId: 'site-1',
    action: 'join', // 'join' | 'heartbeat' | 'leave'
    sessionId,
    guestSlug: 'budi',
  }),
});

// Setiap 30 detik:
setInterval(() => {
  fetch('/api/live-visitor', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ siteId: 'site-1', action: 'heartbeat', sessionId }),
  });
}, 30000);

// Saat user tutup tab:
window.addEventListener('beforeunload', () => {
  navigator.sendBeacon('/api/live-visitor', JSON.stringify({
    siteId: 'site-1', action: 'leave', sessionId,
  }));
});
```

---

## TAHAP 7: Generate VAPID Key untuk FCM Web Push

Untuk push notification di browser (PWA), perlu VAPID key:

1. Firebase Console → **Project Settings → Cloud Messaging**
2. Scroll ke **Web configuration** → **Generate key pair**
3. Copy key pair → simpan di website tamu, pakai saat `getToken(messaging, { vapidKey: '...' })`

---

## TAHAP 8: Verifikasi Semua Berfungsi

Setelah setup selesai, login ke admin panel dan test:

- [ ] Login dengan email di allowlist → redirect ke `/dashboard`
- [ ] Edit konten di `/content` → Simpan → website tamu langsung update (realtime)
- [ ] Upload foto di `/gallery` → muncul di website tamu tanpa redeploy
- [ ] Tambah tamu di `/guests` → Copy Link → buka link → website tamu render dengan nama tamu
- [ ] Submit RSVP dari website tamu → muncul realtime di admin `/rsvp`
- [ ] Submit guestbook dari website tamu → muncul realtime di admin `/rsvp`
- [ ] Buat pengumuman → banner muncul realtime di website tamu
- [ ] Buat pengumuman broadcast (target: kedua website) → muncul di kedua site
- [ ] Tamu yang sudah subscribe notif → menerima FCM push saat pengumuman dibuat
- [ ] Hapus foto/tamu/RSVP/ucapan/pengumuman → modal konfirmasi muncul → data hilang dari Firestore + website tamu
- [ ] Export CSV RSVP → buka di Excel/Google Sheets → karakter UTF-8 tidak rusak
- [ ] Analytics menampilkan live visitor + chart kunjungan harian

---

## TROUBLESHOOTING

**"Login Google gagal: Email tidak diizinkan"**
→ Cek `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` sudah berisi email kamu. Pastikan tidak ada spasi.

**"API route return 401 Unauthorized"**
→ Token Firebase ID tidak dikirim di header `Authorization: Bearer <token>`. Cek `getIdToken()` di `lib/firebase/auth.ts`.

**"Build Vercel error: FIREBASE_ADMIN_PRIVATE_KEY invalid"**
→ Private key harus di-quote dan newline di-escape. Format:
```
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
```

**"Firestore permission denied"**
→ Cek email admin kamu sudah ada di array `firestore.rules`. Atau set custom claim `role: admin` (TAHAP 1.7).

**"Supabase error: RLS policy"**
→ Pastikan service_role key dipakai (bukan anon) untuk operasi write di server. Service role bypass RLS.

**"FCM notification tidak diterima tamu"**
→ Pastikan: (1) tamu klik Allow notifications, (2) VAPID key sudah di-set di website tamu, (3) token FCM terdaftar di Firestore via `/api/fcm-token`.

---

## 🔒 RINGKASAN KEAMANAN

| Lapisan | Cara Kerja |
|---|---|
| **Client UX** | Email di luar allowlist tidak bisa login (dicek di `lib/firebase/auth.ts`) |
| **Middleware** | Tanpa cookie session → redirect ke `/login` |
| **API Route** | `verifyAdminToken` verifikasi Firebase ID Token + cek allowlist email di setiap request |
| **Firestore Rules** | Write hanya untuk `request.auth.token.role == 'admin'` ATAU email di allowlist |
| **Supabase RLS** | Anon hanya bisa SELECT + INSERT visit_logs; write lainnya via service_role (server only) |
| **Service Role Key** | Hanya di env server (tanpa prefix NEXT_PUBLIC_), tidak pernah di-bundle ke browser |

> ⚠️ **WAJIB**: Setelah setup selesai, **rotate semua key sensitif** (Supabase service_role, Firebase Admin private key, password Postgres) yang pernah tertulis di chat/instructions, karena sudah pernah terekspos di riwayat.
