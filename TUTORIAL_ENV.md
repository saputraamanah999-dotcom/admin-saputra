# 📖 TUTORIAL: Cara Edit File `.env` & Setup Login Google

> **Lokasi file `.env`**: `/home/z/my-project/.env` (di folder root project)

---

## 🔑 RINGKASAN

Sekarang admin panel **HANYA bisa login dengan Google** — demo login sudah dihapus total. Hanya email **`saputraamanah999@gmail.com`** yang diizinkan akses.

Tapi sebelum login Google bisa berfungsi, kamu HARUS mengisi 2 variabel yang masih kosong di file `.env`:
1. `FIREBASE_ADMIN_CLIENT_EMAIL`
2. `FIREBASE_ADMIN_PRIVATE_KEY`

Kedua nilai ini hanya bisa didapat dari **Firebase Console** (tidak boleh dikarang).

---

## 📍 LOKASI FILE .env

```
my-project/
├── .env                  ← FILE INI yang diedit
├── .env.example          ← contoh template (tidak dipakai aktif)
├── package.json
├── src/
└── ...
```

**Path absolut**: `/home/z/my-project/.env`

---

## ✏️ CARA EDIT .env (3 opsi, pilih salah satu)

### OPSI A: Edit via Terminal (paling cepat)

```bash
# Buka file .env di editor nano
nano /home/z/my-project/.env

# Atau pakai vim
vim /home/z/my-project/.env

# Setelah selesai edit:
# - Di nano: Ctrl+O → Enter (save), Ctrl+X (exit)
# - Di vim: Esc → :wq → Enter
```

### OPSI B: Edit via VS Code / Cursor

1. Buka folder `/home/z/my-project/` di VS Code/Cursor
2. Di sidebar kiri, cari file `.env` (di root project)
3. Klik untuk buka
4. Edit baris yang perlu diisi
5. Save (Ctrl+S / Cmd+S)

### OPSI C: Edit via Replit / Cloud IDE

1. Di file explorer panel, scroll ke root folder
2. Klik file `.env`
3. Edit langsung di editor
4. Save otomatis

---

## 🔥 LANGKAH-LANGKAH SETUP LOGIN GOOGLE

### Langkah 1: Dapatkan Service Account Key dari Firebase Console

1. **Buka** https://console.firebase.google.com
2. **Login** dengan akun Google yang kamu pakai untuk bikin project Firebase
3. **Pilih project** `undanganadmin` (klik nama project di dashboard)
4. Klik **gear icon ⚙️** di pojok kiri atas → **Project Settings**
5. Klik tab **Service accounts** (di bagian atas)
6. Klik tombol **Generate new private key** (warna biru)
7. Akan muncul popup konfirmasi → klik **Generate key**
8. File JSON akan ter-download otomatis ke komputermu (nama: `undanganadmin-firebase-adminsdk-xxxxx.json`)

### Langkah 2: Buka File JSON yang Didownload

Buka file JSON tadi pakai text editor (Notepad, VS Code, TextEdit). Isinya kira-kira begini:

```json
{
  "type": "service_account",
  "project_id": "undanganadmin",
  "private_key_id": "abc123...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n",
  "client_email": "firebase-adminsdk-xxxxx@undanganadmin.iam.gserviceaccount.com",
  "client_id": "1234567890",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  ...
}
```

### Langkah 3: Copy 2 Nilai dari JSON ke .env

Buka file `/home/z/my-project/.env`. Cari baris ini (sekitar baris 23-24):

```env
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

**Isi dengan nilai dari file JSON:**

#### 3a. `FIREBASE_ADMIN_CLIENT_EMAIL`
Copy nilai `"client_email"` dari JSON, paste setelah tanda `=`:

```env
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@undanganadmin.iam.gserviceaccount.com
```

#### 3b. `FIREBASE_ADMIN_PRIVATE_KEY`
Copy nilai `"private_key"` dari JSON (termasuk tanda kutip dan `\n`), paste setelah tanda `=`:

```env
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANB...\n-----END PRIVATE KEY-----\n"
```

⚠️ **PENTING**:
- **Pertahankan tanda kutip ganda** `"..."` di awal dan akhir
- **Pertahankan `\n`** sebagai 2 karakter literal (backslash + n), JANGAN diganti dengan enter asli
- **Jangan tambah spasi** di awal/akhir

### Langkah 4: Restart Dev Server

Setelah save file `.env`, restart Next.js dev server supaya env baru terbaca:

```bash
# Di terminal, stop dev server (Ctrl+C), lalu jalankan lagi:
cd /home/z/my-project
npm run dev

