import React, { useRef } from "react";
import { 
  Palette, 
  Check, 
  Sparkles, 
  Pipette, 
  Sun, 
  Moon, 
  Monitor, 
  ExternalLink 
} from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/hooks/useTheme";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

const PALETTES = [
  { id: "default", label: "Indigo", hex: "#6366F1", gradient: "from-[#8b5cf6] to-[#4f46e5]" },
  { id: "forest", label: "Forest", hex: "#10B981", gradient: "from-[#10b981] to-[#047857]" },
  { id: "sunset", label: "Sunset", hex: "#F59E0B", gradient: "from-[#f59e0b] to-[#b45309]" },
  { id: "ocean", label: "Ocean", hex: "#E05D38", gradient: "from-[#f97316] to-[#c2410c]" },
  { id: "golden", label: "Golden", hex: "#FACC15", gradient: "from-[#facc15] to-[#ca8a04]" },
] as const;

const QUICK_VIBES = [
  { name: "Neon Rose", hex: "#ec4899" },
  { name: "Electric Pink", hex: "#f43f5e" },
  { name: "Cyber Fuchsia", hex: "#d946ef" },
  { name: "Vivid Purple", hex: "#a855f7" },
  { name: "Electric Blue", hex: "#3b82f6" },
  { name: "Neon Cyan", hex: "#06b6d4" },
  { name: "Emerald Mint", hex: "#10b981" },
  { name: "Lime Punch", hex: "#84cc16" },
  { name: "Amber Sun", hex: "#f59e0b" },
  { name: "Crimson Blaze", hex: "#ef4444" },
];

