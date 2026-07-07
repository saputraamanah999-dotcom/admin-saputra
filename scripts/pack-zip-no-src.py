#!/usr/bin/env python3
"""
Pack ZIP dengan struktur TANPA folder src/ — semua file app/, components/, 
lib/, hooks/, middleware.ts langsung di root project.

Kenapa? Karena Vercel build log menampilkan path tanpa src/ prefix, artinya
struktur di GitHub repo user pakai root layout (bukan src/ layout).

Script ini:
1. Walk semua file di /home/z/my-project/src/
2. Tulis ke ZIP dengan path relative ke root (tanpa src/)
3. Walk file di root project (package.json, next.config.ts, dll) — tulis apa adanya
4. Skip node_modules, .next, .git, .env (sudah include), screenshots, dll
"""

import os
import zipfile
from pathlib import Path

PROJECT_ROOT = Path("/home/z/my-project")
OUTPUT_ZIP = Path("/home/z/my-project/download/wedding-admin-cms.zip")

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

EXCLUDE_FILES = {
    "dev.log",
    "server.log",
    "dev.out.log",
    "custom.db",
    "custom.db-journal",
}

# Folder root project yang file-nya boleh di-zip langsung (tanpa modifikasi path)
ROOT_INCLUDE_FILES = {
    ".env", ".env.example", ".gitignore",
    "package.json", "tsconfig.json", "next.config.ts", "next-env.d.ts",
    "postcss.config.mjs", "tailwind.config.ts", "components.json",
    "eslint.config.mjs", "firebase.json", "firestore.rules", "firestore.indexes.json",
    "Caddyfile", "bun.lock",
    "README.md", "SETUP.md", "DEPLOY.md", "TUTORIAL_ENV.md", "PANDUAN-CEPAT.md",
}

ROOT_INCLUDE_DIRS = {"public", "supabase", "scripts"}


def should_skip_file(filename: str, file_path: Path) -> bool:
    if filename in EXCLUDE_FILES:
        return True
    if filename.endswith(".log"):
        return True
    if filename.endswith(".db") or filename.endswith(".db-journal"):
        return True
    if filename.endswith(".png") and "download" in str(file_path):
        return True
    return False


def create_zip():
    if OUTPUT_ZIP.exists():
        OUTPUT_ZIP.unlink()

    print(f"Membuat ZIP (struktur TANPA src/): {OUTPUT_ZIP}")
    print(f"Source: {PROJECT_ROOT}")
    print("-" * 60)

    file_count = 0
    total_size = 0

    with zipfile.ZipFile(OUTPUT_ZIP, "w", zipfile.ZIP_DEFLATED, compresslevel=9) as zf:
        # === Bagian 1: File dari src/ → root ZIP (TANPA src/ prefix) ===
        src_dir = PROJECT_ROOT / "src"
        if src_dir.exists():
            print("\n[1] File dari src/ → root ZIP:")
            for root, dirs, files in os.walk(src_dir):
                root_path = Path(root)
                for filename in files:
                    file_path = root_path / filename
                    if should_skip_file(filename, file_path):
                        continue

                    # Path relatif terhadap src/
                    rel_to_src = file_path.relative_to(src_dir)
                    # Path di ZIP: wedding-admin-cms/<rel_to_src>
                    arcname = f"wedding-admin-cms/{rel_to_src}"

                    try:
                        zf.write(file_path, arcname)
                        file_count += 1
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        print(f"  + {rel_to_src} ({file_size:,} bytes)")
                    except Exception as e:
                        print(f"  ! Skip {file_path}: {e}")

        # === Bagian 2: File root project (package.json, next.config.ts, dll) ===
        print("\n[2] File root project:")
        for root, dirs, files in os.walk(PROJECT_ROOT):
            root_path = Path(root)
            # Skip folder yang dikecualikan
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".z")]
            # Hanya proses root level (bukan subfolder selain ROOT_INCLUDE_DIRS)
            rel_root = root_path.relative_to(PROJECT_ROOT)
            if str(rel_root) == ".":
                # Root level files
                for filename in files:
                    if filename not in ROOT_INCLUDE_FILES:
                        continue
                    file_path = root_path / filename
                    if should_skip_file(filename, file_path):
                        continue
                    arcname = f"wedding-admin-cms/{filename}"
                    try:
                        zf.write(file_path, arcname)
                        file_count += 1
                        file_size = file_path.stat().st_size
                        total_size += file_size
                        print(f"  + {filename} ({file_size:,} bytes)")
                    except Exception as e:
                        print(f"  ! Skip {file_path}: {e}")
            elif rel_root.parts and rel_root.parts[0] in ROOT_INCLUDE_DIRS:
                # Subfolder yang diizinkan (public/, supabase/, scripts/)
                for filename in files:
                    file_path = root_path / filename
                    if should_skip_file(filename, file_path):
                        continue
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
    print(f"\n✅ ZIP berhasil dibuat (struktur TANPA src/)!")
    print(f"   Total file: {file_count}")
    print(f"   Total size: {total_size/1024:.1f} KB ({total_size/1024/1024:.2f} MB)")
    zip_size = OUTPUT_ZIP.stat().st_size
    print(f"   ZIP size:   {zip_size/1024:.1f} KB ({zip_size/1024/1024:.2f} MB)")
    print(f"   Lokasi: {OUTPUT_ZIP}")


if __name__ == "__main__":
    create_zip()
