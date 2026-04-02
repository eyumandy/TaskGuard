"use client";

/**
 * File: hero-panel.tsx
 * Purpose: Left panel of the landing page containing branding, tagline,
 *          and secondary CTAs (Create Account / Sign In).
 *          The primary "Add to Chrome" CTA lives in the fixed bottom-right
 *          floating button defined in page.tsx.
 * Author: TaskGuard Team
 * Dependencies: react, next/link
 */

import { useState, useEffect } from "react";
import Link from "next/link";

export function HeroPanel() {
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
        className={`pt-5 relative z-10 flex items-center justify-between transition-all duration-700 ease-out ${
          mounted ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
        }`}
      >
        <img 
          src="/images/logo.png" 
          alt="TaskGuard" 
          className="h-10 lg:h-10 w-auto"
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
          
          {/* Chrome-only note */}
          <div
            className="flex items-center gap-2 pt-1"
            style={{ color: "rgba(245, 240, 232, 0.2)" }}
          >
            <svg className="w-3.5 h-3.5 flex-shrink-0" viewBox="0 0 24 24" fill="none">
              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <span className="text-[11px] font-mono tracking-wide">Chrome extension only</span>
          </div>
        </div>
      </main>
    </div>
  );
}