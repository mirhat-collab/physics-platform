import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import StreakTracker from "./components/StreakTracker";
import StreakAlert from "./components/StreakAlert";
import PwaInstall from "./components/PwaInstall";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Mirha_Edu — Физика онлайн 7-11 класс Казахстан",
  description: "Бесплатная образовательная платформа по физике для учеников 7-11 классов Казахстана. Теория, формулы, задачи, XP система и рейтинг. Учи физику онлайн!",
  keywords: [
    "физика онлайн",
    "физика 7 класс",
    "физика 8 класс",
    "физика 9 класс",
    "физика 10 класс",
    "физика 11 класс",
    "физика Казахстан",
    "учить физику онлайн",
    "физика задачи",
    "физика теория",
    "физика формулы",
    "онлайн школа физика",
    "физика ЕНТ",
    "подготовка к ЕНТ физика",
    "физика ОГЭ",
    "законы Ньютона",
    "механическое движение",
    "электрический ток",
    "квантовая физика",
    "молекулярная физика",
    "термодинамика",
    "оптика физика",
    "physics platform",
    "физика платформа",
    "образование Казахстан",
  ],
  authors: [{ name: "Mirha_Edu" }],
  creator: "Mirha_Edu",
  publisher: "Mirha_Edu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Mirha_Edu — Физика онлайн 7-11 класс",
    description: "Учи физику онлайн! Теория, формулы, задачи для 7-11 классов Казахстана. Зарабатывай XP и соревнуйся с классом.",
    url: "https://physics-platform-liart.vercel.app",
    siteName: "Mirha_Edu",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirha_Edu — Физика онлайн 7-11 класс",
    description: "Учи физику онлайн! Теория, формулы, задачи для 7-11 классов Казахстана.",
  },
  alternates: {
    canonical: "https://physics-platform-liart.vercel.app",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#667eea" />
        <meta name="google-site-verification" content="" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mirha_Edu" />
        <link rel="canonical" href="https://physics-platform-liart.vercel.app" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={manrope.variable} style={{ margin: 0, fontFamily: 'var(--font-body), sans-serif', background: '#0f0f1a', paddingBottom: 64 }}>
        <StreakTracker />
        <StreakAlert />
        <PwaInstall />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}