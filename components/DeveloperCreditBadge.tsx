// components/DeveloperCreditBadge.tsx
// Badge kredit developer yang dipakai di website tamu.
// Tampil di pojok kanan bawah, dengan animasi gradient pelangi opsiional.
// Konfigurasi (message, link, enabled, animate) diatur dari /settings admin panel.

'use client';

interface Props {
  enabled: boolean;
  message: string;
  contactLink: string;
  animate: boolean;
}

export function DeveloperCreditBadge({ enabled, message, contactLink, animate }: Props) {
  if (!enabled) return null;
  return (
    <a
      href={contactLink}
      target="_blank"
      rel="noreferrer"
      className={`fixed bottom-4 right-4 z-40 rounded-full px-4 py-2 text-xs font-semibold text-white shadow-lg bg-[length:200%_200%] ${
        animate ? "animate-[gradientMove_3s_ease_infinite]" : ""
      } bg-gradient-to-r from-pink-500 via-yellow-400 via-green-400 via-blue-400 to-purple-500`}
    >
      {message}
    </a>
  );
}
