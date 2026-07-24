"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavIcon, type NavIconName } from "@/src/components/ui/nav-icon";

const nav: Array<{ href: string; label: string; icon: NavIconName }> = [
  {
    href: "/dashboard",
    label: "Tableau",
    icon: "dashboard",
  },
  {
    href: "/exercises",
    label: "Exos",
    icon: "exercises",
  },
  {
    href: "/programs",
    label: "Plans",
    icon: "programs",
  },
  {
    href: "/workout",
    label: "Séance",
    icon: "workout",
  },
  {
    href: "/history",
    label: "Histo",
    icon: "history",
  },
  {
    href: "/progress",
    label: "Progrès",
    icon: "progress",
  },
];

export function BottomNav() {
  const pathname = usePathname();
  if (pathname === "/watch") return null;

  return (
    <nav className="bottom-nav fit-bottom-nav-v2" aria-label="Navigation principale">
      {nav.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            prefetch={false}
            aria-current={active ? "page" : undefined}
            className={`bottom-nav-item ${active ? "active" : ""}`}
          >
            <span className="bottom-nav-icon">
              <NavIcon name={item.icon} />
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
