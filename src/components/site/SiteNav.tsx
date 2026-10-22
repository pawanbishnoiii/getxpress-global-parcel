import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, Plane, X, PackageSearch, Truck, Store, Globe2 } from "lucide-react";
import { BrandMark } from "./BrandMark";
import { useSession } from "@/hooks/use-session";

const LINKS = [
  { to: "/track", label: "Track", icon: PackageSearch, sub: "Live parcel status" },
  { to: "/ship", label: "Ship now", icon: Truck, sub: "Doorstep pickup in India" },
  { to: "/international", label: "International", icon: Globe2, sub: "Air parcels abroad" },
  { to: "/point-partner", label: "Become a Hub", icon: Store, sub: "Earn with GetXpress" },
] as const;

export function SiteNav() {
  const { user } = useSession();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  useEffect(() => { document.body.style.overflow = open ? "hidden" : ""; return () => { document.body.style.overflow = ""; }; }, [open]);

  return (
    <nav className="fixed inset-x-0 top-0 z-50 px-2.5 pt-2.5 md:px-6 md:pt-4">
      <div className={`mx-auto flex max-w-[1240px] items-center justify-between gap-2 rounded-2xl border px-3 py-2 backdrop-blur-xl transition-all duration-300 md:px-5 md:py-2.5 ${scrolled ? "border-border bg-background/90 shadow-soft" : "border-transparent bg-background/60"}`}>
        <Link to="/" aria-label="GetXpress home" className="shrink-0"><BrandMark /></Link>
        <div className="hidden items-center gap-1 text-sm font-semibold text-muted-foreground lg:flex">
          {LINKS.filter((l) => l.to !== "/international").map((l) => <Link key={l.to} to={l.to} className="rounded-lg px-3 py-2 hover:bg-secondary hover:text-ink" activeProps={{ className: "text-ink bg-secondary" }}>{l.label}</Link>)}
        </div>
        <div className="flex items-center gap-1.5">
          <Link to="/international" className="flex h-10 items-center gap-1.5 rounded-xl border border-primary/30 bg-primary/10 px-3 text-xs font-bold text-primary transition hover:bg-primary hover:text-primary-foreground sm:text-sm">
            <Plane className="h-4 w-4" /><span className="hidden min-[400px]:inline">International</span>
          </Link>
          <Link to={user ? "/dashboard" : "/auth"} className="group hidden h-10 items-center gap-2 rounded-xl bg-ink px-4 text-sm font-bold text-ink-foreground transition-transform hover:-translate-y-0.5 sm:flex">
            {user ? "Dashboard" : "Sign in"} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
          <button onClick={() => setOpen(true)} aria-label="Open menu" aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-ink-foreground lg:hidden">
            <Menu className="h-4 w-4" />
          </button>
        </div>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button aria-label="Close menu" onClick={() => setOpen(false)} className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-in fade-in duration-200" />
          <div className="absolute inset-x-2.5 top-2.5 rounded-3xl border bg-background p-4 shadow-2xl animate-in slide-in-from-top-4 fade-in duration-300">
            <div className="flex items-center justify-between">
              <BrandMark />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="grid h-10 w-10 place-items-center rounded-xl border bg-card"><X className="h-4 w-4" /></button>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {LINKS.map((l, i) => (
                <Link key={l.to} to={l.to} onClick={() => setOpen(false)} style={{ animationDelay: `${i * 50}ms` }} className="rounded-2xl border bg-card p-4 animate-in fade-in slide-in-from-bottom-2 fill-mode-both duration-300" activeProps={{ className: "border-primary" }}>
                  <l.icon className="h-5 w-5 text-primary" />
                  <p className="mt-3 font-bold">{l.label}</p>
                  <p className="text-xs text-muted-foreground">{l.sub}</p>
                </Link>
              ))}
            </div>
            <Link to={user ? "/dashboard" : "/auth"} onClick={() => setOpen(false)} className="mt-3 flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink font-bold text-ink-foreground">
              {user ? "Open dashboard" : "Sign in / Sign up"} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

/** Bottom bar removed on phones by request; kept as a no-op for existing imports. */
export function MobileTabBar() {
  return null;
}
