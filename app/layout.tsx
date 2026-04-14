import type { Metadata } from "next";
import "./globals.css";

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
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f5f7fa' }}>
        <nav style={{
          background: '#1a1a2e',
          padding: '0 2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '2rem',
          height: '60px'
        }}>
          <a href="/" style={{ color: '#e94560', fontWeight: 'bold', fontSize: '1.2rem', textDecoration: 'none' }}>
            ⚡ Physics
          </a>
          <a href="/classes" style={{ color: 'white', textDecoration: 'none' }}>Классы</a>
          <a href="/topics" style={{ color: 'white', textDecoration: 'none' }}>Темы</a>
          <a href="/progress" style={{ color: 'white', textDecoration: 'none' }}>Прогресс</a>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '1rem' }}>
            <a href="/login" style={{ color: 'white', textDecoration: 'none' }}>Войти</a>
            <a href="/admin" style={{
              background: '#e94560',
              color: 'white',
              padding: '6px 16px',
              borderRadius: '6px',
              textDecoration: 'none'
            }}>Админ</a>
          </div>
        </nav>
        {children}
      </body>
    </html>
  );
}