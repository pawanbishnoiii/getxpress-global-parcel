import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { AppShell, PageHeader, Stat } from "@/components/site/AppShell";
import { DataGrid, type Col } from "@/components/site/DataGrid";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/customers")({
  head: () => ({ meta: [
    { title: "Customer records — GetXpress Admin" },
    { name: "description", content: "Search, filter, sort and export every customer with their order count and spend." },
    { property: "og:title", content: "GetXpress customer records" },
    { property: "og:description", content: "Spreadsheet-style customer CRM for GetXpress admins." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Customers,
});

type Row = { id: string; name: string; phone: string; email: string; city: string; district: string; state: string; pincode: string; type: string; orders: number; spend: number; last_order: string; joined: string; last_seen: string; verified: string };

function Customers() {
  const { isAdmin } = useRoles();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["crm-customers"], enabled: isAdmin,
    queryFn: async () => {
      const [p, s] = await Promise.all([
        supabase.from("profiles").select("id,full_name,phone,contact_email,city,district,state,pincode,account_type,created_at,last_seen_at,phone_verified").order("created_at", { ascending: false }).limit(5000),
        supabase.from("shipments").select("user_id,price,created_at,status").limit(20000),
      ]);
      const agg = new Map<string, { n: number; sum: number; last: string }>();
      for (const r of s.data ?? []) { if (!r.user_id) continue; const a = agg.get(r.user_id) ?? { n: 0, sum: 0, last: "" }; a.n++; if (r.status !== "cancelled") a.sum += Number(r.price); if (r.created_at > a.last) a.last = r.created_at; agg.set(r.user_id, a); }
      const d = (v: string | null) => (v ? new Date(v).toLocaleDateString("en-IN") : "");
      return (p.data ?? []).map((u): Row => { const a = agg.get(u.id); return { id: u.id, name: u.full_name ?? "", phone: u.phone ?? "", email: u.contact_email ?? "", city: u.city ?? "", district: u.district ?? "", state: u.state ?? "", pincode: u.pincode ?? "", type: u.account_type, orders: a?.n ?? 0, spend: Math.round(a?.sum ?? 0), last_order: d(a?.last ?? null), joined: d(u.created_at), last_seen: d(u.last_seen_at), verified: u.phone_verified ? "Yes" : "No" }; });
    },
  });
  if (!isAdmin) return <AppShell><p>Admin access required.</p></AppShell>;
  const cols: Col<Row>[] = [
    { key: "name", label: "Name", width: "160px" }, { key: "phone", label: "Phone" }, { key: "email", label: "Email" },
    { key: "city", label: "City / town" }, { key: "district", label: "District" }, { key: "state", label: "State" }, { key: "pincode", label: "PIN" },
    { key: "type", label: "Type" }, { key: "orders", label: "Orders" }, { key: "spend", label: "Spend ₹", render: (r) => r.spend.toLocaleString("en-IN") },
    { key: "last_order", label: "Last order" }, { key: "joined", label: "Joined" }, { key: "last_seen", label: "Last seen" }, { key: "verified", label: "Verified" },
  ];
  const active = rows.filter((r) => r.orders > 0).length;
  return (
    <AppShell wide>
      <PageHeader title="Customer records" sub="Click a column to sort, type under it to filter, tick rows to export only those." />
      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Customers" value={rows.length} tone="ink" />
        <Stat label="Have ordered" value={active} />
        <Stat label="Total spend ₹" value={rows.reduce((a, r) => a + r.spend, 0).toLocaleString("en-IN")} tone="lime" />
        <Stat label="Phone verified" value={rows.filter((r) => r.verified === "Yes").length} tone="primary" />
      </div>
      {isLoading ? <p className="text-muted-foreground">Loading…</p> : <DataGrid name="getxpress-customers" rows={rows} cols={cols} rowKey={(r) => r.id} />}
    </AppShell>
  );
}
