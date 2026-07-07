#!/usr/bin/env python3
"""
Script untuk pack project admin panel menjadi ZIP yang siap download & deploy.
Mengecualikan: node_modules, .next, dev.log, db/custom.db, .env (sensitif)
Menyertakan: semua source code, config, dokumentasi, .env.example
"""

import os
import zipfile
from pathlib import Path

PROJECT_ROOT = Path("/home/z/my-project")
OUTPUT_ZIP = Path("/home/z/my-project/download/wedding-admin-cms.zip")

# Folder yang DIKECUALIKAN (tidak masuk ZIP)
EXCLUDE_DIRS = {
    "node_modules",
    ".next",
    ".zscripts",
    ".z-ai-config",
    ".claude",
    "skills",
    "mini-services",
    "upload",
    "db",
    "prisma",
    ".git",
}

# File yang dikecualikan
EXCLUDE_FILES = {
    "dev.log",
    "server.log",
    "dev.out.log",
    "custom.db",
    "custom.db-journal",
}

# File `.env` DIIKUTKAN ke ZIP karena user butuh untuk langsung jalan.
# Catatan: FIREBASE_ADMIN_CLIENT_EMAIL & FIREBASE_ADMIN_PRIVATE_KEY dibiarkan kosong
# di .env — user harus generate sendiri dari Firebase Console (tidak boleh dikarang).


def should_skip_file(filename: str, file_path: Path) -> bool:
    if filename in EXCLUDE_FILES:
        return True
    if filename.endswith(".log"):
        return True
    if filename.endswith(".db") or filename.endswith(".db-journal"):
        return True
    # Skip screenshot PNG di folder download (tidak dibutuhkan untuk deploy)
    if filename.endswith(".png") and "download" in str(file_path):
        return True
    return False


def create_zip():
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    print(f"Membuat ZIP: {OUTPUT_ZIP}")
    print(f"Source: {PROJECT_ROOT}")
    print("-" * 60)

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        for root, dirs, files in os.walk(PROJECT_ROOT):
            root_path = Path(root)

            # Filter folder yang dikecualikan (modifikasi dirs in-place)
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".z")]

            for filename in files:
                file_path = root_path / filename
                if should_skip_file(filename, file_path):
                    continue

                # Skip ZIP file di download folder (hindari rekursif)
                if file_path.suffix == ".zip" and "download" in str(file_path):
                    continue

                # Path relatif di dalam ZIP
                rel_path = file_path.relative_to(PROJECT_ROOT)
                arcname = f"wedding-admin-cms/{rel_path}"

                try:
                    zf.write(file_path, arcname)
                    file_count += 1
                    file_size = file_path.stat().st_size
                    total_size += file_size
                    print(f"  + {rel_path} ({file_size:,} bytes)")
                except Exception as e:
                    print(f"  ! Skip {file_path}: {e}")

    print("-" * 60)
    print(f"\n✅ ZIP berhasil dibuat!")
    print(f"   Total file: {file_count}")
    print(f"   Total size: {total_size/1024:.1f} KB ({total_size/1024/1024:.2f} MB)")
    zip_size = OUTPUT_ZIP.stat().st_size
    print(f"   ZIP size:   {zip_size/1024:.1f} KB ({zip_size/1024/1024:.2f} MB)")
    print(f"   Lokasi: {OUTPUT_ZIP}")


if __name__ == "__main__":
    create_zip()
