"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  { href: "/dashboard", label: "Tableau" },
  { href: "/exercises", label: "Exos" },
  { href: "/programs", label: "Plans" },
  { href: "/workout", label: "Seance" },
  { href: "/history", label: "Histo" },
  { href: "/progress", label: "Progress" },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={`bottom-nav-item ${active ? "active" : ""}`}>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
