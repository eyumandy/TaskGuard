"use client";

export function NavBar() {
  return (
    <nav className="w-full px-6 py-5 pointer-events-auto">
      <div 
        className="glass-subtle rounded-full mx-auto max-w-3xl px-6 py-3 flex items-center justify-between"
      >
        {/* Logo */}
        <span 
          className="text-[15px] font-medium tracking-tight"
          style={{ color: "rgba(245, 240, 232, 0.9)" }}
        >
          TaskGuard
        </span>
        
        {/* Nav Links */}
        <div 
          className="flex items-center gap-8 text-[13px]"
          style={{ color: "rgba(245, 240, 232, 0.5)" }}
        >
          <a 
            href="#features" 
            className="hover:text-cream transition-colors duration-200"
          >
            Features
          </a>
          <a 
            href="#docs" 
            className="hover:text-cream transition-colors duration-200"
          >
            Docs
          </a>
          <a 
            href="#about" 
            className="hover:text-cream transition-colors duration-200"
          >
            About
          </a>
        </div>
      </div>
    </nav>
  );
}
