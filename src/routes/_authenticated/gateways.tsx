import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/gateways")({
  beforeLoad: () => { throw redirect({ to: "/admin/gateways/payment" as never, replace: true }); },
});