# Atau kalau pakai bun:
bun run dev
```

### Langkah 5: Test Login Google

1. Buka browser → http://localhost:3000
2. Otomatis redirect ke `/login`
3. Klik tombol **"Masuk dengan Google"**
4. Popup Google Sign-In muncul → pilih akun **saputraamanah999@gmail.com**
5. Setelah login berhasil → otomatis redirect ke `/dashboard`

---

## ✅ VERIFIKASI SETUP BERHASIL

Cek di terminal (log dev server):

```
POST /api/auth/demo-login   ← baris ini TIDAK boleh muncul lagi (demo sudah dihapus)
GET /dashboard 200          ← ini yang muncul setelah login Google berhasil
```

Cek di browser:
- Sidebar kiri menampilkan email `saputraamanah999@gmail.com` di bagian bawah
- Badge "Verified Admin" (hijau) muncul di bawah email
- **TIDAK ada** badge "Demo Mode" lagi

---

## 🚨 TROUBLESHOOTING

### Error: "Firebase belum dikonfigurasi"
**Penyebab**: Variabel `NEXT_PUBLIC_FIREBASE_*` belum diset di `.env`.
**Solusi**: Pastikan baris 12-17 di `.env` sudah terisi (apiKey, authDomain, projectId, dll).

### Error: "Firebase Admin SDK belum dikonfigurasi"
**Penyebab**: `FIREBASE_ADMIN_CLIENT_EMAIL` atau `FIREBASE_ADMIN_PRIVATE_KEY` masih kosong.
**Solusi**: Ikuti Langkah 1-3 di atas — generate service account key dari Firebase Console.

### Error: "Email xxx@gmail.com tidak ada di allowlist admin"
**Penyebab**: Email yang dipakai login Google bukan `saputraamanah999@gmail.com`.
**Solusi**: 
- Logout dari akun Google lain di browser
- Atau buka Incognito, login pakai `saputraamanah999@gmail.com`
- Atau tambahkan email lain di `.env` baris `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS` dan `ADMIN_ALLOWED_EMAILS` (pisahkan dengan koma)

### Error: "auth/unauthorized-domain"
**Penyebab**: Domain localhost/vercel-app belum didaftarkan di Firebase Console.
**Solusi**:
1. Firebase Console → **Authentication** → **Settings** → **Authorized domains**
2. Klik **Add domain**
3. Tambahkan: `localhost`, `undanganadmin.vercel.app`, `admin.undanganadmin.vercel.app` (atau domain Vercel kamu)

### Error: `FIREBASE_ADMIN_PRIVATE_KEY` tidak valid
**Penyebab**: Format private key salah (kurang tanda kutip, `\n` hilang, dll).
**Solusi**:
- Pastikan format: `FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"`
- Buka file JSON service account, copy **persis** value `private_key` termasuk tanda kutip
- Di terminal cek: `echo $FIREBASE_ADMIN_PRIVATE_KEY | head -c 50` (harus mulai dengan `-----BEGIN`)

### Error: Login Google popup diblokir browser
**Solusi**: Allow popup untuk domain `localhost:3000` di settings browser.

---

## 📋 CHECKLIST FINAL

Sebelum bilang "sudah selesai", pastikan semua ini OK:

- [ ] File `.env` berisi semua variabel (cek: `cat .env | grep -v "^#" | grep -v "^$"`)
- [ ] `FIREBASE_ADMIN_CLIENT_EMAIL` terisi (tidak kosong)
- [ ] `FIREBASE_ADMIN_PRIVATE_KEY` terisi dengan format `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`
- [ ] `NEXT_PUBLIC_ADMIN_ALLOWED_EMAILS=saputraamanah999@gmail.com`
- [ ] `ADMIN_ALLOWED_EMAILS=saputraamanah999@gmail.com`
- [ ] Dev server sudah di-restart setelah edit `.env`
- [ ] Login Google berhasil → redirect ke `/dashboard`
- [ ] Tidak ada lagi tombol "Masuk Demo" di halaman login
- [ ] Sidebar menampilkan "Verified Admin" (bukan "Demo Mode")

---

## 🔒 KEAMANAN

- **JANGAN PERNAH** commit file `.env` ke GitHub/Git (sudah ada di `.gitignore`)
- **JANGAN PERNAH** share isi `FIREBASE_ADMIN_PRIVATE_KEY` atau `SUPABASE_SERVICE_ROLE_KEY` di chat/screenshot
- File JSON service account yang di-download dari Firebase Console → simpan di tempat aman, jangan share
- Kalau pernah tidak sengaja share key → **generate ulang** dari Firebase Console (sebelumnya di-revoke)

---

## 📞 BUTUH BANTUAN?

Kalau ada error yang tidak ter-cover di atas, kirim:
1. Screenshot error message lengkap
2. Log dev server (output terminal setelah error)
3. Baris `.env` yang bermasalah (sensor nilai sensitifnya dulu!)
