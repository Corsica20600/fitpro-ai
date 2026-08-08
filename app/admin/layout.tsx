import Image from "next/image";
import Link from "next/link";

export default function AdminLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="admin-web-layout">
      <header className="admin-web-header">
        <Link href="/dashboard" className="admin-web-brand" aria-label="Retourner au tableau de bord Traknio">
          <Image
            src="/brand/traknio-site-lockup-v2.png"
            alt="Traknio - Train smarter. Progress further."
            width={1614}
            height={311}
            priority
          />
        </Link>
        <div className="admin-web-header__actions">
          <span>Administration privée</span>
          <Link href="/" className="ghost-btn">Retour à Traknio</Link>
        </div>
      </header>
      <main className="admin-web-main">{children}</main>
    </div>
  );
}
