import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { AlertTriangle, CheckCircle2, Copy, Loader2, Wand2 } from "lucide-react";
import { AppShell, PageHeader } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { checkAddresses, type AddressCheck } from "@/lib/address-ai.functions";

export const Route = createFileRoute("/_authenticated/address-check")({
  head: () => ({ meta: [
    { title: "AI address check — GetXpress" },
    { name: "description", content: "Spot unclear pickup and drop-off addresses and get clear corrections before dispatch." },
    { property: "og:title", content: "AI address check — GetXpress" },
    { property: "og:description", content: "Fix ambiguous courier addresses before the rider leaves." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: AddressCheckPage,
});

function AddressCheckPage() {
  const run = useServerFn(checkAddresses);
  const [pickup, setPickup] = useState(""); const [drop, setDrop] = useState("");
  const [busy, setBusy] = useState(false); const [res, setRes] = useState<AddressCheck | null>(null);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setBusy(true); setRes(null);
    try { setRes(await run({ data: { pickup, drop } })); } catch (err) { toast.error((err as Error).message); } finally { setBusy(false); }
  };
  const field = "mt-1 w-full rounded-md border bg-card p-3 text-sm";
  return (
    <AppShell>
      <PageHeader title="Address check" sub="Paste the pickup and drop-off addresses. AI flags anything a rider can't find." />
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-semibold">Pickup address<textarea required minLength={3} maxLength={400} rows={4} value={pickup} onChange={(e) => setPickup(e.target.value)} className={field} placeholder="e.g. near hanuman mandir, vaishali nagar jaipur" /></label>
        <label className="text-sm font-semibold">Drop-off address<textarea required minLength={3} maxLength={400} rows={4} value={drop} onChange={(e) => setDrop(e.target.value)} className={field} placeholder="e.g. flat 12, sector 4, gurgaon 122001" /></label>
        <Button disabled={busy} className="h-12 sm:col-span-2">{busy ? <Loader2 className="animate-spin" /> : <Wand2 />}Check addresses</Button>
      </form>
      {res && <div className="mt-6 grid gap-4 sm:grid-cols-2">{(["pickup", "drop"] as const).map((k) => <Result key={k} label={k === "pickup" ? "Pickup" : "Drop-off"} r={res[k]} />)}</div>}
    </AppShell>
  );
}

function Result({ label, r }: { label: string; r: AddressCheck["pickup"] }) {
  return (
    <div className={`rounded-lg border p-5 ${r.ambiguous ? "border-destructive/40 bg-destructive/5" : "border-primary/30 bg-primary/5"}`}>
      <p className="flex items-center gap-2 font-bold">{r.ambiguous ? <AlertTriangle className="h-4 w-4 text-destructive" /> : <CheckCircle2 className="h-4 w-4 text-primary" />}{label} · {r.ambiguous ? "Needs fixing" : "Looks clear"} <span className="text-xs font-semibold text-muted-foreground">({r.confidence} confidence)</span></p>
      {r.problems.length > 0 && <ul className="mt-3 list-disc pl-5 text-sm">{r.problems.map((p) => <li key={p}>{p}</li>)}</ul>}
      <p className="mt-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">Suggested address</p>
      <div className="mt-1 flex items-start gap-2 rounded-md bg-card p-3 text-sm font-semibold"><span className="flex-1">{r.suggested}</span><button aria-label="Copy" onClick={() => { void navigator.clipboard.writeText(r.suggested); toast.success("Copied"); }}><Copy className="h-4 w-4" /></button></div>
      <p className="mt-2 text-xs text-muted-foreground">{[r.city, r.state, r.pincode].filter(Boolean).join(" · ")}</p>
      {r.ask_customer && <p className="mt-3 text-sm"><b>Ask the customer:</b> {r.ask_customer}</p>}
    </div>
  );
}
