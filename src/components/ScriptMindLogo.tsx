import React, { useId } from "react";
import { cn } from "@/lib/utils";
import { useTheme } from "@/hooks/useTheme";

interface ScriptMindLogoProps {
  className?: string;
  size?: number | string;
  showText?: boolean;
}

// Curated theme gradients matching the project design system
const themePalette: Record<string, { from: string; to: string; accent: string; glow: string }> = {
  default: {
    from: "#8b5cf6",
    to: "#6366f1",
    accent: "#c084fc",
    glow: "rgba(139, 92, 246, 0.45)",
  },
  forest: {
    from: "#10b981",
    to: "#059669",
    accent: "#34d399",
    glow: "rgba(16, 185, 129, 0.45)",
  },
  sunset: {
    from: "#f97316",
    to: "#d97706",
    accent: "#fb923c",
    glow: "rgba(249, 115, 22, 0.45)",
  },
  ocean: {
    from: "#06b6d4",
    to: "#0284c7",
    accent: "#38bdf8",
    glow: "rgba(6, 182, 212, 0.45)",
  },
  golden: {
    from: "#f59e0b",
    to: "#d97706",
    accent: "#fbbf24",
    glow: "rgba(245, 158, 11, 0.45)",
  },
};

export const ScriptMindLogo: React.FC<ScriptMindLogoProps> = ({
  className,
  size = 30,
  showText = false,
}) => {
  const { variant = "default" } = useTheme();
  const palette = themePalette[variant] || themePalette.default;
  const uniqueId = useId().replace(/:/g, "");

  const sGradientId = `sm-s-grad-${uniqueId}`;
  const mGradientId = `sm-m-grad-${uniqueId}`;
  const glowFilterId = `sm-glow-${uniqueId}`;

  return (
    <div className={cn("inline-flex items-center gap-3 select-none", className)}>
      {/* Sleek Neutral Squircle Container - No Theme-Colored Highlight Border */}
      <div 
        className="relative flex items-center justify-center shrink-0 rounded-xl bg-zinc-900/90 dark:bg-zinc-900/90 border border-zinc-800/80 dark:border-white/10 p-1.5 shadow-sm transition-all duration-300"
        style={{ 
          width: typeof size === "number" ? `${size + 8}px` : size, 
          height: typeof size === "number" ? `${size + 8}px` : size,
        }}
      >
        <svg
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full overflow-visible"
        >
          <defs>
            {/* Dynamic S Gradient */}
            <linearGradient id={sGradientId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={palette.from} />
              <stop offset="100%" stopColor={palette.accent} />
            </linearGradient>

            {/* Dynamic M Gradient */}
            <linearGradient id={mGradientId} x1="0%" y1="100%" x2="100%" y2="0%">
              <stop offset="0%" stopColor={palette.to} />
              <stop offset="50%" stopColor={palette.from} />
              <stop offset="100%" stopColor={palette.accent} />
            </linearGradient>

            {/* Subtle Drop Shadow Glow strictly on glyph strokes */}
            <filter id={glowFilterId} x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="1" stdDeviation="1.5" floodColor={palette.from} floodOpacity="0.4" />
            </filter>
          </defs>

          <g filter={`url(#${glowFilterId})`}>
            {/* 'S' Letterform (Script) - Sleek, futuristic, high-tech curve */}
            <path
              d="M 40 24 C 27 24 17 28 17 38 C 17 47 43 49 43 60 C 43 71 31 76 17 76"
              stroke={`url(#${sGradientId})`}
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* 'M' Letterform (Mind) - Sharp, architectural, futuristic */}
            <path
              d="M 52 76 V 24 L 67 49 L 82 24 V 76"
              stroke={`url(#${mGradientId})`}
              strokeWidth="8.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* AI 4-Point Spark Accent above 'M' */}
            <path
              d="M 82 7 Q 82 13 86 13 Q 82 13 82 19 Q 82 13 78 13 Q 82 13 82 7 Z"
              fill={palette.accent}
            />
          </g>
        </svg>
      </div>

      {/* Brand Name Typography */}
      {showText && (
        <div className="flex flex-col">
          <span className="font-black text-lg tracking-tight text-foreground leading-none flex items-center">
            Script
            <span 
              className="bg-clip-text text-transparent font-black ml-0.5 transition-all duration-300"
              style={{
                backgroundImage: `linear-gradient(to right, ${palette.from}, ${palette.accent})`
              }}
            >
              Mind
            </span>
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest mt-1">
            AI STUDIO
          </span>
        </div>
      )}
    </div>
  );
};
