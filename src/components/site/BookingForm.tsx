import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, ArrowRight, BatteryCharging, CheckCircle2, GlassWater, Loader2, Map as MapIcon, MessageCircle, Printer, ShieldCheck, Sparkles, Ticket, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PinAutocomplete } from "./PinAutocomplete";
import { ParcelEditor, NumberField } from "./ParcelEditor";
import { LocationPicker } from "./LocationPicker";
import { composeAddress, initialDraft, readDraft, saveDraft, DRAFT_KEY, type BookingDraft } from "@/lib/booking-draft";
import { quote, services, serviceAllowed, type ServiceLevel } from "@/lib/pricing";
import { bookingConfigOptions } from "@/lib/booking-config";
import { parcelPresetsOptions, handlingFee, DEFAULT_PRESETS } from "@/lib/parcel-presets";
import { createShipment, previewCoupon } from "@/lib/shipments.functions";
import { sendPhoneOtp } from "@/lib/otp.functions";
import { pinInfo } from "@/lib/pin-lookup";
import { postalLookup } from "@/lib/postal";
import { INDIAN_STATES } from "@/lib/india-regions";
import { Globe2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

type Bill = { weight: number; freight: number; handling: number; gst: number; total: number; discount: number; payable: number; coupon: string | null };
type Done = { id: string; tracking_number: string; price: number; status: string; bill?: Bill; whatsapp?: Record<string, string> };

const CONTENT_CHOICES = [
  { v: "Documents / papers", hi: "कागज़ात" }, { v: "Clothes", hi: "कपड़े" }, { v: "Books", hi: "किताबें" },
  { v: "Mobile / electronics", hi: "मोबाइल / इलेक्ट्रॉनिक" }, { v: "Gifts", hi: "उपहार" }, { v: "Medicines", hi: "दवाइयाँ" },
  { v: "Food items (packed)", hi: "पैक खाना" }, { v: "Spare parts", hi: "पुर्ज़े" },
];

/** Small Hindi helper line under English labels. */
export function Hi({ children }: { children: React.ReactNode }) { return <span className="block text-[11px] font-normal text-muted-foreground">{children}</span>; }

export function BookingForm({ compact = false }: { compact?: boolean }) {
  const [d, setD] = useState<BookingDraft>(() => initialDraft());
  const [ready, setReady] = useState(false), [busy, setBusy] = useState(false);
  const [coupon, setCoupon] = useState<{ code: string; discount: number; description?: string | null } | null>(null);
  const [done, setDone] = useState<Done | null>(null);
  const { user } = useSession(); const navigate = useNavigate(), qc = useQueryClient();
  const { data: config, error: configError } = useQuery(bookingConfigOptions);
  const { data: presets = DEFAULT_PRESETS } = useQuery(parcelPresetsOptions);
  const create = useServerFn(createShipment), couponPreview = useServerFn(previewCoupon), sendOtp = useServerFn(sendPhoneOtp);
  const [otp, setOtp] = useState<{ phone: string; dev: string | null } | null>(null), [otpCode, setOtpCode] = useState("");
  useEffect(() => { setD(readDraft(localStorage) ?? initialDraft()); setReady(true); }, []);
  useEffect(() => { if (ready) { try { saveDraft(localStorage, d); saveDraft(sessionStorage, d); } catch { /* storage full or private mode */ } } }, [d, ready]);
  const update = (patch: Partial<BookingDraft>) => setD((x) => ({ ...x, ...patch }));
  const validPins = /^\d{6}$/.test(d.sender.pincode) && /^\d{6}$/.test(d.receiver.pincode) && !!d.sender.city && !!d.receiver.city;
  const extras = handlingFee(d.pieces, presets, { fragile: d.is_fragile, electronics: d.has_electronics });
  const quoteFor = (service: ServiceLevel) => validPins && config ? quote({ fromPin: d.sender.pincode, toPin: d.receiver.pincode, weightKg: 0, service, pieces: d.pieces, rates: config.rates, extras }) : null;
  const q = quoteFor(d.service);
  // Drop an applied coupon if the order total changes so the shown saving never goes stale.
  useEffect(() => { setCoupon(null); }, [q?.total]);
  const discount = coupon?.discount ?? 0;

  const checkParty = async (p: BookingDraft["sender"], who: string) => {
    if (p.name.trim().length < 2) { toast.error(`${who}: enter full name / पूरा नाम लिखें`); return false; }
    if (!/^[6-9]\d{9}$/.test(p.phone)) { toast.error(`${who}: enter a valid 10-digit mobile / सही मोबाइल नंबर`); return false; }
    if (p.house.trim().length < 1) { toast.error(`${who}: enter house / flat number`); return false; }
    if (p.street.trim().length < 2) { toast.error(`${who}: enter street or colony`); return false; }
    if (p.city.trim().length < 2) { toast.error(`${who}: enter city / town`); return false; }
    if (!p.state) { toast.error(`${who}: select state`); return false; }
    if (!/^\d{6}$/.test(p.pincode)) { toast.error(`${who}: enter a 6-digit PIN code`); return false; }
    if (p.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email)) { toast.error(`${who}: email looks wrong`); return false; }
    return true;
  };
  const next = async () => {
    if (d.step < 2 && !await checkParty(d.step === 0 ? d.sender : d.receiver, d.step === 0 ? "Sender" : "Receiver")) return;
    if (d.step === 1 && d.sender.phone === d.receiver.phone) { toast.error("Sender and receiver mobile must be different."); return; }
    if (d.step === 2) {
      if (d.pieces.some((p) => p.weight_kg < 0.05 || Object.values(p.dims).some((v) => v < 1))) { toast.error("Enter valid parcel weight and size."); return; }
      const over = d.pieces.find((p) => { const pr = presets.find((x) => x.id === p.preset); return pr && pr.max_kg > 0 && p.weight_kg > pr.max_kg; });
      if (over) { toast.error("A parcel is heavier than its size allows. Pick a bigger size."); return; }
      if (!d.contents.trim()) { toast.error("Tell us what is inside / पैकेट में क्या है?"); return; }
    }
    update({ step: Math.min(3, d.step + 1) });
  };

  const confirm = async () => {
    if (!q || !config) return;
    if (!serviceAllowed(d.service, d.sender.city, d.receiver.city, config.rates)) { toast.error("Choose an available delivery service."); return; }
    if (!user) { sessionStorage.setItem("dbx_after_auth", "/users/addorder"); navigate({ to: "/auth", search: { redirect: "/users/addorder" } }); return; }
    const { data: p } = await supabase.from("profiles").select("phone_verified,phone").eq("id", user.id).maybeSingle();
    if (!p?.phone_verified) { sessionStorage.setItem("dbx_after_auth", "/users/addorder"); navigate({ to: "/onboarding" }); return; }
    if (!otp) {
      const ph = (p.phone ?? "").replace(/\D/g, "").slice(-10);
      try { const r = await sendOtp({ data: { phone: ph } }); setOtp({ phone: ph, dev: r.devCode }); toast.success(`OTP sent to +91 ${ph}`); } catch (e) { toast.error((e as Error).message); }
      return;
    }
    if (otpCode.length !== 6) { toast.error("Enter the 6-digit OTP."); return; }
    setBusy(true);
    try {
      const result = await create({ data: { service: d.service, sender: { name: d.sender.name, phone: d.sender.phone, pincode: d.sender.pincode, city: d.sender.city, address: composeAddress(d.sender) }, receiver: { name: d.receiver.name, phone: d.receiver.phone, pincode: d.receiver.pincode, city: d.receiver.city, address: composeAddress(d.receiver) }, pieces: d.pieces.map((x) => ({ weight_kg: x.weight_kg, dims: x.dims, box_preset: x.preset })), contents: d.contents, declared_value: d.declared_value, payment_method: d.payment_method, booking_otp: otpCode, is_fragile: d.is_fragile, has_electronics: d.has_electronics, ...(coupon ? { coupon_code: coupon.code } : {}), ...(d.sender.lat != null && d.sender.lng != null ? { pickup: { lat: d.sender.lat, lng: d.sender.lng } } : {}) } });
      setOtp(null); setOtpCode(""); localStorage.removeItem(DRAFT_KEY); sessionStorage.removeItem(DRAFT_KEY); qc.invalidateQueries();
      if (result.status === "awaiting_payment") { navigate({ to: "/pay/$shipmentId", params: { shipmentId: result.id } }); return; }
      setDone(result as Done);
    } catch (e) { toast.error((e as Error).message); } finally { setBusy(false); }
  };

  const applyCoupon = async () => {
    if (!q || !d.coupon) return;
    if (!user) {
      const { data: c, error } = await supabase.from("coupons").select("code,description,discount_type,discount_value,max_discount,min_order,active,starts_at,expires_at,max_uses,used_count").eq("code", d.coupon.toUpperCase()).maybeSingle();
      if (error || !c || !c.active || new Date(c.starts_at) > new Date() || (c.expires_at && new Date(c.expires_at) < new Date()) || (c.max_uses != null && c.used_count >= c.max_uses) || q.total < Number(c.min_order)) { toast.error("Coupon unavailable or minimum order not met."); return; }
      setCoupon({ code: c.code, description: c.description, discount: Math.min(q.total, c.max_discount ?? q.total, c.discount_type === "percent" ? q.total * Number(c.discount_value) / 100 : Number(c.discount_value)) });
      return;
    }
    try { const r = await couponPreview({ data: { code: d.coupon, total: q.total } }); setCoupon(r); toast.success(`${r.code} applied`); } catch (e) { toast.error((e as Error).message); }
  };
  const removeCoupon = () => { setCoupon(null); update({ coupon: "" }); };

  if (done) return <BookingDone done={done} draftPieces={d.pieces.length} />;
  const titles = ["Pickup details", "Delivery details", "Describe shipment", "Review & confirm"];
  const titlesHi = ["सामान कहाँ से उठाना है", "सामान कहाँ पहुँचाना है", "पैकेट की जानकारी", "जाँचें और बुक करें"];
  return <div className="min-w-0">
    {!compact && <><div className="mb-6 grid grid-cols-4 gap-2">{titles.map((t, i) => <div key={t} className={`border-t-4 pt-2 text-xs font-bold ${i <= d.step ? "border-primary text-primary" : "text-muted-foreground"}`}>{i + 1}. <span className="hidden sm:inline">{t}</span></div>)}</div><h1 className="text-3xl font-bold">{titles[d.step]}</h1><p className="mb-6 text-sm text-muted-foreground">{titlesHi[d.step]}</p></>}

    {(compact || d.step < 2) && <div className={compact ? "grid gap-5 md:grid-cols-2" : ""}>{(compact ? (["sender", "receiver"] as const) : ([d.step === 0 ? "sender" : "receiver"] as const)).map((side) => <div key={side}>
      <h3 className="mb-3 flex items-center gap-2 font-bold">{side === "sender" ? "From · भेजने वाला" : "To · पाने वाला"}<span className="text-xs font-normal text-muted-foreground">India</span>{side === "sender" && !compact && <IntlButton />}</h3>
      {!compact && <PartyFields side={side} party={d[side]} onChange={(p) => update({ [side]: p })} />}
      {compact && <PinAutocomplete label={side === "sender" ? "Pickup pincode / area · पिनकोड या इलाका" : "Delivery pincode / area · पिनकोड या इलाका"} value={d[side].pincode} city={d[side].city}
        onChange={(pincode) => { setD((x) => ({ ...x, [side]: { ...x[side], pincode, city: "" } })); if (/^\d{6}$/.test(pincode)) pinInfo(pincode).then((h) => { if (h) setD((x) => x[side].pincode === pincode ? { ...x, [side]: { ...x[side], city: h.city } } : x); }); }}
        onPick={(p) => setD((x) => ({ ...x, [side]: { ...x[side], pincode: p.pincode, city: p.city, ...(p.lat != null ? { lat: p.lat, lng: p.lng } : {}) } }))} />}
    </div>)}</div>}

    {(compact || d.step === 2) && <div className="mt-6"><ParcelEditor pieces={d.pieces} presets={presets} onChange={(pieces) => update({ pieces })} />
      {!compact && <>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <label className="block"><span className="mb-1 block text-xs font-semibold">What is inside? (Contents)<Hi>पैकेट के अंदर क्या सामान है?</Hi></span>
            <input aria-label="Contents" list="gx-contents" value={d.contents} onChange={(e) => update({ contents: e.target.value })} placeholder="e.g. Clothes, books" className="h-11 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" />
            <datalist id="gx-contents">{CONTENT_CHOICES.map((c) => <option key={c.v} value={c.v}>{c.hi}</option>)}</datalist>
            <div className="mt-2 flex flex-wrap gap-1">{CONTENT_CHOICES.slice(0, 6).map((c) => <button type="button" key={c.v} onClick={() => update({ contents: c.v, ...(c.v.includes("electronic") ? { has_electronics: true } : {}) })} className={`rounded-full border px-2.5 py-1 text-[11px] ${d.contents === c.v ? "border-primary bg-primary/10 text-primary" : "bg-card"}`}>{c.v}</button>)}</div>
          </label>
          <div><NumberField label="Value of items in ₹ (Declared value)" value={d.declared_value} onChange={(declared_value) => update({ declared_value })} /><Hi>सामान की कुल कीमत लगभग कितनी है — बीमा और जाँच के लिए</Hi></div>
        </div>
        <p className="mt-5 text-sm font-bold">Special items <span className="font-normal text-muted-foreground">· क्या कोई खास सामान है?</span></p>
        <div className="mt-2 grid gap-3 sm:grid-cols-2">
          <FlagCard on={d.is_fragile} onToggle={() => update({ is_fragile: !d.is_fragile })} icon={<GlassWater />} title="Glass or breakable item" hi="कांच या टूटने वाला सामान है" fee={presets.find((p) => p.id === "fragile")?.fee ?? 0} note="Extra bubble-wrap and 'FRAGILE' marking" />
          <FlagCard on={d.has_electronics} onToggle={() => update({ has_electronics: !d.has_electronics })} icon={<BatteryCharging />} title="Electronics or battery" hi="इलेक्ट्रॉनिक सामान या बैटरी है" fee={presets.find((p) => p.id === "electronics")?.fee ?? 0} note="Phones, chargers, power banks, gadgets" />
        </div>
      </>}
    </div>}

    {(compact || d.step >= 2) && <div className="mt-6 grid gap-3 md:grid-cols-3">{(Object.keys(services) as ServiceLevel[]).map((service) => { const allowed = config && validPins && serviceAllowed(service, d.sender.city, d.receiver.city, config.rates); const rate = allowed ? quoteFor(service) : null; return <Button key={service} variant="outline" disabled={!allowed} onClick={() => update({ service })} className={`h-auto min-h-28 flex-col items-start whitespace-normal p-4 text-left ${d.service === service ? "border-primary bg-primary/5 ring-1 ring-primary" : ""}`}><span className="font-bold">{services[service].label}</span><span className="text-xs text-muted-foreground">{services[service].eta}{service === "same_day" && !allowed ? " · Same city only" : ""}</span><span className="text-xl font-bold">{rate ? `₹${rate.total}` : "—"}</span></Button>; })}</div>}

    {(compact || d.step === 3) && <div className="mt-5 border-t pt-5">
      {!compact && <div className="mb-4 grid gap-2 rounded-2xl border bg-card p-4 text-sm"><p><b>From:</b> {d.sender.name} (+91 {d.sender.phone}), {d.sender.address}, {d.sender.city} {d.sender.pincode}</p><p><b>To:</b> {d.receiver.name} (+91 {d.receiver.phone}), {d.receiver.address}, {d.receiver.city} {d.receiver.pincode}</p><p>{d.pieces.length} parcel(s) · {q?.weight} kg billable · {services[d.service].label} · {d.contents || "—"}{d.is_fragile ? " · Fragile" : ""}{d.has_electronics ? " · Electronics" : ""}</p></div>}
      <PromoCard code={d.coupon} applied={coupon} disabled={!q} onCode={(c) => update({ coupon: c })} onApply={applyCoupon} onRemove={removeCoupon} />
      {q && !compact && <BillLines rows={[["Delivery charge", q.freight - q.handling], ["Size & special handling", q.handling], ["GST 18%", q.gst], ...(discount ? [[`Promo ${coupon?.code}`, -discount] as [string, number]] : [])]} />}
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3"><div><span className="text-xs text-muted-foreground">Total to pay · कुल रकम (GST सहित)</span><p className="text-3xl font-bold">{q ? `₹${Math.max(0, q.total - discount).toFixed(2)}` : "—"}</p></div>{compact && <Button disabled={!q} className="h-12 px-6" onClick={() => { update({ step: 0 }); navigate({ to: "/ship" }); }}>Book now <ArrowRight /></Button>}</div>
      {!compact && <div className="mt-4 grid grid-cols-2 gap-3"><Button variant={d.payment_method === "cash_on_pickup" ? "default" : "outline"} disabled={!config?.cashOnPickup} onClick={() => update({ payment_method: "cash_on_pickup" })} className="h-12 whitespace-normal">Pay at pickup{!config?.cashOnPickup ? " · Disabled" : ""}</Button><Button variant={d.payment_method === "online" ? "default" : "outline"} onClick={() => update({ payment_method: "online" })} className="h-12">Online · demo only</Button></div>}
      {otp && !compact && <div className="mt-5 rounded-2xl border-2 border-dashed border-primary bg-primary/5 p-4 animate-in fade-in slide-in-from-bottom-2"><p className="font-bold">Enter OTP to confirm booking</p><Hi>आपके मोबाइल पर आया 6 अंकों का कोड डालें</Hi><p className="mt-1 text-sm text-muted-foreground">Sent to +91 {otp.phone}{otp.dev && <> · Test code: <b className="font-mono">{otp.dev}</b></>}</p><div className="mt-3 flex flex-wrap gap-2"><input autoFocus aria-label="Booking OTP" inputMode="numeric" maxLength={6} value={otpCode} onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))} className="h-12 w-40 rounded-md border bg-card px-3 text-center font-mono text-xl tracking-[0.4em]" /><Button className="h-12" onClick={confirm} disabled={busy || otpCode.length !== 6}>{busy ? <Loader2 className="animate-spin" /> : <ShieldCheck />}Verify & book</Button><Button variant="ghost" className="h-12" onClick={() => { setOtp(null); setOtpCode(""); }}>Resend</Button></div></div>}
    </div>}
    {configError && <p className="mt-3 text-sm text-destructive">Delivery prices could not load. Please retry.</p>}
    {!compact && !otp && <div className="mt-6 flex gap-3">{d.step > 0 && <Button variant="outline" size="icon" className="h-12 w-12" aria-label="Previous step" onClick={() => update({ step: d.step - 1 })}><ArrowLeft /></Button>}<Button className="h-12 flex-1" disabled={busy || !ready || (d.step === 3 && !q)} onClick={d.step === 3 ? confirm : next}>{busy ? <Loader2 className="animate-spin" /> : d.step === 3 ? <ShieldCheck /> : <ArrowRight />}{d.step === 3 ? (user ? "Confirm booking" : "Sign in & confirm") : "Continue"}</Button></div>}
  </div>;
}

