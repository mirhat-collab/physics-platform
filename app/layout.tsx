import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";
import StreakTracker from "./components/StreakTracker";

export const metadata: Metadata = {
  title: "Physics Platform — Физика онлайн 7-11 класс Казахстан",
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
  authors: [{ name: "Physics Platform" }],
  creator: "Physics Platform",
  publisher: "Physics Platform",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    title: "Physics Platform — Физика онлайн 7-11 класс",
    description: "Учи физику онлайн! Теория, формулы, задачи для 7-11 классов Казахстана. Зарабатывай XP и соревнуйся с классом.",
    url: "https://physics-platform-liart.vercel.app",
    siteName: "Physics Platform",
    locale: "ru_RU",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Physics Platform — Физика онлайн 7-11 класс",
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
        <meta name="theme-color" content="#0f0f1a" />
        <meta name="google-site-verification" content="" />
        <link rel="canonical" href="https://physics-platform-liart.vercel.app" />
      </head>
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f0f1a', paddingBottom: 64 }}>
        <StreakTracker />
        {children}
        <BottomNav />
      </body>
    </html>
  );
}