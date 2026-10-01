(function () {
  "use strict";

  const SW = window.SatWizz;
  SW.curriculum.build(); // every chapter file has registered by now
  const QUESTIONS = SW.questions;
  const THEMES = SW.themes;
  const PRONOUNS = SW.pronouns;
  const CHAPTERS = SW.chapters;
  const chapterById = SW.chapterById;
  const CORE_CHAPTERS = SW.CORE_CHAPTERS;
  const REVIEW_ID = "review"; // mixed review of completed chapters
  const SAVE_VERSION = 3; // 3: 7-chapter curriculum, Focus 0-100%
  const auth = SW.auth;
  const onboarding = SW.onboarding;
  const sfx = SW.sfx;
  const rewards = SW.rewards;
  const RULES = rewards.RULES;
  const BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const STORE_KEY = "satwizz.v1";
  const LEGACY_STORE_KEY = "brainblast-sat.v1"; // pre-rebrand saves
  const SIGNUP_PROMPT_COMBO = 3;
  const GOALS = [5, 10, 20];
  const FOCUS = SW.focus; // the 0-100% Focus Meter (js/focus.js)
  const REVIEW_LENGTH = FOCUS.RULES.restoreStreak; // Focus Break: this many right in a row

  // ---------- State ----------
  const DEFAULTS = {
    name: "",
    themeId: SW.defaultThemeId,
    castChosen: false,
    custom: {
      people: [
        { name: "", pro: "he" },
        { name: "", pro: "she" },
        { name: "", pro: "they" },
      ],
      place: "",
      craft: "",
      event: "",
    },
    goal: 5,
    xp: 0,
    combo: 0,
    bestCombo: 0,
    streak: 0,
    bestStreak: 0,
    lastDone: null, // date key of the last day the goal was met
    freezes: 0, // Aura Shields (synced as streak_freezes)
    days: {}, // dateKey -> { n, c, done, frozen }
    skills: {}, // skill -> { seen, right }
    missed: [], // question ids answered wrong and not yet fixed
    guest: false, // chose "Continue as Guest", so don't prompt again on a combo
    // curriculum
    chapterId: 1, // current chapter (1-10) or "review"
    unlockedChapters: [1],
    completedChapters: [],
    chapterCorrect: {}, // chapterId -> question ids answered correctly
    // gamification
    sparks: RULES.startSparks, // new players start with 2,500 ⚡
    focus: FOCUS.RULES.max, // Focus Meter 0-100%, kept between sessions (js/focus.js)
    focusStreak: 0, // right answers in a row toward the next +25%
    unlockedThemes: [],
    badges: [],
    title: null, // equipped badge id
    wager: null,
    totalCorrect: 0,
    comboSavers: 0,
    avatar: SW.defaultAvatarId,
    unlockedAvatars: [],
    // Vocab Vault spaced-repetition progress (see js/vocab.js)
    vocab: SW.vocab.emptyProgress(),
    // social
    username: "", // @handle, claimed on first sign-in
    displayName: "",
    lbScope: "global", // leaderboard tab: "global" | "friends"
    lbMetric: "xp", // rank by "xp" | "sparks"
    derbyChapter: null, // unit the Derby races on (defaults to the current chapter)
    genSeed: 0, // per-player seed: question casts and the no-repeat order of generated questions
    genCursor: {}, // chapterId -> how many generated questions you've been served
    // Review for Understanding tests (8/10 unlocks the next chapter) and
    // practice sets: chapterId -> { best, last, n, passed, attempts, at }
    tests: {},
    practiceSets: {},
    focusResetAt: 0, // ms of the last hourly Focus recharge
    // Trophy Case (js/badges.js): 10/10 sets, unlock times, first-run seeding
    flawless: 0,
    badgeAt: {}, // badge id -> ms unlocked (recent ones glow)
    trophySeeded: false,
    // settings
    muted: false,
    haptics: true,
    demo: false, // Demo Mode: everything unlocked, nothing synced
    // sync bookkeeping
    updatedAt: 0, // ms of the last change made on this device
    syncedUserId: null, // account this device last merged with
    v: SAVE_VERSION,
  };

  let S = load();
  if (!S.genSeed) S.genSeed = (Math.floor(Math.random() * 2 ** 31) || 1);

  function normalize(saved) {
    const s = { ...structuredClone(DEFAULTS), ...saved, custom: { ...DEFAULTS.custom, ...(saved.custom || {}) } };
    if (!Array.isArray(s.unlockedThemes)) s.unlockedThemes = [];
    if (!Array.isArray(s.badges)) s.badges = [];
    if (!Array.isArray(s.missed)) s.missed = [];
    if (!Array.isArray(s.unlockedAvatars)) s.unlockedAvatars = [];
    s.vocab = SW.vocab.mergeProgress(s.vocab, null); // fills defaults, drops unknown words
    if (!SW.avatars.some((a) => a.id === s.avatar)) s.avatar = SW.defaultAvatarId;
    // Saves from before Sparks existed: count correct answers from skill stats.
    if (typeof saved.totalCorrect !== "number") {
      s.totalCorrect = Object.values(s.skills || {}).reduce((n, k) => n + (k.right || 0), 0);
    }
    // Saves from before the 7-chapter curriculum: renumber chapters
    // (old 2-10 → 1-9; old chapter 1 was retired) and turn the 3 Focus
    // Shields into a full 0-100% Focus Meter.
    if ((saved.v || 1) < 3) {
      const map = (id) => SW.LEGACY_CHAPTER_MAP[id];
      const ids = (list) => (Array.isArray(list) ? list.map(map).filter(Boolean) : []);
      s.unlockedChapters = ids(saved.unlockedChapters);
      s.completedChapters = ids(saved.completedChapters);
      const cc = {};
      for (const [k, v] of Object.entries(saved.chapterCorrect || {})) if (map(Number(k))) cc[map(Number(k))] = v;
      s.chapterCorrect = cc;
      s.chapterId = saved.chapterId === REVIEW_ID ? REVIEW_ID : map(saved.chapterId) || 1;
      s.focus = FOCUS.RULES.max;
      s.focusStreak = 0;
    }
    s.focus = FOCUS.clamp(s.focus);
    // Drop question ids that no longer exist and old filters.
    s.missed = s.missed.filter((id) => BY_ID[id]);
    delete s.filter;
    delete s.focusDay;
    const validChapter = (id) => Number.isInteger(id) && chapterById(id);
    s.unlockedChapters = [...new Set([1, ...(s.unlockedChapters || []).filter(validChapter)])];
    s.completedChapters = [...new Set((s.completedChapters || []).filter(validChapter))];
    if (!s.chapterCorrect || typeof s.chapterCorrect !== "object") s.chapterCorrect = {};
    if (!s.tests || typeof s.tests !== "object") s.tests = {};
    if (!s.practiceSets || typeof s.practiceSets !== "object") s.practiceSets = {};
    if (!s.badgeAt || typeof s.badgeAt !== "object") s.badgeAt = {};
    if (s.chapterId !== REVIEW_ID && !s.unlockedChapters.includes(s.chapterId)) s.chapterId = 1;
    // Packs that used to be free stay free for anyone who played before v2,
    // and anyone already using a cast that became paid keeps it.
    if ((saved.v || 1) < 2) {
      const played = (saved.xp || 0) > 0 || (saved.totalCorrect || 0) > 0 || Object.keys(saved.days || {}).length > 0;
      if (played) SW.legacyFreeThemes.forEach((id) => { if (!s.unlockedThemes.includes(id)) s.unlockedThemes.push(id); });
    }
    s.v = SAVE_VERSION;
    const current = THEMES.find((t) => t.id === s.themeId);
    if (current && current.price && !s.unlockedThemes.includes(current.id)) s.unlockedThemes.push(current.id);
    return s;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY) || localStorage.getItem(LEGACY_STORE_KEY);
      if (raw) return normalize(JSON.parse(raw));
    } catch (e) { /* storage unavailable: start fresh */ }
    return structuredClone(DEFAULTS);
  }

  // touch=false for bookkeeping (day rollover) so a stale device doesn't look
  // newer than the cloud when merging. Demo Mode never reaches the cloud.
  function save(touch = true) {
    if (touch) S.updatedAt = Date.now();
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
    if (!S.demo) auth.schedulePush(() => S);
    queueBadgeCheck();
  }

  // Accomplishments can come from anywhere (Vault, Derby, Shop, tests), so
  // every save schedules one check of all 50 badges.
  let badgeTimer = null;
  function queueBadgeCheck() {
    if (badgeTimer || !S.trophySeeded) return;
    badgeTimer = setTimeout(() => {
      badgeTimer = null;
      const fresh = rewards.checkBadges(S, {});
      if (!fresh.length) return;
      save();
      announceBadges(fresh);
      if (currentView === "you" && youTab === "profile") renderStreak();
    }, 0);
  }

  // ---------- Dates ----------
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => keyOf(new Date());
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const dayDiff = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
  const today = () => (S.days[todayKey()] ||= { n: 0, c: 0 });

  // Missed days: spend Aura Shields if there are enough, otherwise the streak
  // (and any wager) is lost.
  function rollover() {
    const t = todayKey();
    let changed = false;
    if (S.lastDone && S.streak > 0) {
      const gap = dayDiff(S.lastDone, t);
      if (gap > 1) {
        const missedDays = gap - 1;
        if (S.freezes >= missedDays) {
          for (let i = 1; i <= missedDays; i++) {
            const k = addDays(S.lastDone, i);
            S.days[k] = { ...(S.days[k] || { n: 0, c: 0 }), frozen: true };
          }
          S.freezes -= missedDays;
          S.lastDone = addDays(t, -1);
          toast(`💠 ${missedDays === 1 ? "An Aura Shield" : missedDays + " Aura Shields"} saved your ${S.streak}-day streak`);
        } else {
          const lost = rewards.loseWager(S);
          toast(`Your ${S.streak}-day streak ended${lost ? ` and your ${lost.stake} ⚡ wager was lost` : ""}. Start a new one today.`);
          S.streak = 0;
        }
        changed = true;
      }
    }
    if (changed) save(false);
  }

  const doneToday = () => S.lastDone === todayKey();
  const atRisk = () => S.streak > 0 && !doneToday();

  // ---------- Personalization ----------
  function castOf(themeId = S.themeId) {
    if (themeId === "custom") {
      const fallback = THEMES[0];
      const c = S.custom;
      return {
        people: c.people.map((p, i) => ({ name: p.name.trim() || fallback.people[i].name, pro: p.pro })),
        place: c.place.trim() || fallback.place,
        craft: c.craft.trim() || fallback.craft,
        event: c.event.trim() || fallback.event,
      };
    }
    const t = THEMES.find((x) => x.id === themeId);
    return t && rewards.isThemeUnlocked(S, t.id) ? t : THEMES[0];
  }

  // Casts have 8 people; each question uses 3 of them for its NAME_1..3 slots,
  // picked by a seeded shuffle so the same question always shows the same 3.
  function castFor(key) {
    const base = castOf();
    if (!key || base.people.length <= 3) return base;
    const people = SW.rng.shuffle(base.people, SW.rng.hash(String(key)) ^ (S.genSeed >>> 0)).slice(0, 3);
    return { ...base, people };
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  // Swaps {{NAME_1}}, {{NAME_2_POSS}}, {{LOCATION}} etc. for the chosen cast.
  // Returns HTML; names are highlighted unless mark=false.
  const PLACEHOLDER = /\{\{(?:NAME_([123])(?:_(POSS|OBJ))?|(LOCATION|EVENT|SKILL))\}\}/g;
  function fill(template, cast = castOf(), mark = true) {
    return esc(template).replace(PLACEHOLDER, (m, n, form, flavorKey) => {
      if (n) {
        const p = cast.people[Number(n) - 1];
        if (form) return esc(PRONOUNS[p.pro][form === "POSS" ? "his" : "him"]);
        return mark ? `<span class="cast">${esc(p.name)}</span>` : esc(p.name);
      }
      const flavor = { LOCATION: cast.place, SKILL: cast.craft, EVENT: cast.event }[flavorKey];
      return flavor != null ? esc(flavor) : m;
    });
  }

  const castNames = (t) => `${t.people.slice(0, 3).map((p) => p.name).join(", ")} + ${t.people.length - 3} more`;

  // Free casts first, then packs by price.
  const themesForPicker = () => THEMES.slice().sort((a, b) => (a.price || 0) - (b.price || 0));

  // A cast button for the welcome card and the Personalize view.
  function castButton(t, onPick) {
    const locked = !rewards.isThemeUnlocked(S, t.id);
    const sub = t.id === "custom" ? "Type any names you like" : castNames(t);
    const b = h("button", {
      class: `cast-btn${locked ? " locked" : ""}`,
      type: "button",
      "data-id": t.id,
      "aria-pressed": String(t.id === S.themeId),
    }, `<b>${esc(t.label)}</b><span>${locked ? `🔒 ${fmt(t.price)} ⚡ in the Shop` : esc(sub)}</span>`);
    b.addEventListener("click", () => {
      if (locked) {
        show("shop");
        toast(`Unlock ${t.label} in the Shop for ${fmt(t.price)} ⚡`);
        return;
      }
      onPick(t);
    });
    return b;
  }

  const currentAvatar = () => rewards.avatarById(S.avatar) || rewards.avatarById(SW.defaultAvatarId);

  // ---------- Question queue ----------
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // A chapter runs through a queue of its questions. Wrong answers go back
  // into the queue, so the chapter is complete once every question has been
  // answered correctly. Mixed review never runs out.
  let queue = []; // { id, isRetry }
  // After the core set (or when you reopen a finished chapter), the feed keeps
  // going with generated questions (js/curriculum/gen/) in a per-player
  // shuffled order. S.genCursor counts what's been served, so nothing repeats
  // until the chapter's whole pool has been seen; then a new lap starts in a
  // fresh order.
  let streaming = false;
  const genOrders = {};
  function nextGenId(chId) {
    const ch = chapterById(chId);
    if (!ch || !ch.pool || !ch.pool.length) return null;
    const n = S.genCursor[chId] || 0;
    const lap = Math.floor(n / ch.pool.length);
    const key = `${chId}:${lap}`;
    const order = (genOrders[key] ||= SW.rng.shuffle(ch.pool.map((q) => q.id), ((S.genSeed >>> 0) ^ Math.imul(chId + 1, 2654435761) ^ lap) >>> 0));
    S.genCursor[chId] = n + 1;
    return order[n % order.length];
  }
  let served = 0;
  let lastId = null;
  let completeShown = false;

  const inReview = () => S.chapterId === REVIEW_ID;
  const currentChapter = () => (inReview() ? null : chapterById(S.chapterId));
  const correctIn = (chId) => (S.chapterCorrect[chId] ||= []);
  const isUnlocked = (chId) => S.unlockedChapters.includes(chId);
  const isComplete = (chId) => S.completedChapters.includes(chId);
  // Mixed review opens once any core chapter is complete.
  const reviewOpen = () => S.completedChapters.some((id) => !chapterById(id).bonus);

  function buildQueue() {
    const ch = currentChapter();
    if (ch) {
      const done = new Set(correctIn(ch.id));
      // In progress: only what's left. Replay of a finished chapter: everything.
      // The pop-culture set (questions with a rule line) comes first, then the
      // extra practice, each shuffled.
      // A finished chapter skips straight to fresh generated questions.
      // (Bonus chapters have no generated pool, so they replay their core set.)
      const stream = isComplete(ch.id) && ch.pool.length > 0;
      const left = stream ? [] : ch.questions.filter((q) => isComplete(ch.id) || !done.has(q.id));
      queue = [...shuffle(left.filter((q) => q.rule)), ...shuffle(left.filter((q) => !q.rule))]
        .map((q) => ({ id: q.id, isRetry: false }));
    } else {
      queue = [];
    }
  }

  // Mixed review: missed questions first, then a shuffle of completed chapters.
  function refillReview() {
    const pool = QUESTIONS.filter((q) => isComplete(q.chapterId)).map((q) => q.id);
    const missed = shuffle(S.missed.filter((id) => pool.includes(id)));
    const rest = shuffle(pool.filter((id) => !missed.includes(id)));
    queue.push(...[...missed, ...rest].map((id) => ({ id, isRetry: false })));
    if (queue.length > 1 && queue[0].id === lastId) queue.push(queue.shift());
  }

  function nextQuestion() {
    if (inReview() && !queue.length) refillReview();
    let next = queue.shift();
    if (!next && streaming && currentChapter()) {
      const id = nextGenId(S.chapterId);
      if (id) next = { id, isRetry: false };
    }
    if (!next) return null;
    served++;
    lastId = next.id;
    return { q: BY_ID[next.id], isRetry: next.isRetry };
  }

  // Wrong answer: see it again two cards later (or at the end of a short queue).
  function requeue(id) {
    queue.splice(Math.min(2, queue.length), 0, { id, isRetry: true });
  }

  // ---------- DOM helpers ----------
  const $ = (sel, root = document) => root.querySelector(sel);
  const h = (tag, attrs = {}, html = "") => {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) {
      if (k === "class") el.className = v;
      else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v);
    }
    if (html) el.innerHTML = html;
    return el;
  };
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- App shell ----------
  const app = $("#app");
  app.innerHTML = `
    <header class="hud">
      <div class="brand" id="brand" aria-label="SatWizz"><b class="b-pre">Sat</b><span class="b-w">W<span class="b-izz">izz</span></span><em class="demo-badge" id="demo-badge" hidden>DEMO</em></div>
      <button class="pill flame" id="hud-streak" type="button" title="Lock In Streak: days in a row you met your daily goal"></button>
      <button class="pill sparks" id="hud-sparks" type="button" title="Sparks. Spend them in the Shop"></button>
      <button class="help-btn" id="hud-help" type="button" aria-label="Help, keyboard shortcuts and feedback" aria-haspopup="dialog" title="Help (?)">?</button>
      <button class="pill focus-pill" id="hud-focus" type="button" title="Focus Meter"></button>
      <button class="avatar sm" id="hud-avatar" type="button" aria-label="Profile, leaderboard and friends"></button>
      <button class="acct" id="hud-account" type="button"><span class="acct-long">Save</span><span class="acct-short" aria-hidden="true">☁️</span></button>
    </header>
    <div>
      <div class="goalbar" aria-hidden="true"><i id="goal-fill"></i></div>
      <div class="goalnote"><span id="goal-text"></span><span id="goal-risk"></span></div>
    </div>
    <div class="alert-slot" id="alert-slot" aria-live="assertive"></div>
    <div id="feed-tools">
      <div class="focusbar" id="focusbar"></div>
      <div class="feed-nav">
        <button class="back-dash" id="back-dash" type="button" aria-label="Back to the Dashboard"><span aria-hidden="true">←</span><span class="back-lbl">Dashboard</span></button>
        <button class="chapter-bar" id="chapter-bar" type="button" aria-haspopup="dialog"></button>
      </div>
    </div>
    <main class="view scrollview" id="view-dash"></main>
    <main class="view feed" id="view-feed" aria-live="polite" hidden></main>
    <main class="view scrollview" id="view-test" hidden></main>
    <main class="view scrollview" id="view-diag" hidden></main>
    <main class="view scrollview" id="view-vocab" hidden></main>
    <main class="view scrollview" id="view-derby" hidden></main>
    <main class="view scrollview" id="view-shop" hidden></main>
    <main class="view scrollview" id="view-you" hidden></main>
    <nav class="tabs" role="tablist" aria-label="SatWizz">
      <button class="tab" role="tab" data-view="dash" aria-selected="true" aria-label="Dashboard"><span class="ico" aria-hidden="true">🏠</span><span class="lbl-long">Dashboard</span><span class="lbl-short">Home</span></button>
      <button class="tab" role="tab" data-view="vocab" aria-selected="false"><span class="ico" aria-hidden="true">📚</span>Vocab Vault</button>
      <button class="tab" role="tab" data-view="derby" aria-selected="false"><span class="ico" aria-hidden="true">🐎</span>Derby</button>
      <button class="tab" role="tab" data-view="shop" aria-selected="false"><span class="ico" aria-hidden="true">🛍️</span>Shop</button>
      <button class="tab" role="tab" data-view="you" aria-selected="false"><span class="ico" aria-hidden="true">🎭</span>Profile</button>
    </nav>
    <footer class="disclaimer">SatWizz is an independent practice tool and is not affiliated with or endorsed by the College Board. Names in practice sentences are used for fun and don't imply any endorsement or affiliation.</footer>`;

  const feed = $("#view-feed");
  // Five tabs: Dashboard, Vocab Vault, Derby, Shop, Profile. The Dashboard opens a
  // chapter's practice feed, its practice sets and its Review for
  // Understanding test (with the Diagnostic screen after), which have no tab
  // of their own. Profile has three sub-tabs: Edit Profile, Settings and
  // Leaderboard (with friends).
  const VIEWS = ["dash", "feed", "test", "diag", "vocab", "derby", "shop", "you"];
  const TAB_OF = { feed: "dash", test: "dash", diag: "dash" };
  let youTab = "profile"; // "profile" | "settings" | "leaderboard"
  // The leaderboard module keeps its own DOM; it moves into the Profile pane.
  const ranksMount = h("div", { id: "ranks-mount", class: "ranks-view" });
  let currentView = "dash";
  let streakTab = "streak"; // Profile's streak section: "streak" or "achievements"

  app.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => { sfx.play("tap"); show(t.dataset.view); }));
  $("#hud-sparks").addEventListener("click", () => show("shop"));
  $("#hud-account").addEventListener("click", () => openSignup("save"));
  const openProfile = () => {
    youTab = "profile";
    show("you");
    $("#view-you").scrollTop = 0;
  };
  $("#hud-avatar").addEventListener("click", openProfile);
  $("#hud-streak").addEventListener("click", openProfile); // streak details live in Profile
  $("#hud-focus").addEventListener("click", () => {
    toast(S.focus >= FOCUS.RULES.max
      ? "🧠 Focus 100%. A miss costs 25%, rushing (under 3s) 10%."
      : `🧠 Focus ${S.focus}%. Get 2 right in a row for +${FOCUS.RULES.restore}% (${S.focusStreak || 0}/2), buy a Focus Elixir in the Shop, or wait: full recharge in ${FOCUS.nextRechargeMin(S)} min.`);
  });
 $("#hud-help").addEventListener("click", () => openHelp());
  $("#back-dash").addEventListener("click", () => { sfx.play("tap"); show("dash"); });

  function show(view) {
    const changed = view !== currentView;
    currentView = view;
    app.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.view === (TAB_OF[view] || view))));
    for (const v of VIEWS) $(`#view-${v}`).hidden = v !== view;
    $("#feed-tools").hidden = view !== "feed";
    if (changed && !reducedMotion()) {
      const el = $(`#view-${view}`);
      el.classList.remove("view-in");
      void el.offsetWidth;
      el.classList.add("view-in");
    }
    if (view === "dash") renderDash();
    if (view === "vocab") vocab.render();
    if (view === "derby") {
      if (!derby.active()) derby.open();
      else if (derby.racing()) derby.sync();
      else derby.render();
    }
    if (view === "shop") renderShop();
    if (view === "you") renderYou();
  }

  function rerenderCurrent() {
    if (currentView === "dash") renderDash();
    if (currentView === "vocab" && !vocab.busy()) vocab.render();
    if (currentView === "derby" && !derby.racing()) derby.render();
    if (currentView === "you" && youTab === "leaderboard") ranks.render();
    if (currentView === "shop") renderShop();
    if (currentView === "you") renderYou();
  }

  // Vocab Vault lives in its own module (js/vocab.js).
  const vocab = SW.vocab.mount({
    container: $("#view-vocab"),
    getState: () => S,
    save: () => save(),
    esc,
    fill: (text, cast, mark) => fill(text, cast || castOf(), mark),
    todayKey: () => todayKey(),
    sfx,
    toast: (m) => toast(m),
    celebrate: (...a) => celebrate(...a),
    earn: (n) => rewards.earn(S, n),
    recordAnswer: (correct) => recordVocabAnswer(correct),
    renderHud: (bump) => renderHud(bump),
    openDerby: () => show("derby"),
  });

  // The Derby has its own tab (js/derby.js) and races on grammar questions
  // from the unit you're on (or any unlocked one you pick). It shares the
  // app's Focus Meter, so a rough race carries into Practice and back.
  const derby = SW.derby.mount({
    container: $("#view-derby"),
    tab: true,
    source: grammarSource(),
    getState: () => S,
    save: () => save(),
    esc,
    fill: (text, cast, mark) => fill(text, cast || castOf(), mark),
    todayKey: () => todayKey(),
    sfx,
    toast: (m) => toast(m),
    celebrate: (...a) => celebrate(...a),
    earn: (n) => rewards.earn(S, n),
    recordAnswer: (correct) => recordVocabAnswer(correct),
    renderHud: (bump) => renderHud(bump),
    focusState: () => S,
    shake: () => shake(),
    onExit: () => derby.open(),
  });

  // ---------- Derby question source: grammar from your unit ----------
  function derbyChapter() {
    const pick = [S.derbyChapter, S.chapterId].find((id) => Number.isInteger(id) && isUnlocked(id));
    return chapterById(pick || 1);
  }
  function grammarSource() {
    return {
      title: "SatWizz Grammar Derby",
      banner: "=== 🐎 SATWIZZ GRAMMAR DERBY 🐎 ===",
      tagline: "Where clean sentences win photo finishes.",
      intro: "Answer Digital SAT grammar questions from your unit as fast and as accurately as you can.",
      // CPU reading time per question, tuned by simulation so that breaking
      // even at ×1.5 takes about 11.5s per question at 85% (see README).
      read: [13, 17],
      // Questions you missed come first, then core ones you haven't got right
      // yet, then fresh generated questions (never repeated; see nextGenId).
      draw() {
        const ch = derbyChapter();
        const got = new Set(correctIn(ch.id));
        const missed = shuffle(S.missed.filter((id) => BY_ID[id] && BY_ID[id].chapterId === ch.id));
        const fresh = shuffle(ch.questions.map((q) => q.id).filter((id) => !got.has(id) && !missed.includes(id)));
        return [...missed, ...fresh, ...this.more()];
      },
      more() {
        const ch = derbyChapter();
        const ids = [];
        for (let i = 0; i < 20; i++) {
          const id = nextGenId(ch.id);
          if (id) ids.push(id);
        }
        // Chapters without a generated pool (the bonus ones) reuse their core set.
        return ids.length ? ids : shuffle(ch.questions.map((q) => q.id));
      },
      question(id) {
        const q = BY_ID[id];
        const order = shuffle([0, 1, 2, 3]);
        const ch = chapterById(q.chapterId);
        return {
          id,
          cast: castFor(id),
          meta: `${ch.bonus ? "Bonus" : `Ch ${ch.id}`} · ${ch.short}`,
          passage: q.text,
          stem: SW.stemFor(q),
          choices: order.map((i) => q.choices[i]),
          answer: order.indexOf(q.answer),
          notes: order.map((i) => q.notes[i]),
          rule: q.rule || "",
          explain: q.notes[q.answer],
        };
      },
      // Derby answers count toward the unit like Practice answers do.
      onAnswer(dq, correct) {
        const q = BY_ID[dq.id];
        const sk = (S.skills[q.skill] ||= { seen: 0, right: 0 });
        sk.chapterId = q.chapterId;
        sk.seen++;
        if (correct) {
          sk.right++;
          S.totalCorrect++;
          S.missed = S.missed.filter((id) => id !== q.id);
          if (!q.gen) {
            const got = correctIn(q.chapterId);
            if (!got.includes(q.id)) got.push(q.id);
          }
        } else if (!S.missed.includes(q.id)) S.missed.push(q.id);
        renderChapterBar();
      },
      missNote: () => "↺ Saved to your missed questions: it comes back first next race and in mixed review.",
      lateNote: (dq) => `Answer: ${renderPassage(BY_ID[dq.id].text, dq.cast, fill(BY_ID[dq.id].choices[BY_ID[dq.id].answer], dq.cast, false))}`,
      review: {
        title: "Grammar review",
        head: ["Question", "Why"],
        row(dq) {
          const q = BY_ID[dq.id];
          const cast = dq.cast;
          return [
            `<small class="muted">${esc(q.skill)}</small><br>${renderPassage(q.text, cast, fill(q.choices[q.answer], cast, false))}`,
            q.rule ? fill(q.rule, cast, false) : fill(q.notes[q.answer], cast, false),
          ];
        },
        note: "Missed questions come back first in your next race and in mixed review.",
      },
      unitHtml() {
        const cur = derbyChapter();
        const opts = CHAPTERS.filter((c) => isUnlocked(c.id))
          .map((c) => `<option value="${c.id}" ${c.id === cur.id ? "selected" : ""}>${c.bonus ? "Bonus" : `Ch ${c.id}`} · ${esc(c.short)}</option>`).join("");
        return `<label class="unit-pick"><span class="label-sm">Racing on</span><select class="select" id="derby-unit">${opts}</select></label>`;
      },
      wireUnit(el, rerender) {
        el.querySelector("#derby-unit")?.addEventListener("change", (e) => {
          S.derbyChapter = Number(e.target.value);
          save();
          rerender();
        });
      },
    };
  }

  // Leaderboards & friends live in their own module (js/social-view.js).
  const ranks = SW.socialView.mount({
    container: ranksMount,
    getState: () => S,
    save: () => save(false),
    esc,
    toast,
    openSignup,
    avatarEmoji: (id) => (rewards.avatarById(id) || rewards.avatarById(SW.defaultAvatarId)).emoji,
    sfx,
    inviteUrl: () => (S.username ? `${location.origin}${location.pathname}?invite=${encodeURIComponent(S.username)}` : ""),
  });

  // ---------- Demo Mode (tap the logo 5 times) ----------
  const DEMO_BACKUP_KEY = "satwizz.demo-backup";
  let logoTaps = [];
  $("#brand").addEventListener("click", () => {
    const now = Date.now();
    logoTaps = [...logoTaps.filter((t) => now - t < 2500), now];
    if (logoTaps.length >= 5) {
      logoTaps = [];
      toggleDemo();
    }
  });

  // Demo Mode unlocks every chapter and maxes Sparks for testing and demos.
  // It saves your real progress first and restores it when you turn it off.
  // Nothing is synced or posted to leaderboards while it's on.
  function toggleDemo() {
    if (!S.demo) {
      try { localStorage.setItem(DEMO_BACKUP_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
      S.demo = true;
      S.unlockedChapters = CHAPTERS.map((c) => c.id);
      S.sparks = 99999;
      FOCUS.refill(S);
      save(false);
      toast("Demo Mode on: all chapters unlocked and Sparks maxed. Tap the logo 5 times to exit.");
    } else {
      let restored = null;
      try { restored = JSON.parse(localStorage.getItem(DEMO_BACKUP_KEY) || "null"); } catch (e) { /* ignore */ }
      S = restored ? normalize(restored) : { ...S, demo: false };
      S.demo = false;
      try { localStorage.removeItem(DEMO_BACKUP_KEY); } catch (e) { /* ignore */ }
      save(false);
      toast("Demo Mode off. Your real progress is back.");
    }
    sfx.play("combo");
    ranks.invalidate();
    renderHud(["sparks"]);
    startChapter(isUnlocked(S.chapterId) || S.chapterId === REVIEW_ID ? S.chapterId : 1);
    rerenderCurrent();
  }

  // ---------- HUD ----------
  // A miss at critical Focus (under 25%) shakes the screen (not with reduced motion).
  function shake() {
    if (!reducedMotion()) FOCUS.shake(app);
  }

  function bumpEl(el) {
    el.classList.remove("bump");
    void el.offsetWidth;
    el.classList.add("bump");
  }

  // 12,345 → "12.3K" so big balances fit the header on phones.
  const compactFmt = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
  const compact = (n) => (n >= 10000 ? compactFmt.format(n) : String(n));
  const fmt = (n) => Number(n || 0).toLocaleString("en-US");

  // bump: list of "streak" | "sparks"
  function renderHud(bump = []) {
    rollover();
    const st = $("#hud-streak");
    st.innerHTML = `🔥 ${S.streak}${atRisk() ? ' <span class="risk" title="Streak at risk">⌛</span>' : ""}`;
    st.classList.toggle("cold", S.streak === 0 || atRisk());
    $("#hud-sparks").textContent = `⚡ ${compact(S.sparks)}`;
    $("#hud-sparks").setAttribute("aria-label", `${S.sparks} Sparks. Open the Shop`);
    st.setAttribute("aria-label", `Lock In Streak: ${S.streak} day${S.streak === 1 ? "" : "s"}${atRisk() ? ", at risk" : ""}`);
    const fp = $("#hud-focus");
    fp.innerHTML = FOCUS.meterHtml(S.focus);
    fp.className = `pill focus-pill ${FOCUS.level(S.focus)}`;
    fp.setAttribute("aria-label", `Focus ${S.focus}%`);
    fp.title = S.focus < FOCUS.RULES.max ? `Focus Meter · full recharge in ${FOCUS.nextRechargeMin(S)} min` : "Focus Meter · recharges to 100% every hour";
    FOCUS.paint(S.focus); // <body data-focus>: low-Focus outline on open questions
    $("#demo-badge").hidden = !S.demo;
    renderAccountButton();
    renderFocus();

    const n = today().n;
    $("#goal-fill").style.width = `${Math.min(100, (n / S.goal) * 100)}%`;
    $("#goal-text").textContent = doneToday()
      ? `Daily goal done · ${n} answered today`
      : `${n} / ${S.goal} today · +${RULES.dailyGoalSparks} ⚡ at goal`;
    $("#goal-risk").textContent = atRisk() ? "⌛ Streak ends at midnight" : "";

    if (bump.includes("streak")) bumpEl(st);
    if (bump.includes("sparks")) bumpEl($("#hud-sparks"));
  }

  // Combo (and Restore Focus at 0%), shown above the question feed. The Focus
  // Meter itself lives in the header.
  function renderFocus(bumpCombo) {
    const bar = $("#focusbar");
    bar.innerHTML = `
      <span class="label-sm">Focus ${S.focus}%</span>
      <span class="muted small focus-hint">${S.focus < FOCUS.RULES.max ? `2 in a row: +${FOCUS.RULES.restore}% (${S.focusStreak || 0}/2)` : "Locked in"}</span>
      ${S.focus === 0 ? '<button class="mini-btn" type="button" id="restore-focus">Restore Focus</button>' : ""}
      <span class="combo${S.combo >= 3 ? " hot" : ""}" id="combo-pill" title="Correct answers in a row">×${S.combo}<span class="combo-word"> combo</span></span>`;
    $("#restore-focus", bar)?.addEventListener("click", () => openFocusBreak());
    if (bumpCombo) bumpEl($("#combo-pill", bar));
  }

  // "Ch 3 · Subject-Verb Agreement · 4/7 ▾" above the feed; opens the drawer.
  function renderChapterBar() {
    const bar = $("#chapter-bar");
    const ch = currentChapter();
    if (!ch) {
      bar.innerHTML = `<span class="ch-num">Mix</span><span class="ch-title">Mixed review</span><span class="ch-count">${S.missed.length} missed</span><span class="ch-caret" aria-hidden="true">▾</span>`;
      bar.setAttribute("aria-label", "Mixed review. Choose a chapter");
      return;
    }
    const done = Math.min(correctIn(ch.id).length, ch.questions.length);
    bar.innerHTML = `
      <span class="ch-num">${ch.bonus ? "Bonus" : `Ch ${ch.id}`}</span>
      <span class="ch-title">${esc(ch.short)}</span>
      <span class="ch-count">${isComplete(ch.id) ? "✓" : `${done}/${ch.questions.length}`}</span>
      <span class="ch-caret" aria-hidden="true">▾</span>`;
    bar.setAttribute("aria-label", `Chapter ${ch.id}: ${ch.title}. ${done} of ${ch.questions.length} correct. Choose a chapter`);
  }

  // ---------- Feed ----------
  let cardCount = 0;
  let sentinelObs;
  let activeCard = null;
  const visObs = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      activeCard = e.target;
      if (!activeCard._seenAt) activeCard._seenAt = Date.now();
    }
  }, { root: feed, threshold: 0.6 });

  // Opens a chapter (or mixed review): Explanation Pause, then its questions.
  function startChapter(id) {
    if (id !== REVIEW_ID && !isUnlocked(id)) return;
    if (id === REVIEW_ID && !reviewOpen()) return;
    S.chapterId = id;
    save();
    feed.innerHTML = "";
    served = 0;
    cardCount = 0;
    lastId = null;
    completeShown = false;
    streaming = id !== REVIEW_ID && isComplete(id) && chapterById(id).pool.length > 0;
    buildQueue();
    if (!S.castChosen) feed.append(welcomeCard());
    const ch = currentChapter();
    if (ch) feed.append(pauseCard(ch));
    appendCards(3);
    feed.scrollTop = 0;
    renderChapterBar();
  }

  function appendCards(n) {
    for (let i = 0; i < n; i++) {
      const next = nextQuestion();
      if (!next) break;
      cardCount++;
      const card = makeCard(next.q, { isRetry: next.isRetry, label: String(cardCount) });
      visObs.observe(card);
      feed.append(card);
    }
    // Keep a sentinel at the end so more cards load as you scroll.
    feed.querySelector(".sentinel")?.remove();
    const s = h("div", { class: "sentinel", "aria-hidden": "true", style: "height:1px" });
    feed.append(s);
    sentinelObs?.disconnect();
    sentinelObs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) appendCards(3);
    }, { root: feed, rootMargin: "0px 0px 150% 0px" });
    sentinelObs.observe(s);
  }

  // After each answer: keep two unanswered cards ready, and finish the chapter
  // once the queue is empty and every card on screen has been answered.
  function afterFeedAnswer() {
    const pending = [...feed.querySelectorAll(".card[data-qid]")].filter((c) => !c._answered).length;
    if (pending < 2 && (queue.length || streaming)) appendCards(2 - pending);
    const ch = currentChapter();
    if (!ch || completeShown || queue.length || pending) return;
    completeShown = true;
    const firstTime = !isComplete(ch.id);
    // The next chapter opens by passing the Review for Understanding test.
    if (firstTime) {
      S.completedChapters.push(ch.id);
      rewards.earn(S, RULES.chapterSparks);
      save();
      renderHud(["sparks"]);
      setTimeout(() => sfx.play("complete"), 400);
      sfx.buzz(50);
      celebrate("⭐", `Chapter ${ch.id} complete!`, `+${RULES.chapterSparks} ⚡ Sparks`);
    }
    feed.querySelector(".sentinel")?.remove();
    feed.append(completeCard(ch, firstTime));
    renderChapterBar();
  }

  // The next chapter opens when this one's Review for Understanding test is
  // passed (8/10 or better; see the tests section below).
  const lockNote = (ch) => {
    const prev = chapterById(ch.id - 1);
    return prev ? `Score ${passMark(TEST_LEN)}/${TEST_LEN} on ${prev.bonus ? "the bonus chapter's" : `Chapter ${prev.id}'s`} Review for Understanding to unlock` : "";
  };

  // "Explanation Pause": the lesson card that opens each chapter.
  function pauseCard(ch) {
    const card = h("section", { class: "card pause" });
    const cast = castOf();
    card.innerHTML = `
      <div class="card-inner pause-card">
        <div class="meta"><span class="domain">${ch.bonus ? "Bonus chapter" : `Chapter ${ch.id} of ${CORE_CHAPTERS}`}</span><span>Explanation Pause</span></div>
        <h2>${esc(ch.title)}</h2>
        <p class="pause-summary">${fill(ch.pause.summary, cast)}</p>
        <ul class="rule-list">${ch.pause.rules.map((r) => `<li>${fill(r, cast)}</li>`).join("")}</ul>
        <div class="patterns" aria-label="Patterns">
          ${ch.pause.patterns.map((p) => `<span class="pattern ${p.ok ? "ok" : "no"}"><b aria-hidden="true">${p.ok ? "✓" : "✗"}</b> ${fill(p.f, cast, false)}<span class="sr-only">${p.ok ? " (correct)" : " (incorrect)"}</span></span>`).join("")}
        </div>
        <p class="pause-example"><span class="label-sm">Example</span><span>${fill(ch.pause.example, cast)}</span></p>
        <button class="btn wide next-row" type="button">Start practice ↓</button>
      </div>`;
    card.querySelector(".btn").addEventListener("click", () => scrollToNext(card));
    return card;
  }

  function completeCard(ch, firstTime) {
    const card = h("section", { class: "card complete" });
    const next = chapterById(ch.id + 1);
    const finishedCore = CHAPTERS.filter((c) => !c.bonus).every((c) => isComplete(c.id));
    let heading;
    let body;
    let actions = "";
    if (next && !isUnlocked(next.id)) {
      heading = `${ch.bonus ? "Bonus chapter" : `Chapter ${ch.id}`} complete`;
      body = `Score ${passMark(TEST_LEN)}/${TEST_LEN} on the Review for Understanding test to unlock <b>${esc(next.title)}</b>.`;
      actions = `<button class="btn wide" type="button" data-test>Take the Review for Understanding →</button>`;
    } else if (next && !next.bonus) {
      heading = `Chapter ${ch.id} complete`;
      body = `Next up: <b>${esc(next.title)}</b>.`;
      actions = `<button class="btn wide" type="button" data-go="${next.id}">Start Chapter ${next.id} →</button>`;
    } else if (finishedCore) {
      heading = ch.bonus ? "Bonus chapter complete" : "Curriculum complete";
      body = "You've worked through every chapter. Keep your skills sharp with mixed review.";
      if (next) actions += `<button class="btn wide" type="button" data-go="${next.id}">Bonus: ${esc(next.short)} →</button>`;
      actions += `<button class="btn ${next ? "ghost " : ""}wide" type="button" data-go="${REVIEW_ID}">Mixed review →</button>`;
    } else {
      heading = `${ch.bonus ? "Bonus chapter" : `Chapter ${ch.id}`} complete`;
      body = "Pick your next chapter from the chapter list.";
      actions = `<button class="btn wide" type="button" data-drawer>Open chapters</button>`;
    }
    card.innerHTML = `
      <div class="card-inner complete-card">
        <span class="complete-star" aria-hidden="true">⭐</span>
        <h2>${heading}</h2>
        <p>${firstTime ? `+${RULES.chapterSparks} ⚡ Sparks earned. ` : "Replay finished. "}${body}</p>
        <div class="stack">${actions}${ch.pool.length
          ? `<button class="btn ghost wide" type="button" data-stream>Keep practicing: ${fmt(ch.pool.length)} fresh questions ↓</button>`
          : `<button class="btn ghost wide" type="button" data-go="${ch.id}">Replay this chapter</button>`}</div>
      </div>`;
    card.querySelectorAll("[data-go]").forEach((b) => b.addEventListener("click", () => {
      const go = b.dataset.go === REVIEW_ID ? REVIEW_ID : Number(b.dataset.go);
      startChapter(go);
    }));
    card.querySelector("[data-drawer]")?.addEventListener("click", openChapters);
    card.querySelector("[data-test]")?.addEventListener("click", () => startRun("test", ch.id));
    card.querySelector("[data-stream]")?.addEventListener("click", () => {
      streaming = true;
      appendCards(3);
      scrollToNext(card);
    });
    return card;
  }

  function welcomeCard() {
    const card = h("section", { class: "card welcome" });
    const inner = h("div", { class: "card-inner hello" });
    inner.innerHTML = `
      <div class="meta"><span class="domain">Personalize</span></div>
      <h2>Who should star in your questions?</h2>
      <p>Every sentence uses your cast's names. Pick one now or change it later in Profile.</p>
      <div class="cast-grid"></div>
      <p class="preview" id="welcome-preview"></p>
      <button class="btn wide next-row" type="button">Start practicing ↓</button>`;
    const grid = inner.querySelector(".cast-grid");
    const paint = () => {
      grid.querySelectorAll(".cast-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === S.themeId)));
      inner.querySelector("#welcome-preview").innerHTML = previewSentence();
    };
    for (const t of themesForPicker()) {
      grid.append(castButton(t, () => { S.themeId = t.id; save(); paint(); refreshCast(); }));
    }
    paint();
    inner.querySelector(".btn").addEventListener("click", () => {
      S.castChosen = true;
      save();
      scrollToNext(card);
    });
    card.append(inner);
    return card;
  }

  // A question card. opts: { isRetry, label, review, onDone }
  function makeCard(q, opts = {}) {
    const card = h("section", { class: `card${opts.review ? " review-card" : ""}`, "data-qid": q.id });
    card._q = q;
    card._order = shuffle([0, 1, 2, 3]);
    card._isRetry = Boolean(opts.isRetry);
    card._label = opts.label || "";
    card._review = Boolean(opts.review);
    card._onDone = opts.onDone || null;
    card._madeAt = Date.now(); // think time starts when the card scrolls into view (_seenAt)
    paintCard(card);
    return card;
  }

  // Passage HTML: the blank becomes a Bluebook-style line (or the filled-in
  // answer), and [[segment]] becomes the underlined target.
  function renderPassage(text, cast, filledWith) {
    return fill(text, cast)
      .replace("______", filledWith != null
        ? `<mark class="fill-in">${filledWith}</mark>`
        : '<span class="blank" role="img" aria-label="blank"></span>')
      .replace(/\[\[([^\]]+)\]\]/, '<u class="target">$1</u>');
  }

  // Digital SAT (Bluebook) layout: numbered header, passage box, official
  // stem, then choices A–D.
  function paintCard(card) {
    const q = card._q;
    const cast = castFor(q.id);
    const ch = chapterById(q.chapterId);
    card.innerHTML = `
      <div class="card-inner bb">
        <div class="bb-top">
          <span class="bb-num" aria-label="Question ${esc(card._label)}">${esc(card._label)}</span>
          <span class="bb-meta">${ch.bonus ? "Bonus" : `Ch ${ch.id}`} · ${esc(q.skill)}</span>
          ${card._isRetry ? '<span class="retry-tag">↺ Try again</span>' : ""}
        </div>
        <div class="bb-passage"><p class="passage">${renderPassage(q.text, cast)}</p></div>
        <p class="bb-stem">${esc(SW.stemFor(q))}</p>
        <ol class="choices">
          ${card._order.map((ci, pos) => `
            <li><button class="choice" type="button" data-ci="${ci}" aria-label="(${"ABCD"[pos]}) ${esc(fill(q.choices[ci], cast, false).replace(/<[^>]+>/g, ""))}">
              <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span><span class="txt">${fill(q.choices[ci], cast, false)}</span>
            </button></li>`).join("")}
        </ol>
        <div class="fb-slot"></div>
      </div>`;
    card.querySelectorAll(".choice").forEach((b) => {
      b.addEventListener("pointerdown", () => { if (!card._answered) sfx.play("tap"); });
      b.addEventListener("click", () => answer(card, Number(b.dataset.ci)));
    });
  }

  // Re-render cards that haven't been answered, and the lesson card, so a new
  // cast shows up immediately.
  function refreshCast() {
    feed.querySelectorAll(".card[data-qid]").forEach((c) => { if (!c._answered) paintCard(c); });
    const pause = feed.querySelector(".card.pause");
    const ch = currentChapter();
    if (pause && ch) pause.replaceWith(pauseCard(ch));
  }

  // A sample sentence for cast previews.
  function previewSentence() {
    const q = BY_ID["c6-4"];
    return fill(q.text.replace("______", q.choices[q.answer]));
  }

  function scrollToNext(card) {
    const next = card.nextElementSibling;
    if (next && next.classList.contains("card")) {
      next.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
      next.querySelector(".choice, .btn")?.focus({ preventScroll: true });
    }
  }

  // ---------- Answering ----------
  const fastRun = []; // timestamps of the current correct run (Lightning Fast badge)
  let lastWrong = null; // last question answered wrong (the Focus Break reviews its skill)

  function answer(card, ci) {
    if (card._answered) return;
    // With no Focus left, the feed waits for a Focus Break review.
    if (!card._review && S.focus === 0) {
      openFocusBreak();
      return;
    }
    card._answered = true;
    card.classList.add("answered");
    const q = card._q;
    const correct = ci === q.answer;
    const cast = castFor(q.id);
    const thinkMs = Date.now() - (card._seenAt || card._madeAt || Date.now());

    card.querySelectorAll(".choice").forEach((b) => {
      const bci = Number(b.dataset.ci);
      b.disabled = true;
      if (bci === q.answer) b.classList.add("right");
      else if (bci === ci) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    const blank = card.querySelector(".blank"); // absent for [[underlined]] questions
    if (blank) {
      blank.classList.add("filled");
      blank.removeAttribute("role");
      blank.removeAttribute("aria-label");
      blank.innerHTML = fill(q.choices[q.answer], cast, false);
    }

    // stats
    rollover();
    const d = today();
    d.n++;
    if (correct) d.c++;
    const sk = (S.skills[q.skill] ||= { seen: 0, right: 0 });
    sk.chapterId = q.chapterId;
    sk.seen++;
    if (correct) sk.right++;

    let xp = 0;
    let sparks = null;
    let savedCombo = 0; // combo kept by a Combo Saver
    if (correct) {
      S.combo++;
      S.bestCombo = Math.max(S.bestCombo, S.combo);
      S.totalCorrect++;
      xp = 10 + (S.combo >= 3 ? 5 : 0) + (card._isRetry ? 5 : 0);
      sparks = rewards.sparksForCorrect(S.combo);
      rewards.earn(S, sparks.total);
      S.missed = S.missed.filter((id) => id !== q.id);
      // Chapter progress counts the core set; generated questions are extra practice.
      if (!q.gen) {
        const got = correctIn(q.chapterId);
        if (!got.includes(q.id)) got.push(q.id);
      }
    } else {
      savedCombo = rewards.useComboSaver(S) ? S.combo : 0;
      S.combo = savedCombo;
      if (!S.missed.includes(q.id)) S.missed.push(q.id);
      if (!card._review) {
        requeue(q.id);
        lastWrong = q;
      }
    }
    // Focus: −25% for a miss, −10% for rushing (under 3s), +25% for 2 right in a row.
    const focusRes = FOCUS.apply(S, { correct, ms: thinkMs, rushMs: FOCUS.RULES.practiceRushMs });
    const focusLeft = S.focus;
    if (!correct && FOCUS.level(S.focus) === "critical") shake();
    S.xp += xp;
    // A Combo Saver keeps the combo, but not a "5 in a row" speed run.
    const fast = rewards.trackFastRun(fastRun, correct, Date.now());

    // sound + haptics
    const milestone = correct && [3, 5, 10, 15, 20, 25, 30, 40, 50].includes(S.combo);
    sfx.play(correct ? (milestone ? "combo" : "correct") : "wrong");
    if (correct) sfx.buzz(50);

    // feedback
    let tag;
    if (correct) tag = `+${xp} XP · +${sparks.total} ⚡${sparks.bonus ? " combo bonus" : ""}`;
    else tag = focusLeft === 0 ? "Focus is out" : `Focus ${focusLeft}%`;
    if (focusRes.delta) tag += ` · ${focusRes.delta > 0 ? "+" : "−"}${Math.abs(focusRes.delta)}% Focus${focusRes.rushed ? " (rushed)" : ""}`;
    if (savedCombo) tag += ` · Combo Saver kept ×${savedCombo}`;
    const verdict = correct ? pickPraise() : "Not quite";
    const fb = h("div", { class: `feedback ${correct ? "ok" : "no"}` });
    const next = h("button", { class: "btn wide next-row", type: "button" }, card._review ? "Continue" : "Next question ↓");
    if (card._review) {
      // Inside the Focus Break drawer: keep the explanation inline.
      fb.innerHTML = `
        <h3>${verdict}<small>${esc(tag)}</small></h3>
        ${q.rule ? `<p class="rule-line"><b>Rule:</b> ${fill(q.rule, cast, false)}</p>` : ""}
        <p>${fill(q.notes[q.answer], cast, false)}</p>`;
      next.addEventListener("click", () => card._onDone?.());
    } else {
      fb.innerHTML = `
        <h3>${verdict}<small>${esc(tag)}</small></h3>
        <button class="linkbtn why-btn" type="button">💡 Why? See every answer explained</button>`;
      fb.querySelector(".why-btn").addEventListener("click", () => openExplain(card, ci, verdict, tag));
      next.addEventListener("click", () => scrollToNext(card));
    }
    card.querySelector(".fb-slot").append(fb);
    card.querySelector(".card-inner").append(next);

    const goal = checkGoal();
    const newBadges = rewards.checkBadges(S, { fastRun: fast });
    save();
    renderHud(goal || correct ? ["sparks", ...(goal ? ["streak"] : [])] : []);
    renderFocus(correct);
    renderChapterBar();
    if (!card._review) {
      afterFeedAnswer();
      pingPractice();
    }

    if (goal) celebrateGoal(goal);
    if (milestone) {
      sfx.buzz(50);
      celebrate("⚡", `${S.combo} in a row!`, sparks.bonus ? `+${sparks.bonus} bonus Sparks` : "Keep the combo going");
    }
    announceBadges(newBadges);

    if (card._review) {
      next.focus({ preventScroll: true });
      return;
    }
    // Things that open their own dialog wait until the explanation is closed.
    const after = [];
    if (!correct && focusLeft === 0) after.push(() => openFocusBreak());
    // First time a guest hits a 3-in-a-row streak, offer to save it to an account.
    if (correct && S.combo === SIGNUP_PROMPT_COMBO && !auth.user() && !S.guest && auth.available()) {
      after.push(() => { if (!auth.user() && !focusSheet) openSignup("combo"); });
    }
    openExplain(card, ci, verdict, tag, after);
  }

  // Vocab Vault answers count toward the daily goal, XP and friend streaks.
  // They don't touch the practice combo (the Derby applies Focus itself).
  function recordVocabAnswer(correct) {
    rollover();
    const d = today();
    d.n++;
    if (correct) {
      d.c++;
      S.xp += 5;
    }
    const goal = checkGoal();
    if (goal) {
      renderHud(["streak", "sparks"]);
      celebrateGoal(goal);
    }
    pingPractice();
  }

  // Tell the server you practiced (friend streaks, "practiced today"), at most
  // every 30 minutes. Skipped for guests and in Demo Mode.
  let lastPracticePing = 0;
  function pingPractice() {
    if (S.demo || !auth.user() || Date.now() - lastPracticePing < 30 * 60e3) return;
    lastPracticePing = Date.now();
    auth.recordPractice().then(() => ranks.invalidate());
  }

  // ---------- Slide-up explanation drawer ----------
  // Opens after every feed answer: why the right answer works and why each
  // other choice fails. `after` runs once it closes (Focus Break, sign-up).
  let explainSheet = null;
  let explainAfter = [];

  function openExplain(card, picked, verdict, tag, after = []) {
    if (explainSheet) closeExplain(false);
    explainAfter = after;
    const q = card._q;
    const cast = castFor(q.id);
    const correct = picked === q.answer;
    const filled = renderPassage(q.text, cast, fill(q.choices[q.answer], cast, false));
    const rows = card._order.map((ci, pos) => {
      const isAnswer = ci === q.answer;
      const isPick = ci === picked;
      const status = isAnswer ? "right" : isPick ? "wrong" : "other";
      const label = isAnswer ? (isPick ? "Your answer · correct" : "Correct answer") : isPick ? "Your answer" : "";
      return `
        <li class="why-row ${status}">
          <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span>
          <div class="why-body">
            <b>${fill(q.choices[ci], cast, false)}</b>${label ? `<span class="why-tag">${label}</span>` : ""}
            <p>${fill(q.notes[ci], cast, false)}</p>
          </div>
        </li>`;
    });
    // Correct answer first, then your pick, then the rest.
    const order = card._order.map((ci, pos) => ({ ci, pos, rank: ci === q.answer ? 0 : ci === picked ? 1 : 2 }))
      .sort((a, b) => a.rank - b.rank || a.pos - b.pos);
    const shortcut = q.shortcut && SHORTCUT_TIPS[q.shortcut];

    explainSheet = h("div", { class: "sheet-backdrop explain-backdrop" });
    const sheet = h("div", { class: `sheet explain ${correct ? "ok" : "no"}`, role: "dialog", "aria-modal": "true", "aria-labelledby": "ex-title" });
    sheet.innerHTML = `
      <div class="grabber" aria-hidden="true"></div>
      <div class="explain-head">
        <span class="verdict-icon" aria-hidden="true">${correct ? "✓" : "✗"}</span>
        <div><h2 id="ex-title">${verdict}</h2><small>${esc(tag)}</small></div>
        <button class="linkbtn" type="button" data-close>Close</button>
      </div>
      <p class="explain-sentence">${filled}</p>
      ${q.rule ? `<p class="rule-line"><b>Rule:</b> ${fill(q.rule, cast, false)}</p>` : ""}
      ${shortcut ? `<p class="shortcut-chip"><b>Shortcut ${esc(q.shortcut)}</b> ${esc(shortcut)}</p>` : ""}
      <ol class="why-list">${order.map((o) => rows[o.pos]).join("")}</ol>
      <button class="btn wide" type="button" data-next>Next question ↓</button>`;
    explainSheet.append(sheet);
    document.body.append(explainSheet);
    explainSheet.addEventListener("mousedown", (e) => { if (e.target === explainSheet) closeExplain(); });
    sheet.querySelector("[data-close]").addEventListener("click", () => closeExplain());
    sheet.querySelector("[data-next]").addEventListener("click", () => {
      closeExplain();
      scrollToNext(card);
    });
    document.addEventListener("keydown", explainKeys, true);
    sheet.querySelector("[data-next]").focus({ preventScroll: true });
  }

  const SHORTCUT_TIPS = {
    "3:1": "Three choices share a number (singular or plural) and one doesn't. The odd one out is the answer.",
    "2:1": "Cross out the non-verb. Of the three verbs left, two match in number. The odd one is the answer.",
  };

  function closeExplain(runAfter = true) {
    if (!explainSheet) return;
    document.removeEventListener("keydown", explainKeys, true);
    explainSheet.remove();
    explainSheet = null;
    const pending = explainAfter;
    explainAfter = [];
    if (runAfter) pending.forEach((fn) => setTimeout(fn, 150));
  }

  function explainKeys(e) {
    if (!explainSheet) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeExplain();
    } else if ((e.key === " " || e.key === "Enter") && !e.target.closest("button")) {
      e.preventDefault();
      explainSheet.querySelector("[data-next]")?.click();
    } else if (e.key === "Tab") {
      const items = [...explainSheet.querySelectorAll("button:not(:disabled)")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation();
  }

  // Runs when the daily goal may have just been met. Returns what happened, or null.
  function checkGoal() {
    const t = todayKey();
    const d = today();
    if (d.n < S.goal || S.lastDone === t) return null;
    S.streak = S.lastDone && dayDiff(S.lastDone, t) === 1 ? S.streak + 1 : 1;
    S.lastDone = t;
    d.done = true;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    const aura = rewards.earnAuraForStreak(S);
    rewards.earn(S, RULES.dailyGoalSparks);
    const wager = rewards.settleWager(S);
    return { aura, wager };
  }

  function celebrateGoal(goal) {
    const extra = goal.aura ? " · free Aura Shield 💠" : "";
    celebrate("🔥", `${S.streak}-day streak!`, `Daily goal done: +${RULES.dailyGoalSparks} ⚡${extra}`);
    if (goal.wager?.won) celebrate("🎲", "Wager won!", `+${goal.wager.payout} ⚡ Sparks`);
    else if (goal.wager && !goal.wager.lost) toast(`🎲 Wager: day ${goal.wager.days} of ${goal.wager.of}`);
  }

  function celebrateBadge(b) {
    celebrate(b.icon, `Accomplishment unlocked: ${b.title}`, "See it in Profile → Trophy Case");
  }
  // Several at once get one celebration instead of a queue of them.
  function announceBadges(list) {
    if (list.length > 2) celebrate("🏆", `${list.length} accomplishments unlocked!`, list.map((b) => b.icon).join(" "));
    else list.forEach(celebrateBadge);
  }

  const PRAISE = ["Correct!", "Nailed it!", "Clean!", "Exactly right!", "Boom!", "Sharp!"];
  const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  // ---------- Focus Break ----------
  let focusSheet = null;
  let focusReturn = null;

  // Review questions from the same chapter, same skill first, skipping ones
  // already used in this break.
  function pickReview(base, used) {
    const sameChapter = QUESTIONS.filter((q) => q.chapterId === base.chapterId && q.id !== base.id && !used.has(q.id));
    const sameSkill = shuffle(sameChapter.filter((q) => q.skill === base.skill));
    const rest = shuffle(sameChapter.filter((q) => q.skill !== base.skill));
    return [...sameSkill, ...rest][0] || shuffle(QUESTIONS.filter((q) => !used.has(q.id)))[0];
  }

  // At 0% Focus the feed pauses here: read the chapter's rules, then answer
  // review questions until you get 2 right in a row (+25% Focus),
  // or drink a Focus Elixir (500 ⚡) to go straight back to 100%.
  function openFocusBreak() {
    if (focusSheet || onboarding.isOpen()) return;
    const base = lastWrong || BY_ID[S.missed[S.missed.length - 1]] || currentChapter()?.questions[0] || QUESTIONS[0];
    const ch = chapterById(base.chapterId);
    const cast = castOf();
    focusReturn = document.activeElement;

    focusSheet = h("div", { class: "sheet-backdrop" });
    const sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "fb-title" });
    focusSheet.append(sheet);
    document.body.append(focusSheet);
    focusSheet.addEventListener("mousedown", (e) => { if (e.target === focusSheet) closeFocusBreak(); });
    document.addEventListener("keydown", focusKeys, true);

    const header = (step) => `
      <div class="grabber" aria-hidden="true"></div>
      <div class="sheet-head">
        <span class="label-sm">Focus Break${step ? ` · ${step}` : ""}</span>
        <button class="linkbtn" type="button" data-close>Not now</button>
      </div>`;
    const wireClose = () => sheet.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", closeFocusBreak));

    // Step 1: tip card
    sheet.innerHTML = `
      ${header("")}
      <h2 id="fb-title">Focus is out. Take a breath.</h2>
      <p class="muted">Here's the rule summary for this chapter. Then get ${REVIEW_LENGTH} review questions right in a row to win back ${FOCUS.RULES.restore}% Focus.</p>
      ${FOCUS.meterHtml(S.focus)}
      <article class="tip-card">
        <span class="label-sm">${ch.bonus ? "Bonus" : `Chapter ${ch.id}`} · ${esc(ch.short)}</span>
        <ul class="rule-list">${ch.pause.rules.map((r) => `<li>${fill(r, cast, false)}</li>`).join("")}</ul>
        ${ch.pause.example ? `<p class="tip-ex">${fill(ch.pause.example, cast, false)}</p>` : ""}
      </article>
      <button class="btn wide" type="button" id="fb-start">Start review</button>
      ${S.sparks >= RULES.elixirPrice
        ? `<button class="btn ghost wide" type="button" id="fb-refill">🧪 Focus Elixir · ${fmt(RULES.elixirPrice)} ⚡ (back to 100%)</button>`
        : `<button class="btn ghost wide" type="button" disabled>🧪 Focus Elixir needs ${fmt(RULES.elixirPrice - S.sparks)} more ⚡</button>`}`;
    wireClose();
    $("#fb-start", sheet).addEventListener("click", () => runReview(sheet, base, new Set(), 1, header, wireClose));
    $("#fb-refill", sheet)?.addEventListener("click", () => {
      const res = rewards.buyElixir(S);
      if (!res.ok) return;
      save();
      renderHud(["sparks"]);
      closeFocusBreak();
      toast(`🧪 Focus back to 100% for ${fmt(res.spent)} ⚡`);
    });
    $("#fb-start", sheet).focus();
  }

  function runReview(sheet, base, used, n, header, wireClose) {
    if (S.focus > 0) {
      save();
      renderHud();
      sheet.innerHTML = `
        ${header("Done")}
        <div class="restored">
          <span class="restored-shields" aria-hidden="true">🧠</span>
          <h2 id="fb-title">Focus restored</h2>
          <p class="muted">You're back to ${S.focus}%. Two more right in a row adds another ${FOCUS.RULES.restore}%.</p>
          ${FOCUS.meterHtml(S.focus)}
        </div>
        <button class="btn wide" type="button" data-close>Back to practice</button>`;
      wireClose();
      sheet.querySelector(".btn").focus();
      return;
    }
    const q = pickReview(base, used);
    used.add(q.id);
    sheet.innerHTML = `
      ${header(`Review ${n} · ${S.focusStreak || 0}/${REVIEW_LENGTH} in a row`)}
      <h2 id="fb-title" class="sr-only">Review question ${n}</h2>
      <div class="review-slot"></div>`;
    wireClose();
    const card = makeCard(q, {
      review: true,
      label: `R${n}`,
      onDone: () => runReview(sheet, base, used, n + 1, header, wireClose),
    });
    card._seenAt = Date.now();
    $(".review-slot", sheet).append(card);
    card.querySelector(".choice").focus();
  }

  function closeFocusBreak() {
    if (!focusSheet) return;
    document.removeEventListener("keydown", focusKeys, true);
    focusSheet.remove();
    focusSheet = null;
    focusReturn?.focus?.({ preventScroll: true });
  }

  function focusKeys(e) {
    if (!focusSheet) return;
    const pos = answerKey(e);
    if (e.key === "Escape") {
      e.preventDefault();
      closeFocusBreak();
    } else if (pos !== -1 && !e.target.closest("input, textarea")) {
      if (pickIn(focusSheet, pos)) e.preventDefault();
    } else if ((e.key === " " || e.key === "Enter") && !e.target.closest("button")) {
      const go = visibleBtn(focusSheet, ".next-row, .btn[data-close]"); // never the Elixir (it costs Sparks)
      if (go) { e.preventDefault(); go.click(); }
    } else if (e.key === "Tab") {
      const items = [...focusSheet.querySelectorAll("button:not(:disabled)")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation(); // keep the feed's shortcuts out of the drawer
  }

  // ---------- Chapter drawer ----------
  let chapterSheet = null;
  let chapterReturn = null;

  function openChapters() {
    if (chapterSheet || focusSheet || onboarding.isOpen()) return;
    chapterReturn = document.activeElement;
    chapterSheet = h("div", { class: "sheet-backdrop" });
    const sheet = h("div", { class: "sheet", role: "dialog", "aria-modal": "true", "aria-labelledby": "ch-title" });
    chapterSheet.append(sheet);
    document.body.append(chapterSheet);
    chapterSheet.addEventListener("mousedown", (e) => { if (e.target === chapterSheet) closeChapters(); });
    document.addEventListener("keydown", chapterKeys, true);

    const row = (ch) => {
      const unlocked = isUnlocked(ch.id);
      const done = isComplete(ch.id);
      const current = S.chapterId === ch.id;
      const got = Math.min(correctIn(ch.id).length, ch.questions.length);
      const status = done ? "✓" : current ? "▶" : unlocked ? "•" : "🔒";
      const sub = unlocked
        ? `${done ? "Complete" : `${got} of ${ch.questions.length} correct`}${current ? " · current" : ""}`
        : lockNote(ch);
      return `
        <button type="button" class="chapter-row${done ? " done" : ""}${current ? " current" : ""}" data-ch="${ch.id}" ${unlocked ? "" : "disabled"}>
          <span class="ch-status" aria-hidden="true">${status}</span>
          <span class="ch-info">
            <b>${ch.bonus ? "Bonus" : `${ch.id}.`} ${esc(ch.title)}</b>
            <small>${sub}</small>
            ${unlocked && !done ? `<span class="bar" aria-hidden="true"><i style="width:${(got / ch.questions.length) * 100}%"></i></span>` : ""}
          </span>
        </button>`;
    };
    const core = CHAPTERS.filter((c) => !c.bonus);
    const extra = CHAPTERS.filter((c) => c.bonus);
    const coreDone = core.filter((c) => isComplete(c.id)).length;

    sheet.innerHTML = `
      <div class="grabber" aria-hidden="true"></div>
      <div class="sheet-head">
        <span class="label-sm">Curriculum · ${coreDone} of ${core.length} complete</span>
        <button class="linkbtn" type="button" data-close>Close</button>
      </div>
      <h2 id="ch-title">Chapters</h2>
      <div class="chapter-list">${core.map(row).join("")}</div>
      <span class="label-sm">Extras</span>
      <div class="chapter-list">
        ${extra.map(row).join("")}
        <button type="button" class="chapter-row${inReview() ? " current" : ""}" data-ch="${REVIEW_ID}" ${reviewOpen() ? "" : "disabled"}>
          <span class="ch-status" aria-hidden="true">${reviewOpen() ? "🔀" : "🔒"}</span>
          <span class="ch-info"><b>Mixed review</b><small>${reviewOpen() ? "Endless questions from finished chapters, missed ones first" : "Finish any chapter first"}</small></span>
        </button>
      </div>`;
    sheet.querySelector("[data-close]").addEventListener("click", closeChapters);
    sheet.querySelectorAll("[data-ch]:not([disabled])").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.ch === REVIEW_ID ? REVIEW_ID : Number(b.dataset.ch);
      closeChapters();
      startChapter(id);
    }));
    (sheet.querySelector(".chapter-row.current:not([disabled])") || sheet.querySelector("[data-close]")).focus();
  }

  function closeChapters() {
    if (!chapterSheet) return;
    document.removeEventListener("keydown", chapterKeys, true);
    chapterSheet.remove();
    chapterSheet = null;
    chapterReturn?.focus?.({ preventScroll: true });
  }

  function chapterKeys(e) {
    if (!chapterSheet) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeChapters();
    } else if (e.key === "Tab") {
      const items = [...chapterSheet.querySelectorAll("button:not(:disabled)")];
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation();
  }

  $("#chapter-bar").addEventListener("click", openChapters);

  // ---------- Dashboard (chapter select) ----------
  // One card per chapter: core progress, best test score, and three ways in:
  // Learn & practice (the feed), a 10-question practice set, and the
  // 10-question Review for Understanding test that unlocks the next chapter.
  const dash = $("#view-dash");
  function renderDash() {
    const core = CHAPTERS.filter((c) => !c.bonus);
    const passed = core.filter((c) => S.tests[c.id]?.passed).length;
    const card = (ch) => {
      const open = isUnlocked(ch.id);
      const t = S.tests[ch.id];
      const ps = S.practiceSets[ch.id];
      const got = Math.min(correctIn(ch.id).length, ch.questions.length);
      const state = !open ? "🔒 Locked"
        : t?.passed ? `✓ Passed · best ${t.best}/${t.n}`
        : t ? `Best ${t.best}/${t.n} · need ${passMark(t.n)}`
        : S.chapterId === ch.id ? "▶ Current" : "Not tested yet";
      return `
        <article class="ch-card${open ? "" : " locked"}${t?.passed ? " passed" : ""}${S.chapterId === ch.id ? " current" : ""}" data-ch="${ch.id}">
          <div class="ch-card-top">
            <span class="ch-badge">${ch.bonus ? "Bonus" : `Ch ${ch.id}`}</span>
            <span class="ch-state">${state}</span>
          </div>
          <h3>${esc(ch.title.replace(/^Bonus: /, ""))}</h3>
          ${open ? `
          <div class="ch-progress">
            <span class="bar" aria-hidden="true"><i style="width:${(got / ch.questions.length) * 100}%"></i></span>
            <small class="muted">${got}/${ch.questions.length} core questions right${ps ? ` · last practice set ${ps.last}/${ps.n}` : ""}</small>
          </div>
          <div class="ch-actions">
            <button class="btn" type="button" data-learn="${ch.id}">📖 Learn & practice</button>
            <button class="btn ghost" type="button" data-set="${ch.id}">✏️ Practice set (${TEST_LEN})</button>
            <button class="btn ghost test-btn" type="button" data-test="${ch.id}">🎯 Review for Understanding (${TEST_LEN})</button>
          </div>` : `<p class="lock-note">🔒 ${esc(lockNote(ch))}.</p>`}
        </article>`;
    };
    dash.innerHTML = `
      <div class="stack dash">
        <section class="dash-hero">
          <span class="label-sm">Digital SAT grammar · ${passed} of ${core.length} chapters passed</span>
          <h2>${S.name ? `Welcome back, ${esc(S.name)}` : "Your chapters"}</h2>
          <p class="muted">Learn each rule, practice, then score <b>${passMark(TEST_LEN)}/${TEST_LEN}</b> or better on the chapter's <b>Review for Understanding</b> to unlock the next one.</p>
          <div class="dash-focus">${FOCUS.meterHtml(S.focus)}<small class="muted">${S.focus < FOCUS.RULES.max ? `Full recharge in ${FOCUS.nextRechargeMin(S)} min` : "Focus recharges to 100% every hour"}</small></div>
        </section>
        <div class="dash-grid">${core.map(card).join("")}</div>
        <span class="label-sm">Extras</span>
        <div class="dash-grid">
          ${CHAPTERS.filter((c) => c.bonus).map(card).join("")}
          <article class="ch-card${reviewOpen() ? "" : " locked"}">
            <div class="ch-card-top"><span class="ch-badge">Mix</span><span class="ch-state">${reviewOpen() ? `${S.missed.length} missed` : "🔒 Locked"}</span></div>
            <h3>Mixed review</h3>
            ${reviewOpen()
              ? `<p class="muted small">Endless questions from finished chapters, missed ones first.</p><div class="ch-actions"><button class="btn" type="button" data-learn="${REVIEW_ID}">🔀 Start mixed review</button></div>`
              : '<p class="lock-note">🔒 Finish every question in any chapter first.</p>'}
          </article>
        </div>
      </div>`;
    dash.querySelectorAll("[data-learn]").forEach((b) => b.addEventListener("click", () => {
      sfx.play("tap");
      openPractice(b.dataset.learn === REVIEW_ID ? REVIEW_ID : Number(b.dataset.learn));
    }));
    dash.querySelectorAll("[data-set]").forEach((b) => b.addEventListener("click", () => startRun("practice", Number(b.dataset.set))));
    dash.querySelectorAll("[data-test]").forEach((b) => b.addEventListener("click", () => startRun("test", Number(b.dataset.test))));
  }

  // Learn & practice: the chapter's lesson card and question feed. Coming back
  // to the chapter you were on keeps your place.
  function openPractice(id) {
    if (S.chapterId !== id || !feed.querySelector(".card")) startChapter(id);
    show("feed");
  }

  // ---------- Review for Understanding tests & practice sets ----------
  // Ten questions, one at a time, with no feedback until you submit. Then the
  // Diagnostic screen: PASS/FAIL at 80%, the score, and every item with your
  // answer, the right one, the rule's name and a short explanation.
  const TEST_LEN = 10;
  const PASS_SHARE = 0.8;
  const passMark = (n) => Math.ceil(n * PASS_SHARE);
  const testView = $("#view-test");
  const diagView = $("#view-diag");
  let run = null; // { mode: "test" | "practice", chId, items: [{ q, order, cast, pick, ms, seenAt }], i }
  let lastResult = null;

  // A test: the chapter's benchmark question, then core questions (missed and
  // not-yet-right first), then fresh generated ones from the no-repeat stream,
  // so every retake is different.
  function pickTest(ch) {
    const ids = [];
    const add = (id) => { if (id && BY_ID[id] && !ids.includes(id) && ids.length < TEST_LEN) ids.push(id); };
    const bm = ch.questions.find((q) => q.benchmark);
    if (bm) add(bm.id);
    const core = ch.questions.filter((q) => !q.benchmark);
    const got = new Set(correctIn(ch.id));
    const missed = core.filter((q) => S.missed.includes(q.id));
    const fresh = core.filter((q) => !got.has(q.id) && !S.missed.includes(q.id));
    const rest = core.filter((q) => got.has(q.id) && !S.missed.includes(q.id));
    const coreUpTo = ch.pool.length ? TEST_LEN - 4 : TEST_LEN;
    for (const q of [...shuffle(missed), ...shuffle(fresh), ...shuffle(rest)]) {
      if (ids.length >= coreUpTo) break;
      add(q.id);
    }
    for (let k = 0; ids.length < TEST_LEN && ch.pool.length && k < 40; k++) add(nextGenId(ch.id));
    for (const q of shuffle(core)) add(q.id);
    return [ids[0], ...shuffle(ids.slice(1))];
  }
  // A practice set: this chapter's missed questions first, then fresh ones.
  function pickPractice(ch) {
    const ids = [];
    const add = (id) => { if (id && BY_ID[id] && !ids.includes(id) && ids.length < TEST_LEN) ids.push(id); };
    shuffle(S.missed.filter((id) => BY_ID[id]?.chapterId === ch.id)).slice(0, TEST_LEN / 2).forEach(add);
    for (let k = 0; ids.length < TEST_LEN && ch.pool.length && k < 40; k++) add(nextGenId(ch.id));
    const got = new Set(correctIn(ch.id));
    for (const q of [...shuffle(ch.questions.filter((x) => !got.has(x.id))), ...shuffle(ch.questions)]) add(q.id);
    return shuffle(ids);
  }

  function startRun(mode, chId) {
    const ch = chapterById(chId);
    if (!ch || !isUnlocked(chId)) return;
    sfx.play("tap");
    const ids = mode === "test" ? pickTest(ch) : pickPractice(ch);
    run = {
      mode,
      chId,
      i: 0,
      items: ids.map((id) => ({ q: BY_ID[id], order: shuffle([0, 1, 2, 3]), cast: castFor(id), pick: null, ms: 0, seenAt: 0 })),
    };
    save(); // the generated-question cursor moved
    show("test");
    renderTest();
  }

  const runTitle = (r) => {
    const ch = chapterById(r.chId);
    return `${r.mode === "test" ? "Review for Understanding" : "Practice set"} · ${ch.bonus ? "Bonus" : `Ch ${ch.id}`}`;
  };

  function renderTest() {
    if (!run) { show("dash"); return; }
    const it = run.items[run.i];
    const q = it.q;
    const ch = chapterById(q.chapterId);
    const n = run.items.length;
    const done = run.items.filter((x) => x.pick != null).length;
    const last = run.i === n - 1;
    if (!it.seenAt) it.seenAt = Date.now();
    testView.innerHTML = `
      <div class="stack test-view">
        <div class="test-top">
          <button class="linkbtn" type="button" data-quit>✕ Quit</button>
          <span class="label-sm">${esc(runTitle(run))}</span>
          <span class="pill-sm">${done}/${n} answered</span>
        </div>
        <ol class="test-dots" aria-label="Questions">
          ${run.items.map((x, k) => `<li><button type="button" data-jump="${k}" class="${k === run.i ? "on " : ""}${x.pick != null ? "done" : ""}" aria-label="Question ${k + 1}${x.pick != null ? ", answered" : ""}"${k === run.i ? ' aria-current="step"' : ""}>${k + 1}</button></li>`).join("")}
        </ol>
        <section class="card test-card" data-qid="${esc(q.id)}">
          <div class="card-inner bb">
            <div class="bb-top">
              <span class="bb-num" aria-label="Question ${run.i + 1} of ${n}">${run.i + 1}</span>
              <span class="bb-meta">${ch.bonus ? "Bonus" : `Ch ${ch.id}`} · ${esc(q.skill)}</span>
            </div>
            <div class="bb-passage"><p class="passage">${renderPassage(q.text, it.cast)}</p></div>
            <p class="bb-stem">${esc(SW.stemFor(q))}</p>
            <ol class="choices">
              ${it.order.map((ci, pos) => `
                <li><button class="choice${it.pick === ci ? " picked" : ""}" type="button" data-ci="${ci}" aria-pressed="${it.pick === ci}" aria-label="(${"ABCD"[pos]}) ${esc(fill(q.choices[ci], it.cast, false).replace(/<[^>]+>/g, ""))}">
                  <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span><span class="txt">${fill(q.choices[ci], it.cast, false)}</span>
                </button></li>`).join("")}
            </ol>
          </div>
        </section>
        <div class="test-nav">
          <button class="btn ghost" type="button" data-prev ${run.i === 0 ? "disabled" : ""}>← Back</button>
          ${last && done === n
            ? '<button class="btn" type="button" data-submit>Submit ✓</button>'
            : `<button class="btn" type="button" data-next>${last ? "Next unanswered →" : "Next →"}</button>`}
        </div>
        <p class="muted small center">No answers are revealed until you submit${run.mode === "test" ? ` · ${passMark(n)}/${n} passes` : ""}.${done === n && !last ? ' <button class="linkbtn" type="button" data-submit>Submit now</button>' : ""}</p>
      </div>`;
    testView.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => pickChoice(Number(b.dataset.ci))));
    testView.querySelectorAll("[data-jump]").forEach((b) => b.addEventListener("click", () => goTo(Number(b.dataset.jump))));
    testView.querySelector("[data-prev]")?.addEventListener("click", () => goTo(run.i - 1));
    testView.querySelector("[data-next]")?.addEventListener("click", nextInRun);
    testView.querySelectorAll("[data-submit]").forEach((b) => b.addEventListener("click", submitRun));
    testView.querySelector("[data-quit]").addEventListener("click", () => {
      if (done && !confirm("Quit this set? Your answers won't be scored.")) return;
      run = null;
      show("dash");
    });
  }

  function pickChoice(ci) {
    const it = run.items[run.i];
    if (it.pick == null) it.ms = Date.now() - (it.seenAt || Date.now()); // think time to the first pick
    it.pick = ci;
    sfx.play("tap");
    renderTest();
    testView.querySelector("[data-next], [data-submit]")?.focus({ preventScroll: true });
  }
  function goTo(k) {
    if (!run || k < 0 || k >= run.items.length) return;
    run.i = k;
    renderTest();
    testView.scrollTop = 0;
  }
  function nextInRun() {
    const n = run.items.length;
    if (run.i < n - 1) return goTo(run.i + 1);
    const open = run.items.findIndex((x) => x.pick == null);
    if (open !== -1) goTo(open);
  }

  // Scores the set and records every answer like Practice does: stats, the
  // daily goal, missed questions, Sparks for right answers and Focus.
  function submitRun() {
    if (!run || run.items.some((x) => x.pick == null)) return;
    const r = run;
    run = null;
    const ch = chapterById(r.chId);
    rollover();
    const d = today();
    let score = 0;
    let earned = 0;
    for (const it of r.items) {
      const q = it.q;
      const correct = it.pick === q.answer;
      it.correct = correct;
      d.n++;
      const sk = (S.skills[q.skill] ||= { seen: 0, right: 0 });
      sk.chapterId = q.chapterId;
      sk.seen++;
      if (correct) {
        score++;
        d.c++;
        sk.right++;
        S.totalCorrect++;
        S.missed = S.missed.filter((id) => id !== q.id);
        earned += rewards.earn(S, RULES.sparksPerCorrect);
        if (!q.gen) {
          const got = correctIn(q.chapterId);
          if (!got.includes(q.id)) got.push(q.id);
        }
      } else if (!S.missed.includes(q.id)) S.missed.push(q.id);
      FOCUS.apply(S, { correct, ms: it.ms || Infinity, rushMs: FOCUS.RULES.practiceRushMs });
    }
    S.xp += score * 10;
    const n = r.items.length;
    const pass = score >= passMark(n);
    const book = r.mode === "test" ? S.tests : S.practiceSets;
    const prev = book[ch.id];
    book[ch.id] = {
      best: Math.max(prev?.best || 0, score),
      last: score,
      n,
      passed: Boolean(prev?.passed) || pass,
      attempts: (prev?.attempts || 0) + 1,
      at: Date.now(),
    };
    // Passing the test unlocks the next chapter (Chapter 7 opens the bonus ones).
    let unlocked = null;
    if (r.mode === "test" && pass) {
      const next = chapterById(ch.id + 1);
      if (next && !isUnlocked(next.id)) {
        S.unlockedChapters.push(next.id);
        unlocked = next;
      }
      if (!prev?.passed) earned += rewards.earn(S, RULES.chapterSparks);
    }
    if (score === n) S.flawless = (S.flawless || 0) + 1; // a flawless run (Trophy Case)
    const goal = checkGoal();
    const newBadges = rewards.checkBadges(S, {});
    save();
    renderHud(["sparks", ...(goal ? ["streak"] : [])]);
    renderChapterBar();
    pingPractice();
    lastResult = { mode: r.mode, chId: ch.id, items: r.items, score, n, pass, unlocked, earned };
    sfx.play(pass ? "complete" : "wrong");
    if (pass) sfx.buzz(50);
    if (r.mode === "test" && FOCUS.level(S.focus) === "critical") shake();
    show("diag");
    renderDiag();
    if (unlocked) celebrate("🔓", `${unlocked.bonus ? "Bonus chapter" : `Chapter ${unlocked.id}`} unlocked!`, `${score}/${n} on the Review for Understanding`);
    if (goal) celebrateGoal(goal);
    announceBadges(newBadges);
  }

  // ---------- Diagnostic Feedback screen ----------
  function renderDiag() {
    const r = lastResult;
    if (!r) { show("dash"); return; }
    const ch = chapterById(r.chId);
    const next = chapterById(r.chId + 1);
    const pct = Math.round((r.score / r.n) * 100);
    const isTest = r.mode === "test";
    const status = r.pass ? "PASS" : "FAIL";
    let note;
    if (isTest && r.unlocked) note = `🔓 ${r.unlocked.bonus ? "Bonus chapter" : `Chapter ${r.unlocked.id}`} unlocked: <b>${esc(r.unlocked.title.replace(/^Bonus: /, ""))}</b>`;
    else if (isTest && r.pass) note = next ? `${next.bonus ? "The bonus chapter" : `Chapter ${next.id}`} is open.` : "You've passed every chapter test.";
    else if (isTest) note = `You need ${passMark(r.n)}/${r.n} (80%) to unlock ${next ? (next.bonus ? "the bonus chapter" : `Chapter ${next.id}`) : "the next chapter"}. Review the rules below, then retake: every retake has new questions.`;
    else note = r.pass ? "Nice set. When you're ready, take the Review for Understanding." : "Practice sets don't unlock chapters. Review the misses below and keep going.";
    const letter = (it, ci) => "ABCD"[it.order.indexOf(ci)];
    const ans = (it, ci) => `<span class="ans-letter">${letter(it, ci)}</span> ${fill(it.q.choices[ci], it.cast, false)}`;
    diagView.innerHTML = `
      <div class="stack diag">
        <section class="diag-banner ${r.pass ? "pass" : "fail"}" role="status">
          <span class="diag-status">${status}</span>
          <b class="diag-pct">${pct}%</b>
          <span class="diag-sub">${r.score} of ${r.n} correct · ${esc(runTitle(r))}</span>
          <p class="diag-note">${note}</p>
          <small class="diag-earn">+${fmt(r.earned)} ⚡ · Focus ${S.focus}%</small>
        </section>
        <div class="diag-actions">
          <button class="btn" type="button" data-retake>↻ ${isTest ? "Retake test" : "New practice set"}</button>
          ${next && isUnlocked(next.id) ? `<button class="btn ghost" type="button" data-next-ch="${next.id}">${next.bonus ? "Bonus chapter" : `Chapter ${next.id}`} →</button>` : ""}
          ${!isTest ? `<button class="btn ghost" type="button" data-test-now>🎯 Take the test</button>` : ""}
          <button class="btn ghost" type="button" data-dash>🏠 Dashboard</button>
        </div>
        <h3 class="diag-head">Item-by-item review · ${esc(ch.title.replace(/^Bonus: /, ""))}</h3>
        <ol class="diag-list">
          ${r.items.map((it, k) => `
            <li class="diag-item ${it.correct ? "ok" : "no"}">
              <div class="diag-item-top">
                <span class="diag-n">${k + 1}</span>
                <span class="diag-verdict">${it.correct ? "✓ Correct" : "✗ Incorrect"}</span>
                <span class="diag-rule">${esc(SW.ruleName(it.q))}</span>
              </div>
              <p class="passage">${renderPassage(it.q.text, it.cast, fill(it.q.choices[it.q.answer], it.cast, false))}</p>
              <dl class="diag-ans">
                <div class="${it.correct ? "ok" : "no"}"><dt>Your answer</dt><dd>${ans(it, it.pick)}</dd></div>
                ${it.correct ? "" : `<div class="ok"><dt>Correct answer</dt><dd>${ans(it, it.q.answer)}</dd></div>`}
              </dl>
              <p class="diag-why"><b>Why:</b> ${fill(SW.ruleExplain(it.q), it.cast, false)}</p>
              ${it.correct ? "" : `<p class="diag-why miss"><b>Your choice:</b> ${fill(it.q.notes[it.pick], it.cast, false)}</p>`}
            </li>`).join("")}
        </ol>
        <button class="btn ghost wide" type="button" data-dash>🏠 Back to Dashboard</button>
      </div>`;
    diagView.scrollTop = 0;
    diagView.querySelector("[data-retake]").addEventListener("click", () => startRun(r.mode, r.chId));
    diagView.querySelector("[data-test-now]")?.addEventListener("click", () => startRun("test", r.chId));
    diagView.querySelector("[data-next-ch]")?.addEventListener("click", (e) => openPractice(Number(e.currentTarget.dataset.nextCh)));
    diagView.querySelectorAll("[data-dash]").forEach((b) => b.addEventListener("click", () => show("dash")));
    diagView.querySelector(".diag-banner").focus?.();
  }

  // ---------- Hourly Focus recharge ----------
  // Focus goes back to 100% once an hour (checked at start-up, every minute
  // and when the tab comes back). It waits until a Derby race is over.
  function focusTick() {
    if (derby.racing()) return;
    const before = S.focusResetAt;
    if (FOCUS.hourly(S)) {
      save();
      renderHud();
      toast("🧠 Focus recharged to 100%. It refills every hour.");
      rerenderCurrent();
    } else if (before !== S.focusResetAt) save(false);
  }


  // ---------- Help overlay: how to play, keyboard, rules, feedback ----------
  // Opened with the header's "?" button or the ? key. Esc closes it.
  const FEEDBACK_KEY = "satwizz.feedback"; // localStorage: [{ id, at, kind, text, view }]
  const readFeedback = () => {
    try {
      const list = JSON.parse(localStorage.getItem(FEEDBACK_KEY) || "[]");
      return Array.isArray(list) ? list : [];
    } catch (e) {
      return [];
    }
  };
  let helpSheet = null;
  let helpReturn = null;

  function openHelp(section) {
    if (helpSheet) return;
    closeExplain(false);
    helpReturn = document.activeElement;
    helpSheet = h("div", { class: "help-backdrop" });
    const box = h("div", { class: "help-modal", role: "dialog", "aria-modal": "true", "aria-labelledby": "help-title" });
    helpSheet.append(box);
    document.body.append(helpSheet);
    helpSheet.addEventListener("mousedown", (e) => { if (e.target === helpSheet) closeHelp(); });
    document.addEventListener("keydown", helpKeys, true);
    const cast = castOf();
    const core = CHAPTERS.filter((c) => !c.bonus && c.pause);
    const key = (k) => `<kbd>${k}</kbd>`;
    const saved = readFeedback().length;
    box.innerHTML = `
      <div class="help-head">
        <h2 id="help-title">❓ Help</h2>
        <button class="linkbtn" type="button" data-close aria-label="Close help">✕ Close</button>
      </div>
      <nav class="help-jump" aria-label="Help sections">
        <a href="#help-play">How to play</a><a href="#help-keys">Keyboard</a><a href="#help-rules">Rules cheat sheet</a><a href="#help-feedback">Suggest / report</a>
      </nav>
      <section class="help-sec" id="help-play">
        <h3>How to Play SatWizz</h3>
        <ul class="help-list">
          <li><b>🏠 Chapters.</b> Learn each chapter's rules in <i>Learn &amp; practice</i>, try a <i>Practice set</i>, then take the 10-question <b>Review for Understanding</b>. Score <b>8/10</b> to unlock the next chapter. After every set, the Diagnostic screen explains each answer.</li>
          <li><b>🧠 Focus (0–100%).</b> A miss costs ${FOCUS.RULES.miss}%, rushing (under 3s) costs ${FOCUS.RULES.rush}%. Two right in a row gives +${FOCUS.RULES.restore}%. It refills to 100% every hour, or right away with a 🧪 Focus Elixir. Low Focus outlines the question in orange or red, and in the Derby it locks your answers for a few seconds.</li>
          <li><b>⚡ Sparks.</b> +${RULES.sparksPerCorrect} per right answer, bonuses for combos, your daily goal and chapter milestones. Spend them in the 🛍️ Shop or bet them in the 🐎 Derby.</li>
          <li><b>🔥 Lock In Streak.</b> Meet your daily goal (${S.goal} questions) every day. Aura Shields 💠 cover a missed day.</li>
          <li><b>📚 Vocab Vault.</b> Flashcards with 🔊 pronunciation, daily sprints and 🎣 Vocab Fishing.</li>
          <li><b>🏆 Trophy Case.</b> ${rewards.BADGES.length} accomplishments in Profile. Wear one as your title or share it.</li>
        </ul>
      </section>
      <section class="help-sec" id="help-keys">
        <h3>Keyboard Controls</h3>
        <div class="key-grid">
          <div>${key("A")} ${key("B")} ${key("C")} ${key("D")} <span class="muted">or</span> ${key("1")}–${key("4")}</div><div>Answer (practice, tests, Derby, sprints)</div>
          <div>${key("Space")} ${key("Enter")}</div><div>Continue / next question</div>
          <div>${key("←")} ${key("→")}</div><div>Previous / next in a test; flashcard Needs Review / Mastered</div>
          <div>${key("Esc")}</div><div>Close a panel or this help</div>
          <div>${key("P")}</div><div>Pronounce the flashcard word</div>
          <div>${key("?")}</div><div>Open this help</div>
        </div>
      </section>
      <section class="help-sec" id="help-rules">
        <h3>SAT Grammar Rules Cheat Sheet</h3>
        <div class="rule-acc">
          ${core.map((ch) => `
            <details>
              <summary><span class="ch-badge">Ch ${ch.id}</span> ${esc(ch.title)}</summary>
              <p class="muted">${fill(ch.pause.summary, cast, false)}</p>
              <ul>${ch.pause.rules.map((r) => `<li>${fill(r, cast, false)}</li>`).join("")}</ul>
            </details>`).join("")}
        </div>
      </section>
      <section class="help-sec" id="help-feedback">
        <h3>Suggest a Feature / Report a Bug</h3>
        <form class="feedback-form" id="feedback-form" novalidate>
          <div class="seg" role="radiogroup" aria-label="Feedback type">
            <label><input type="radio" name="fb-kind" value="feature" checked> 💡 Feature idea</label>
            <label><input type="radio" name="fb-kind" value="bug"> 🐞 Bug report</label>
          </div>
          <label class="sr-only" for="fb-text">Your feedback</label>
          <textarea id="fb-text" rows="4" maxlength="1000" placeholder="What would make SatWizz better? If something broke, what were you doing?"></textarea>
          <div class="fb-row">
            <small class="muted" id="fb-count">${saved ? `${saved} saved on this device` : "Saved on this device"}</small>
            <button class="btn" type="submit" id="fb-submit">Submit Feedback</button>
          </div>
        </form>
      </section>`;
    box.querySelector("[data-close]").addEventListener("click", closeHelp);
    box.querySelectorAll(".help-jump a").forEach((a) => a.addEventListener("click", (e) => {
      e.preventDefault();
      box.querySelector(a.getAttribute("href")).scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    }));
    box.querySelector("#feedback-form").addEventListener("submit", (e) => {
      e.preventDefault();
      const ta = box.querySelector("#fb-text");
      const text = ta.value.trim();
      if (!text) {
        ta.focus();
        toast("Type your suggestion or bug first.");
        return;
      }
      const list = readFeedback();
      list.push({ id: `fb-${Date.now().toString(36)}`, at: new Date().toISOString(), kind: box.querySelector('[name="fb-kind"]:checked').value, text: text.slice(0, 1000), view: currentView });
      try { localStorage.setItem(FEEDBACK_KEY, JSON.stringify(list)); } catch (err) { /* storage blocked: still thank them */ }
      ta.value = "";
      box.querySelector("#fb-count").textContent = `${list.length} saved on this device`;
      sfx.play("correct");
      toast("Thanks! Your suggestion has been saved locally.");
    });
    if (section) box.querySelector(`#help-${section}`)?.scrollIntoView({ block: "start" });
    (section === "feedback" ? box.querySelector("#fb-text") : box.querySelector("[data-close]")).focus({ preventScroll: Boolean(section) });
  }

  function closeHelp() {
    if (!helpSheet) return;
    document.removeEventListener("keydown", helpKeys, true);
    helpSheet.remove();
    helpSheet = null;
    helpReturn?.focus?.({ preventScroll: true });
  }

  function helpKeys(e) {
    if (!helpSheet) return;
    if (e.key === "Escape") {
      e.preventDefault();
      closeHelp();
    } else if (e.key === "Tab") {
      const items = [...helpSheet.querySelectorAll("button, a, textarea, input, summary")].filter((x) => !x.disabled && x.offsetParent);
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    e.stopPropagation(); // the app's shortcuts stay out of the help
  }

  // ---------- Celebration & toast ----------
  // Celebrations queue so a streak, a badge and a combo don't pile up at once.
  const burstQueue = [];
  let bursting = false;

  function celebrate(emoji, title, sub) {
    burstQueue.push({ emoji, title, sub });
    if (!bursting) nextBurst();
  }

  function nextBurst() {
    const item = burstQueue.shift();
    if (!item) { bursting = false; return; }
    bursting = true;
    const wrap = h("div", { class: "burst", role: "status" });
    wrap.innerHTML = `<div class="burst-card"><span class="e" aria-hidden="true">${item.emoji}</span><b>${esc(item.title)}</b><span>${esc(item.sub)}</span></div>`;
    document.body.append(wrap);
    const colors = ["var(--flame)", "var(--flame-2)", "var(--volt)", "var(--good)", "var(--ice)"];
    for (let i = 0; i < 26; i++) {
      const c = h("i", { class: "confetti" });
      const angle = Math.random() * Math.PI * 2;
      const dist = 120 + Math.random() * 180;
      c.style.setProperty("--dx", `${Math.cos(angle) * dist}px`);
      c.style.setProperty("--dy", `${Math.sin(angle) * dist}px`);
      c.style.setProperty("--rot", `${Math.random() * 720 - 360}deg`);
      c.style.background = colors[i % colors.length];
      document.body.append(c);
      setTimeout(() => c.remove(), 1400);
    }
    setTimeout(() => { wrap.remove(); nextBurst(); }, 2000);
  }

  let toastTimer;
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const t = h("div", { class: "toast", role: "status" }, esc(msg));
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  // ---------- Streak & Achievements (top of the Profile tab) ----------
  function renderStreak() {
    rollover();
    const v = $("#streak-slot");
    if (!v) return;
    const switcher = `
      <div class="seg subtabs" role="tablist" aria-label="Streak sections">
        <button type="button" role="tab" data-sub="streak" aria-selected="${streakTab === "streak"}">Streak</button>
        <button type="button" role="tab" data-sub="achievements" aria-selected="${streakTab === "achievements"}">🏆 Trophy Case <span class="count">${earnedCount()}/${rewards.BADGES.length}</span></button>
      </div>`;
    v.innerHTML = `<div class="stack">${switcher}${streakTab === "streak" ? streakHtml() : achievementsHtml()}</div>`;
    v.querySelectorAll("[data-sub]").forEach((b) => b.addEventListener("click", () => { streakTab = b.dataset.sub; renderStreak(); }));
    v.querySelectorAll("[data-wear]").forEach((b) => b.addEventListener("click", () => {
      S.title = S.title === b.dataset.wear ? null : b.dataset.wear;
      save();
      renderStreak();
    }));
    v.querySelectorAll("[data-cat]").forEach((b) => b.addEventListener("click", () => {
      trophyCat = b.dataset.cat;
      sfx.play("tap");
      renderStreak();
    }));
    v.querySelectorAll("[data-share]").forEach((b) => b.addEventListener("click", () => shareBadge(rewards.badgeById(b.dataset.share))));
  }

  function streakHtml() {
    const t = todayKey();
    const n = today().n;
    let status;
    let warn = false;
    if (doneToday()) status = "Today's goal is done. Come back tomorrow to keep it going.";
    else if (S.streak > 0) { status = `⌛ Answer ${S.goal - n} more today or your streak resets at midnight.`; warn = true; }
    else status = `Answer ${S.goal} questions today to start a streak.`;

    const names = ["S", "M", "T", "W", "T", "F", "S"];
    const week = [];
    for (let i = -6; i <= 0; i++) {
      const k = addDays(t, i);
      const rec = S.days[k];
      const cls = rec?.done ? "done" : rec?.frozen ? "frozen" : "";
      const icon = rec?.done ? "🔥" : rec?.frozen ? "💠" : "";
      week.push(`<div class="d ${i === 0 ? "today" : ""}"><span class="dot ${cls}">${icon}</span>${names[parseKey(k).getDay()]}</div>`);
    }

    const totals = Object.values(S.days).reduce((a, d) => ({ n: a.n + d.n, c: a.c + d.c }), { n: 0, c: 0 });
    const acc = totals.n ? Math.round((totals.c / totals.n) * 100) + "%" : "–";
    const title = S.title && rewards.badgeById(S.title);
    const wp = rewards.wagerProgress(S);

    return `
      <section class="panel flame-hero">
        ${title ? `<span class="title-chip">${title.icon} ${esc(title.title)}</span>` : ""}
        <span class="emoji" aria-hidden="true">${S.streak > 0 ? "🔥" : "🪵"}</span>
        <div class="big ${S.streak === 0 ? "cold" : ""}">${S.streak}</div>
        <div class="label">day streak</div>
        <p class="status ${warn ? "warn" : ""}">${esc(status)}</p>
      </section>
      <section class="panel">
        <span class="label-sm">Last 7 days</span>
        <div class="week">${week.join("")}</div>
        <div class="goalbar" aria-hidden="true"><i style="width:${Math.min(100, (n / S.goal) * 100)}%"></i></div>
        <p class="muted">${Math.min(n, S.goal)} of ${S.goal} questions for today</p>
      </section>
      <section class="panel">
        <div class="freeze-row">
          <span class="ice" aria-hidden="true">${"💠".repeat(S.freezes) || "–"}</span>
          <p><b>${S.freezes} of ${RULES.maxAura} Aura Shields.</b> Each one covers a missed day automatically. You get one free every ${RULES.auraEarnEvery} streak days, or buy one in the Shop.</p>
        </div>
        ${wp ? `<p class="muted">🎲 Double-Spark Wager: day ${wp.days} of ${wp.of}</p>` : ""}
      </section>
      <section class="panel">
        <span class="label-sm">Records</span>
        <div class="stats">
          <div class="stat"><b>${S.bestStreak}</b><span>Best day streak</span></div>
          <div class="stat"><b>${S.bestCombo}</b><span>Best in a row</span></div>
          <div class="stat"><b>${S.xp}</b><span>Total XP</span></div>
          <div class="stat"><b>${acc}</b><span>Accuracy (${totals.n} answered)</span></div>
        </div>
      </section>`;
  }

  // ---------- Trophy Case: 50 accomplishments (js/badges.js) ----------
  // Filter by category, progress bars on locked badges, a glow on anything
  // unlocked in the last 7 days, and a Share button that copies a snippet.
  let trophyCat = "all";
  const RECENT_MS = 7 * 864e5;
  const earnedCount = () => rewards.BADGES.filter((b) => S.badges.includes(b.id)).length;
  const isRecent = (id) => Date.now() - (S.badgeAt[id] || 0) < RECENT_MS;
  const shortDate = (ms) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  function achievementsHtml() {
    const all = rewards.BADGES;
    const got = (b) => S.badges.includes(b.id);
    const cats = [["all", "All"], ...SW.BADGE_CATS];
    const inCat = (c) => (c === "all" ? all : all.filter((b) => b.cat === c));
    const shown = inCat(trophyCat).slice().sort((a, b) => {
      // Unlocked first (most recent first), then locked by how close you are.
      const ga = got(a), gb = got(b);
      if (ga !== gb) return ga ? -1 : 1;
      if (ga) return (S.badgeAt[b.id] || 0) - (S.badgeAt[a.id] || 0);
      const pa = a.progress(S), pb = b.progress(S);
      return pb.value / pb.of - pa.value / pa.of;
    });
    const total = earnedCount();
    const recent = all.filter((b) => got(b) && isRecent(b.id));
    const card = (b) => {
      const have = got(b);
      const p = b.progress(S);
      const wearing = S.title === b.id;
      const fresh = have && isRecent(b.id);
      return `
        <article class="trophy${have ? " got" : " locked"}${fresh ? " recent" : ""}" data-badge="${b.id}">
          <span class="trophy-icon" aria-hidden="true">${b.icon}</span>
          <div class="trophy-info">
            <b>${esc(b.title)}${fresh ? ' <span class="new-tag">NEW</span>' : ""}</b>
            <span>${esc(b.desc)}</span>
            ${have
              ? `<small class="muted">${S.badgeAt[b.id] ? `Unlocked ${shortDate(S.badgeAt[b.id])}` : "Unlocked"}</small>`
              : `<div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${p.of}" aria-valuenow="${p.value}" aria-label="${esc(b.title)} progress"><i style="width:${(p.value / p.of) * 100}%"></i></div><small>${esc(p.label)}</small>`}
          </div>
          ${have ? `
          <div class="trophy-actions">
            <button class="mini-btn${wearing ? " on" : ""}" type="button" data-wear="${b.id}" aria-pressed="${wearing}">${wearing ? "Wearing" : "Wear title"}</button>
            <button class="mini-btn" type="button" data-share="${b.id}" aria-label="Share ${esc(b.title)}">📋 Share</button>
          </div>` : ""}
        </article>`;
    };
    return `
      <section class="panel trophy-case">
        <div class="trophy-head">
          <h2>🏆 Trophy Case</h2>
          <span class="pill-sm">${total} / ${all.length}</span>
        </div>
        <div class="bar trophy-total" aria-hidden="true"><i style="width:${(total / all.length) * 100}%"></i></div>
        <p class="muted">${total ? "Wear any unlocked accomplishment as your title, or share it." : "Every question, test, sprint, race and purchase counts toward an accomplishment."}${recent.length ? ` <b>${recent.length} new this week ✨</b>` : ""}</p>
        <div class="trophy-filters" role="group" aria-label="Filter accomplishments">
          ${cats.map(([id, label]) => {
            const list = inCat(id);
            return `<button type="button" class="chip-btn" data-cat="${id}" aria-pressed="${trophyCat === id}">${esc(label)} <small>${list.filter(got).length}/${list.length}</small></button>`;
          }).join("")}
        </div>
        <div class="trophy-grid">${shown.map(card).join("")}</div>
      </section>`;
  }

  // Copies a short brag to the clipboard (with a fallback for older browsers).
  async function shareBadge(b) {
    if (!b) return;
    const text = `🏆 I unlocked "${b.title}" ${b.icon} on SatWizz: ${b.desc} (${earnedCount()}/${rewards.BADGES.length} accomplishments) #SatWizz #DigitalSAT`;
    let ok = false;
    try {
      await navigator.clipboard.writeText(text);
      ok = true;
    } catch (e) {
      const ta = h("textarea", { style: "position:fixed;opacity:0", "aria-hidden": "true" });
      ta.value = text;
      document.body.append(ta);
      ta.select();
      try { ok = document.execCommand("copy"); } catch (e2) { ok = false; }
      ta.remove();
    }
    sfx.play("tap");
    toast(ok ? "📋 Copied! Paste it anywhere to share." : text);
  }

  // ---------- Shop ----------
  // Every cosmetic is 500 ⚡: jockey skins, Derby mounts, character casts,
  // avatars, fishing rods and fishing spots; the Focus Elixir is 500 too.
  // Derby and fishing gear live in the Vault progress, so they sync.
  const D = SW.derby;
  const fishStats = () => {
    S.vocab.fishing = Object.assign(S.vocab.fishing || {}, SW.fishing.mergeStats(S.vocab.fishing, null));
    return S.vocab.fishing;
  };
  const derbyStats = () => {
    S.vocab.derby = Object.assign(S.vocab.derby || {}, D.mergeStats(S.vocab.derby, null));
    return S.vocab.derby;
  };
  let armed = null; // id of the buy button waiting for a second tap
  let armTimer;

  function renderShop() {
    rollover();
    const v = $("#view-shop");
    const packs = THEMES.filter((t) => t.price > 0);
    const wp = rewards.wagerProgress(S);
    const auraRoom = RULES.maxAura - S.freezes;

    const derbySt = derbyStats();
    const buyBtn = (id, price, opts = {}) => {
      if (opts.state) return `<button class="buy" type="button" disabled>${esc(opts.state)}</button>`;
      if (S.sparks < price) return `<button class="buy" type="button" disabled>Need ${fmt(price - S.sparks)} more</button>`;
      const confirm = armed === id;
      return `<button class="buy${confirm ? " confirm" : ""}" type="button" data-buy="${id}">${confirm ? `Confirm ${fmt(price)} ⚡` : `${fmt(price)} ⚡`}</button>`;
    };
    const row = (icon, title, sub, action) => `
        <article class="shop-item">
          ${icon}
          <div class="shop-info"><b>${title}</b><span>${sub}</span></div>
          ${action}
        </article>`;
    const useBtn = (inUse, attrs) => (inUse ? '<button class="buy" type="button" disabled>In use</button>' : `<button class="buy owned" type="button" ${attrs}>Use</button>`);

    const fishSt = fishStats();
    const F = SW.fishing;
    const section = (icon, title, sub, rows) => `
        <section class="panel shop-tier">
          <h2><span>${icon} ${title}</span> <span class="price-tag">500 ⚡ each</span></h2>
          <p class="muted">${sub}</p>
          <div class="shop-list">${rows}</div>
        </section>`;
    const silkRows = D.STABLE.silks.map((x) => row(
      `<span class="shop-icon silk-swatch silk-${x.id}" aria-hidden="true">🏇</span>`, esc(x.name), "Jockey silks: colors your Derby lane",
      derbySt.silks.includes(x.id) ? useBtn(derbySt.silk === x.id, `data-silk="${x.id}"`) : buyBtn(`silk:${x.id}`, x.price))).join("");
    const mountRows = D.STABLE.mounts.map((m) => row(
      `<span class="shop-icon" aria-hidden="true">${m.emoji}</span>`, esc(m.name), "Derby mount: runs in your lane",
      derbySt.mounts.includes(m.id) ? useBtn(derbySt.mount === m.id, `data-mount="${m.id}"`) : buyBtn(`mount:${m.id}`, m.price))).join("");
    const packRows = packs.map((t) => row(
      `<span class="shop-icon" aria-hidden="true">${t.icon || "🎭"}</span>`, esc(t.label), esc(castNames(t)),
      rewards.isThemeUnlocked(S, t.id) ? useBtn(S.themeId === t.id, `data-use="${t.id}"`) : buyBtn(`theme:${t.id}`, t.price))).join("");
    const avatarRows = SW.avatars.filter((a) => a.price > 0).map((a) => row(
      `<span class="avatar md" aria-hidden="true">${a.emoji}</span>`, esc(a.label), "Profile picture",
      rewards.isAvatarUnlocked(S, a.id) ? useBtn(S.avatar === a.id, `data-wear-avatar="${a.id}"`) : buyBtn(`avatar:${a.id}`, a.price))).join("");
    const rodRows = F.RODS.filter((r) => r.price).map((r) => row(
      `<span class="shop-icon" aria-hidden="true">${r.emoji}</span>`, esc(r.name), esc(r.perk),
      fishSt.rods.includes(r.id) ? useBtn(fishSt.rod === r.id, `data-rod="${r.id}"`) : buyBtn(`rod:${r.id}`, r.price))).join("");
    const spotRows = F.SPOTS.filter((x) => x.price).map((x) => row(
      `<span class="shop-icon" aria-hidden="true">${x.emoji}</span>`, esc(x.name), esc(x.desc),
      fishSt.spots.includes(x.id) ? useBtn(fishSt.spot === x.id, `data-spot="${x.id}"`) : buyBtn(`spot:${x.id}`, x.price))).join("");

    v.innerHTML = `
      <div class="stack">
        <section class="panel wallet">
          <span class="label-sm">SatWizz Shop</span>
          <div class="wallet-num"><span aria-hidden="true">⚡</span> ${fmt(S.sparks)} <small>Sparks</small></div>
          <ul class="earn-list">
            <li><b>×1.5</b> your bet back on every Derby win</li>
            <li><b>+${RULES.sparksPerCorrect}</b> each correct Practice answer · <b>+${F.RULES.catchSparks}</b> each fish caught</li>
            <li><b>+${RULES.dailyGoalSparks}</b> for your daily goal · <b>+${RULES.chapterSparks}</b> per chapter completed</li>
          </ul>
          <nav class="shop-jump" aria-label="Shop sections">
            <a href="#shop-casts">🎭 Casts</a><a href="#shop-silks">🏇 Jockey Skins</a><a href="#shop-mounts">🦄 Mounts</a><a href="#shop-avatars">🙂 Avatars</a><a href="#shop-rods">🎣 Rods</a><a href="#shop-spots">🌊 Spots</a><a href="#shop-elixir">🧪 Elixir</a>
          </nav>
        </section>
        <div id="shop-casts">${section("🎭", "Character Casts", "Questions use generic names until you unlock a cast. Then every Practice and Derby question stars your cast.", packRows)}</div>
        <div id="shop-silks">${section("🏇", "Jockey Skins", "Silks for your jockey in the Derby.", silkRows)}</div>
        <div id="shop-mounts">${section("🦄", "Derby Mounts", "Ride something rarer than a horse.", mountRows)}</div>
        <div id="shop-avatars">${section("🙂", "Avatars", "Rare profile pictures for the leaderboard.", avatarRows)}</div>
        <div id="shop-rods">${section("🎣", "Fishing Rods", "Each rod has a small perk in Vocab Fishing.", rodRows)}</div>
        <div id="shop-spots">${section("🌊", "Fishing Spots", "New scenery, and a different set of words to fish.", spotRows)}</div>
        <section class="panel shop-tier" id="shop-elixir">
          <h2><span>🧪 Focus Elixir</span> <span class="price-tag">${fmt(RULES.elixirPrice)} ⚡</span></h2>
          <div class="shop-list">
            ${row('<span class="shop-icon" aria-hidden="true">🧪</span>', "Focus Elixir",
              `Refills your Focus Meter to 100% right now, in Practice and the Derby. Otherwise only 2 right in a row restore it (+${FOCUS.RULES.restore}%). ${FOCUS.meterHtml(S.focus)}`,
              buyBtn("elixir", RULES.elixirPrice, { state: S.focus >= FOCUS.RULES.max ? "Focus full" : "" }))}
          </div>
        </section>
        <section class="panel">
          <h2>Power-ups</h2>
          <div class="shop-list">
            ${row('<span class="shop-icon" aria-hidden="true">💨</span>', esc(D.STABLE.burst.name), `Start your next Derby one step ahead. You have ${derbySt.bursts}.`, buyBtn("burst", D.STABLE.burst.price))}
            ${row('<span class="shop-icon" aria-hidden="true">💠</span>', "Aura Shield", `Protects your Lock In Streak on a day you miss practice. Used automatically. You have ${S.freezes} of ${RULES.maxAura}.`,
              buyBtn("aura", RULES.auraPrice, { state: S.freezes >= RULES.maxAura ? "Full" : "" }))}
            ${row(`<span class="shop-icon" aria-hidden="true">💠<sup>×${RULES.auraBundleSize}</sup></span>`, `Aura Shield ×${RULES.auraBundleSize}`, `Costs ${RULES.auraPrice * RULES.auraBundleSize - RULES.auraBundlePrice} ⚡ less than buying ${RULES.auraBundleSize} one at a time. Needs room for ${RULES.auraBundleSize}.`,
              buyBtn("aura3", RULES.auraBundlePrice, { state: auraRoom < RULES.auraBundleSize ? (auraRoom ? `Room for ${auraRoom}` : "Full") : "" }))}
            ${row('<span class="shop-icon" aria-hidden="true">🔗</span>', "Combo Saver", `The next wrong answer on a combo of ${RULES.comboSaverMin}+ keeps your combo. Used automatically. You have ${S.comboSavers} of ${RULES.maxComboSavers}.`,
              buyBtn("saver", RULES.comboSaverPrice, { state: S.comboSavers >= RULES.maxComboSavers ? "Full" : "" }))}
            <article class="shop-item">
              <span class="shop-icon" aria-hidden="true">🎲</span>
              <div class="shop-info">
                <b>Double-Spark Wager</b>
                <span>Bet ${RULES.wagerStake} ⚡. Keep your streak going ${RULES.wagerDays} more days to win ${RULES.wagerPayout} ⚡. If the streak breaks, you lose the bet.</span>
                ${wp ? `<div class="bar" aria-hidden="true"><i style="width:${(wp.days / wp.of) * 100}%"></i></div><small>Day ${wp.days} of ${wp.of}${doneToday() ? "" : " · finish today's goal to count today"}</small>` : ""}
              </div>
              ${buyBtn("wager", RULES.wagerStake, { state: wp ? "Active" : "" })}
            </article>
          </div>
        </section>
      </div>`;

    v.querySelectorAll(".shop-jump a").forEach((x) => x.addEventListener("click", (e) => {
      e.preventDefault();
      v.querySelector(x.getAttribute("href"))?.scrollIntoView({ behavior: reducedMotion() ? "auto" : "smooth", block: "start" });
    }));
    v.querySelectorAll("[data-rod], [data-spot]").forEach((b) => b.addEventListener("click", () => {
      const st = fishStats();
      if (b.dataset.rod) st.rod = b.dataset.rod;
      else st.spot = b.dataset.spot;
      st.at = Date.now();
      save();
      sfx.play("tap");
      renderShop();
    }));
    v.querySelectorAll("[data-silk], [data-mount]").forEach((b) => b.addEventListener("click", () => {
      const st = derbyStats();
      if (b.dataset.silk) st.silk = b.dataset.silk;
      else st.mount = b.dataset.mount;
      st.at = Date.now();
      save();
      sfx.play("tap");
      renderShop();
    }));
    v.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => onBuy(b.dataset.buy)));
    v.querySelectorAll("[data-wear-avatar]").forEach((b) => b.addEventListener("click", () => {
      setAvatar(b.dataset.wearAvatar);
      renderShop();
    }));
    v.querySelectorAll("[data-use]").forEach((b) => b.addEventListener("click", () => {
      S.themeId = b.dataset.use;
      S.castChosen = true;
      save();
      refreshCast();
      renderShop();
      toast(`Cast switched to ${THEMES.find((t) => t.id === b.dataset.use).label}`);
    }));
  }

  // First tap arms the button, second tap buys.
  function onBuy(id) {
    if (armed !== id) {
      armed = id;
      clearTimeout(armTimer);
      armTimer = setTimeout(() => { armed = null; if (currentView === "shop") renderShop(); }, 3000);
      renderShop();
      $(`#view-shop [data-buy="${id}"]`)?.focus();
      return;
    }
    armed = null;
    clearTimeout(armTimer);
    let res;
    if (id.startsWith("theme:")) {
      res = rewards.buyTheme(S, id.slice(6));
      if (res.ok) {
        S.themeId = res.theme.id;
        S.castChosen = true;
        refreshCast();
        celebrate(res.theme.icon || "🎭", `${res.theme.label} unlocked`, "Your questions now use this cast");
      }
    } else if (id.startsWith("avatar:")) {
      res = rewards.buyAvatar(S, id.slice(7));
      if (res.ok) {
        S.avatar = res.avatar.id;
        celebrate(res.avatar.emoji, `${res.avatar.label} unlocked`, "It's your new profile picture");
      }
    } else if (id === "aura") {
      res = rewards.buyAura(S);
      if (res.ok) toast(`💠 Aura Shield added. You have ${S.freezes} of ${RULES.maxAura}.`);
    } else if (id === "aura3") {
      res = rewards.buyAuraBundle(S);
      if (res.ok) toast(`💠 ${RULES.auraBundleSize} Aura Shields added. You have ${S.freezes} of ${RULES.maxAura}.`);
    } else if (id === "elixir") {
      res = rewards.buyElixir(S);
      if (res.ok) toast("🧪 Focus Elixir: Focus back to 100%.");
    } else if (id.startsWith("rod:") || id.startsWith("spot:")) {
      res = SW.fishing.buyItem(fishStats(), S, id);
      if (res.ok) toast(`${res.item.emoji} ${res.item.name} is yours, and equipped for Vocab Fishing.`);
    } else if (id === "burst" || id.startsWith("silk:") || id.startsWith("mount:")) {
      res = D.buyItem(derbyStats(), S, id, S);
      if (res.ok) toast(id === "burst" ? `💨 ${D.STABLE.burst.name} added` : "🏇 New Derby gear equipped!");
    } else if (id === "saver") {
      res = rewards.buyComboSaver(S);
      if (res.ok) toast(`🔗 Combo Saver ready. You have ${S.comboSavers} of ${RULES.maxComboSavers}.`);
    } else if (id === "wager") {
      rollover();
      res = rewards.placeWager(S, todayKey());
      if (res.ok) toast(`🎲 Wager placed. Keep your streak for ${RULES.wagerDays} more days to win ${RULES.wagerPayout} ⚡.`);
    }
    if (res && !res.ok) {
      toast(res.reason === "short" ? `You need ${res.need} more Sparks.`
        : res.reason === "room" ? `You only have room for ${res.room} more Aura Shields.`
        : "That isn't available right now.");
    }
    save();
    renderHud(["sparks"]);
    renderShop();
  }

  // ---------- Personalize view ----------
  function renderYou() {
    const v = $("#view-you");
    const c = S.custom;
    const proOpts = (sel) => ["he", "she", "they"].map((p) => `<option value="${p}" ${p === sel ? "selected" : ""}>${p}</option>`).join("");
    // Accuracy per chapter, in curriculum order (skills are tagged with their chapter).
    const byChapter = {};
    for (const s of Object.values(S.skills)) {
      if (!s.chapterId) continue; // stats from before the curriculum
      const t = (byChapter[s.chapterId] ||= { seen: 0, right: 0 });
      t.seen += s.seen;
      t.right += s.right;
    }
    const skillRows = CHAPTERS.filter((ch) => byChapter[ch.id]).map((ch) => {
      const s = byChapter[ch.id];
      const pct = Math.round((s.right / s.seen) * 100);
      const tone = pct >= 80 ? "" : pct >= 50 ? "mid" : "low";
      return `<div class="bar-row"><div class="top"><span>${ch.bonus ? "Bonus" : `Ch ${ch.id}`} · ${esc(ch.short)}</span><span>${s.right}/${s.seen} · ${pct}%</span></div><div class="bar"><i class="${tone}" style="width:${pct}%"></i></div></div>`;
    }).join("");

    const tabsHtml = `
      <div class="seg subtabs you-tabs" role="tablist" aria-label="Profile sections">
        ${[["profile", "✏️", "Edit Profile", "Profile"], ["settings", "⚙️", "Settings", "Settings"], ["leaderboard", "🏆", "Leaderboard", "Leaders"]]
          .map(([id, ico, long, short]) => `<button type="button" role="tab" data-you="${id}" aria-selected="${youTab === id}" aria-label="${long}"><span aria-hidden="true">${ico} <span class="lbl-long">${long}</span><span class="lbl-short">${short}</span></span></button>`).join("")}
      </div>`;
    const wireTabs = () => v.querySelectorAll("[data-you]").forEach((b) => b.addEventListener("click", () => {
      youTab = b.dataset.you;
      sfx.play("tap");
      renderYou();
      v.scrollTop = 0;
    }));

    // ---- Leaderboard & Friends ----
    if (youTab === "leaderboard") {
      v.innerHTML = `<div class="stack">${tabsHtml}<div id="you-ranks"></div></div>`;
      $("#you-ranks", v).append(ranksMount);
      wireTabs();
      ranks.render();
      return;
    }

    // ---- Settings ----
    if (youTab === "settings") {
      v.innerHTML = `
        <div class="stack">
          ${tabsHtml}
          <section class="panel" id="settings-panel">
            <h2>Settings</h2>
            <label class="toggle"><input type="checkbox" id="set-sound" ${S.muted ? "" : "checked"}><span>Sound effects</span></label>
            ${sfx.canVibrate() ? `<label class="toggle"><input type="checkbox" id="set-haptics" ${S.haptics ? "checked" : ""}><span>Vibration</span></label>` : ""}
            <div id="set-push"></div>
          </section>
          <section class="panel">
            <h2>Daily goal</h2>
            <p class="muted">Questions per day to keep your Lock In Streak alive.</p>
            <div class="seg" id="goal-seg">${GOALS.map((g) => `<button type="button" data-g="${g}" aria-pressed="${g === S.goal}">${g} / day</button>`).join("")}</div>
          </section>
          <section class="panel">
            <h2>Help &amp; feedback</h2>
            <p class="muted">How to play, keyboard shortcuts and a grammar rules cheat sheet. Got an idea or found a bug? Tell us.</p>
            <div class="row"><button class="btn ghost" type="button" id="open-help">❓ Help</button><button class="btn ghost" type="button" id="open-feedback">💡 Suggest a feature / report a bug</button></div>
          </section>
          <section class="panel">
            <h2>Start over</h2>
            <p class="muted">Clears your streak, XP, Sparks, purchases and stats on this device${auth.user() ? " and in your account" : ""}.</p>
            <div class="row" id="reset-row"><button class="btn ghost" type="button" id="reset-btn">Reset progress</button></div>
          </section>
          <p class="memorial">In memory of Terry</p>
        </div>`;
      wireTabs();
      renderSettings();
      $("#goal-seg", v).querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
        S.goal = Number(b.dataset.g);
        const goal = checkGoal();
        const newBadges = rewards.checkBadges(S);
        save();
        $("#goal-seg", v).querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
        renderHud(goal ? ["streak", "sparks"] : []);
        if (goal) celebrateGoal(goal);
        announceBadges(newBadges);
      }));
      $("#open-help", v).addEventListener("click", () => openHelp());
      $("#open-feedback", v).addEventListener("click", () => openHelp("feedback"));
      $("#reset-btn", v).addEventListener("click", () => {
        const row = $("#reset-row", v);
        row.innerHTML = '<button class="btn danger" type="button" id="reset-yes">Yes, erase everything</button><button class="btn ghost" type="button" id="reset-no">Keep my progress</button>';
        $("#reset-no", v).addEventListener("click", renderYou);
        $("#reset-yes", v).addEventListener("click", () => {
          const keepUser = S.syncedUserId;
          S = structuredClone(DEFAULTS);
          S.syncedUserId = keepUser; // still the same account; the reset should win on next merge
          save();
          renderHud();
          startChapter(1);
          youTab = "profile";
          show("feed");
          toast("Progress reset. Fresh start.");
        });
      });
      return;
    }

    // ---- Edit Profile ----
    v.innerHTML = `
      <div class="stack">
        ${tabsHtml}
        <section class="panel you-stats">
          <div><b>${fmt(S.xp)}</b><span>XP</span></div>
          <div><b>⚡ ${fmt(S.sparks)}</b><span>Sparks</span></div>
          <div><b>🔥 ${S.streak}</b><span>Streak</span></div>
          <div><b>🧠 ${S.focus}%</b><span>Focus</span></div>
        </section>
        <section class="panel" id="account-panel"></section>
        <div id="streak-slot"></div>
        <section class="panel">
          <h2>Your cast</h2>
          <p class="muted">Every question uses your cast's names. The Everyday cast is free; unlock more in the Shop.</p>
          <div class="cast-grid" id="you-casts"></div>
          <div id="custom-box" class="stack" ${S.themeId === "custom" ? "" : "hidden"}>
            ${c.people.map((p, i) => `
              <div class="field">
                <label for="cp-${i}">Person ${"ABC"[i]}</label>
                <div class="person-row">
                  <input class="input" id="cp-${i}" maxlength="24" placeholder="${esc(THEMES[0].people[i].name)}" value="${esc(p.name)}">
                  <select class="select" id="cpp-${i}" aria-label="Pronouns for person ${"ABC"[i]}">${proOpts(p.pro)}</select>
                </div>
              </div>`).join("")}
            <div class="field"><label for="c-place">A place (mid-sentence)</label><input class="input" id="c-place" maxlength="40" placeholder="the library" value="${esc(c.place)}"></div>
            <div class="field"><label for="c-craft">A skill they practice</label><input class="input" id="c-craft" maxlength="40" placeholder="public speaking" value="${esc(c.craft)}"></div>
            <div class="field"><label for="c-event">A big event</label><input class="input" id="c-event" maxlength="40" placeholder="the state finals" value="${esc(c.event)}"></div>
          </div>
          <span class="label-sm">Preview</span>
          <p class="preview" id="you-preview"></p>
        </section>
        <section class="panel">
          <h2>Skill check</h2>
          ${skillRows ? `<div class="bars">${skillRows}</div>` : '<p class="muted">Answer a few questions to see your accuracy for each chapter.</p>'}
        </section>
      </div>`;

    wireTabs();
    renderStreak();
    renderAccountPanel();
    const grid = $("#you-casts", v);
    const all = [...themesForPicker(), { id: "custom", label: "Custom", people: [] }];
    for (const t of all) {
      grid.append(castButton(t, () => {
        S.themeId = t.id;
        S.castChosen = true;
        save();
        grid.querySelectorAll(".cast-btn").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === t.id)));
        $("#custom-box", v).hidden = t.id !== "custom";
        preview();
        castChanged();
      }));
    }

    const preview = () => { $("#you-preview", v).innerHTML = previewSentence(); };
    preview();

    const bindText = (id, setter) => $(id, v).addEventListener("input", (e) => { setter(e.target.value); save(); preview(); castChanged(); });
    c.people.forEach((p, i) => {
      bindText(`#cp-${i}`, (val) => { p.name = val; });
      $(`#cpp-${i}`, v).addEventListener("change", (e) => { p.pro = e.target.value; save(); preview(); castChanged(); });
    });
    bindText("#c-place", (val) => { c.place = val; });
    bindText("#c-craft", (val) => { c.craft = val; });
    bindText("#c-event", (val) => { c.event = val; });

  }

  let castTimer;
  function castChanged() {
    clearTimeout(castTimer);
    castTimer = setTimeout(refreshCast, 150);
  }

  // ---------- Accounts & sync ----------
  const SYNC_LABEL = {
    idle: "Synced",
    pending: "Saving…",
    syncing: "Saving…",
    synced: "Synced",
    error: "Couldn't sync. Retrying on your next answer.",
  };

  function openSignup(reason) {
    onboarding.open({
      reason,
      onGuest: () => { S.guest = true; save(); },
    });
  }

  function setAvatar(id) {
    if (!rewards.isAvatarUnlocked(S, id)) return;
    S.avatar = id;
    save();
    renderAccountButton();
  }

  // HUD: avatar (opens Profile) plus a "Save" pill for guests.
  // Signed in, the pill is replaced by a sync dot on the avatar.
  function renderAccountButton() {
    const u = auth.user();
    const av = $("#hud-avatar");
    const st = auth.status();
    av.innerHTML = `${currentAvatar().emoji}${u ? `<i class="sync-dot" data-status="${st}"></i>` : ""}`;
    av.setAttribute("aria-label", u
      ? `Profile: ${u.email}. ${SYNC_LABEL[st]}`
      : "Profile (guest)");
    av.title = u ? `${u.email} · ${SYNC_LABEL[st]}` : "Your profile";
    const btn = $("#hud-account");
    btn.hidden = Boolean(u);
    btn.title = "Save progress to an account";
    btn.setAttribute("aria-label", "Save progress");
  }

  // Personalize → Profile: avatar, title, account and avatar picker.
  function renderAccountPanel() {
    const panel = $("#account-panel");
    if (!panel) return;
    const u = auth.user();
    const title = S.title && rewards.badgeById(S.title);
    const av = currentAvatar();
    const grid = SW.avatars.map((a) => {
      const owned = rewards.isAvatarUnlocked(S, a.id);
      const id = `avatar:${a.id}`;
      const armedHere = armed === id;
      return `<button type="button" class="avatar-pick${owned ? "" : " locked"}${armedHere ? " confirm" : ""}"
        data-avatar="${a.id}" aria-pressed="${S.avatar === a.id}"
        aria-label="${esc(a.label)}${owned ? "" : `, locked, ${a.price} Sparks`}">
        <span class="emoji" aria-hidden="true">${a.emoji}</span>
        ${owned ? "" : `<small>${armedHere ? "Confirm" : `🔒 ${a.price}`}</small>`}
      </button>`;
    }).join("");

    panel.innerHTML = `
      <div class="profile-head">
        <span class="avatar lg" aria-hidden="true">${av.emoji}</span>
        <div class="profile-meta">
          <h2>${u ? "Profile" : "Guest"}</h2>
          ${u ? `<p class="muted">Signed in as <b class="email">${esc(u.email || "your account")}</b></p>` : '<p class="muted">Progress lives in this browser only.</p>'}
          ${title ? `<span class="title-chip">${title.icon} ${esc(title.title)}</span>` : ""}
        </div>
      </div>
      ${u
        ? `<form class="stack" id="profile-form" novalidate>
             <div class="field">
               <label for="p-name">Display name</label>
               <input class="input" id="p-name" maxlength="30" autocomplete="nickname" value="${esc(S.displayName || auth.defaultDisplayName(u))}">
             </div>
             <div class="field">
               <label for="p-user">Username</label>
               <div class="handle-row"><span class="at" aria-hidden="true">@</span><input class="input" id="p-user" maxlength="20" autocapitalize="none" spellcheck="false" value="${esc(S.username)}"></div>
               <small class="muted">Friends find you by this. 3–20 lowercase letters, numbers or _.</small>
             </div>
             <div class="row"><button class="btn ghost" type="submit">Save profile</button></div>
           </form>
           <p class="sync-line" data-status="${auth.status()}">☁︎ ${esc(SYNC_LABEL[auth.status()])}</p>
           <div class="row"><button class="btn ghost" type="button" id="signout-btn">Sign out</button></div>`
        : `<p class="muted">Sign up to sync your streak, Sparks, unlocks, avatar and cast across devices, and to join leaderboards.</p>
           <div class="row"><button class="btn" type="button" id="save-progress-btn">Save Progress</button></div>`}
      <span class="label-sm">Profile picture</span>
      <div class="avatar-grid">${grid}</div>`;

    $("#profile-form", panel)?.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = $("#p-name", panel).value.replace(/\s+/g, " ").trim().slice(0, 30);
      const handle = $("#p-user", panel).value.trim().replace(/^@/, "").toLowerCase();
      if (!name) return toast("Add a display name.");
      S.displayName = name;
      try {
        if (handle !== S.username) S.username = await auth.claimUsername(handle, S);
        save();
        ranks.invalidate();
        toast("Profile saved");
      } catch (err) {
        toast(err.message);
      }
    });

    panel.querySelectorAll("[data-avatar]").forEach((b) => b.addEventListener("click", () => {
      const id = b.dataset.avatar;
      if (rewards.isAvatarUnlocked(S, id)) {
        armed = null;
        setAvatar(id);
        renderAccountPanel();
        return;
      }
      const a = rewards.avatarById(id);
      if (S.sparks < a.price) {
        toast(`${a.label} costs ${a.price} ⚡. You need ${a.price - S.sparks} more.`);
        return;
      }
      // same two-tap confirm as the shop
      const key = `avatar:${id}`;
      if (armed !== key) {
        armed = key;
        clearTimeout(armTimer);
        armTimer = setTimeout(() => { armed = null; renderAccountPanel(); }, 3000);
        renderAccountPanel();
        panel.querySelector(`[data-avatar="${id}"]`)?.focus();
        return;
      }
      armed = null;
      clearTimeout(armTimer);
      const res = rewards.buyAvatar(S, id);
      if (res.ok) {
        S.avatar = id;
        save();
        renderHud(["sparks"]);
        celebrate(a.emoji, `${a.label} unlocked`, "It's your new profile picture");
      }
      renderAccountPanel();
    }));

    if (u) {
      $("#signout-btn", panel).addEventListener("click", async () => {
        try {
          await auth.signOut();
          toast("Signed out. Progress on this device stays here.");
        } catch (e) {
          toast("Couldn't sign out. Check your connection and try again.");
        }
      });
    } else {
      $("#save-progress-btn", panel).addEventListener("click", () => openSignup("save"));
    }
  }

  // Settings: sound, vibration and Lock In push alerts.
  async function renderSettings() {
    const panel = $("#settings-panel");
    if (!panel) return;
    $("#set-sound", panel).addEventListener("change", (e) => {
      S.muted = !e.target.checked;
      sfx.setMuted(S.muted);
      save(false);
      sfx.play("tap");
    });
    $("#set-haptics", panel)?.addEventListener("change", (e) => {
      S.haptics = e.target.checked;
      sfx.setHaptics(S.haptics);
      save(false);
      sfx.buzz(50);
    });
    const slot = $("#set-push", panel);
    if (!auth.user()) {
      slot.innerHTML = '<p class="muted">🔔 Sign in to get Lock In alerts from friends.</p>';
      return;
    }
    const state = await auth.pushState();
    const label = {
      enabled: "🔔 Lock In alerts are on for this device.",
      default: "🔔 Get a notification when a friend tells you to Lock In.",
      denied: "🔕 Notifications are blocked. Allow them in your browser's site settings.",
      "needs-install": "🔔 On iPhone, add SatWizz to your Home Screen (Share → Add to Home Screen) to get Lock In alerts.",
      unsupported: "🔕 This browser can't show notifications. You'll still see Lock In alerts in the app.",
      "not-configured": "🔔 Lock In alerts show up in the app when you open it.",
    }[state];
    slot.innerHTML = `<p class="muted">${label}</p>${
      state === "default" ? '<button class="btn ghost" type="button" id="push-toggle">Turn on alerts</button>' :
      state === "enabled" ? '<button class="btn ghost" type="button" id="push-toggle">Turn off alerts</button>' : ""}`;
    $("#push-toggle", slot)?.addEventListener("click", async () => {
      try {
        if (state === "enabled") {
          await auth.disablePush();
          toast("Lock In alerts turned off on this device.");
        } else {
          await auth.enablePush();
          toast("Lock In alerts are on 🔔");
        }
      } catch (err) {
        toast(err.message);
      }
      renderSettings();
    });
  }

  // ---------- Lock In alerts (in-app) ----------
  let unsubscribeLockIns = () => {};

  function showLockInAlert(row) {
    const slot = $("#alert-slot");
    if (!row || slot.querySelector(`[data-alert="${row.id}"]`)) return;
    const el = h("div", { class: "alert-banner", role: "alert", "data-alert": row.id });
    el.innerHTML = `
      <span class="alert-icon" aria-hidden="true">🔒</span>
      <p>${esc(row.message)}</p>
      <button class="mini-btn on" type="button" data-go>Practice</button>
      <button class="alert-x" type="button" aria-label="Dismiss">✕</button>`;
    const dismiss = () => {
      el.remove();
      auth.markLockInsRead([row.id]);
    };
    el.querySelector("[data-go]").addEventListener("click", () => { dismiss(); show("feed"); });
    el.querySelector(".alert-x").addEventListener("click", dismiss);
    slot.replaceChildren(el); // newest alert only; older unread ones stay unread
    sfx.play("combo");
    sfx.buzz(50);
  }

  async function startLockInAlerts() {
    unsubscribeLockIns();
    unsubscribeLockIns = auth.subscribeLockIns(showLockInAlert);
    try {
      const unread = await auth.unreadLockIns(); // newest first
      if (unread.length) showLockInAlert(unread[0]);
    } catch (e) { /* alerts are best-effort */ }
  }

  // ---------- Invite links (?invite=username) ----------
  const INVITE_KEY = "satwizz.invite";
  function captureInvite() {
    try {
      const params = new URLSearchParams(location.search);
      const invite = (params.get("invite") || "").replace(/^@/, "").toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(invite)) return;
      sessionStorage.setItem(INVITE_KEY, invite);
      params.delete("invite");
      const qs = params.toString();
      history.replaceState(null, "", location.pathname + (qs ? `?${qs}` : "") + location.hash);
    } catch (e) { /* ignore */ }
  }
  const pendingInvite = () => { try { return sessionStorage.getItem(INVITE_KEY); } catch (e) { return null; } };

  async function acceptPendingInvite() {
    const invite = pendingInvite();
    if (!invite || !auth.user()) return;
    try { sessionStorage.removeItem(INVITE_KEY); } catch (e) { /* ignore */ }
    if (invite === S.username) return;
    try {
      const row = await auth.sendFriendRequest(invite);
      toast(row && row.status === "accepted" ? `You and @${invite} are now friends 🎉` : `Friend request sent to @${invite}`);
      ranks.invalidate();
    } catch (e) {
      toast(e.message);
    }
  }

  // After sign-in: combine this device with the account, then push the result.
  async function syncFromCloud(announce) {
    const u = auth.user();
    if (S.demo) {
      toast("Signed in. Demo Mode is on, so nothing syncs until you turn it off.");
    } else {
      try {
        const cloud = await auth.pull();
        Object.assign(S, auth.merge(S, cloud, u.id));
        S.syncedUserId = u.id;
        S.guest = false;
        rewards.checkBadges(S);
        rollover();
        const who = await auth.ensureUsername(S);
        S.username = who.username;
        S.displayName = who.displayName;
        save(); // writes locally and schedules the upload of the merged result
        if (announce) toast(`Signed in as @${S.username}. Progress synced.`);
      } catch (e) {
        console.warn("SatWizz: initial sync failed", e);
        toast("Signed in, but syncing failed. We'll retry after your next answer.");
      }
    }
    startLockInAlerts();
    acceptPendingInvite();
    ranks.invalidate();
    renderHud();
    refreshCast();
    renderChapterBar();
    rerenderCurrent();
  }

  let syncedSessionUser = null;
  auth.onChange((event, session) => {
    if (session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
      if (onboarding.isOpen()) onboarding.close();
      // Supabase can repeat SIGNED_IN (e.g. when the tab regains focus); merge once per user.
      if (session.user.id === syncedSessionUser) return;
      syncedSessionUser = session.user.id;
      syncFromCloud(event === "SIGNED_IN");
    } else if (event === "SIGNED_OUT") {
      syncedSessionUser = null;
      unsubscribeLockIns();
      unsubscribeLockIns = () => {};
      S.username = "";
      save(false);
      ranks.invalidate();
      renderHud();
      rerenderCurrent();
    } else if (!session && event === "INITIAL_SESSION" && pendingInvite() && auth.available()) {
      // Opened an invite link while signed out: ask them to sign in first.
      openSignup("invite");
    }
  });

  auth.onStatus(() => {
    renderAccountButton();
    const line = document.querySelector(".sync-line");
    if (line) {
      line.dataset.status = auth.status();
      line.textContent = `☁︎ ${SYNC_LABEL[auth.status()]}`;
    }
  });

  // ---------- Keyboard ----------
  // One layer for the whole app: A–D (or 1–4) answers the question on screen,
  // Space / Enter continues, ? opens Help. Open panels (explanation, Focus
  // Break, chapters, Help, the Vault's word breakdown) handle their own keys
  // and stop them reaching this. The Derby answers A–D itself; Fishing uses 1–4.
  const answerKey = (e) => {
    const k = e.key.toLowerCase();
    if (k.length !== 1) return -1;
    return "abcd".includes(k) ? "abcd".indexOf(k) : "1234".indexOf(k);
  };
  const isGo = (e) => e.key === " " || e.key === "Enter";
  // Space/Enter on a focused button presses that button, as usual.
  const onButton = (e) => Boolean(e.target.closest && e.target.closest("button:not(:disabled), a, summary"));
  // The visible primary "continue" button inside `root`.
  const visibleBtn = (root, sel) => [...root.querySelectorAll(sel)].find((b) => !b.disabled && b.offsetParent !== null);
  // A–D on the first open question (enabled .choices) inside `root`.
  function pickIn(root, pos) {
    const list = [...root.querySelectorAll(".choices")].find((ol) => ol.querySelector(".choice:not(:disabled)") && ol.offsetParent !== null);
    const btn = list && list.querySelectorAll(":scope > li > .choice")[pos];
    if (!btn || btn.disabled) return false;
    btn.click();
    return true;
  }

  document.addEventListener("keydown", (e) => {
    if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, select, textarea")) return;
    if (onboarding.isOpen() || helpSheet || focusSheet || chapterSheet || explainSheet || vocab.isOpen()) return;
    if (e.key === "?") { e.preventDefault(); openHelp(); return; }
    const pos = answerKey(e);
    const k = e.key.toLowerCase();

    if (currentView === "feed") {
      const card = activeCard;
      if (!card) return;
      if (pos !== -1 && card._q && !card._answered) {
        e.preventDefault();
        answer(card, card._order[pos]);
      } else if ((k === "arrowdown" || k === "j" || isGo(e)) && (card._answered || !card._q)) {
        if (isGo(e) && onButton(e)) return;
        e.preventDefault();
        scrollToNext(card);
      }
    } else if (currentView === "test" && run) {
      // Tests: A–D picks, Space/Enter or → goes on (Submit on the last), ← goes back.
      if (pos !== -1) { e.preventDefault(); pickChoice(run.items[run.i].order[pos]); }
      else if (k === "arrowright" || (isGo(e) && !onButton(e))) {
        e.preventDefault();
        if (run.i === run.items.length - 1 && run.items.every((x) => x.pick != null)) submitRun();
        else nextInRun();
      } else if (k === "arrowleft") { e.preventDefault(); goTo(run.i - 1); }
    } else if (currentView === "vocab") {
      const view = $("#view-vocab");
      if (view.querySelector("#fc")) return; // flashcards: Space flips (js/vocab.js)
      if (pos !== -1 && pickIn(view, pos)) e.preventDefault();
      else if (isGo(e) && !onButton(e)) {
        const go = visibleBtn(view, "#vocab-next, #fish-next, [data-next]");
        if (go) { e.preventDefault(); go.click(); }
      }
    } else if (currentView === "derby") {
      if (isGo(e) && !onButton(e)) {
        const go = visibleBtn($("#view-derby"), "#derby-next");
        if (go) { e.preventDefault(); go.click(); }
      }
    } else if (currentView === "diag" && isGo(e) && !onButton(e)) {
      e.preventDefault();
      $("#view-diag [data-dash]")?.click();
    }
  });

  document.addEventListener("visibilitychange", () => { if (!document.hidden) { focusTick(); renderHud(); } });

  // ---------- Boot ----------
  sfx.setMuted(S.muted);
  sfx.setHaptics(S.haptics);
  captureInvite();
  auth.init();
  focusTick();
  setInterval(focusTick, 60 * 1000);
  // First run of the Trophy Case: award what existing progress has already
  // earned, quietly, with one toast instead of a celebration for each.
  if (!S.trophySeeded) {
    const earned = rewards.checkBadges(S, {});
    S.trophySeeded = true;
    save(false);
    if (earned.length) setTimeout(() => toast(`🏆 Trophy Case: you've already earned ${earned.length} accomplishment${earned.length === 1 ? "" : "s"}. See Profile.`), 900);
  }
  renderHud();
  startChapter(S.chapterId);
  // The Dashboard is home; index.html#practice opens straight into practice.
  show(location.hash === "#practice" ? "feed" : "dash");
})();
