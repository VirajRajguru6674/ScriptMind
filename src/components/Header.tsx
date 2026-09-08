import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <div className="relative size-9 rounded-xl bg-gradient-to-br from-primary/20 via-primary/10 to-primary/5 border border-primary/30 flex items-center justify-center text-primary shadow-sm shadow-primary/20 shrink-0 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-transparent opacity-60 pointer-events-none" />
            <svg 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg" 
              className="w-5 h-5 relative z-10 text-primary"
            >
              <path 
                d="M17.5 7C17.5 5.067 15.709 3.5 13.5 3.5H9.5C6.73858 3.5 4.5 5.73858 4.5 8.5C4.5 11.2614 6.73858 13.5 9.5 13.5H14.5C17.2614 13.5 19.5 15.7386 19.5 18.5C19.5 21.2614 17.2614 23.5 14.5 23.5H10.5C8.291 23.5 6.5 21.933 6.5 20" 
                stroke="currentColor" 
                strokeWidth="2.75" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
              <circle cx="17.5" cy="7" r="1.5" fill="currentColor" />
              <circle cx="6.5" cy="20" r="1.5" fill="currentColor" />
              <path 
                d="M12 11.5L12 15.5" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                opacity="0.6" 
              />
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
