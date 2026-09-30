// SatWizz "Lock In" Edge Function.
//
// POST { friendId } with the signed-in user's JWT (supabase.functions.invoke
// sends it automatically). The function:
//   1. calls send_lock_in() as that user, which checks the friendship and the
//      4-hour rate limit and stores the alert (so it also shows in-app);
//   2. sends a Web Push notification to every device the friend registered;
//   3. removes subscriptions the push service reports as expired.
//
// Secrets (supabase secrets set ...): VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY,
// VAPID_SUBJECT (e.g. "mailto:you@example.com"), and optionally APP_URL.
// SUPABASE_URL, SUPABASE_ANON_KEY and SUPABASE_SERVICE_ROLE_KEY are provided
// by Supabase automatically.
import { createClient } from "npm:@supabase/supabase-js@2";
import webpush from "npm:web-push@3.6.7";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json" } });

const env = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) throw new Error(`Missing secret ${name}`);
  return value;
};

// Database errors that mean "the request was fine, the answer is no".
const USER_ERRORS = ["not_signed_in", "not_friends", "already_locked_in"];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  let friendId: string;
  try {
    ({ friendId } = await req.json());
    if (typeof friendId !== "string" || !/^[0-9a-f-]{36}$/i.test(friendId)) throw new Error();
  } catch {
    return json({ error: "friendId is required" }, 400);
  }

  const supabaseUrl = env("SUPABASE_URL");

  // 1. Store the alert as the calling user (RLS and the function's checks apply).
  const asUser = createClient(supabaseUrl, env("SUPABASE_ANON_KEY"), {
    global: { headers: { Authorization: req.headers.get("Authorization") ?? "" } },
    auth: { persistSession: false },
  });
  const { data: lockIn, error } = await asUser.rpc("send_lock_in", { target: friendId });
  if (error) {
    const code = USER_ERRORS.find((e) => error.message.includes(e));
    return json({ error: code ?? error.message }, code ? 400 : 500);
  }

  // 2. Push to the friend's devices.
  const admin = createClient(supabaseUrl, env("SUPABASE_SERVICE_ROLE_KEY"), { auth: { persistSession: false } });
  const { data: subs, error: subsError } = await admin
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("user_id", friendId);
  if (subsError) return json({ ok: true, stored: true, sent: 0, warning: subsError.message });

  let vapidReady = true;
  try {
    webpush.setVapidDetails(env("VAPID_SUBJECT"), env("VAPID_PUBLIC_KEY"), env("VAPID_PRIVATE_KEY"));
  } catch (e) {
    vapidReady = false;
    console.error(e);
  }
  if (!vapidReady || !subs?.length) return json({ ok: true, stored: true, sent: 0 });

  const payload = JSON.stringify({
    title: "Lock In 🔒",
    body: lockIn.message,
    url: Deno.env.get("APP_URL") ?? "./",
    tag: `lock-in-${lockIn.from_user}`,
  });

  const stale: number[] = [];
  let sent = 0;
  await Promise.all(
    subs.map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload,
          { TTL: 60 * 60 * 12, urgency: "high" },
        );
        sent++;
      } catch (e) {
        const status = (e as { statusCode?: number }).statusCode;
        if (status === 404 || status === 410) stale.push(s.id);
        else console.error("push failed", status, (e as Error).message);
      }
    }),
  );

  // 3. Forget devices whose subscription has expired.
  if (stale.length) await admin.from("push_subscriptions").delete().in("id", stale);

  return json({ ok: true, stored: true, sent });
});
