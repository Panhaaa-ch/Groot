"use client";

import { useState } from "react";
import { Bell, Settings, Menu, CheckCircle2 } from "lucide-react";
import { appLogo, userProfile, notifications } from "@/lib/mockData";

export default function Header({ onOpenMobileMenu, onOpenSettings }) {
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="w-full flex justify-between items-center px-4 sm:px-8 h-20 sticky top-0 bg-surface/85 backdrop-blur-md z-30 border-b border-surface-dim/40">
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="md:hidden flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center bg-white border border-outline-variant/40">
            <img
              src={appLogo}
              alt="Groot Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <h1 className="font-display text-xl text-primary font-bold">
            Groot
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3 text-on-surface-variant relative">
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="Notifications"
            className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors squish-press relative cursor-pointer"
          >
            <Bell className="w-5 h-5 text-on-surface-variant" />
            {notifications.length > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-secondary" />
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl p-4 shadow-xl border border-surface-dim/70 z-50">
              <div className="flex items-center justify-between pb-2 border-b border-surface-dim/50 mb-3">
                <span className="font-display font-bold text-base text-on-surface">
                  Greenhouse Alerts
                </span>
                <span className="font-body-sm text-xs text-primary font-semibold bg-primary-container/15 px-2 py-0.5 rounded-full">
                  {notifications.length} updates
                </span>
              </div>
              <div className="space-y-2.5 max-h-72 overflow-y-auto">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-xl transition-colors ${
                      n.icon === "warning"
                        ? "bg-secondary-container/10 border border-secondary-container/30"
                        : "bg-surface-container-low"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1">
                      <p className="font-body-sm font-semibold text-xs text-on-surface">
                        {n.title}
                      </p>
                      <span className="font-body-sm text-[10px] text-outline whitespace-nowrap">
                        {n.time}
                      </span>
                    </div>
                    <p className="font-body-sm text-xs text-on-surface-variant mt-1">
                      {n.description}
                    </p>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="w-full mt-3 py-2 text-center text-xs font-semibold text-primary hover:bg-surface-container-high rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Dismiss All
              </button>
            </div>
          )}
        </div>

        <button
          onClick={onOpenSettings}
          aria-label="Settings"
          className="p-2.5 rounded-full hover:bg-surface-container-high transition-colors squish-press cursor-pointer"
        >
          <Settings className="w-5 h-5 text-on-surface-variant" />
        </button>

        <div
          className="w-10 h-10 rounded-full bg-surface-variant overflow-hidden border-2 border-white shadow-xs flex-shrink-0 ml-1 cursor-pointer hover:ring-2 hover:ring-primary-container/50 transition-all"
          title="Venis"
        >
          <img
            src={userProfile.avatarUrl}
            alt="User Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
