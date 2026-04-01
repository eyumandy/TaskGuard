import AsciiWater from "@/components/ascii-water";
import { HeroPanel } from "@/components/hero-panel";

export default function Page() {
  return (
    <div className="flex w-full h-screen overflow-hidden">
      {/* Left Panel - Content */}
      <HeroPanel />
      
      {/* Right Panel - ASCII Water Effect */}
      <div className="hidden lg:block flex-1 relative">
        <AsciiWater />
        {/* Subtle gradient fade on left edge for blending */}
        <div 
          className="absolute inset-y-0 left-0 w-32 pointer-events-none"
          style={{
            background: "linear-gradient(to right, #0a0a0a 0%, transparent 100%)"
          }}
        />
      </div>
    </div>
  );
}
