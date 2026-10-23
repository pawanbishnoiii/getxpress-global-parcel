import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Calculator, Globe2, Loader2, Plane, Plus, Trash2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SiteNav } from "@/components/site/SiteNav";
import { SiteFooter } from "@/components/site/SiteFooter";
import { intlCountries, intlQuote, getIntlMarkup, saveIntlMarkup } from "@/lib/intl-rates.functions";
import { useRoles } from "@/hooks/use-roles";
import { flagOf, allCountries } from "@/lib/countries";
import { toast } from "sonner";

export const Route = createFileRoute("/calculator")({
  head: () => ({ meta: [
    { title: "International courier rate calculator | GetXpress" },
    { name: "description", content: "Pick a country, enter the destination pincode, add your products and compare GetXpress air courier prices with doorstep pickup." },
    { property: "og:title", content: "GetXpress international rate calculator" },
    { property: "og:description", content: "Compare air courier prices with pickup from India to 30+ countries." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: CalculatorPage,
});

type Row = { name: string; qty: number; weight: number; value: number };
const codeOf = (name: string) => allCountries().find((c) => c.name === name || (name === "United States" && c.code === "US"))?.code;

function CalculatorPage() {
  const list = useServerFn(intlCountries), quote = useServerFn(intlQuote);
  const { data: countries = [] } = useQuery({ queryKey: ["intl-countries"], queryFn: () => list(), staleTime: Infinity });
  const [country, setCountry] = useState("United Kingdom"), [postal, setPostal] = useState("");
  const [items, setItems] = useState<Row[]>([{ name: "", qty: 1, weight: 1, value: 0 }]);
  const [dims, setDims] = useState({ l: 0, w: 0, h: 0 });
  const [busy, setBusy] = useState(false);
  const [res, setRes] = useState<Awaited<ReturnType<typeof intlQuote>> | null>(null);
  const meta = countries.find((c) => c.name === country);
  const { isAdmin } = useRoles();

  const run = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.some((i) => !i.name.trim())) return toast.error("Add a name for each product");
    setBusy(true);
    try { setRes(await quote({ data: { country, postal, items, ...dims } })); } catch (err) { toast.error((err as Error).message); }
    setBusy(false);
  };
  const set = (i: number, p: Partial<Row>) => setItems((r) => r.map((x, j) => (j === i ? { ...x, ...p } : x)));

  return (
    <div className="min-h-screen bg-background">
      <SiteNav />
      <main className="mx-auto max-w-[1100px] px-4 pb-16 pt-28 md:px-8">
        <p className="flex items-center gap-2 text-xs font-bold uppercase text-primary"><Calculator className="h-4 w-4" />Rate calculator</p>
        <h1 className="mt-2 text-3xl font-extrabold md:text-4xl">International shipping, with pickup</h1>
        <p className="mt-2 text-muted-foreground">Choose a country, enter the destination pincode, add your products and compare prices.</p>
        <form onSubmit={run} className="mt-8 grid gap-6 lg:grid-cols-[1.3fr_1fr]">
          <div className="space-y-5 rounded-2xl border bg-card p-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-semibold">Destination country
                <select value={country} onChange={(e) => { setCountry(e.target.value); setPostal(""); setRes(null); }} className="mt-1 h-11 w-full rounded-md border bg-background px-3">
                  {countries.map((c) => { const code = codeOf(c.name); return <option key={c.name} value={c.name}>{code ? flagOf(code) : "🌐"} {c.name}</option>; })}
                </select>
              </label>
              <label className="text-sm font-semibold">Destination pincode{meta?.needsPostal ? "" : " (optional)"}
                <Input value={postal} onChange={(e) => setPostal(e.target.value)} placeholder={meta?.postalHint || "Postal code"} className="mt-1 h-11" required={meta?.needsPostal} maxLength={20} />
              </label>
            </div>
            <div>
              <p className="mb-2 text-sm font-semibold">Products</p>
              <div className="space-y-2">
                {items.map((it, i) => (
                  <div key={i} className="grid grid-cols-[1fr_64px_80px_96px_36px] gap-2">
                    <Input aria-label="Product" placeholder="e.g. Cotton kurta" value={it.name} onChange={(e) => set(i, { name: e.target.value })} maxLength={80} />
                    <Input aria-label="Qty" type="number" min={1} value={it.qty} onChange={(e) => set(i, { qty: Math.max(1, +e.target.value) })} />
                    <Input aria-label="Weight kg" type="number" step="0.1" min={0.1} value={it.weight} onChange={(e) => set(i, { weight: +e.target.value })} />
                    <Input aria-label="Value ₹" type="number" min={0} value={it.value} onChange={(e) => set(i, { value: +e.target.value })} />
                    <Button type="button" size="icon" variant="ghost" aria-label="Remove product" disabled={items.length === 1} onClick={() => setItems((r) => r.filter((_, j) => j !== i))}><Trash2 /></Button>
                  </div>
                ))}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Qty · weight per piece (kg) · value per piece (₹)</p>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => setItems((r) => [...r, { name: "", qty: 1, weight: 1, value: 0 }])}><Plus />Add product</Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(["l", "w", "h"] as const).map((k) => <label key={k} className="text-xs font-semibold">{k === "l" ? "Length" : k === "w" ? "Width" : "Height"} (cm)<Input type="number" min={0} value={dims[k]} onChange={(e) => setDims({ ...dims, [k]: +e.target.value })} className="mt-1" /></label>)}
            </div>
            <Button type="submit" className="h-12 w-full" disabled={busy}>{busy ? <Loader2 className="animate-spin" /> : <Plane />}Compare prices</Button>
          </div>
          <aside className="space-y-3">
            {!res ? <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground"><Globe2 className="mx-auto mb-3 h-8 w-8 text-primary" />Prices appear here.</div>
              : !res.ok ? <div role="alert" className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5 text-sm">{res.error} <Link to="/international" className="font-bold text-primary">Request a quote</Link></div>
              : <>
                <div className="rounded-2xl border bg-card p-4 text-sm"><p>Chargeable weight <b>{res.chargeableKg} kg</b>{res.zone && <> · {res.zone}</>}</p><p className="text-muted-foreground">Actual {res.actualKg} kg · volumetric {res.volumetricKg} kg · declared ₹{res.declared.toLocaleString("en-IN")}</p></div>
                {res.options.map((o, i) => (
                  <div key={o.id} className={`rounded-2xl border p-5 ${i === 0 ? "border-primary bg-primary/5" : "bg-card"}`}>
                    <div className="flex items-center justify-between"><p className="font-bold">{o.name}</p><p className="text-2xl font-extrabold">₹{o.price.toLocaleString("en-IN")}</p></div>
                    <p className="mt-1 text-xs text-muted-foreground">{o.days} · duties may apply</p>
                  </div>
                ))}
                <Button asChild className="w-full"><Link to="/international">Book this shipment</Link></Button>
              </>}
            <p className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4" />Final price confirmed after parcel inspection.</p>
            {isAdmin && <MarkupCard />}
          </aside>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}

function MarkupCard() {
  const get = useServerFn(getIntlMarkup), save = useServerFn(saveIntlMarkup);
  const [v, setV] = useState({ percent: 0, flat: 0 });
  useEffect(() => { get().then(setV).catch(() => {}); }, [get]);
  return (
    <div className="rounded-2xl border bg-muted/40 p-4 text-sm">
      <p className="font-bold">Admin · hidden margin</p>
      <p className="text-xs text-muted-foreground">Added to every price. Customers only see the final total.</p>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="text-xs">Percent %<Input type="number" min={0} value={v.percent} onChange={(e) => setV({ ...v, percent: +e.target.value })} /></label>
        <label className="text-xs">Flat ₹<Input type="number" min={0} value={v.flat} onChange={(e) => setV({ ...v, flat: +e.target.value })} /></label>
      </div>
      <Button type="button" size="sm" className="mt-3" onClick={() => save({ data: v }).then(() => toast.success("Margin saved")).catch((e) => toast.error(e.message))}>Save margin</Button>
    </div>
  );
}
