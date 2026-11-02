// Каждая страница плавно проявляется при переходе (только прозрачность:
// сдвиг сломал бы фиксированный 3D-фон главной)
export default function Template({ children }: { children: React.ReactNode }) {
  return <div className="page-enter">{children}</div>
}
