import type { Metadata } from "next";
import { Caveat, Golos_Text, Literata } from "next/font/google";
import "./globals.css";
import AppNav from "./components/AppNav";
import LandingFooter from "./components/LandingFooter";
import StreakTracker from "./components/StreakTracker";
import StreakAlert from "./components/StreakAlert";
import PwaInstall from "./components/PwaInstall";
import RecoveryRedirect from "./components/RecoveryRedirect";
import { LanguageProvider } from "./components/LanguageProvider";
import { Analytics } from "@vercel/analytics/next";
import { getLocale } from "@/lib/i18n/server";
import { SITE_URL } from "@/lib/seo";

// Шрифты дизайна «Тетрадь»: текст, заголовки и «рукописные» формулы.
// subsets — только то, что грузится заранее; казахские буквы (cyrillic-ext)
// подгружаются автоматически, когда встречаются на странице
const golos = Golos_Text({
  subsets: ["latin", "cyrillic"],
  variable: "--font-body",
  display: "swap",
});
const literata = Literata({
  subsets: ["latin", "cyrillic"],
  style: ["normal", "italic"],
  variable: "--font-display",
  display: "swap",
});
const caveat = Caveat({
  subsets: ["latin", "cyrillic"],
  variable: "--font-hand",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "Mirha_Edu — подготовка к ЕНТ по физике и математике онлайн бесплатно",
  description: "Бесплатная подготовка к ЕНТ по физике и математике: все темы по спецификации НЦТ, задачи с решением, формулы, пробный ЕНТ онлайн и прогноз балла. На русском и казахском.",
  keywords: [
    "ЕНТ", "подготовка к ЕНТ", "ЕНТ физика", "ЕНТ математика", "пробный ЕНТ онлайн", "задачи ЕНТ с решением",
    "формулы по физике ЕНТ", "ҰБТ", "ҰБТ физика", "ҰБТ математика", "физика онлайн Казахстан",
  ],
  authors: [{ name: "Mirha_Edu" }],
  creator: "Mirha_Edu",
  publisher: "Mirha_Edu",
  robots: { index: true, follow: true, googleBot: { index: true, follow: true } },
  openGraph: {
    title: "Mirha_Edu — подготовка к ЕНТ по физике и математике",
    description: "Задачи ЕНТ с решением, формулы, пробный ЕНТ онлайн и прогноз балла. Бесплатно, на русском и казахском.",
    url: "/",
    siteName: "Mirha_Edu",
    locale: "ru_RU",
    type: "website",
    images: ["/og.png"],
  },
  twitter: {
    card: "summary_large_image",
    title: "Mirha_Edu — подготовка к ЕНТ по физике и математике",
    description: "Задачи ЕНТ с решением, формулы, пробный ЕНТ онлайн. Бесплатно.",
    images: ["/og.png"],
  },
  // Коды подтверждения Google Search Console и Яндекс Вебмастера (не секретные —
  // они и так видны в коде страницы); переменные окружения Vercel их заменяют
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "SStvXcqEdVFdR5m4QOuTMUmQg9na2p9-zAopbgAKsgQ",
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || "77fbcff1a9d9c49e",
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Язык интерфейса — из cookie, которую ставит переключатель языка
  const locale = await getLocale();
  return (
    <html lang={locale}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#667eea" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Mirha_Edu" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/icon-192.png" type="image/png" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
      </head>
      <body className={`${golos.variable} ${literata.variable} ${caveat.variable}`}style={{ margin: 0, fontFamily: 'var(--font-body), sans-serif', background: '#0f0f1a' }}>
        <div aria-hidden style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', background: '#0f0f1a' }}>
          <div className="aurora-blob aurora-blob-1" />
          <div className="aurora-blob aurora-blob-2" />
          <div className="aurora-blob aurora-blob-3" />
        </div>
        <LanguageProvider initialLocale={locale}>
          <StreakTracker />
          <StreakAlert />
          <PwaInstall />
          <RecoveryRedirect />
          <AppNav />
          <div className="app-main">{children}</div>
          <LandingFooter />
        </LanguageProvider>
        {/* Посещаемость: смотреть во вкладке Analytics проекта на vercel.com */}
        <Analytics />
      </body>
    </html>
  );
}