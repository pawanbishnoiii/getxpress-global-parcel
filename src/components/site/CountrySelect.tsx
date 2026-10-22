import { useMemo, useRef, useState, useEffect } from "react";
import { ChevronDown, Search } from "lucide-react";
import { allCountries, searchCountries } from "@/lib/countries";

/** Searchable country picker with flags; search by name, ISO code or dialing code. */
export function CountrySelect({ value, onChange, label }: { value: string; onChange: (name: string) => void; label: string }) {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const ref = useRef<HTMLDivElement>(null);
  const list = useMemo(() => searchCountries(q), [q]);
  const current = useMemo(() => allCountries().find((c) => c.name === value), [value]);
  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h);
  }, []);
  return (
    <div ref={ref} className="relative mt-1">
      <button type="button" aria-label={label} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="flex h-11 w-full items-center gap-2 rounded-md border bg-card px-3 text-left text-sm font-normal">
        {current ? <><span className="text-lg">{current.flag}</span><span className="flex-1 truncate">{current.name}</span><span className="text-xs text-muted-foreground">{current.code} {current.dial}</span></> : <span className="flex-1 text-muted-foreground">Select country</span>}
        <ChevronDown className="h-4 w-4 opacity-60" />
      </button>
      <input tabIndex={-1} required value={value} onChange={() => {}} className="pointer-events-none absolute inset-0 opacity-0" aria-hidden />
      {open && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b px-3"><Search className="h-4 w-4 opacity-60" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Country, code (US) or +1" className="h-10 w-full bg-transparent text-sm font-normal outline-none" /></div>
          <ul role="listbox" className="max-h-64 overflow-y-auto py-1">
            {list.map((c) => (
              <li key={c.code}><button type="button" onClick={() => { onChange(c.name); setOpen(false); setQ(""); }} className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-normal hover:bg-secondary ${c.name === value ? "bg-secondary" : ""}`}><span className="text-lg">{c.flag}</span><span className="flex-1">{c.name}</span><span className="text-xs text-muted-foreground">{c.code} · {c.dial}</span></button></li>
            ))}
            {!list.length && <li className="px-3 py-3 text-sm text-muted-foreground">No country matches “{q}”</li>}
          </ul>
        </div>
      )}
    </div>
  );
}
