import { ThemeToggle } from "./ThemeToggle";
import { NotificationPanel } from "./NotificationPanel";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-2 lg:hidden">
          <div className="shrink-0">
            <img src="/logo.png" alt="ScriptMind Logo" className="w-10 h-10 rounded-lg object-cover" />
          </div>
          <span className="text-xl font-bold text-foreground">ScriptMind</span>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationPanel />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
