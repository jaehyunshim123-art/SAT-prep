// SatWizz accounts and cloud sync (Supabase).
// Exposes window.SatWizz.auth. Works without Supabase too: if the SDK or the
// config is missing, available() is false and the app stays in guest mode.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});
  const cfg = SW.config || {};
  const GOALS = [5, 10, 20];
  const PUSH_DELAY_MS = 1200;

  let client = null;
  let session = null;
  let unavailableReason = "";
  const authListeners = new Set();
  const statusListeners = new Set();
  let status = "idle"; // idle | pending | syncing | synced | error

  // ---------- Setup ----------
  function init() {
    if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) {
      unavailableReason = "not-configured";
      return false;
    }
    if (!window.supabase || typeof window.supabase.createClient !== "function") {
      unavailableReason = "sdk-missing";
      return false;
    }
    client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    });
    client.auth.onAuthStateChange((event, s) => {
      session = s;
      // Supabase warns against awaiting its own calls inside this callback,
      // so listeners run on the next tick.
      setTimeout(() => authListeners.forEach((fn) => fn(event, s)), 0);
    });
    return true;
  }

  const available = () => client !== null;
  const reason = () => unavailableReason;
  const user = () => (session && session.user) || null;

  function onChange(fn) {
    authListeners.add(fn);
    return () => authListeners.delete(fn);
  }

  function requireClient() {
    if (!client) {
      throw new Error(
        unavailableReason === "sdk-missing"
          ? "Couldn't reach the sign-in service. Check your connection and reload."
          : "Cloud accounts aren't set up on this copy of SatWizz yet."
      );
    }
  }

  const redirectUrl = () => location.origin + location.pathname;

  // ---------- Auth methods ----------
  async function signUp(email, password) {
    requireClient();
    const { data, error } = await client.auth.signUp({
      email,
      password,
      options: { emailRedirectTo: redirectUrl() },
    });
    if (error) throw error;
    // With email confirmation on, Supabase returns a user but no session.
    return { needsConfirmation: !data.session };
  }

  async function signIn(email, password) {
    requireClient();
    const { error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
  }

  async function signInWithGoogle() {
    requireClient();
    if (location.protocol === "file:") {
      throw new Error("Google sign-in needs SatWizz to be served over http(s), not opened as a file.");
    }
    const { error } = await client.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectUrl() },
    });
    if (error) throw error; // on success the browser leaves for Google
  }

  async function signOut() {
    if (!client) return;
    clearTimeout(pushTimer);
    const { error } = await client.auth.signOut();
    if (error) throw error;
    setStatus("idle");
  }

  // ---------- Cloud sync ----------
  function setStatus(next) {
    status = next;
    statusListeners.forEach((fn) => fn(status));
  }
  const getStatus = () => status;
  function onStatus(fn) {
    statusListeners.add(fn);
    return () => statusListeners.delete(fn);
  }

  // App state -> table rows
  function toRows(state, u) {
    const now = new Date().toISOString();
    return {
      profile: {
        user_id: u.id,
        email: u.email,
        current_streak: state.streak,
        best_streak: state.bestStreak,
        total_xp: state.xp,
        streak_freezes: state.freezes,
        last_goal_date: state.lastDone,
        sparks: state.sparks,
        unlocked_chapters: state.unlockedChapters,
        completed_chapters: state.completedChapters,
        unlocked_themes: state.unlockedThemes,
        unlocked_badges: state.badges,
        spark_wager: state.wager,
        unlocked_avatars: state.unlockedAvatars,
        combo_savers: state.comboSavers,
        vocab_progress: state.vocab,
        updated_at: now,
      },
      settings: {
        user_id: u.id,
        selected_theme: state.themeId,
        daily_goal: state.goal,
        custom_names: state.custom,
        avatar: state.avatar,
        updated_at: now,
      },
    };
  }

  async function pull() {
    requireClient();
    const u = user();
    if (!u) return { profile: null, settings: null };
    const [p, s] = await Promise.all([
      client.from("profiles").select("*").eq("user_id", u.id).maybeSingle(),
      client.from("user_settings").select("*").eq("user_id", u.id).maybeSingle(),
    ]);
    if (p.error) throw p.error;
    if (s.error) throw s.error;
    return { profile: p.data, settings: s.data };
  }

  async function push(state) {
    requireClient();
    const u = user();
    if (!u) return;
    const rows = toRows(state, u);
    const [a, b, c] = await Promise.all([
      client.from("profiles").upsert(rows.profile, { onConflict: "user_id" }),
      client.from("user_settings").upsert(rows.settings, { onConflict: "user_id" }),
      client.from("user_public").upsert(publicRow(state, u), { onConflict: "user_id" }),
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
    if (c.error) throw c.error;
  }

  // The leaderboard card. Username is only sent once it has been claimed, so a
  // sync never overwrites it with an empty value.
  function publicRow(state, u) {
    const row = {
      user_id: u.id,
      display_name: cleanDisplayName(state.displayName) || defaultDisplayName(u),
      avatar: state.avatar,
      total_xp: Math.max(0, Math.round(state.xp || 0)),
      sparks: Math.max(0, Math.round(state.sparks || 0)),
      current_streak: Math.max(0, Math.round(state.streak || 0)),
      updated_at: new Date().toISOString(),
    };
    if (state.username) row.username = state.username;
    return row;
  }

  const cleanDisplayName = (s) => String(s || "").replace(/\s+/g, " ").trim().slice(0, 30);
  const defaultDisplayName = (u) => {
    const local = String((u && u.email) || "").split("@")[0].replace(/[._-]+/g, " ").trim();
    return cleanDisplayName(local ? local.charAt(0).toUpperCase() + local.slice(1) : "SatWizz student");
  };

  // Debounced push; call after every local save.
  let pushTimer;
  function schedulePush(getState) {
    if (!client || !user()) return;
    clearTimeout(pushTimer);
    setStatus("pending");
    pushTimer = setTimeout(async () => {
      setStatus("syncing");
      try {
        await push(getState());
        setStatus("synced");
      } catch (e) {
        console.warn("SatWizz sync failed", e);
        setStatus("error");
      }
    }, PUSH_DELAY_MS);
  }

  const union = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])].filter((x) => typeof x === "string");
  const clampInt = (n, lo, hi) => Math.max(lo, Math.min(hi, Math.round(Number(n) || 0)));
  function cleanWager(w) {
    if (!w || typeof w !== "object") return null;
    const startStreak = clampInt(w.startStreak, 0, 1e6);
    return {
      stake: clampInt(w.stake, 0, 1e6),
      startStreak,
      target: clampInt(w.target, startStreak, 1e6),
      placedOn: typeof w.placedOn === "string" ? w.placedOn : null,
    };
  }

  // Combines this device's state with what the account already has.
  // - XP and best streak keep the higher value; the current streak comes from
  //   whichever side met its daily goal more recently.
  // - Unlocked and completed chapters, themes, badges and avatars are combined.
  // - Focus Shields are per session and never synced.
  // - Sparks, Combo Savers and the wager are spendable, so taking the max would undo
  //   purchases. If this device last synced with the same account, the newer
  //   side wins. Otherwise (guest progress, another account) keep the higher
  //   balance so nothing earned is lost.
  // - Saved settings win over this device's.
  // Returns only the fields to overwrite.
  function merge(local, cloud, userId) {
    const out = {};
    const p = cloud.profile;
    if (p) {
      out.xp = Math.max(local.xp || 0, p.total_xp || 0);
      const cloudDate = p.last_goal_date || null;
      const cloudStreakNewer =
        (cloudDate && (!local.lastDone || cloudDate > local.lastDone)) ||
        (cloudDate && cloudDate === local.lastDone && (p.current_streak || 0) > local.streak);
      if (cloudStreakNewer) {
        out.streak = p.current_streak || 0;
        out.lastDone = cloudDate;
        out.freezes = p.streak_freezes || 0;
      }
      out.bestStreak = Math.max(local.bestStreak || 0, p.best_streak || 0, out.streak || 0, local.streak || 0);

      const chapterIds = new Set((SW.chapters || []).map((c) => c.id));
      const chapters = (a, b) => [...new Set([...(Array.isArray(a) ? a : []), ...(Array.isArray(b) ? b : [])])]
        .filter((id) => chapterIds.has(id)).sort((x, y) => x - y);
      out.unlockedChapters = chapters([1, ...(local.unlockedChapters || [])], p.unlocked_chapters);
      out.completedChapters = chapters(local.completedChapters, p.completed_chapters);
      out.unlockedThemes = union(local.unlockedThemes, p.unlocked_themes);
      out.badges = union(local.badges, p.unlocked_badges);
      // Vocab Vault: per word, the most recently answered side wins.
      if (SW.vocab) out.vocab = SW.vocab.mergeProgress(local.vocab, p.vocab_progress);
      const avatarIds = new Set((SW.avatars || []).map((a) => a.id));
      out.unlockedAvatars = union(local.unlockedAvatars, p.unlocked_avatars).filter((id) => avatarIds.has(id));

      if (typeof p.sparks === "number") {
        const sameAccount = Boolean(userId) && local.syncedUserId === userId;
        const cloudNewer = (Date.parse(p.updated_at) || 0) > (local.updatedAt || 0);
        if (sameAccount) {
          if (cloudNewer) {
            out.sparks = clampInt(p.sparks, 0, 1e9);
            out.wager = cleanWager(p.spark_wager);
            out.comboSavers = clampInt(p.combo_savers, 0, 3);
          }
        } else {
          out.sparks = Math.max(local.sparks || 0, clampInt(p.sparks, 0, 1e9));
          out.comboSavers = Math.max(local.comboSavers || 0, clampInt(p.combo_savers, 0, 3));
          if (!local.wager) out.wager = cleanWager(p.spark_wager);
        }
      }
    }
    const s = cloud.settings;
    if (s) {
      if (s.selected_theme) out.themeId = s.selected_theme;
      if (GOALS.includes(s.daily_goal)) out.goal = s.daily_goal;
      if (s.avatar && (SW.avatars || []).some((a) => a.id === s.avatar)) out.avatar = s.avatar;
      const c = s.custom_names;
      if (c && Array.isArray(c.people) && c.people.length === 3) {
        out.custom = {
          people: c.people.map((x) => ({
            name: String((x && x.name) || "").slice(0, 24),
            pro: ["he", "she", "they"].includes(x && x.pro) ? x.pro : "they",
          })),
          place: String(c.place || "").slice(0, 40),
          craft: String(c.craft || "").slice(0, 40),
          event: String(c.event || "").slice(0, 40),
        };
      }
      out.castChosen = true;
    }
    return out;
  }

  // ======================================================================
  // Social: usernames, friends, friend streaks, leaderboards, Lock In.
  // All of these need a signed-in user; they throw friendly Errors.
  // ======================================================================
  const USERNAME_RE = /^[a-z0-9_]{3,20}$/;
  const PUBLIC_COLS = "user_id, username, display_name, avatar, total_xp, sparks, current_streak, last_practice_at";
  const FRIENDLY = {
    user_not_found: "No one has that username. Check the spelling.",
    cannot_friend_self: "That's your own username.",
    not_friends: "You can only Lock In friends.",
    already_locked_in: "You already sent a Lock In. Try again in a few hours.",
    request_not_found: "That request is no longer there.",
    not_signed_in: "Sign in first.",
  };

  function friendly(err) {
    const msg = (err && (err.message || err.error)) || String(err || "");
    const code = Object.keys(FRIENDLY).find((k) => msg.includes(k));
    if (code) return new Error(FRIENDLY[code]);
    if (err && err.code === "23505") return new Error("That username is taken.");
    if (/failed to fetch|network/i.test(msg)) return new Error("Couldn't reach the server. Check your connection.");
    return new Error(msg || "Something went wrong. Try again.");
  }

  function me() {
    requireClient();
    const u = user();
    if (!u) throw new Error(FRIENDLY.not_signed_in);
    return u;
  }

  const normalizeUsername = (s) => String(s || "").trim().replace(/^@/, "").toLowerCase();

  // Claim or change your @username. Returns the saved username.
  async function claimUsername(name, state) {
    const u = me();
    const username = normalizeUsername(name);
    if (!USERNAME_RE.test(username)) throw new Error("Use 3–20 lowercase letters, numbers or underscores.");
    const row = { ...publicRow(state, u), username };
    const { error } = await client.from("user_public").upsert(row, { onConflict: "user_id" });
    if (error) throw friendly(error);
    return username;
  }

  // Returns { username, displayName } for the signed-in user, giving a new
  // account a username like "maya_4821" so friends can find it.
  async function ensureUsername(state) {
    const u = me();
    const { data } = await client.from("user_public").select("username, display_name").eq("user_id", u.id).maybeSingle();
    const displayName = (data && data.display_name) || cleanDisplayName(state.displayName) || defaultDisplayName(u);
    if (data && data.username) return { username: data.username, displayName };
    const base = (String(u.email || "").split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "") || "wizz").slice(0, 14).padEnd(3, "x");
    for (let i = 0; i < 6; i++) {
      const candidate = `${base}_${Math.floor(1000 + Math.random() * 9000)}`;
      try {
        return { username: await claimUsername(candidate, { ...state, displayName }), displayName };
      } catch (e) {
        if (!/taken/.test(e.message)) throw e;
      }
    }
    throw new Error("Couldn't pick a username. Choose one in Profile.");
  }

  async function searchUsers(query) {
    const u = me();
    const q = normalizeUsername(query).replace(/[^a-z0-9_]/g, "");
    if (q.length < 2) return [];
    const { data, error } = await client.from("user_public").select(PUBLIC_COLS)
      .ilike("username", `${q}%`).neq("user_id", u.id).order("username").limit(8);
    if (error) throw friendly(error);
    return data || [];
  }

  async function sendFriendRequest(username) {
    me();
    const { data, error } = await client.rpc("send_friend_request", { target_username: normalizeUsername(username) });
    if (error) throw friendly(error);
    return data; // friendships row; status "accepted" if they had already asked you
  }

  async function respondFriendRequest(id, accept) {
    me();
    const { error } = await client.rpc("respond_friend_request", { request_id: id, accept });
    if (error) throw friendly(error);
  }

  const utcDay = (d = new Date()) => d.toISOString().slice(0, 10);
  const utcYesterday = () => utcDay(new Date(Date.now() - 864e5));

  // Friends with their public cards and the shared streak.
  async function listFriends() {
    const u = me();
    const { data: rows, error } = await client.from("friendships").select("*");
    if (error) throw friendly(error);
    const otherId = (f) => (f.user_low === u.id ? f.user_high : f.user_low);
    const ids = [...new Set((rows || []).map(otherId))];
    let cards = [];
    if (ids.length) {
      const res = await client.from("user_public").select(PUBLIC_COLS).in("user_id", ids);
      if (res.error) throw friendly(res.error);
      cards = res.data || [];
    }
    const byId = Object.fromEntries(cards.map((c) => [c.user_id, c]));
    const alive = (f) => f.streak_date && f.streak_date >= utcYesterday();
    const out = { friends: [], incoming: [], outgoing: [] };
    for (const f of rows || []) {
      const profile = byId[otherId(f)] || { user_id: otherId(f), display_name: "Friend", avatar: "fox" };
      const lastAt = profile.last_practice_at ? Date.parse(profile.last_practice_at) : 0;
      const entry = {
        id: f.id,
        profile,
        streak: alive(f) ? f.streak : 0,
        practicedRecently: Date.now() - lastAt < 20 * 3600e3, // "active" for Lock In purposes
        lastPracticeAt: lastAt || null,
      };
      if (f.status === "accepted") out.friends.push(entry);
      else if (f.requested_by === u.id) out.outgoing.push(entry);
      else out.incoming.push(entry);
    }
    out.friends.sort((a, b) => b.streak - a.streak || (b.profile.total_xp || 0) - (a.profile.total_xp || 0));
    return out;
  }

  // scope: "global" (top 50) or "friends"; metric: "xp" or "sparks".
  async function leaderboard(scope, metric, mine) {
    const u = me();
    const col = metric === "sparks" ? "sparks" : "total_xp";
    let rows;
    if (scope === "friends") {
      const { data: fr, error } = await client.from("friendships").select("user_low, user_high").eq("status", "accepted");
      if (error) throw friendly(error);
      const ids = [u.id, ...(fr || []).map((f) => (f.user_low === u.id ? f.user_high : f.user_low))];
      const res = await client.from("user_public").select(PUBLIC_COLS).in("user_id", ids).order(col, { ascending: false });
      if (res.error) throw friendly(res.error);
      rows = res.data || [];
    } else {
      const res = await client.from("user_public").select(PUBLIC_COLS).order(col, { ascending: false }).limit(50);
      if (res.error) throw friendly(res.error);
      rows = res.data || [];
    }
    // Your rank = 1 + number of people strictly ahead of you.
    let myRank = rows.findIndex((r) => r.user_id === u.id) + 1 || null;
    if (!myRank && scope === "global" && mine != null) {
      const { count, error } = await client.from("user_public").select("user_id", { count: "exact", head: true }).gt(col, mine);
      if (!error && typeof count === "number") myRank = count + 1;
    }
    return { rows, myRank, column: col };
  }

  // Marks you active and grows friend streaks. Cheap; the app throttles it.
  async function recordPractice() {
    if (!client || !user()) return;
    const { error } = await client.rpc("record_practice");
    if (error) console.warn("SatWizz: record_practice failed", error);
  }

  // Lock In a friend: the Edge Function stores the alert and pushes it. If the
  // function isn't deployed, fall back to storing it (in-app alert only).
  async function sendLockIn(friendId) {
    me();
    const { data, error } = await client.functions.invoke("lock-in", { body: { friendId } });
    if (!error) return { pushed: (data && data.sent) > 0, message: data && data.message };
    let status = 0;
    let body = null;
    try {
      status = error.context && error.context.status;
      body = error.context && typeof error.context.json === "function" ? await error.context.json() : null;
    } catch (e) { /* not JSON */ }
    if (body && body.error && status >= 400 && status < 500 && status !== 404) throw friendly(body);
    // Not deployed (404) or unreachable: store it directly so it still shows in-app.
    const res = await client.rpc("send_lock_in", { target: friendId });
    if (res.error) throw friendly(res.error);
    return { pushed: false, message: res.data && res.data.message };
  }

  async function unreadLockIns() {
    const u = me();
    const { data, error } = await client.from("lock_ins").select("*")
      .eq("to_user", u.id).is("read_at", null).order("created_at", { ascending: false }).limit(5);
    if (error) throw friendly(error);
    return data || [];
  }

  async function markLockInsRead(ids) {
    if (!ids.length) return;
    me();
    const { error } = await client.from("lock_ins").update({ read_at: new Date().toISOString() }).in("id", ids);
    if (error) console.warn("SatWizz: couldn't mark Lock In read", error);
  }

  // Live in-app alerts while the app is open. Returns an unsubscribe function.
  function subscribeLockIns(onAlert) {
    const u = user();
    if (!client || !u || typeof client.channel !== "function") return () => {};
    const channel = client
      .channel(`lock-ins-${u.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "lock_ins", filter: `to_user=eq.${u.id}` },
        (payload) => onAlert(payload.new))
      .subscribe();
    return () => client.removeChannel(channel);
  }

  // ---------- Web Push ----------
  const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  const isStandalone = () => matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;

  // unsupported | not-configured | needs-install | default | denied | enabled
  async function pushState() {
    if (!cfg.vapidPublicKey) return "not-configured";
    if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) {
      return isIOS() && !isStandalone() ? "needs-install" : "unsupported";
    }
    if (Notification.permission === "denied") return "denied";
    try {
      const reg = await navigator.serviceWorker.getRegistration();
      const sub = reg && (await reg.pushManager.getSubscription());
      if (sub && Notification.permission === "granted") return "enabled";
    } catch (e) { /* treat as not enabled */ }
    return "default";
  }

  function urlBase64ToUint8Array(base64) {
    const padded = (base64 + "=".repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, "+").replace(/_/g, "/");
    const raw = atob(padded);
    return Uint8Array.from(raw, (c) => c.charCodeAt(0));
  }

  // Must be called from a tap (browsers require a user gesture for the prompt).
  async function enablePush() {
    me();
    const state = await pushState();
    if (state === "needs-install") throw new Error("On iPhone, add SatWizz to your Home Screen first (Share → Add to Home Screen), then turn alerts on there.");
    if (state === "unsupported") throw new Error("This browser doesn't support notifications.");
    if (state === "not-configured") throw new Error("Push alerts aren't set up on this copy of SatWizz yet.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Notifications are blocked. Allow them in your browser settings to get Lock In alerts.");
    const reg = await navigator.serviceWorker.register("sw.js");
    await navigator.serviceWorker.ready;
    const sub = (await reg.pushManager.getSubscription()) ||
      (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(cfg.vapidPublicKey) }));
    const { endpoint, keys } = sub.toJSON();
    const { error } = await client.from("push_subscriptions")
      .upsert({ user_id: user().id, endpoint, p256dh: keys.p256dh, auth: keys.auth }, { onConflict: "endpoint" });
    if (error) throw friendly(error);
    return "enabled";
  }

  async function disablePush() {
    const reg = "serviceWorker" in navigator ? await navigator.serviceWorker.getRegistration() : null;
    const sub = reg && (await reg.pushManager.getSubscription());
    if (!sub) return;
    if (client && user()) await client.from("push_subscriptions").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }

  SW.auth = {
    init,
    available,
    reason,
    user,
    onChange,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    pull,
    push,
    schedulePush,
    merge,
    status: getStatus,
    onStatus,
    defaultDisplayName,
    // social
    claimUsername,
    ensureUsername,
    searchUsers,
    sendFriendRequest,
    respondFriendRequest,
    listFriends,
    leaderboard,
    recordPractice,
    sendLockIn,
    unreadLockIns,
    markLockInsRead,
    subscribeLockIns,
    pushState,
    enablePush,
    disablePush,
  };
})();
