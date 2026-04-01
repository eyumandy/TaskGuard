"use client";

export function StatusBar() {
  return (
    <footer className="w-full px-6 py-5">
      <div 
        className="glass-subtle rounded-full mx-auto max-w-2xl px-6 py-2.5 flex items-center justify-between"
      >
        {/* Status Indicators */}
        <div 
          className="flex items-center gap-6 text-[12px] font-mono"
          style={{ color: "rgba(245, 240, 232, 0.4)" }}
        >
          <span>12 sessions</span>
          <span 
            className="w-px h-3" 
            style={{ backgroundColor: "rgba(245, 240, 232, 0.15)" }}
          />
          <span>84% focus</span>
          <span 
            className="w-px h-3" 
            style={{ backgroundColor: "rgba(245, 240, 232, 0.15)" }}
          />
          <span className="flex items-center gap-2">
            <span 
              className="w-1.5 h-1.5 rounded-full animate-pulse-status"
              style={{ backgroundColor: "#4ade80" }}
            />
            active
          </span>
        </div>
        
        {/* Version */}
        <span 
          className="text-[11px] font-mono"
          style={{ color: "rgba(245, 240, 232, 0.25)" }}
        >
          v0.1.0
        </span>
      </div>
    </footer>
  );
}
