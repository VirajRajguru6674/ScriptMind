import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";
import { BrainCircuit } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="relative size-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/25 flex items-center justify-center text-primary shadow-sm shrink-0">
            <svg 
              viewBox="0 0 28 28" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5 text-primary"
            >
              <defs>
                <linearGradient id="sm-header-gradient" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="currentColor" stopOpacity="1" />
                  <stop offset="100%" stopColor="currentColor" stopOpacity="0.75" />
                </linearGradient>
              </defs>
              <path 
                d="M6 8.5C6 6.567 7.567 5 9.5 5H13C14.657 5 16 6.343 16 8C16 9.657 14.657 11 13 11H8.5C6.567 11 5 12.567 5 14.5C5 16.433 6.567 18 8.5 18H12" 
                stroke="url(#sm-header-gradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <path 
                d="M15 23V11.5L19 16.5L23 11.5V23" 
                stroke="url(#sm-header-gradient)" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <circle cx="21.5" cy="5.5" r="1.75" fill="currentColor" />
            </svg>
          </div>
          <span className="font-black text-lg tracking-tight text-foreground">
            Script<span className="text-primary font-black ml-0.5">Mind</span>
          </span>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationPanel />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
