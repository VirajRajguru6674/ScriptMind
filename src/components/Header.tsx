import { ThemeToggle } from "./ThemeToggle";
import { PaletteCustomizer } from "./PaletteCustomizer";
import { NotificationPanel } from "./NotificationPanel";
import { ScriptMindLogo } from "./ScriptMindLogo";
import { Link } from "react-router-dom";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3 lg:hidden">
          <Link to="/" className="flex items-center">
            <ScriptMindLogo showText={true} />
          </Link>
        </div>
        <div className="flex items-center gap-2 lg:hidden">
          <NotificationPanel />
          <PaletteCustomizer />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
