import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { basePrice, chargeableKg, withMarkup, zoneFor, type RateCard } from "./intl-rates";

const quoteSchema = z.object({
  country: z.string().min(2).max(60),
  postal: z.string().max(20).default(""),
  items: z.array(z.object({ name: z.string().min(1).max(80), qty: z.number().int().min(1).max(500), weight: z.number().positive().max(300), value: z.number().min(0).max(10_000_000) })).min(1).max(30),
  l: z.number().min(0).max(300).default(0), w: z.number().min(0).max(300).default(0), h: z.number().min(0).max(300).default(0),
});

/** Replace the upstream brand with ours; customers never see the source provider. */
export const rebrand = (name: string) => name.replace(/ship\s?global/gi, "GetXpress.in");

async function liveConfig() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("gateway_configs").select("enabled,config").eq("provider", "shipglobal").maybeSingle();
  const cfg = (data?.config ?? {}) as Record<string, string>;
  if (!data?.enabled || !cfg["api_key"]) return null;
  return { base: (cfg["base_url"] || "https://shipglobal-rate-spark.lovable.app").replace(/\/$/, ""), key: cfg["api_key"] };
}

/** Public: list of countries (no prices). Live list when the rate API is configured. */
export const intlCountries = createServerFn({ method: "GET" }).handler(async () => {
  const card = (await import("@/data/intl-rates.json")).default as unknown as RateCard;
  const local = Object.entries(card).map(([name, c]) => ({ name, code: "" as string, needsPostal: !!c.zones, postalHint: c.zones === "state" ? "State code e.g. CA" : c.zones === "fsa" ? "Postal code e.g. M5V 2T6" : c.zones === "postcode" ? "Postcode e.g. 2000" : "" }));
  try {
    const cfg = await liveConfig();
    if (cfg) {
      const r = await fetch(`${cfg.base}/api/public/v1/countries`);
      const j = (await r.json()) as { countries?: { code: string; name: string }[] };
      if (j.countries?.length) return j.countries.filter((c) => c.code !== "IN").map((c) => ({ name: c.name, code: c.code, needsPostal: true, postalHint: "Destination pincode / postal code" })).sort((a, b) => a.name.localeCompare(b.name));
    }
  } catch (e) { console.error("intl countries live", e); }
  return local.sort((a, b) => a.name.localeCompare(b.name));
});

/** Public: final customer price only; base rate and markup stay on the server. */
export const intlQuote = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => quoteSchema.extend({ code: z.string().length(2).optional() }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin.from("app_settings").select("intl_markup_percent,intl_markup_flat").eq("id", true).maybeSingle();
    const pct = Number(s?.intl_markup_percent ?? 0), flat = Number(s?.intl_markup_flat ?? 0);
    const actual = data.items.reduce((s, i) => s + i.qty * i.weight, 0);
    const volumetric = (data.l * data.w * data.h) / 5000;
    const declared = data.items.reduce((s, i) => s + i.qty * i.value, 0);
    const cfg = data.code ? await liveConfig() : null;
    if (cfg && data.code) {
      try {
        const r = await fetch(`${cfg.base}/api/public/v1/quote`, { method: "POST", headers: { "content-type": "application/json", "x-api-key": cfg.key }, body: JSON.stringify({ country: data.code, pincode: data.postal.replace(/\s+/g, ""), weight: +Math.max(actual, 0.05).toFixed(2), length: data.l || 10, breadth: data.w || 10, height: data.h || 10 }) });
        const j = (await r.json()) as { status?: string; error?: string; message?: string; shipment?: { billedWeight: number; volumetricWeight: number }; results?: { provider: string; courier: string; transit: string; price: number }[] };
        if (r.ok && j.results?.length) {
          return {
            ok: true as const, zone: null, actualKg: +actual.toFixed(2), volumetricKg: j.shipment?.volumetricWeight ?? +volumetric.toFixed(2), chargeableKg: j.shipment?.billedWeight ?? actual, declared,
            options: j.results.map((o) => ({ id: o.provider, name: rebrand(o.courier), days: o.transit, price: withMarkup(o.price, pct, flat) })).sort((a, b) => a.price - b.price),
          };
        }
        if (r.status === 400) return { ok: false as const, error: "Please check the destination pincode, weight or box size." };
        console.error("intl live quote", r.status, j.error ?? j.message);
      } catch (e) { console.error("intl live quote", e); }
    }
    const card = (await import("@/data/intl-rates.json")).default as unknown as RateCard;
    const c = card[data.country];
    if (!c) return { ok: false as const, error: "Live prices are unavailable right now. Request a quote instead." };
    const zone = zoneFor(c, data.postal);
    if (!zone || !c.rates[zone]) return { ok: false as const, error: "We couldn't match this destination pincode/postal code. Please check it." };
    const kg = chargeableKg(Math.max(actual, volumetric), c.rates[zone]!);
    const express = withMarkup(basePrice(c.rates[zone]!, kg), pct, flat);
    return {
      ok: true as const, zone: zone === "_" ? null : zone, actualKg: +actual.toFixed(2), volumetricKg: +volumetric.toFixed(2), chargeableKg: kg, declared,
      options: [
        { id: "pickup", name: "Air Express · with pickup", days: "5–8 working days", price: express },
        { id: "economy", name: "Air Economy · with pickup", days: "8–12 working days", price: Math.round(express * 0.9) },
      ],
    };
  });

export const getIntlMarkup = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
  if (!isAdmin) throw new Error("Forbidden");
  const { data } = await context.supabase.from("app_settings").select("intl_markup_percent,intl_markup_flat").eq("id", true).maybeSingle();
  return { percent: Number(data?.intl_markup_percent ?? 0), flat: Number(data?.intl_markup_flat ?? 0) };
});

export const saveIntlMarkup = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ percent: z.number().min(0).max(200), flat: z.number().min(0).max(100000) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { error } = await context.supabase.from("app_settings").update({ intl_markup_percent: data.percent, intl_markup_flat: data.flat }).eq("id", true);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
