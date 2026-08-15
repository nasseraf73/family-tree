import type { Metadata } from 'next';
import '@xyflow/react/dist/style.css';
import './globals.css';

export const metadata: Metadata = {
  title: 'شجرة عائلة أبو فاره | المنظومة الرقمية لتوثيق الأنساب',
  description: 'منصة ويب تفاعلية موحدة لتوثيق أنساب وسلالة عائلة أبو فاره باستعمال الكانفاس اللانهائي ومحرك الذكاء لمنع التكرار.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ar" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="antialiased bg-slate-950 text-slate-100 font-sans">
        {children}
      </body>
    </html>
  );
}