function hexToHue(hex: string): number {
  let r = 0, g = 0, b = 0;
  const cleanHex = hex.replace(/^#/, '');
  if (cleanHex.length === 3) {
    r = parseInt(cleanHex[0] + cleanHex[0], 16);
    g = parseInt(cleanHex[1] + cleanHex[1], 16);
    b = parseInt(cleanHex[2] + cleanHex[2], 16);
  } else if (cleanHex.length === 6) {
    r = parseInt(cleanHex.substring(0, 2), 16);
    g = parseInt(cleanHex.substring(2, 4), 16);
    b = parseInt(cleanHex.substring(4, 6), 16);
  }
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0;
  if (max !== min) {
    const d = max - min;
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return Math.round(h * 360);
}

function hslToHex(h: number, s: number, l: number): string {
  s /= 100;
  l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

interface PaletteCustomizerProps {
  className?: string;
  align?: "start" | "center" | "end";
}

export function PaletteCustomizer({ className, align = "end" }: PaletteCustomizerProps) {
  const { theme, setTheme, variant, setVariant, customColor, setCustomColor } = useTheme();
  const colorInputRef = useRef<HTMLInputElement>(null);

  const activeColorHex = variant === "custom" 
    ? customColor 
    : (PALETTES.find(p => p.id === variant)?.hex || "#6366F1");

  const handleOpenColorPicker = () => {
    colorInputRef.current?.showPicker?.();
    colorInputRef.current?.click();
  };

  const handleEyeDropper = async () => {
    if (typeof window !== "undefined" && "EyeDropper" in window) {
      try {
        const eyeDropper = new (window as any).EyeDropper();
        const res = await eyeDropper.open();
        if (res?.sRGBHex) {
          setCustomColor(res.sRGBHex);
          setVariant("custom");
        }
      } catch {
        // Dismissed
      }
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          title="Customize Theme & Colors"
          className={cn(
            "relative h-9 w-9 rounded-full flex items-center justify-center text-foreground hover:bg-muted active:scale-95 transition-all outline-none focus-visible:ring-1 focus-visible:ring-primary group",
            className
          )}
        >
          <Palette className="h-4.5 w-4.5 transition-transform group-hover:rotate-12" />
          {/* Active Color Beacon Pip */}
          <span 
            className="absolute bottom-1.5 right-1.5 size-2.5 rounded-full border border-background shadow-xs transition-transform group-hover:scale-125"
            style={{ backgroundColor: activeColorHex }}
          />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align={align}
        sideOffset={10}
        className="w-[330px] sm:w-[360px] p-4 rounded-3xl shadow-2xl border-border/80 bg-card/95 backdrop-blur-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200 z-50"
      >
        {/* Header Bar with Quick Mode Toggles */}
        <div className="flex items-center justify-between pb-3 border-b border-border/50">
          <div className="flex items-center gap-2">
            <div 
              className="size-7 rounded-lg flex items-center justify-center text-white shadow-xs"
              style={{ backgroundColor: activeColorHex }}
            >
              <Sparkles className="size-3.5" />
            </div>
            <div>
              <h4 className="text-xs font-black text-foreground">Theme & Colorway</h4>
              <p className="text-[10px] text-muted-foreground font-medium">Applied instantly across all pages</p>
            </div>
          </div>

          {/* Mode Pill */}
          <div className="flex items-center bg-secondary/80 p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setTheme("light")}
              title="Light Mode"
              className={cn(
                "size-6 rounded-md flex items-center justify-center transition-all",
                theme === "light" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Sun className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("dark")}
              title="Dark Mode"
              className={cn(
                "size-6 rounded-md flex items-center justify-center transition-all",
                theme === "dark" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Moon className="size-3" />
            </button>
            <button
              type="button"
              onClick={() => setTheme("system")}
              title="System Sync"
              className={cn(
                "size-6 rounded-md flex items-center justify-center transition-all",
                theme === "system" ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Monitor className="size-3" />
            </button>
          </div>
        </div>

        {/* 6 Palette Cards Grid */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground">
            <span>Brand Palettes</span>
            <span className="capitalize text-[10px] text-primary font-black">{variant}</span>
          </div>

          <div className="grid grid-cols-6 gap-1.5">
            {PALETTES.map((p) => {
              const isSelected = variant === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setVariant(p.id)}
                  title={`${p.label} (${p.hex})`}
                  className={cn(
                    "flex flex-col items-center p-1.5 rounded-xl border transition-all duration-200 cursor-pointer group",
                    isSelected 
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 scale-105" 
                      : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/70"
                  )}
                >
                  <div 
                    className="size-6 rounded-lg shadow-xs flex items-center justify-center text-white"
                    style={{ backgroundColor: p.hex }}
                  >
                    {isSelected && <Check className="size-3 stroke-[3]" />}
                  </div>
                  <span className="text-[9px] font-bold mt-1 text-foreground truncate w-full text-center">
                    {p.label}
                  </span>
                </button>
              );
            })}

            {/* Custom 6th Palette Card */}
            {(() => {
              const isCustom = variant === "custom";
              return (
                <button
                  type="button"
                  onClick={() => {
                    setVariant("custom");
                    setCustomColor(customColor || "#ec4899");
                  }}
                  title="Custom Color Palette"
                  className={cn(
                    "flex flex-col items-center p-1.5 rounded-xl border transition-all duration-200 cursor-pointer group",
                    isCustom 
                      ? "border-primary bg-primary/10 ring-1 ring-primary/40 scale-105" 
                      : "border-border/60 bg-secondary/30 hover:border-border hover:bg-secondary/70"
                  )}
                >
                  <div 
                    className="size-6 rounded-lg shadow-xs flex items-center justify-center text-white relative overflow-hidden"
                    style={{ backgroundColor: customColor || "#ec4899" }}
                  >
                    {isCustom ? <Check className="size-3 stroke-[3]" /> : <Pipette className="size-3" />}
                  </div>
                  <span className="text-[9px] font-black mt-1 text-primary truncate w-full text-center">
                    Custom
                  </span>
                </button>
              );
            })()}
          </div>
        </div>

        {/* Custom Studio Controls (expanded when custom is selected) */}
        {variant === "custom" && (
          <div className="space-y-3 pt-2 border-t border-border/50 animate-in fade-in duration-200">
            {/* Rainbow Hue Spectrum Slider */}
            <div className="space-y-1.5 bg-background/80 p-2.5 rounded-2xl border border-border/80 shadow-inner">
              <div className="flex items-center justify-between text-[10px]">
                <span className="font-bold text-muted-foreground flex items-center gap-1">
                  <Palette className="size-3 text-primary" />
                  Rainbow Spectrum
                </span>
                <span className="font-mono font-bold text-foreground">
                  {hexToHue(customColor)}°
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="360"
                value={hexToHue(customColor)}
                onChange={(e) => {
                  const hue = Number(e.target.value);
                  const newHex = hslToHex(hue, 90, 56);
                  setCustomColor(newHex);
                  setVariant("custom");
                }}
                className="w-full h-3 rounded-lg cursor-pointer appearance-none outline-none shadow-sm"
                style={{
                  background: "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
                }}
              />
            </div>

            {/* Picker, EyeDropper, and HEX row */}
            <div className="flex items-center gap-2">
              {/* Native OS Color Wheel button */}
              <button
                type="button"
                onClick={handleOpenColorPicker}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-xs font-bold text-foreground transition-all shrink-0 cursor-pointer"
              >
                <div 
                  className="size-4 rounded-md border border-white/40 relative overflow-hidden"
                  style={{ backgroundColor: customColor }}
                >
                  <input
                    ref={colorInputRef}
                    type="color"
                    value={customColor}
                    onChange={(e) => {
                      setCustomColor(e.target.value);
                      setVariant("custom");
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full scale-150"
                  />
                </div>
                <span>Pick</span>
              </button>

              {/* EyeDropper button (if supported) */}
              {typeof window !== "undefined" && "EyeDropper" in window && (
                <button
                  type="button"
                  onClick={handleEyeDropper}
                  title="Sample any pixel on screen"
                  className="p-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-foreground text-xs font-bold transition-all shrink-0 cursor-pointer"
                >
                  <Pipette className="size-3.5" />
                </button>
              )}

              {/* Direct Hex Input */}
              <div className="flex items-center gap-1 flex-1 px-2 py-1 rounded-xl border border-border bg-background">
                <span className="text-[10px] font-bold text-muted-foreground uppercase">HEX:</span>
                <input
                  type="text"
                  maxLength={7}
                  value={customColor}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (/^#[0-9A-Fa-f]{0,6}$/.test(val)) {
                      setCustomColor(val);
                      if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
                        setVariant("custom");
                      }
                    }
                  }}
                  className="w-full bg-transparent text-xs font-mono font-black uppercase focus:outline-none text-foreground"
                  placeholder="#84CC16"
                />
              </div>
            </div>

            {/* Quick Vibes Palette */}
            <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
              {QUICK_VIBES.map((swatch) => (
                <button
                  key={swatch.hex}
                  type="button"
                  title={swatch.name}
                  onClick={() => {
                    setCustomColor(swatch.hex);
                    setVariant("custom");
                  }}
                  className={cn(
                    "size-5 rounded-full transition-transform hover:scale-125 shrink-0 shadow-xs cursor-pointer",
                    customColor.toLowerCase() === swatch.hex.toLowerCase() && "ring-2 ring-foreground ring-offset-1 ring-offset-background scale-110"
                  )}
                  style={{ backgroundColor: swatch.hex }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer Link to Settings */}
        <div className="pt-2 border-t border-border/40 flex items-center justify-between text-[11px]">
          <span className="text-muted-foreground font-medium">More in Studio:</span>
          <Button variant="ghost" size="sm" asChild className="h-6 px-2 text-[11px] font-bold text-primary hover:text-primary gap-1">
            <Link to="/settings?tab=appearance">
              Open Settings
              <ExternalLink className="size-3" />
            </Link>
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