function FlagCard({ on, onToggle, icon, title, hi, fee, note }: { on: boolean; onToggle: () => void; icon: React.ReactNode; title: string; hi: string; fee: number; note: string }) {
  return <button type="button" role="switch" aria-checked={on} onClick={onToggle} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${on ? "border-primary bg-primary/10 ring-1 ring-primary" : "bg-card hover:border-primary/50"}`}>
    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${on ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{icon}</span>
    <span className="min-w-0 flex-1"><span className="block font-bold">{title}</span><Hi>{hi}</Hi><span className="mt-1 block text-xs text-muted-foreground">{note}{fee ? ` · +₹${fee}` : ""}</span></span>
    <span className={`mt-1 h-6 w-11 shrink-0 rounded-full p-0.5 transition ${on ? "bg-primary" : "bg-muted"}`}><span className={`block h-5 w-5 rounded-full bg-background shadow transition ${on ? "translate-x-5" : ""}`} /></span>
  </button>;
}

function PromoCard({ code, applied, disabled, onCode, onApply, onRemove }: { code: string; applied: { code: string; discount: number; description?: string | null } | null; disabled: boolean; onCode: (c: string) => void; onApply: () => void; onRemove: () => void }) {
  if (applied) return <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-accent p-[2px] animate-in zoom-in-95">
    <div className="relative flex items-center gap-3 rounded-[14px] bg-card p-4">
      <Sparkles className="absolute -right-2 -top-2 h-16 w-16 rotate-12 text-primary/10" />
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground animate-bounce"><Ticket className="h-5 w-5" /></span>
      <div className="min-w-0 flex-1"><p className="font-mono font-bold tracking-wider">{applied.code} applied 🎉</p><p className="text-sm text-primary">You save ₹{applied.discount.toFixed(2)} · आपकी बचत</p>{applied.description && <p className="truncate text-xs text-muted-foreground">{applied.description}</p>}</div>
      <Button variant="outline" size="sm" onClick={onRemove}><X className="h-4 w-4" />Remove</Button>
    </div>
  </div>;
  return <div className="relative rounded-2xl border-2 border-dashed border-primary/40 bg-gradient-to-br from-primary/5 to-transparent p-4">
    <span className="absolute -left-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" /><span className="absolute -right-3 top-1/2 h-6 w-6 -translate-y-1/2 rounded-full bg-background" />
    <p className="flex items-center gap-2 text-sm font-bold"><Ticket className="h-4 w-4 text-primary" />Have a promo code?<span className="font-normal text-muted-foreground">· कूपन कोड है?</span></p>
    <div className="mt-2 flex gap-2"><input aria-label="Promo code" placeholder="ENTER CODE" value={code} onChange={(e) => onCode(e.target.value.toUpperCase())} onKeyDown={(e) => e.key === "Enter" && onApply()} className="h-11 min-w-0 flex-1 rounded-md border bg-background px-3 font-mono text-sm tracking-wider" /><Button onClick={onApply} disabled={!code || disabled} className="h-11">Apply</Button></div>
  </div>;
}

function BillLines({ rows }: { rows: [string, number][] }) {
  return <div className="mt-4 space-y-1 rounded-2xl border bg-card p-4 text-sm">{rows.filter(([, v]) => v !== 0).map(([k, v]) => <div key={k} className={`flex justify-between ${v < 0 ? "text-primary" : ""}`}><span>{k}</span><span className="font-mono">{v < 0 ? "−" : ""}₹{Math.abs(v).toFixed(2)}</span></div>)}</div>;
}

function BookingDone({ done, draftPieces }: { done: Done; draftPieces: number }) {
  const b = done.bill;
  const wa = done.whatsapp;
  return <div className="mx-auto max-w-xl py-8 animate-in fade-in zoom-in-95">
    <div className="text-center"><CheckCircle2 className="mx-auto h-14 w-14 text-primary" /><h1 className="mt-3 text-3xl font-bold">Order booked!</h1><p className="text-sm text-muted-foreground">आपका ऑर्डर बुक हो गया है</p></div>
    <div className="mt-6 rounded-3xl border bg-card p-5" id="gx-bill">
      <div className="flex items-start justify-between gap-3 border-b pb-3"><div><p className="text-xs text-muted-foreground">Order ID / Tracking</p><p className="font-mono text-xl font-bold">{done.tracking_number}</p></div><div className="text-right text-xs text-muted-foreground"><p>{new Date().toLocaleString("en-IN")}</p><p>{b?.weight ?? "—"} kg · {draftPieces} parcel(s)</p></div></div>
      {b ? <div className="mt-3 space-y-1 text-sm">
        {([["Delivery charge", b.freight - b.handling], ["Size & special handling", b.handling], ["GST 18%", b.gst], ["Promo " + (b.coupon ?? ""), -b.discount]] as [string, number][]).filter(([, v]) => v !== 0).map(([k, v]) => <div key={k} className="flex justify-between"><span>{k}</span><span className="font-mono">{v < 0 ? "−" : ""}₹{Math.abs(v).toFixed(2)}</span></div>)}
        <div className="flex justify-between border-t pt-2 text-lg font-bold"><span>Total</span><span>₹{b.payable.toFixed(2)}</span></div>
      </div> : <p className="mt-3 text-lg font-bold">₹{done.price}</p>}
    </div>
    {wa && <p className="mt-3 flex items-center justify-center gap-2 text-sm text-muted-foreground"><MessageCircle className="h-4 w-4" />{wa["sender"] === "sent" ? "WhatsApp sent to sender and receiver with tracking link." : "WhatsApp alerts are off until the admin turns them on."}</p>}
    <div className="mt-6 flex flex-wrap justify-center gap-3"><Button asChild><Link to="/labels/$shipmentId" params={{ shipmentId: done.id }}><Printer />Print labels</Link></Button><Button variant="outline" onClick={() => window.print()}>Print bill</Button><Button asChild variant="outline"><Link to="/track" search={{ id: done.tracking_number }}>Track parcel</Link></Button></div>
  </div>;
}

function TextField({ label, hi, value, onChange, inputMode }: { label: string; hi?: string; value: string; onChange: (v: string) => void; inputMode?: "numeric" | "text" }) { return <label className="block"><span className="mb-1 block text-xs font-semibold text-muted-foreground">{label}{hi && <Hi>{hi}</Hi>}</span><input aria-label={label} inputMode={inputMode} value={value} onChange={(e) => onChange(e.target.value)} className="h-11 w-full rounded-md border bg-background px-3 outline-none focus:ring-2 focus:ring-ring" /></label>; }

function IntlButton() {
  const [open, setOpen] = useState(false), [country, setCountry] = useState("");
  return <span className="ml-auto inline-flex items-center gap-2 text-xs font-normal">
    <Button type="button" size="sm" variant={open ? "default" : "outline"} onClick={() => setOpen(!open)}><Globe2 className="h-4 w-4" />International</Button>
    {open && <span className="flex items-center gap-2"><input aria-label="Destination country" value={country} onChange={(e) => setCountry(e.target.value.slice(0, 60))} placeholder="Destination country" className="h-9 w-40 rounded-md border bg-background px-2" />
      <Button type="button" size="sm" asChild><a href={`https://wa.me/?text=${encodeURIComponent(`GetXpress international quote request to ${country || "(country)"}`)}`} target="_blank" rel="noreferrer">Get quote</a></Button></span>}
  </span>;
}

