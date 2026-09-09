import React from "react";
import { cn } from "@/lib/utils";

interface ScriptMindLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

export const ScriptMindLogo: React.FC<ScriptMindLogoProps> = ({
  className,
  size = 28,
  showText = false,
}) => {
  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {/* Stylish SM Monogram Icon (Theme Responsive Vector) */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 p-1.5 shadow-sm shadow-primary/10"
        style={{ width: typeof size === "number" ? `${size + 10}px` : size, height: typeof size === "number" ? `${size + 10}px` : size }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            <linearGradient id="sm-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.8" />
            </linearGradient>
            <filter id="sm-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="hsl(var(--primary))" floodOpacity="0.3" />
            </filter>
          </defs>

          <g filter="url(#sm-glow)">
            {/* S Letterform */}
            <path
              d="M20 14H12C9.23858 14 7 16.2386 7 19C7 21.7614 9.23858 24 12 24H16C18.7614 24 21 26.2386 21 29C21 31.7614 18.7614 34 16 34H7"
              stroke="url(#sm-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* M Letterform */}
            <path
              d="M26 34V15L34 25L42 15V34"
              stroke="url(#sm-gradient)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* AI Sparkle Dot */}
            <circle cx="39" cy="9.5" r="2" fill="hsl(var(--primary))" />
          </g>
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight text-foreground leading-none flex items-center">
            Script<span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent font-black ml-0.5">Mind</span>
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            AI STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
