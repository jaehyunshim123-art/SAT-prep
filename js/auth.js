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
    const [a, b] = await Promise.all([
      client.from("profiles").upsert(rows.profile, { onConflict: "user_id" }),
      client.from("user_settings").upsert(rows.settings, { onConflict: "user_id" }),
    ]);
    if (a.error) throw a.error;
    if (b.error) throw b.error;
  }

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
  };
})();
