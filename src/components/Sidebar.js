"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MessageCircle, User, Plus } from "lucide-react";
import { appLogo } from "@/lib/mockData";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/chat", label: "Chat", icon: MessageCircle },
  { href: "/profile", label: "Profile & Stats", icon: User },
];

export default function Sidebar({ isOpenMobile, onCloseMobile, onOpenAddPlant }) {
  const pathname = usePathname();

  return (
    <>
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 bg-black/30 z-40 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-surface-container-low border-r border-surface-dim/70 flex flex-col justify-between py-6 px-4 z-50 transition-transform duration-300 ${
          isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div>
          <Link
            href="/"
            onClick={onCloseMobile}
            className="flex items-center gap-3 mb-8 group px-2"
          >
            <div className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center bg-white border border-outline-variant/40 shadow-xs group-hover:scale-105 transition-transform">
              <img
                src={appLogo}
                alt="Groot Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="font-display text-2xl text-primary tracking-tight leading-none font-bold">
                Groot
              </h1>
              <p className="font-body-sm text-xs text-on-surface-variant mt-0.5 font-medium">
                Your Digital Greenhouse
              </p>
            </div>
          </Link>

          <nav className="space-y-1.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onCloseMobile}
                  className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl font-body-md text-[15px] font-medium transition-all squish-press text-left ${
                    active
                      ? "bg-surface-container-high text-primary font-semibold border-r-4 border-primary shadow-xs"
                      : "text-on-surface-variant hover:bg-surface-container-high/70 hover:text-on-surface"
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 ${
                      active ? "text-primary" : "text-on-surface-variant"
                    }`}
                  />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-surface-dim/50">
          <button
            onClick={() => {
              onOpenAddPlant?.();
              onCloseMobile?.();
            }}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-primary hover:bg-[#495524] text-on-primary font-body-md font-semibold text-[14px] rounded-full shadow-sm hover:shadow-md transition-all squish-press cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add New Plant</span>
          </button>
        </div>
      </aside>
    </>
  );
}
