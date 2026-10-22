import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell, PageHeader } from "@/components/site/AppShell";
import { DataGrid, type Col } from "@/components/site/DataGrid";
import { Button } from "@/components/ui/button";
import { useRoles } from "@/hooks/use-roles";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated/admin/payouts")({
  head: () => ({ meta: [
    { title: "Hub payouts — GetXpress Admin" },
    { name: "description", content: "Approve, pay or reject hub wallet withdrawal requests." },
    { property: "og:title", content: "GetXpress hub payouts" },
    { property: "og:description", content: "Hub wallet withdrawal approvals." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }),
  component: Payouts,
});

type Row = { id: string; user_id: string; amount: number; payout_method: string; payout_details: string; status: string; created: string };

function Payouts() {
  const { isAdmin } = useRoles();
  const qc = useQueryClient();
  const { data: rows = [] } = useQuery({
    queryKey: ["payouts"], enabled: isAdmin,
    queryFn: async () => ((await supabase.from("wallet_withdrawals").select("*").order("created_at", { ascending: false }).limit(2000)).data ?? []).map((r): Row => ({ id: r.id, user_id: r.user_id, amount: Number(r.amount), payout_method: r.payout_method, payout_details: r.payout_details, status: r.status, created: new Date(r.created_at).toLocaleString("en-IN") })),
  });
  if (!isAdmin) return <AppShell><p>Admin access required.</p></AppShell>;
  const set = async (ids: string[], status: string) => {
    const r = await supabase.from("wallet_withdrawals").update({ status }).in("id", ids);
    if (r.error) toast.error(r.error.message); else { toast.success(`${ids.length} marked ${status}`); qc.invalidateQueries({ queryKey: ["payouts"] }); }
  };
  const cols: Col<Row>[] = [
    { key: "created", label: "Requested" }, { key: "amount", label: "Amount ₹", render: (r) => `₹${r.amount.toLocaleString("en-IN")}` },
    { key: "payout_method", label: "Method" }, { key: "payout_details", label: "UPI / bank" }, { key: "status", label: "Status", render: (r) => <span className="rounded bg-secondary px-2 py-0.5 text-xs font-semibold capitalize">{r.status}</span> },
    { key: "user_id", label: "Hub ID", render: (r) => <span className="font-mono text-xs">{r.user_id.slice(0, 8)}</span> },
  ];
  return (
    <AppShell wide>
      <PageHeader title="Hub payouts" sub="Tick requests, then approve, mark paid (wallet is debited automatically) or reject." />
      <DataGrid name="hub-payouts" rows={rows} cols={cols} rowKey={(r) => r.id} actions={(sel) => sel.length ? <>
        <Button size="sm" variant="outline" onClick={() => set(sel.filter((r) => r.status === "pending").map((r) => r.id), "approved")}>Approve</Button>
        <Button size="sm" onClick={() => set(sel.filter((r) => r.status !== "paid" && r.status !== "rejected").map((r) => r.id), "paid")}>Mark paid</Button>
        <Button size="sm" variant="destructive" onClick={() => set(sel.filter((r) => r.status === "pending").map((r) => r.id), "rejected")}>Reject</Button>
      </> : null} />
    </AppShell>
  );
}
