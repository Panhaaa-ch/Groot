"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/", label: "Dashboard", icon: "dashboard" },
  { href: "/chat", label: "Chat", icon: "chat_bubble" },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="md:hidden fixed bottom-0 w-full h-16 bg-surface border-t border-surface-container flex justify-around items-center px-4 pb-safe z-40">
      {navItems.map(({ href, label, icon }) => {
        const active = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            className={`flex flex-col items-center gap-1 ${
              active ? "text-primary" : "text-on-surface-variant"
            }`}
          >
            <span
              className="material-symbols-outlined"
              style={
                active
                  ? { fontVariationSettings: '"FILL" 1' }
                  : undefined
              }
            >
              {icon}
            </span>
            <span className="text-[10px] font-medium">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
