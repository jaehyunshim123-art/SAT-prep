// SatWizz rewards: Sparks economy, Shop, Focus Elixir, Aura Shields,
// the Double-Spark Wager and achievement titles.
// Pure state logic with no DOM. Each function takes the app state, changes it,
// and returns what happened so the UI can react.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    sparksPerCorrect: 10,
    comboBonus: 5, // paid on every 3rd answer in a row (3, 6, 9...)
    comboEvery: 3,
    dailyGoalSparks: 50,
    chapterSparks: 50, // first completion of each chapter
    startSparks: 50, // new players' bankroll: earn the rest by practicing
    maxAura: 5,
    auraPrice: 50,
    auraBundleSize: 3,
    auraBundlePrice: 120,
    elixirPrice: 500, // Focus Elixir: Focus back to 100% (js/focus.js)
    comboSaverPrice: 40,
    maxComboSavers: 3,
    comboSaverMin: 3, // only protects combos of 3 or more
    auraEarnEvery: 7, // streak days per free Aura Shield
    wagerStake: 50,
    wagerPayout: 100,
    wagerDays: 5,
    fastRunLength: 5,
    fastRunMs: 60 * 1000,
  });

  const fail = (reason, extra = {}) => ({ ok: false, reason, ...extra });

  // ---------- Sparks ----------
  // `combo` is the combo count after this correct answer.
  function sparksForCorrect(combo) {
    const bonus = combo > 0 && combo % RULES.comboEvery === 0 ? RULES.comboBonus : 0;
    return { base: RULES.sparksPerCorrect, bonus, total: RULES.sparksPerCorrect + bonus };
  }

  function earn(state, amount) {
    state.sparks = (state.sparks || 0) + amount;
    return amount;
  }

  // ---------- Themes ----------
  const themeById = (id) => SW.themes.find((t) => t.id === id);

  function isThemeUnlocked(state, id) {
    if (id === "custom") return true;
    const t = themeById(id);
    if (!t) return false;
    return !t.price || state.unlockedThemes.includes(id);
  }

  function buyTheme(state, id) {
    const t = themeById(id);
    if (!t || !t.price) return fail("not-for-sale");
    if (isThemeUnlocked(state, id)) return fail("owned");
    if (state.sparks < t.price) return fail("short", { need: t.price - state.sparks });
    state.sparks -= t.price;
    state.unlockedThemes.push(id);
    return { ok: true, spent: t.price, theme: t };
  }

  // ---------- Aura Shields (protect a missed day) ----------
  function buyAura(state) {
    if (state.freezes >= RULES.maxAura) return fail("full");
    if (state.sparks < RULES.auraPrice) return fail("short", { need: RULES.auraPrice - state.sparks });
    state.sparks -= RULES.auraPrice;
    state.freezes += 1;
    return { ok: true, spent: RULES.auraPrice };
  }

  function buyAuraBundle(state) {
    const room = RULES.maxAura - state.freezes;
    if (room < RULES.auraBundleSize) return fail("room", { room });
    if (state.sparks < RULES.auraBundlePrice) return fail("short", { need: RULES.auraBundlePrice - state.sparks });
    state.sparks -= RULES.auraBundlePrice;
    state.freezes += RULES.auraBundleSize;
    return { ok: true, spent: RULES.auraBundlePrice };
  }

  // Free shield for every 7 streak days, if there's room.
  function earnAuraForStreak(state) {
    if (state.streak % RULES.auraEarnEvery !== 0 || state.freezes >= RULES.maxAura) return false;
    state.freezes += 1;
    return true;
  }

  // ---------- Double-Spark Wager ----------
  // Stake 50 now; if the streak grows by 5 more days, collect 100.
  // Today counts as day 1 if today's goal isn't done yet.
  function placeWager(state, todayKey) {
    if (state.wager) return fail("active");
    if (state.sparks < RULES.wagerStake) return fail("short", { need: RULES.wagerStake - state.sparks });
    state.sparks -= RULES.wagerStake;
    state.wager = {
      stake: RULES.wagerStake,
      startStreak: state.streak,
      target: state.streak + RULES.wagerDays,
      placedOn: todayKey,
    };
    return { ok: true, spent: RULES.wagerStake };
  }

  function wagerProgress(state) {
    const w = state.wager;
    if (!w) return null;
    const days = Math.max(0, Math.min(RULES.wagerDays, state.streak - w.startStreak));
    return { days, of: RULES.wagerDays };
  }

  // Call after the daily goal is met.
  function settleWager(state) {
    const w = state.wager;
    if (!w) return null;
    if (state.streak < w.startStreak) return loseWager(state);
    if (state.streak >= w.target) {
      state.wager = null;
      earn(state, RULES.wagerPayout);
      return { won: true, payout: RULES.wagerPayout };
    }
    return { won: false, ...wagerProgress(state) };
  }

  // Call when the streak breaks.
  function loseWager(state) {
    if (!state.wager) return null;
    const stake = state.wager.stake;
    state.wager = null;
    return { lost: true, stake };
  }

  // ---------- Focus Elixir ----------
  // Refills the Focus Meter (js/focus.js) to 100%.
  function buyElixir(state) {
    if (state.focus >= SW.focus.RULES.max) return fail("full");
    if (state.sparks < RULES.elixirPrice) return fail("short", { need: RULES.elixirPrice - state.sparks });
    state.sparks -= RULES.elixirPrice;
    SW.focus.refill(state);
    return { ok: true, spent: RULES.elixirPrice };
  }

  // ---------- Combo Savers ----------
  function buyComboSaver(state) {
    if (state.comboSavers >= RULES.maxComboSavers) return fail("full");
    if (state.sparks < RULES.comboSaverPrice) return fail("short", { need: RULES.comboSaverPrice - state.sparks });
    state.sparks -= RULES.comboSaverPrice;
    state.comboSavers += 1;
    return { ok: true, spent: RULES.comboSaverPrice };
  }

  // Call on a wrong answer before resetting the combo. True if a saver was spent.
  function useComboSaver(state) {
    if (state.combo < RULES.comboSaverMin || state.comboSavers <= 0) return false;
    state.comboSavers -= 1;
    return true;
  }

  // ---------- Avatars ----------
  const avatarById = (id) => SW.avatars.find((a) => a.id === id);

  function isAvatarUnlocked(state, id) {
    const a = avatarById(id);
    if (!a) return false;
    return !a.price || state.unlockedAvatars.includes(id);
  }

  function buyAvatar(state, id) {
    const a = avatarById(id);
    if (!a || !a.price) return fail("not-for-sale");
    if (isAvatarUnlocked(state, id)) return fail("owned");
    if (state.sparks < a.price) return fail("short", { need: a.price - state.sparks });
    state.sparks -= a.price;
    state.unlockedAvatars.push(id);
    return { ok: true, spent: a.price, avatar: a };
  }

  // ---------- Achievements ----------
  // Keeps timestamps of the current run of correct answers.
  // Returns true when the last 5 in a row took under 60 seconds.
  function trackFastRun(times, correct, now) {
    if (!correct) {
      times.length = 0;
      return false;
    }
    times.push(now);
    while (times.length > RULES.fastRunLength) times.shift();
    return times.length === RULES.fastRunLength && now - times[0] < RULES.fastRunMs;
  }

  // The 50 accomplishments live in js/badges.js (Profile → Trophy Case).
  const BADGES = SW.BADGE_LIST || [];

  const badgeById = (id) => BADGES.find((b) => b.id === id);

  // Returns badges unlocked by this check.
  function checkBadges(state, ctx = {}) {
    const fresh = [];
    for (const b of BADGES) {
      if (!state.badges.includes(b.id) && b.check(state, ctx)) {
        state.badges.push(b.id);
        // When it was unlocked: recent unlocks glow in the Trophy Case.
        state.badgeAt = state.badgeAt && typeof state.badgeAt === "object" ? state.badgeAt : {};
        state.badgeAt[b.id] = Date.now();
        fresh.push(b);
      }
    }
    return fresh;
  }

  SW.rewards = {
    RULES,
    sparksForCorrect,
    earn,
    isThemeUnlocked,
    buyTheme,
    buyAura,
    buyAuraBundle,
    earnAuraForStreak,
    buyElixir,
    buyComboSaver,
    useComboSaver,
    avatarById,
    isAvatarUnlocked,
    buyAvatar,
    placeWager,
    wagerProgress,
    settleWager,
    loseWager,
    trackFastRun,
    BADGES,
    badgeById,
    checkBadges,
  };
})();
