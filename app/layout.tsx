import type { Metadata } from "next";
import "./globals.css";
import BottomNav from "./components/BottomNav";

export const metadata: Metadata = {
  title: "Physics Platform",
  description: "Образовательная платформа по физике",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#0f0f1a', paddingBottom: 64 }}>
        {children}
        <BottomNav />
      </body>
    </html>
  );
}