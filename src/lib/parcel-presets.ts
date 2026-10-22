import { queryOptions } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { boxPresets } from "./pricing";

export type ParcelPreset = { id: string; label: string; label_hi: string | null; kind: string; max_kg: number; l: number; w: number; h: number; fee: number; active: boolean; sort: number };

/** Built-in sizes used until the admin saves their own list. */
export const DEFAULT_PRESETS: ParcelPreset[] = [
  ...boxPresets.map((b, i) => ({ id: b.id, label: b.label, label_hi: null, kind: b.kind, max_kg: b.maxKg, l: b.dims.l, w: b.dims.w, h: b.dims.h, fee: 0, active: true, sort: i })),
  { id: "fragile", label: "Fragile / glass handling", label_hi: "कांच / टूटने वाला सामान", kind: "addon", max_kg: 0, l: 0, w: 0, h: 0, fee: 30, active: true, sort: 20 },
  { id: "electronics", label: "Electronics / battery", label_hi: "इलेक्ट्रॉनिक / बैटरी वाला सामान", kind: "addon", max_kg: 0, l: 0, w: 0, h: 0, fee: 20, active: true, sort: 21 },
];

export const parcelPresetsOptions = queryOptions({
  queryKey: ["parcel-presets"],
  staleTime: 5 * 60_000,
  queryFn: async (): Promise<ParcelPreset[]> => {
    const { data, error } = await supabase.from("parcel_presets").select("*").order("sort");
    if (error || !data?.length) return DEFAULT_PRESETS;
    return data.map((r) => ({ ...r, max_kg: Number(r.max_kg), l: Number(r.l), w: Number(r.w), h: Number(r.h), fee: Number(r.fee) }));
  },
});

/** Extra handling charge: each parcel's size fee + fragile/electronics add-ons (once per shipment). */
export function handlingFee(pieces: { preset: string }[], presets: ParcelPreset[], flags: { fragile?: boolean; electronics?: boolean }) {
  const byId = new Map(presets.filter((p) => p.active).map((p) => [p.id, p]));
  let fee = pieces.reduce((a, p) => a + (byId.get(p.preset)?.fee ?? 0), 0);
  if (flags.fragile) fee += byId.get("fragile")?.fee ?? 0;
  if (flags.electronics) fee += byId.get("electronics")?.fee ?? 0;
  return Math.round(fee * 100) / 100;
}
