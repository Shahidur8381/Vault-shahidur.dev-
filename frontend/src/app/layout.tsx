import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "Sanctum — Sovereign Cloud Vault & CDN",
  description: "High-performance personal cloud sanctuary for instant public CDN asset distribution and TOTP-guarded private partitions by Md. Shahidur Rahman.",
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    shortcut: '/favicon.svg',
    apple: '/favicon.svg',
  },
  themeColor: '#080C14',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
      </head>
      <body className="bg-[#070A10] text-slate-100 antialiased min-h-screen selection:bg-sky-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
