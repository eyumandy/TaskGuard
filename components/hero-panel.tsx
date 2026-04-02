"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export function HeroPanel() {
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [createHovered, setCreateHovered] = useState(false);
  const [signInHovered, setSignInHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div 
      className="relative w-full lg:w-[520px] h-full flex flex-col px-8 sm:px-10 lg:px-14 py-8 overflow-hidden"
      style={{ backgroundColor: "#0a0a0a" }}
    >
      {/* Ambient gradient animation */}
      <div 
        className="absolute inset-0 pointer-events-none animate-ambient"
        style={{
          background: "linear-gradient(180deg, rgba(245, 240, 232, 0.02) 0%, transparent 50%, rgba(245, 240, 232, 0.01) 100%)",
        }}
      />

      {/* Nav */}
      <nav 
        className={` relative z-10 flex items-center justify-between transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <img 
          src="/images/logo.png" 
          alt="TaskGuard" 
          className="h-6 lg:h-10 w-auto"
          style={{ 
            filter: "brightness(0) invert(1)",
            opacity: 0.9
          }}
        />
        

      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-1 flex flex-col justify-center">
        {/* Overline */}
        <span 
          className={`text-[10px] font-mono tracking-[0.3em] uppercase mb-8 transition-all duration-700 ease-out delay-100 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ color: "rgba(245, 240, 232, 0.3)" }}
        >
          Behavioral Focus Engine
        </span>

        {/* Title */}
        <h1 
          className={`font-sans tracking-tight leading-[1.05] transition-all duration-700 ease-out delay-200 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
        >
          <span 
            className="block text-[48px] sm:text-[64px] lg:text-[76px] font-light"
            style={{ color: "#f5f0e8" }}
          >
            Stay focused.
          </span>
          <span 
            className="block text-[24px] sm:text-[28px] lg:text-[32px] font-light mt-2"
            style={{ color: "rgba(245, 240, 232, 0.4)" }}
          >
            Build better habits.
          </span>
        </h1>

        {/* Divider */}
        <div 
          className={`w-12 h-px mt-8 mb-6 transition-all duration-700 ease-out delay-300 ${
            mounted ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0'
          }`}
          style={{ backgroundColor: "rgba(245, 240, 232, 0.15)", transformOrigin: "left" }}
        />
        
        {/* Description */}
        <p 
          className={`text-[15px] leading-[1.7] max-w-[340px] transition-all duration-700 ease-out delay-400 ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ color: "rgba(245, 240, 232, 0.45)" }}
        >
          TaskGuard monitors your browsing patterns and gently redirects 
          you when you drift. No willpower required.
        </p>
        
        {/* CTA Section */}
        <div 
          className={`flex flex-col gap-5 mt-10 transition-all duration-700 ease-out ${
            mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
          }`}
          style={{ transitionDelay: '500ms' }}
        >
          {/* Primary: Chrome CTA - Premium design */}
          <button
            className="group relative flex items-center justify-center gap-3 h-14 px-8 text-[15px] font-medium rounded-2xl transition-all duration-300 overflow-hidden"
            style={{ 
              backgroundColor: primaryHovered ? "#ffffff" : "#f5f0e8",
              color: "#0a0a0a",
              boxShadow: primaryHovered 
                ? "0 8px 32px rgba(245, 240, 232, 0.25), 0 0 0 1px rgba(245, 240, 232, 0.1)" 
                : "0 4px 16px rgba(245, 240, 232, 0.1)",
              transform: primaryHovered ? "translateY(-2px)" : "translateY(0)",
            }}
            onMouseEnter={() => setPrimaryHovered(true)}
            onMouseLeave={() => setPrimaryHovered(false)}
          >
            {/* Chrome icon - colored */}
            <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" fill="#4285F4"/>
              <path d="M12 7a5 5 0 0 1 4.33 2.5l4.33-2.5A10 10 0 0 0 12 2a10 10 0 0 0-8.66 5l4.33 2.5A5 5 0 0 1 12 7z" fill="#EA4335"/>
              <path d="M7.67 9.5L3.34 7A10 10 0 0 0 2 12c0 2.12.66 4.09 1.78 5.71l4.14-4.14A5 5 0 0 1 7.67 9.5z" fill="#FBBC05"/>
              <path d="M12 17a5 5 0 0 1-4.08-2.12l-4.14 4.14A10 10 0 0 0 12 22a10 10 0 0 0 8.66-5l-4.33-2.5A5 5 0 0 1 12 17z" fill="#34A853"/>
              <circle cx="12" cy="12" r="3" fill="white"/>
            </svg>
            <span className="flex items-center gap-2">
              Add to Chrome
              <span 
                className="text-[12px] px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "rgba(0, 0, 0, 0.08)" }}
              >
                Free
              </span>
            </span>
            {/* Shine effect on hover */}
            <div 
              className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{
                background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%)",
                transform: "translateX(-100%)",
                animation: primaryHovered ? "shine 0.6s ease-out forwards" : "none",
              }}
            />
          </button>

          {/* Secondary Row: Sign Up & Log In */}
          <div className="flex items-center gap-3">
            <Link
              href="/signup"
              className="group flex-1 relative flex items-center justify-center gap-2 h-12 px-6 text-[14px] font-medium rounded-xl transition-all duration-300 overflow-hidden"
              style={{ 
                backgroundColor: createHovered ? "rgba(245, 240, 232, 0.12)" : "rgba(245, 240, 232, 0.06)",
                color: createHovered ? "#f5f0e8" : "rgba(245, 240, 232, 0.8)",
                border: createHovered ? "1px solid rgba(245, 240, 232, 0.2)" : "1px solid rgba(245, 240, 232, 0.08)",
                transform: createHovered ? "translateY(-1px)" : "translateY(0)",
                boxShadow: createHovered ? "0 4px 12px rgba(0, 0, 0, 0.3)" : "none",
              }}
              onMouseEnter={() => setCreateHovered(true)}
              onMouseLeave={() => setCreateHovered(false)}
            >
              <svg 
                className="w-4 h-4 transition-transform duration-300" 
                style={{ transform: createHovered ? "scale(1.1)" : "scale(1)" }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <line x1="19" y1="8" x2="19" y2="14" />
                <line x1="16" y1="11" x2="22" y2="11" />
              </svg>
              Create Account
            </Link>
            <Link
              href="/login"
              className="flex-1 relative flex items-center justify-center gap-2 h-12 px-6 text-[14px] font-medium rounded-xl transition-all duration-300"
              style={{ 
                color: signInHovered ? "rgba(245, 240, 232, 0.9)" : "rgba(245, 240, 232, 0.45)",
                backgroundColor: signInHovered ? "rgba(245, 240, 232, 0.04)" : "transparent",
              }}
              onMouseEnter={() => setSignInHovered(true)}
              onMouseLeave={() => setSignInHovered(false)}
            >
              <svg 
                className="w-4 h-4 transition-all duration-300" 
                style={{ 
                  transform: signInHovered ? "translateX(2px)" : "translateX(0)",
                  opacity: signInHovered ? 1 : 0.7 
                }}
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="1.5"
              >
                <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
              </svg>
              Sign In
            </Link>
          </div>
          
          {/* Chrome-only note — project scope is Chrome extension */}
          <div 
            className="flex items-center gap-3 pt-2"
            style={{ color: "rgba(245, 240, 232, 0.2)" }}
          >
            <span className="text-[11px] font-mono">Chrome only · HCI Course Demo</span>
          </div>
        </div>
      </main>
    </div>
  );
}