function PartyFields({ side, party: p, onChange }: { side: "sender" | "receiver"; party: BookingDraft["sender"]; onChange: (p: BookingDraft["sender"]) => void }) {
  const [map, setMap] = useState(false), [pinState, setPinState] = useState<"idle" | "loading" | "ok" | "miss">("idle");
  const who = side === "sender" ? "Sender" : "Receiver";
  const setPin = async (raw: string) => {
    const pincode = raw.replace(/\D/g, "").slice(0, 6); onChange({ ...p, pincode });
    if (pincode.length !== 6) { setPinState("idle"); return; }
    setPinState("loading");
    const [post, master] = await Promise.all([postalLookup(pincode), pinInfo(pincode).catch(() => null)]);
    if (!post && !master) { setPinState("miss"); return; }
    setPinState("ok");
    onChange({ ...p, pincode, district: post?.district ?? p.district, state: post?.state ?? p.state, city: p.city || post?.city || master?.city || "" });
  };
  return <div className="mb-4 space-y-4">
    <div className="grid gap-3 sm:grid-cols-2"><TextField label={`${who} full name`} value={p.name} onChange={(name) => onChange({ ...p, name })} /><TextField label="Mobile (WhatsApp)" hi="Order updates and tracking link go here" inputMode="numeric" value={p.phone} onChange={(phone) => onChange({ ...p, phone: phone.replace(/\D/g, "").slice(0, 10) })} /></div>
    <TextField label="Email (optional)" value={p.email} onChange={(email) => onChange({ ...p, email: email.trim().slice(0, 120) })} />
    <div className="grid gap-3 sm:grid-cols-2">
      <TextField label="House / flat no." value={p.house} onChange={(house) => onChange({ ...p, house: house.slice(0, 80) })} />
      <TextField label="Street / colony" value={p.street} onChange={(street) => onChange({ ...p, street: street.slice(0, 120) })} />
      <TextField label="City / town" value={p.city} onChange={(city) => onChange({ ...p, city: city.slice(0, 80) })} />
      <TextField label="Nearby landmark" hi="Helps the rider find you" value={p.landmark} onChange={(landmark) => onChange({ ...p, landmark: landmark.slice(0, 80) })} />
      <div><TextField label="6-digit PIN code" inputMode="numeric" value={p.pincode} onChange={setPin} />
        <p className="mt-1 text-xs">{pinState === "loading" ? <span className="text-muted-foreground">Looking up PIN…</span> : pinState === "ok" ? <span className="text-primary">District: {p.district || "—"} ✓</span> : pinState === "miss" ? <span className="text-destructive">PIN not found — please check it</span> : null}</p></div>
      <label className="block"><span className="mb-1 block text-xs font-semibold">State</span>
        <select aria-label={`${who} state`} value={p.state} onChange={(e) => onChange({ ...p, state: e.target.value })} className="h-11 w-full rounded-md border bg-background px-3"><option value="">Select state</option>{INDIAN_STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
    </div>
    {(p.house || p.street) && <p className="rounded-md bg-muted px-3 py-2 text-xs text-muted-foreground">{composeAddress(p)}</p>}
    <div><Button type="button" variant="outline" size="sm" onClick={() => setMap(!map)}><MapIcon className="h-4 w-4" />{map ? "Hide map" : "View on map"}</Button>{p.lat != null && !map && <span className="ml-2 text-xs text-primary">Location pinned ✓</span>}</div>
    {map && <LocationPicker point={p.lat != null && p.lng != null ? { lat: p.lat, lng: p.lng } : null} onResolve={(h) => { onChange({ ...p, lat: h.lat, lng: h.lng }); if (h.pincode && !p.pincode) void setPin(h.pincode); }} />}
  </div>;
}
