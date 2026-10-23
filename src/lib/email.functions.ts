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
  const envUser = process.env["SMTP_USERNAME"];
  // Until an admin saves the SMTP form, fall back to the server-stored Gmail account.
  const username = smtp?.username || envUser;
  const enabled = smtp?.username ? smtp.enabled : !!envUser;
  if (!smtp || !enabled || !username || !password) {
    await log("skipped", "SMTP not enabled or credentials missing");
    return { sent: false, error: "SMTP is not enabled yet" };
  }
  try {
    const from = { name: smtp.from_name ?? company, email: smtp.from_email || username };
    const html = brandedHtml(body, company, app?.logo_url, opts.image);
    let usedWorker = false; let via = "worker"; let messageId: string | undefined; let response: string | undefined;
    try {
      const { WorkerMailer } = await import("worker-mailer");
      const mailer = await WorkerMailer.connect({
        host: smtp.host,
        port: smtp.port,
        secure: smtp.secure === "ssl",
        startTls: smtp.secure === "starttls",
        credentials: { username, password },
        authType: "plain",
      });
      usedWorker = true;
      const r: any = await mailer.send({ from, to, subject, text: body, html }); messageId = r?.messageId; response = r?.response;
      await mailer.close();
    } catch (e) {
      // Outside Cloudflare (preview/dev on Node) `cloudflare:sockets` is missing — use nodemailer instead.
      if (usedWorker || !/cloudflare:sockets|cloudflare:|Unsupported URL scheme|ERR_UNSUPPORTED_ESM_URL_SCHEME|Cannot find/i.test(String((e as Error)?.message ?? e))) throw e;
      const mod = "nodemailer";
      const nm = (await import(/* @vite-ignore */ mod)) as typeof import("nodemailer");
      const t = (nm.default ?? nm).createTransport({ host: smtp.host, port: smtp.port, secure: smtp.secure === "ssl", requireTLS: smtp.secure === "starttls", auth: { user: username, pass: password } });
      via = "node"; const info = await t.sendMail({ from: `"${from.name}" <${from.email}>`, to, subject, text: body, html }); messageId = info.messageId; response = info.response;
    }
    await log("sent");
    return { sent: true, via, messageId, response, host: smtp.host, port: smtp.port, from: from.email };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("SMTP send failed:", msg);
    await log("failed", msg.slice(0, 500));
    return { sent: false as const, error: msg, host: smtp.host, port: smtp.port };
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

/** Admin: effective SMTP settings (fills in the server-stored account when the form was never saved). */
export const getSmtpStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: s } = await supabaseAdmin.from("smtp_settings").select("*").eq("id", true).single();
    const envUser = process.env["SMTP_USERNAME"] ?? "";
    return {
      provider: s?.provider ?? "gmail", host: s?.host ?? "smtp.gmail.com", port: s?.port ?? 465, secure: s?.secure ?? "ssl",
      username: s?.username || envUser, from_name: s?.from_name || "GetXpress", from_email: s?.from_email || s?.username || envUser,
      enabled: s?.username ? !!s.enabled : !!envUser, passwordSet: !!process.env["SMTP_PASSWORD"],
    };
  });

export const saveSmtpSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({
    provider: z.enum(["gmail", "hostinger", "custom"]), host: z.string().min(3).max(120), port: z.number().int().min(1).max(65535),
    secure: z.enum(["ssl", "starttls", "none"]), username: z.string().min(3).max(160), from_name: z.string().max(80),
    from_email: z.string().email().or(z.literal("")), enabled: z.boolean(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const r = await supabaseAdmin.from("smtp_settings").upsert({ id: true, ...data, from_email: data.from_email || null, updated_at: new Date().toISOString() });
    if (r.error) throw new Error(r.error.message);
    return { ok: true };
  });

/** Signed-in user: send the welcome email once (skips synthetic phone-login addresses). */
export const sendWelcomeEmail = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const email = (context.claims as { email?: string }).email;
    if (!email || email.endsWith("@phone.getxpress.in")) return { sent: false };
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("email_logs").select("id", { count: "exact", head: true }).eq("to_email", email).eq("template_key", "welcome");
    if (count) return { sent: false };
    const { data: p } = await supabaseAdmin.from("profiles").select("full_name").eq("id", context.userId).maybeSingle();
    const origin = new URL(process.env["PUBLIC_BASE_URL"] ?? "https://getxpress.in").origin;
    return sendTemplate("welcome", email, { name: (p as { full_name?: string } | null)?.full_name || email.split("@")[0]!, link: `${origin}/ship` });
  });
