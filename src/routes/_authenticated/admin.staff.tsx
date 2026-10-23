import { createFileRoute } from "@tanstack/react-router";
import { ClientOnly } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { lazy, Suspense, useMemo, useState } from "react";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/site/AppShell";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";
import { INDIA_STATES } from "@/lib/india-regions";
import type { Database } from "@/integrations/supabase/types";

const TerritoryMap = lazy(() => import("@/components/site/TerritoryMap"));
type Role = Database["public"]["Enums"]["app_role"];
const ROLES: { v: Role; l: string }[] = [
  { v: "area_manager", l: "Area manager" }, { v: "point", l: "Hub" }, { v: "state_manager", l: "State manager" }, { v: "network", l: "Network partner" },
];

export const Route = createFileRoute("/_authenticated/admin/staff")({
  head: () => ({ meta: [
    { title: "Staff assignment — GetXpress Admin" }, { name: "description", content: "Assign staff to a state, area and hub PIN code, and see coverage on a map." },
    { property: "og:title", content: "GetXpress staff assignment" }, { property: "og:description", content: "Assign staff to PIN codes." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: StaffAssign,
});

function StaffAssign() {
  const { isAdmin, roles } = useRoles();
  const qc = useQueryClient();
  const [user, setUser] = useState(""), [q, setQ] = useState(""), [role, setRole] = useState<Role>("area_manager"), [state, setState] = useState(""), [area, setArea] = useState(""), [pin, setPin] = useState("");
  const { data: people = [] } = useQuery({ queryKey: ["staff-people", q], enabled: isAdmin, queryFn: async () => {
    let s = supabase.from("profiles").select("id, full_name, phone, city").order("created_at", { ascending: false }).limit(30);
    if (q.trim()) s = s.or(`full_name.ilike.%${q.trim()}%,phone.ilike.%${q.trim()}%`);
    return (await s).data ?? [];
  } });
  const { data: allocs = [] } = useQuery({ queryKey: ["allocs"], queryFn: async () => (await supabase.from("pincode_allocations").select("id, pincode, area, holder_role, holder_user_id, status").eq("status", "active").order("created_at", { ascending: false }).limit(500)).data ?? [] });
  const ids = [...new Set(allocs.map((a) => a.holder_user_id))];
  const { data: names = {} } = useQuery({ queryKey: ["alloc-names", ids.join()], enabled: ids.length > 0, queryFn: async () => Object.fromEntries(((await supabase.from("profiles").select("id, full_name, phone").in("id", ids)).data ?? []).map((p) => [p.id, p.full_name || p.phone || p.id.slice(0, 8)])) as Record<string, string> });
  const points = useMemo(() => allocs.map((a) => ({ pincode: a.pincode, label: `${names[a.holder_user_id] ?? "Staff"} · ${a.holder_role.replace("_", " ")}${a.area ? ` · ${a.area}` : ""}` })), [allocs, names]);
  const canView = isAdmin || roles.includes("area_manager") || roles.includes("state_manager");

  const assign = async () => {
    if (!user) return toast.error("Select a user");
    if (!state) return toast.error("Select a state");
    if (!/^\d{6}$/.test(pin)) return toast.error("Enter a 6-digit hub PIN");
    const { data: me } = await supabase.auth.getUser();
    const p = await supabase.from("pincodes").select("pincode, state").eq("pincode", pin).maybeSingle();
    if (!p.data) return toast.error("This PIN is not in the PIN master. Add it on the Pincodes page first.");
    await supabase.from("user_roles").upsert({ user_id: user, role }, { onConflict: "user_id,role", ignoreDuplicates: true });
    const r = await supabase.from("pincode_allocations").insert({ pincode: pin, area: area.trim() || null, holder_role: role, holder_user_id: user, assigned_by: me.user?.id ?? "", note: state });
    if (r.error) return toast.error(r.error.message);
    toast.success("Assigned"); setPin(""); setArea(""); qc.invalidateQueries({ queryKey: ["allocs"] });
    return undefined;
  };
  const remove = async (id: string) => { const r = await supabase.from("pincode_allocations").update({ status: "ended", effective_to: new Date().toISOString() }).eq("id", id); if (r.error) toast.error(r.error.message); else qc.invalidateQueries({ queryKey: ["allocs"] }); };

  if (!canView) return <AppShell><p>You don't have access to this page.</p></AppShell>;
  const field = "mt-1 h-11 w-full rounded-xl border bg-background px-3";
  return (
    <AppShell wide>
      <PageHeader title={isAdmin ? "Staff assignment" : "My territory"} sub={isAdmin ? "Pick a user, their role, state, area and hub PIN." : "PIN codes and staff assigned in your area."} />
      {isAdmin && <div className="grid gap-3 rounded-2xl border bg-card p-5 md:grid-cols-3">
        <label className="text-xs font-bold md:col-span-1">1. Find user<input className={field} placeholder="Name or phone" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="text-xs font-bold md:col-span-2">Select user<select aria-label="User" className={field} value={user} onChange={(e) => setUser(e.target.value)}><option value="">— choose —</option>{people.map((p) => <option key={p.id} value={p.id}>{p.full_name || "Unnamed"} · {p.phone ?? ""} {p.city ? `· ${p.city}` : ""}</option>)}</select></label>
        <label className="text-xs font-bold">2. Role<select className={field} value={role} onChange={(e) => setRole(e.target.value as Role)}>{ROLES.map((r) => <option key={r.v} value={r.v}>{r.l}</option>)}</select></label>
        <label className="text-xs font-bold">3. State<select className={field} value={state} onChange={(e) => setState(e.target.value)}><option value="">— state —</option>{INDIA_STATES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="text-xs font-bold">4. Area name<input className={field} maxLength={80} value={area} onChange={(e) => setArea(e.target.value)} placeholder="e.g. Malviya Nagar" /></label>
        <label className="text-xs font-bold">5. Hub PIN<input className={field} inputMode="numeric" maxLength={6} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))} placeholder="302017" /></label>
        <div className="flex items-end md:col-span-2"><Button className="h-11" onClick={assign}>Assign</Button></div>
      </div>}
      <div className="mt-5"><ClientOnly fallback={<div className="h-[420px] rounded-2xl border bg-muted" />}><Suspense fallback={<div className="h-[420px] rounded-2xl border bg-muted" />}><TerritoryMap points={points} /></Suspense></ClientOnly></div>
      <div className="mt-5 overflow-x-auto rounded-2xl border bg-card"><table className="enterprise-table"><thead><tr><th>PIN</th><th>Area</th><th>Staff</th><th>Role</th>{isAdmin && <th />}</tr></thead><tbody>
        {allocs.map((a) => <tr key={a.id}><td className="font-mono">{a.pincode}</td><td>{a.area ?? "—"}</td><td>{names[a.holder_user_id] ?? a.holder_user_id.slice(0, 8)}</td><td className="capitalize">{a.holder_role.replace("_", " ")}</td>{isAdmin && <td><Button size="sm" variant="ghost" onClick={() => remove(a.id)}>Remove</Button></td>}</tr>)}
      </tbody></table>{allocs.length === 0 && <p className="p-8 text-center text-muted-foreground">No PIN codes assigned yet.</p>}</div>
    </AppShell>
  );
}
