import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

const inter = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Admin Panel — Wedding Invitation CMS",
  description:
    "Master Control CMS untuk mengelola 2 website undangan pernikahan secara realtime. Dibuat untuk mempelai & admin.",
  keywords: [
    "admin",
    "CMS",
    "wedding",
    "undangan",
    "Firebase",
    "Supabase",
    "Saputra Developer",
  ],
  authors: [{ name: "Saputra Developer" }],
  icons: {
    icon: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning className="dark">
      <body
        className={`${inter.variable} ${cormorant.variable} antialiased bg-background text-foreground min-h-screen`}
      >
        {children}
        <Toaster />
        <SonnerToaster
          position="top-right"
          theme="dark"
          toastOptions={{
            style: {
              background: "#1E1E27",
              border: "1px solid #2A2A33",
              color: "#F4F1EA",
            },
          }}
        />
      </body>
    </html>
  );
}
