import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export function fillTemplate(text: string, vars: Record<string, string>) {
  return text.replace(/\{\{(\w+)\}\}/g, (_, k: string) => vars[k] ?? "");
}

function esc(s: string) {
  return s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);
}

function brandedHtml(body: string, company: string, logo?: string | null, image?: string | null) {
  const paras = esc(body).split(/\n{2,}/).map((p) => `<p style="margin:0 0 14px;line-height:1.6">${p.replace(/\n/g, "<br>")}</p>`).join("");
  return `<div style="background:#f4f1ec;padding:24px;font-family:Arial,sans-serif;color:#14213d"><div style="max-width:560px;margin:auto;background:#fff;border-radius:14px;overflow:hidden"><div style="background:#14213d;padding:18px 24px">${logo ? `<img src="${esc(logo)}" alt="${esc(company)}" height="32">` : `<b style="color:#fff;font-size:18px">${esc(company)}</b>`}</div>${image ? `<img src="${esc(image)}" alt="" style="width:100%;display:block">` : ""}<div style="padding:24px">${paras}</div><div style="padding:14px 24px;background:#fafafa;font-size:12px;color:#666">${esc(company)}</div></div></div>`;
}

/** Server-only: send one email through the admin-configured SMTP account. */
export async function sendSmtp(to: string, subject: string, body: string, opts: { templateKey?: string; image?: string | null } = {}) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: smtp }, { data: app }] = await Promise.all([
    supabaseAdmin.from("smtp_settings").select("*").eq("id", true).single(),
    supabaseAdmin.from("app_settings").select("company_name,logo_url").eq("id", true).single(),
  ]);
  const company = app?.company_name ?? "GetXpress";
  const log = (status: string, error?: string) =>
    supabaseAdmin.from("email_logs").insert({ to_email: to, subject, template_key: opts.templateKey ?? null, status, error: error ?? null });
  const password = (process.env["SMTP_PASSWORD"] ?? "").replace(/\s+/g, "");
  if (!smtp?.enabled || !smtp.username || !password) {
    await log("skipped", "SMTP not enabled or credentials missing");
    return { sent: false, error: "SMTP is not enabled yet" };
  }
  try {
    const { WorkerMailer } = await import("worker-mailer");
    const mailer = await WorkerMailer.connect({
      host: smtp.host,
      port: smtp.port,
      secure: smtp.secure === "ssl",
      startTls: smtp.secure === "starttls",
      credentials: { username: smtp.username, password },
      authType: "plain",
    });
    await mailer.send({
      from: { name: smtp.from_name ?? company, email: smtp.from_email || smtp.username },
      to,
      subject,
      text: body,
      html: brandedHtml(body, company, app?.logo_url, opts.image),
    });
    await mailer.close();
    await log("sent");
    return { sent: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SMTP send failed:", msg);
    await log("failed", msg.slice(0, 500));
    return { sent: false, error: msg };
  }
}

/** Server-only: render a stored template and send it. */
export async function sendTemplate(key: string, to: string, vars: Record<string, string>) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const [{ data: t }, { data: app }] = await Promise.all([
    supabaseAdmin.from("email_templates").select("*").eq("key", key).maybeSingle(),
    supabaseAdmin.from("app_settings").select("company_name").eq("id", true).single(),
  ]);
  if (!t || !t.enabled) return { sent: false, error: "Template disabled" };
  const all = { company: app?.company_name ?? "GetXpress", ...vars };
  return sendSmtp(to, fillTemplate(t.subject, all), fillTemplate(t.body, all), { templateKey: key, image: t.image_url });
}

async function assertAdmin(ctx: { supabase: any; userId: string }) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Admin access required");
}

export const sendTestEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().email(), templateKey: z.string().max(60).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    if (data.templateKey)
      return sendTemplate(data.templateKey, data.to, { name: "Test customer", tracking: "GX000TEST", status: "In transit", link: "https://getxpress.in/track", offer: "Flat 20% off this week." });
    return sendSmtp(data.to, "GetXpress SMTP test", "Your SMTP settings are working.\n\nThis is a test email.");
  });

/** Admin sends an offer to one customer at a time (no bulk lists). */
export const sendOfferEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ to: z.string().email(), name: z.string().max(80), offer: z.string().min(3).max(2000) }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    return sendTemplate("new_offer", data.to, { name: data.name, offer: data.offer });
  });
