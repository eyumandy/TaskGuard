/**
 * File: page.tsx
 * Purpose: Root landing page layout. Composes the left HeroPanel with the
 *          right ASCII water animation, and mounts the floating "Add to Chrome"
 *          CTA fixed to the bottom-right corner of the viewport.
 * Key Components:
 *   - HeroPanel       : Branding, tagline, and secondary auth CTAs
 *   - AsciiWater      : Animated ASCII water background (desktop only)
 *   - ChromeFAB       : Fixed bottom-right primary extension CTA
 * Dependencies: next, react
 */

"use client";

import { useState, useEffect } from "react";
import AsciiWater from "@/components/ascii-water";
import { HeroPanel } from "@/components/hero-panel";

/**
 * ChromeFAB
 * Fixed-position floating action button anchored to the bottom-right corner.
 * Designed to feel premium and enticing while matching the dark cream theme:
 *   - Slow pulsing glow ring to draw the eye without being intrusive
 *   - Slide-up entrance delayed past the hero animation sequence
 *   - Micro-copy below the label for instant trust ("Free · No account needed")
 *   - Arrow nudges right on hover to signal interactivity
 *
 * @returns JSX.Element
 */
function ChromeFAB() {
  const [hovered, setHovered] = useState(false);
  const [mounted, setMounted] = useState(false);

  /* Delay entrance so it doesn't compete with hero animation */
  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 900);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      {/* Keyframe styles injected inline — no external CSS file needed */}
      <style>{`
        @keyframes fab-pulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(245, 240, 232, 0.12), 0 8px 32px rgba(0,0,0,0.7); }
          50%       { box-shadow: 0 0 0 8px rgba(245, 240, 232, 0.04), 0 8px 32px rgba(0,0,0,0.7); }
        }
        @keyframes fab-shine {
          from { transform: translateX(-120%) skewX(-15deg); }
          to   { transform: translateX(220%)  skewX(-15deg); }
        }
      `}</style>

      {/* Wrapper positions both the button and its micro-copy as a unit */}
      <div
        className="fixed bottom-7 right-7 z-50 flex flex-col items-end gap-2"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(20px)",
          transition: "opacity 0.6s ease-out, transform 0.6s ease-out",
        }}
      >
        {/* Micro-copy — appears above button on hover */}
        <span
          className="text-[10px] font-mono tracking-[0.18em] uppercase pr-1 transition-all duration-300"
          style={{
            color: "rgba(245, 240, 232, 0.28)",
            opacity: hovered ? 1 : 0,
            transform: hovered ? "translateY(0)" : "translateY(4px)",
          }}
        >
          Free · No account needed
        </span>

        {/* The button itself */}
        <button
          className="group relative flex items-center gap-3.5 overflow-hidden"
          style={{
            /* Shape & spacing */
            height: "52px",
            paddingLeft: "20px",
            paddingRight: "22px",
            borderRadius: "16px",

            /* Colors */
            backgroundColor: hovered ? "#ffffff" : "#f5f0e8",
            color: "#0a0a0a",

            /* Border — very subtle warm rim */
            outline: "1px solid rgba(245, 240, 232, 0.15)",
            outlineOffset: "-1px",

            /* Elevation + pulse glow when idle, stronger lift on hover */
            animation: hovered ? "none" : "fab-pulse 3s ease-in-out infinite",
            boxShadow: hovered
              ? "0 16px 48px rgba(245, 240, 232, 0.22), 0 4px 16px rgba(0,0,0,0.5)"
              : undefined,
            transform: hovered ? "translateY(-3px) scale(1.01)" : "translateY(0) scale(1)",
            transition: "background-color 0.25s, color 0.25s, transform 0.3s ease, box-shadow 0.3s ease",

            cursor: "pointer",
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          aria-label="Get the TaskGuard Chrome Extension — Free"
        >
          {/* Shine sweep — slides across on hover */}
          <span
            className="pointer-events-none absolute inset-0"
            style={{
              background: "linear-gradient(100deg, transparent 30%, rgba(255,255,255,0.5) 50%, transparent 70%)",
              animation: hovered ? "fab-shine 0.55s ease-out forwards" : "none",
            }}
          />

          {/* Chrome icon — full color */}
          <svg className="relative w-[18px] h-[18px] flex-shrink-0" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#4285F4" />
            <path d="M12 7a5 5 0 0 1 4.33 2.5l4.33-2.5A10 10 0 0 0 12 2a10 10 0 0 0-8.66 5l4.33 2.5A5 5 0 0 1 12 7z" fill="#EA4335" />
            <path d="M7.67 9.5L3.34 7A10 10 0 0 0 2 12c0 2.12.66 4.09 1.78 5.71l4.14-4.14A5 5 0 0 1 7.67 9.5z" fill="#FBBC05" />
            <path d="M12 17a5 5 0 0 1-4.08-2.12l-4.14 4.14A10 10 0 0 0 12 22a10 10 0 0 0 8.66-5l-4.33-2.5A5 5 0 0 1 12 17z" fill="#34A853" />
            <circle cx="12" cy="12" r="3" fill="white" />
          </svg>

          {/* Label */}
          <span
            className="relative flex flex-col items-start leading-none"
            style={{ gap: "3px" }}
          >
            <span className="text-[13px] font-semibold tracking-tight whitespace-nowrap">
              Get the Extension
            </span>
            <span
              className="text-[10px] font-normal tracking-wide"
              style={{ color: "rgba(10,10,10,0.45)" }}
            >
              Add to Chrome
            </span>
          </span>

          {/* Arrow — nudges right on hover */}
          <svg
            className="relative w-4 h-4 flex-shrink-0 ml-0.5 transition-transform duration-300"
            style={{ transform: hovered ? "translateX(3px)" : "translateX(0)" }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12h14M13 6l6 6-6 6" />
          </svg>
        </button>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left Panel — branding & auth CTAs */}
      <HeroPanel />

      {/* Right Panel — ASCII water effect (desktop only) */}
      <div className="hidden lg:block flex-1 relative">
        <AsciiWater />
        {/* Gradient to blend left edge into hero panel background */}
        <div
          className="absolute inset-y-0 left-0 w-32 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #0a0a0a 0%, transparent 100%)",
          }}
        />
      </div>

      {/* Fixed floating CTA — bottom-right corner */}
      <ChromeFAB />
    </div>
  );
}