"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface AppHeaderProps {
  currentPage: "session" | "history" | "settings";
  userInitials: string;
}

export function AppHeader({ currentPage, userInitials }: AppHeaderProps) {
  const router = useRouter();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = () => {
    localStorage.removeItem("taskguard_auth");
    router.push("/login");
  };

  const navItems = [
    { id: "session", label: "Session", href: "/session" },
    { id: "history", label: "History", href: "/history" },
    { id: "settings", label: "Settings", href: "/settings" },
  ];

  return (
    <header 
      className="flex items-center justify-between py-4 px-4 sm:px-0 mb-6 sm:mb-8"
    >
      {/* Logo */}
      <Link href="/" className="flex items-center">
        <Image
          src="/images/logo.png"
          alt="TaskGuard"
          width={100}
          height={28}
          className="h-5 sm:h-6 w-auto"
          style={{ filter: "brightness(0) invert(1)", opacity: 0.85 }}
        />
      </Link>

      {/* Right Side - Nav + Avatar */}
      <div className="flex items-center gap-1">
        {/* Navigation Pills */}
        <nav 
          className="hidden sm:flex items-center gap-0.5 p-1 rounded-full mr-3"
          style={{ backgroundColor: "rgba(245, 240, 232, 0.04)" }}
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="px-4 py-1.5 text-[12px] font-medium rounded-full transition-all duration-200"
              style={{
                backgroundColor: currentPage === item.id ? "rgba(245, 240, 232, 0.1)" : "transparent",
                color: currentPage === item.id ? "#f5f0e8" : "rgba(245, 240, 232, 0.45)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Mobile Nav */}
        <nav 
          className="flex sm:hidden items-center gap-2 mr-2"
        >
          {navItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              className="text-[11px] font-medium transition-all duration-200"
              style={{
                color: currentPage === item.id ? "#f5f0e8" : "rgba(245, 240, 232, 0.4)",
              }}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {/* Separator */}
        <div 
          className="hidden sm:block w-px h-5 mx-2" 
          style={{ backgroundColor: "rgba(245, 240, 232, 0.1)" }} 
        />

        {/* User Avatar */}
        <div className="relative">
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-semibold transition-all duration-200 hover:scale-105"
            style={{ 
              background: "linear-gradient(135deg, rgba(245, 240, 232, 0.15) 0%, rgba(245, 240, 232, 0.05) 100%)",
              color: "rgba(245, 240, 232, 0.8)",
              boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05), 0 1px 2px rgba(0,0,0,0.2)"
            }}
          >
            {userInitials}
          </button>

          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
              <div
                className="absolute right-0 top-full mt-2 w-44 py-1.5 rounded-xl z-50 overflow-hidden"
                style={{
                  backgroundColor: "rgba(18, 18, 18, 0.98)",
                  border: "1px solid rgba(245, 240, 232, 0.08)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.4)"
                }}
              >
                <div 
                  className="px-3 py-2 mb-1 border-b"
                  style={{ borderColor: "rgba(245, 240, 232, 0.06)" }}
                >
                  <span className="text-[10px] font-mono uppercase tracking-wider" style={{ color: "rgba(245, 240, 232, 0.35)" }}>
                    Signed in as
                  </span>
                </div>
                <Link
                  href="/profile"
                  className="flex items-center gap-2 px-3 py-2 text-[13px] transition-all duration-150 hover:bg-white/5"
                  style={{ color: "rgba(245, 240, 232, 0.7)" }}
                >
                  <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
                  </svg>
                  Profile
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[13px] transition-all duration-150 hover:bg-white/5 text-left"
                  style={{ color: "rgba(245, 240, 232, 0.7)" }}
                >
                  <svg className="w-4 h-4 opacity-50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                    <polyline points="16 17 21 12 16 7" />
                    <line x1="21" y1="12" x2="9" y2="12" />
                  </svg>
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
