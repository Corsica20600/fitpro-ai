"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const nav = [
  {
    href: "/dashboard",
    label: "Tableau",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M4 13h7v7H4zm0-9h7v7H4zm9 0h7v11h-7zm0 13h7v3h-7z" />
      </svg>
    ),
  },
  {
    href: "/exercises",
    label: "Exos",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M6.6 10a2.6 2.6 0 1 1 0 4.9L4 17.5a2 2 0 0 1-2.8-2.8l2.6-2.6A2.6 2.6 0 0 1 6.6 10m10.8 0a2.6 2.6 0 0 1 2.8 2.1l2.6 2.6a2 2 0 1 1-2.8 2.8l-2.6-2.6a2.6 2.6 0 1 1 0-4.9M9 11h6v2H9z" />
      </svg>
    ),
  },
  {
    href: "/programs",
    label: "Plans",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2m1 4h12V6H6zm0 4h8v-2H6zm0 4h12v-2H6z" />
      </svg>
    ),
  },
  {
    href: "/workout",
    label: "Seance",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2a1 1 0 0 1 1 1v6.4l5.6 5.6a1 1 0 1 1-1.4 1.4L12 11.2V3a1 1 0 0 1 1-1m0 20a9 9 0 1 1 0-18 9 9 0 0 1 0 18m0-2a7 7 0 1 0 0-14 7 7 0 0 0 0 14" />
      </svg>
    ),
  },
  {
    href: "/history",
    label: "Histo",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 3a9 9 0 1 1-7.8 4.5H1V5h6v6H5V8.8A7 7 0 1 0 12 5a1 1 0 1 1 0-2m-1 5h2v5h4v2h-6z" />
      </svg>
    ),
  },
  {
    href: "/progress",
    label: "Progres",
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 19h18v2H3zm2-3 4-5 3 3 5-7 2 1.4-6.3 8.8-2.9-2.9L6.6 18z" />
      </svg>
    ),
  },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} prefetch={false} className={`bottom-nav-item ${active ? "active" : ""}`}>
            <span className="bottom-nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
