import { Badge } from "@/components/ui/badge";
import { Link } from "@tanstack/react-router";

export function AppHeader() {
  return (
    <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur">
      <div className="container-app flex min-h-16 flex-wrap items-center justify-between gap-2 py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/brand/hourglass.svg" alt="" width="28" height="28" className="shrink-0" />
          <h1 className="text-base font-bold tracking-tight">
            <span className="text-primary">Friction</span>
            <span className="text-foreground"> Timer</span>
          </h1>
        </Link>
        <Badge variant="outline">
          v2.0.0
        </Badge>
      </div>
    </header>
  );
}
