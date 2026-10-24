import { useEffect, useRef, useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { allCountries } from "@/lib/countries";

export type WorldPlace = { city: string; postal_code: string; region: string; label: string };
const cache = new Map<string, WorldPlace[]>();

/** Search cities, towns and postal codes worldwide, limited to the chosen country. */
export async function searchWorldPlaces(q: string, countryName: string): Promise<WorldPlace[]> {
  const code = allCountries().find((c) => c.name === countryName)?.code?.toUpperCase() ?? "";
  const key = `${code}|${q.toLowerCase()}`;
  if (cache.has(key)) return cache.get(key)!;
  const url = `https://photon.komoot.io/api/?q=${encodeURIComponent(`${q} ${countryName}`.slice(0, 120))}&limit=25&lang=en`;
  const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
  if (!res.ok) throw new Error("search failed");
  type P = { countrycode?: string; city?: string; town?: string; village?: string; osm_value?: string; type?: string; name?: string; postcode?: string; state?: string; county?: string };
  const j = (await res.json()) as { features?: { properties: P }[] };
  const seen = new Set<string>();
  const out: WorldPlace[] = [];
  for (const f of j.features ?? []) {
    const p = f.properties;
    if (code && p.countrycode?.toUpperCase() !== code) continue;
    const city = p.city || p.town || p.village || (["city", "town", "village", "suburb", "locality", "district"].includes(p.osm_value ?? p.type ?? "") ? p.name : "") || p.name || "";
    if (!city) continue;
    const postal = (p.postcode ?? "").split(/[;,]/)[0]!.trim();
    const id = `${city}|${postal}`;
    if (seen.has(id)) continue;
    seen.add(id);
    out.push({ city, postal_code: postal, region: p.state ?? p.county ?? "", label: [city, p.state, postal].filter(Boolean).join(" · ") });
    if (out.length >= 12) break;
  }
  cache.set(key, out);
  return out;
}

export function WorldPlaceAutocomplete({ label, value, country, placeholder, onChange, onPick, icon }: {
  label: string; value: string; country: string; placeholder?: string;
  onChange: (v: string) => void; onPick: (p: WorldPlace) => void; icon?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<WorldPlace[]>([]);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const seq = useRef(0);
  const typed = useRef(false);

  useEffect(() => {
    const my = ++seq.current;
    const q = value.trim();
    if (!open || !typed.current || q.length < 2 || !country) { setHits([]); setBusy(false); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      try { const r = await searchWorldPlaces(q, country); if (my === seq.current) { setHits(r); setFailed(false); setActive(0); } }
      catch { if (my === seq.current) { setHits([]); setFailed(true); } }
      finally { if (my === seq.current) setBusy(false); }
    }, 220);
    return () => clearTimeout(t);
  }, [value, country, open]);

  const pick = (p: WorldPlace) => { typed.current = false; onPick(p); setHits([]); setOpen(false); };

  return (
    <div className="relative mt-1">
      <div className="flex h-11 items-center gap-2 rounded-md border bg-card px-3 focus-within:ring-2 focus-within:ring-ring">
        {icon}
        <input aria-label={label} role="combobox" aria-expanded={open && hits.length > 0} autoComplete="off" required
          value={value} placeholder={country ? placeholder : "Select the country first"} disabled={!country}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => { typed.current = true; setOpen(true); onChange(e.target.value.slice(0, 80)); }}
          onKeyDown={(e) => {
            if (!open || !hits.length) return;
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
            else if (e.key === "Enter" || e.key === "Tab") { const h = hits[active]; if (h) { if (e.key === "Enter") e.preventDefault(); pick(h); } }
            else if (e.key === "Escape") setOpen(false);
          }}
          className="h-full min-w-0 flex-1 bg-transparent text-sm font-normal outline-none placeholder:text-muted-foreground" />
        {busy && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
      </div>
      {open && hits.length > 0 && (
        <ul role="listbox" className="absolute z-50 mt-1 max-h-72 w-full overflow-auto rounded-md border bg-popover py-1 text-popover-foreground shadow-lg">
          {hits.map((h, i) => (
            <li key={`${h.city}-${h.postal_code}-${i}`} role="option" aria-selected={i === active}>
              <button type="button" onMouseDown={(e) => e.preventDefault()} onMouseEnter={() => setActive(i)} onClick={() => pick(h)}
                className={`flex w-full items-start gap-2 px-3 py-2 text-left text-sm font-normal ${i === active ? "bg-secondary" : ""}`}>
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0"><span className="font-semibold">{h.city}</span>{h.postal_code && <span className="ml-2 font-mono text-xs">{h.postal_code}</span>}
                  {h.region && <span className="block truncate text-xs text-muted-foreground">{h.region}</span>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
      {open && !busy && typed.current && value.trim().length >= 2 && !hits.length && country && (
        <p role="status" className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-3 py-2 text-xs text-muted-foreground shadow">
          {failed ? "Suggestions are unavailable right now — type the name yourself." : "No match found — check the spelling or type it in yourself."}
        </p>
      )}
    </div>
  );
}
