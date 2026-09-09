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
      {/* 3D Realistic Ribbon S Icon (Theme Responsive Vector) */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-secondary/50 border border-border/60 p-1.5 shadow-sm"
        style={{ width: typeof size === "number" ? `${size + 10}px` : size, height: typeof size === "number" ? `${size + 10}px` : size }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full"
        >
          <defs>
            {/* Top Loop Gradient (Bright highlight to base) */}
            <linearGradient id="sm-ribbon-top" x1="100%" y1="0%" x2="0%" y2="80%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="1" />
              <stop offset="60%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.75" />
            </linearGradient>

            {/* Middle Fold Crease (Deep dimensional shadow) */}
            <linearGradient id="sm-ribbon-crease" x1="20%" y1="20%" x2="80%" y2="90%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.35" />
              <stop offset="45%" stopColor="hsl(var(--primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
            </linearGradient>

            {/* Bottom Loop Gradient (Rich base with lighting) */}
            <linearGradient id="sm-ribbon-bottom" x1="0%" y1="30%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity="0.7" />
              <stop offset="50%" stopColor="hsl(var(--primary))" stopOpacity="0.9" />
              <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity="1" />
            </linearGradient>

            {/* Soft Ambient Glow */}
            <filter id="sm-glow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor="hsl(var(--primary))" floodOpacity="0.2" />
            </filter>
          </defs>

          <g filter="url(#sm-glow)">
            {/* Top Ribbon & Upper Bend */}
            <path
              d="M74 24 C79.5 24 84 28.5 84 34 C84 39.5 79.5 44 74 44 L44 44 C34 44 26 51 26 60 C26 64 27.5 67.5 30 70.5 L46.5 53.5 C44.5 50 46 44 52 44 L74 24 Z"
              fill="url(#sm-ribbon-top)"
            />

            {/* 3D Underfold / Crease (Inner depth layer) */}
            <path
              d="M44 44 C34 44 26 51 26 60 C26 69 34 76 44 76 L62 76 C54 68 47.5 58 50 49 C51.5 45.5 55 44 59 44 L44 44 Z"
              fill="url(#sm-ribbon-crease)"
            />

            {/* Front Ribbon Loop & Bottom Extension */}
            <path
              d="M30 70.5 C33.5 74 38.5 76 44 76 L74 76 C79.5 76 84 71.5 84 66 C84 60.5 79.5 56 74 56 L47 56 C40.5 56 34.5 62 30 70.5 Z"
              fill="url(#sm-ribbon-bottom)"
            />
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
