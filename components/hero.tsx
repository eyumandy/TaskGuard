"use client";

import { useState } from "react";

export function Hero() {
  const [primaryHovered, setPrimaryHovered] = useState(false);
  const [secondaryHovered, setSecondaryHovered] = useState(false);

  return (
    <main className="flex-1 flex flex-col items-center justify-center px-4">
      {/* Floating glass card */}
      <div 
        className="glass rounded-2xl px-12 py-14 flex flex-col items-center animate-float"
        style={{
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(245, 240, 232, 0.03) inset"
        }}
      >
        {/* Hero Title - Using Inter (sans) for premium feel */}
        <h1 
          className="text-[56px] md:text-[72px] font-light tracking-tight font-sans"
          style={{ 
            color: "#f5f0e8",
            textShadow: "0 0 60px rgba(245, 240, 232, 0.15)"
          }}
        >
          TaskGuard
        </h1>
        
        {/* Tagline - Monospace for technical feel */}
        <p 
          className="mt-4 text-[13px] tracking-[0.12em] uppercase font-mono"
          style={{ color: "rgba(245, 240, 232, 0.45)" }}
        >
          Behavioral Focus Engine
        </p>
        
        {/* CTA Buttons */}
        <div className="flex items-center gap-3 mt-10 pointer-events-auto">
          {/* Primary Button */}
          <button
            className="px-8 py-3 text-[14px] font-medium tracking-wide rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: primaryHovered ? "transparent" : "#f5f0e8",
              color: primaryHovered ? "#f5f0e8" : "#070707",
              border: "1px solid #f5f0e8",
              boxShadow: primaryHovered ? "none" : "0 4px 20px rgba(245, 240, 232, 0.15)"
            }}
            onMouseEnter={() => setPrimaryHovered(true)}
            onMouseLeave={() => setPrimaryHovered(false)}
          >
            Start Session
          </button>
          
          {/* Secondary Button */}
          <button
            className="px-8 py-3 text-[14px] font-medium tracking-wide rounded-full transition-all duration-300"
            style={{ 
              backgroundColor: secondaryHovered ? "rgba(245, 240, 232, 0.1)" : "transparent",
              color: "rgba(245, 240, 232, 0.7)",
              border: "1px solid rgba(245, 240, 232, 0.15)"
            }}
            onMouseEnter={() => setSecondaryHovered(true)}
            onMouseLeave={() => setSecondaryHovered(false)}
          >
            Download
          </button>
        </div>
      </div>
    </main>
  );
}
