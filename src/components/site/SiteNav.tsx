import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useSession } from "@/hooks/use-session";

const LINKS = [
  { to: "/track", label: "Track" },
  { to: "/ship", label: "Ship now" },
  { to: "/point-partner", label: "Become a Hub" },
] as const;

export function SiteNav() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6 md:pt-5">
      <div className="mx-auto max-w-[1240px] rounded-[22px] border border-card/80 bg-background/85 px-4 py-3 shadow-soft backdrop-blur-2xl md:px-6">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="Get Xpress home"><BrandMark /></Link>
          <div className="hidden items-center gap-7 text-sm font-semibold text-muted-foreground md:flex">
            {LINKS.map((l) => <Link key={l.to} to={l.to} className="hover:text-ink" activeProps={{ className: "text-ink" }}>{l.label}</Link>)}
          </div>
          <div className="flex items-center gap-2">
            <Link to={user ? "/dashboard" : "/auth"} className="group flex items-center gap-2 rounded-[14px] bg-ink px-4 py-2.5 text-sm font-bold text-ink-foreground transition-transform hover:-translate-y-0.5">
              {user ? "Dashboard" : "Sign in"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <button onClick={() => setOpen((v) => !v)} aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-[14px] border bg-card md:hidden">
              {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
            </button>
          </div>
        </div>
        {open && (
          <div className="mt-3 grid gap-1 border-t pt-3 md:hidden animate-in fade-in slide-in-from-top-2 duration-200">
            {LINKS.map((l) => <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="rounded-xl px-3 py-3 text-base font-bold" activeProps={{ className: "bg-secondary" }}>{l.label}</Link>)}
          </div>
        )}
      </div>
    </nav>
  );
}

/** Bottom bar removed on phones by request; kept as a no-op for existing imports. */
export function MobileTabBar() {
  return null;
}
