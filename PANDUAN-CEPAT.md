# 🚀 PANDUAN CEPAT SETELAH DOWNLOAD

## ✅ Yang Sudah Ada di ZIP
- Semua source code lengkap
- File `.env` **sudah berisi** semua nilai (Firebase client, Supabase, allowlist email)
- Hanya 2 variabel di `.env` yang **masih kosong** dan HARUS kamu isi sendiri:
  - `FIREBASE_ADMIN_CLIENT_EMAIL=` 
  - `FIREBASE_ADMIN_PRIVATE_KEY=`

## 1. Ekstrak ZIP
```bash
unzip wedding-admin-cms.zip
cd wedding-admin-cms
```

## 2. Install Dependencies
```bash
npm install
# atau
bun install
```

## 3. ISI 2 VARIABEL KOSONG di file `.env`

Buka file `.env` (sudah ada di folder project), cari 2 baris ini:

```env
FIREBASE_ADMIN_CLIENT_EMAIL=
FIREBASE_ADMIN_PRIVATE_KEY=
```

### Cara dapatkan nilainya:
1. Buka https://console.firebase.google.com
2. Login dengan akun Google kamu
3. Pilih project **`undanganadmin`**
4. Klik **gear icon ⚙️** (pojok kiri atas) → **Project Settings**
5. Klik tab **Service accounts**
6. Klik tombol **Generate new private key** (biru) → klik **Generate key**
7. File JSON ter-download ke komputermu (nama: `undanganadmin-firebase-adminsdk-xxxxx.json`)
8. Buka file JSON itu pakai Notepad/VS Code
9. Copy nilai `"client_email"` → paste ke `.env`:
   ```env
   FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@undanganadmin.iam.gserviceaccount.com
   ```
10. Copy nilai `"private_key"` (termasuk tanda kutip) → paste ke `.env`:
    ```env
    FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----\n"
    ```

⚠️ **PENTING**:
- Pertahankan tanda kutip ganda `"..."` di awal/akhir private_key
- Pertahankan `\n` sebagai 2 karakter (backslash + n), JANGAN diganti enter asli
- Jangan tambah spasi di awal/akhir

📖 **Tutorial lengkap dengan screenshot**: baca `TUTORIAL_ENV.md`

## 4. Jalankan Dev Server
```bash
npm run dev
# atau
bun run dev
```
Buka browser → http://localhost:3000

## 5. Login
- Otomatis redirect ke `/login`
- Klik tombol **"Masuk dengan Google"**
- Pilih akun **`saputraamanah999@gmail.com`** (hanya email ini yang diizinkan)
- Setelah login → redirect ke `/dashboard`

## 6. Deploy ke Vercel (opsional)
📖 Baca `DEPLOY.md` untuk panduan lengkap deploy ke Vercel + set env vars di dashboard Vercel.

---

## 📁 Struktur Project
```
wedding-admin-cms/
├── .env                  ← FILE INI yang diedit (isi 2 variabel kosong)
├── .env.example          ← template backup
├── src/
│   ├── app/
│   │   ├── (dashboard)/  # 10 halaman admin (dashboard, content, gallery, dll)
│   │   ├── api/          # API routes (admin + publik)
│   │   └── login/        # Halaman login Google
│   ├── components/       # UI components (shadcn/ui + admin custom)
│   ├── lib/              # Firebase, Supabase, hooks realtime, schemas
│   └── middleware.ts     # Route protection
├── firestore.rules       # Security rules (deploy ke Firebase)
├── firestore.indexes.json
├── supabase/schema.sql   # Schema SQL (jalankan di Supabase)
├── SETUP.md              # Tutorial setup Firebase + Supabase lengkap
├── DEPLOY.md             # Tutorial deploy Vercel
├── TUTORIAL_ENV.md       # Tutorial edit .env (dengan screenshot)
└── README.md             # Overview project
```

## ⚠️ JANGAN LUPA
- File `.env` **JANGAN** di-commit ke Git (sudah ada di `.gitignore`)
- Setelah setup selesai, **rotate** semua key sensitif yang pernah terekspose di chat
- Hanya 1 email yang bisa login: `saputraamanah999@gmail.com`
- Setelah deploy ke Vercel, tambahkan domain Vercel ke Firebase Console → Authentication → Settings → Authorized domains

## 🆘 Butuh Bantuan?
Baca `TUTORIAL_ENV.md` bagian **TROUBLESHOOTING** untuk solusi error umum.
