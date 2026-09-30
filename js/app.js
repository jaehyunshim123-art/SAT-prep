(function () {
  "use strict";

  const QUESTIONS = window.BB_QUESTIONS;
  const THEMES = window.BB_THEMES;
  const PRONOUNS = window.BB_PRONOUNS;
  const DOMAINS = window.BB_DOMAINS;
  const BY_ID = Object.fromEntries(QUESTIONS.map((q) => [q.id, q]));
  const STORE_KEY = "brainblast-sat.v1";
  const GOALS = [5, 10, 20];
  const MAX_FREEZES = 2;
  const PROMPT_GRAMMAR = "Which choice completes the text so that it conforms to the conventions of Standard English?";
  const PROMPT_TRANSITION = "Which choice completes the text with the most logical transition?";

  // ---------- State ----------
  const DEFAULTS = {
    name: "",
    themeId: "everyday",
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
    freezes: 0,
    days: {}, // dateKey -> { n, c, done, frozen }
    skills: {}, // skill -> { seen, right }
    missed: [], // question ids answered wrong and not yet fixed
    filter: "all",
  };

  let S = load();

  function load() {
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        return { ...structuredClone(DEFAULTS), ...saved, custom: { ...DEFAULTS.custom, ...(saved.custom || {}) } };
      }
    } catch (e) { /* storage unavailable: start fresh */ }
    return structuredClone(DEFAULTS);
  }
  function save() {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(S)); } catch (e) { /* ignore */ }
  }

  // ---------- Dates ----------
  const pad = (n) => String(n).padStart(2, "0");
  const keyOf = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const todayKey = () => keyOf(new Date());
  const parseKey = (k) => { const [y, m, d] = k.split("-").map(Number); return new Date(y, m - 1, d, 12); };
  const addDays = (k, n) => { const d = parseKey(k); d.setDate(d.getDate() + n); return keyOf(d); };
  const dayDiff = (a, b) => Math.round((parseKey(b) - parseKey(a)) / 864e5);
  const today = () => (S.days[todayKey()] ||= { n: 0, c: 0 });

  // Handles missed days: spend streak freezes if there are enough, otherwise reset.
  function rollover() {
    if (!S.lastDone || S.streak === 0) return;
    const t = todayKey();
    const gap = dayDiff(S.lastDone, t);
    if (gap <= 1) return;
    const missedDays = gap - 1;
    if (S.freezes >= missedDays) {
      for (let i = 1; i <= missedDays; i++) {
        const k = addDays(S.lastDone, i);
        S.days[k] = { ...(S.days[k] || { n: 0, c: 0 }), frozen: true };
      }
      S.freezes -= missedDays;
      S.lastDone = addDays(t, -1);
      toast(`🧊 ${missedDays === 1 ? "A streak freeze" : missedDays + " streak freezes"} saved your ${S.streak}-day streak`);
    } else {
      toast(`Your ${S.streak}-day streak ended. Start a new one today.`);
      S.streak = 0;
    }
    save();
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
    return THEMES.find((t) => t.id === themeId) || THEMES[0];
  }

  const esc = (s) => String(s).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);

  // Swaps {A}, {B_his}, {PLACE} etc. for the chosen cast. Returns HTML.
  function fill(template, cast = castOf(), mark = true) {
    const idx = { A: 0, B: 1, C: 2 };
    return esc(template).replace(/\{([A-Z]+)(?:_(his|him))?\}/g, (m, key, form) => {
      if (key in idx) {
        const p = cast.people[idx[key]];
        if (form) return esc(PRONOUNS[p.pro][form]);
        return mark ? `<span class="cast">${esc(p.name)}</span>` : esc(p.name);
      }
      const flavor = { PLACE: cast.place, CRAFT: cast.craft, EVENT: cast.event }[key];
      return flavor != null ? esc(flavor) : m;
    });
  }

  // ---------- Question queue ----------
  const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  let deck = [];
  let retries = []; // { id, due }
  let served = 0;
  let lastId = null;

  function pool() {
    if (S.filter === "missed") return S.missed.filter((id) => BY_ID[id]);
    if (S.filter === "all") return QUESTIONS.map((q) => q.id);
    return QUESTIONS.filter((q) => q.domain === S.filter).map((q) => q.id);
  }

  function nextQuestion() {
    const r = retries.findIndex((x) => x.due <= served && x.id !== lastId);
    let id;
    let isRetry = false;
    if (r !== -1) {
      id = retries.splice(r, 1)[0].id;
      isRetry = true;
    } else {
      const p = pool();
      if (!p.length) return null;
      if (!deck.length) {
        deck = shuffle(p);
        if (deck.length > 1 && deck[deck.length - 1] === lastId) deck.unshift(deck.pop());
      }
      id = deck.pop();
    }
    served++;
    lastId = id;
    return { q: BY_ID[id], isRetry };
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

  // ---------- App shell ----------
  const app = $("#app");
  app.innerHTML = `
    <header class="hud">
      <div class="brand">Brain<span>Blast</span><em> SAT</em></div>
      <span class="pill flame" id="hud-streak" title="Day streak"></span>
      <span class="pill combo" id="hud-combo" title="Correct in a row"></span>
      <span class="pill" id="hud-xp" title="Total XP"></span>
    </header>
    <div>
      <div class="goalbar" aria-hidden="true"><i id="goal-fill"></i></div>
      <div class="goalnote"><span id="goal-text"></span><span id="goal-risk"></span></div>
    </div>
    <div class="chips" id="chips" role="toolbar" aria-label="Question filter"></div>
    <main class="view feed" id="view-feed" aria-live="polite"></main>
    <main class="view scrollview" id="view-streak" hidden></main>
    <main class="view scrollview" id="view-you" hidden></main>
    <nav class="tabs" role="tablist">
      <button class="tab" role="tab" data-view="feed" aria-selected="true"><span class="ico" aria-hidden="true">⚡</span>Practice</button>
      <button class="tab" role="tab" data-view="streak" aria-selected="false"><span class="ico" aria-hidden="true">🔥</span>Streak</button>
      <button class="tab" role="tab" data-view="you" aria-selected="false"><span class="ico" aria-hidden="true">🎭</span>Personalize</button>
    </nav>`;

  const feed = $("#view-feed");
  let currentView = "feed";

  app.querySelectorAll(".tab").forEach((t) => t.addEventListener("click", () => show(t.dataset.view)));

  function show(view) {
    currentView = view;
    app.querySelectorAll(".tab").forEach((t) => t.setAttribute("aria-selected", String(t.dataset.view === view)));
    for (const v of ["feed", "streak", "you"]) $(`#view-${v}`).hidden = v !== view;
    $("#chips").hidden = view !== "feed";
    if (view === "streak") renderStreak();
    if (view === "you") renderYou();
  }

  // ---------- HUD ----------
  function renderHud(bump) {
    rollover();
    const st = $("#hud-streak");
    st.innerHTML = `🔥 ${S.streak}${atRisk() ? ' <span class="risk" title="Streak at risk">⌛</span>' : ""}`;
    st.classList.toggle("cold", S.streak === 0 || atRisk());
    const co = $("#hud-combo");
    co.textContent = `⚡ ${S.combo}`;
    co.classList.toggle("hot", S.combo >= 3);
    $("#hud-xp").textContent = `${S.xp} XP`;

    const n = today().n;
    $("#goal-fill").style.width = `${Math.min(100, (n / S.goal) * 100)}%`;
    $("#goal-text").textContent = doneToday()
      ? `Daily goal done · ${n} answered today`
      : `${n} / ${S.goal} for today's streak`;
    $("#goal-risk").textContent = atRisk() ? "⌛ Streak ends at midnight" : "";

    if (bump) {
      const el = bump === "streak" ? st : co;
      el.classList.remove("bump");
      void el.offsetWidth;
      el.classList.add("bump");
    }
  }

  function renderChips() {
    const opts = [{ id: "all", short: "All skills" }, ...DOMAINS, { id: "missed", short: `Missed (${S.missed.length})` }];
    const bar = $("#chips");
    bar.innerHTML = "";
    for (const o of opts) {
      bar.append(h("button", {
        class: "chip",
        "aria-pressed": String(S.filter === o.id),
        onclick: () => { S.filter = o.id; save(); renderChips(); resetFeed(); },
      }, esc(o.short)));
    }
  }

  // ---------- Feed ----------
  let cardCount = 0;
  let sentinelObs;
  let activeCard = null;
  const visObs = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) activeCard = e.target;
  }, { root: feed, threshold: 0.6 });

  function resetFeed() {
    feed.innerHTML = "";
    deck = [];
    retries = [];
    served = 0;
    cardCount = 0;
    lastId = null;
    if (!S.castChosen && S.filter === "all") feed.append(welcomeCard());
    appendCards(4);
    feed.scrollTop = 0;
  }

  function appendCards(n) {
    for (let i = 0; i < n; i++) {
      const next = nextQuestion();
      if (!next) {
        if (!feed.querySelector(".empty")) feed.append(emptyCard());
        break;
      }
      feed.append(questionCard(next.q, next.isRetry));
    }
    // keep a sentinel at the end so the feed never runs out
    feed.querySelector(".sentinel")?.remove();
    const s = h("div", { class: "sentinel", "aria-hidden": "true", style: "height:1px" });
    feed.append(s);
    sentinelObs?.disconnect();
    sentinelObs = new IntersectionObserver((es) => {
      if (es.some((e) => e.isIntersecting)) appendCards(3);
    }, { root: feed, rootMargin: "0px 0px 150% 0px" });
    sentinelObs.observe(s);
  }

  function emptyCard() {
    const card = h("section", { class: "card empty" });
    card.innerHTML = `<div class="card-inner hello">
        <h2>No missed questions right now</h2>
        <p>Anything you get wrong lands here so you can try it again. Switch back to all skills to keep going.</p>
        <button class="btn wide next-row" type="button">Practice all skills</button>
      </div>`;
    card.querySelector("button").addEventListener("click", () => { S.filter = "all"; save(); renderChips(); resetFeed(); });
    return card;
  }

  function welcomeCard() {
    const card = h("section", { class: "card welcome" });
    const inner = h("div", { class: "card-inner hello" });
    inner.innerHTML = `
      <div class="meta"><span class="domain">Personalize</span></div>
      <h2>Who should star in your questions?</h2>
      <p>Every sentence uses your cast's names. Pick one now or change it later under Personalize.</p>
      <div class="cast-grid"></div>
      <p class="preview" id="welcome-preview"></p>
      <button class="btn wide next-row" type="button">Start practicing ↓</button>`;
    const grid = inner.querySelector(".cast-grid");
    const paint = () => {
      grid.querySelectorAll(".cast-btn").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.id === S.themeId)));
      inner.querySelector("#welcome-preview").innerHTML = fill(QUESTIONS[0].text.replace("______", castOf().craft + ". By"), castOf());
    };
    for (const t of THEMES) {
      const b = h("button", { class: "cast-btn", type: "button", "data-id": t.id }, `<b>${esc(t.label)}</b><span>${esc(t.people.map((p) => p.name).join(", "))}</span>`);
      b.addEventListener("click", () => { S.themeId = t.id; save(); paint(); refreshUnanswered(); });
      grid.append(b);
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

  function questionCard(q, isRetry) {
    cardCount++;
    const order = shuffle([0, 1, 2, 3]);
    const card = h("section", { class: "card", "data-qid": q.id });
    card._q = q;
    card._order = order;
    card._isRetry = isRetry;
    card._num = cardCount;
    paintCard(card);
    visObs.observe(card);
    return card;
  }

  function paintCard(card) {
    const q = card._q;
    const cast = castOf();
    const domainShort = DOMAINS.find((d) => d.id === q.domain)?.short || q.domain;
    card.innerHTML = `
      <div class="card-inner">
        <div class="meta">
          <span class="domain">${esc(domainShort)}</span>
          <span>${esc(q.skill)}</span>
          ${card._isRetry ? '<span class="retry-tag">↺ Try again</span>' : ""}
          <span class="num">#${card._num}</span>
        </div>
        <p class="passage">${fill(q.text, cast).replace("______", '<span class="blank" role="img" aria-label="blank"></span>')}</p>
        <p class="prompt">${q.domain === "Transitions" ? PROMPT_TRANSITION : PROMPT_GRAMMAR}</p>
        <ol class="choices">
          ${card._order.map((ci, pos) => `
            <li><button class="choice" type="button" data-ci="${ci}">
              <span class="letter">${"ABCD"[pos]}</span><span class="txt">${fill(q.choices[ci], cast, false)}</span>
            </button></li>`).join("")}
        </ol>
        <div class="fb-slot"></div>
      </div>`;
    card.querySelectorAll(".choice").forEach((b) => b.addEventListener("click", () => answer(card, Number(b.dataset.ci))));
  }

  // Re-render cards that haven't been answered so a new cast shows up immediately.
  function refreshUnanswered() {
    feed.querySelectorAll(".card[data-qid]").forEach((c) => { if (!c._answered) paintCard(c); });
  }

  function scrollToNext(card) {
    const next = card.nextElementSibling;
    if (next && next.classList.contains("card")) {
      next.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
      next.querySelector(".choice, .btn")?.focus({ preventScroll: true });
    }
  }

  function answer(card, ci) {
    if (card._answered) return;
    card._answered = true;
    const q = card._q;
    const correct = ci === q.answer;
    const cast = castOf();

    card.querySelectorAll(".choice").forEach((b) => {
      const bci = Number(b.dataset.ci);
      b.disabled = true;
      if (bci === q.answer) b.classList.add("right");
      else if (bci === ci) b.classList.add("wrong");
      else b.classList.add("dim");
    });
    const blank = card.querySelector(".blank");
    blank.classList.add("filled");
    blank.removeAttribute("role");
    blank.removeAttribute("aria-label");
    blank.innerHTML = fill(q.choices[q.answer], cast, false);

    // stats
    rollover();
    const d = today();
    d.n++;
    if (correct) d.c++;
    const sk = (S.skills[q.skill] ||= { seen: 0, right: 0, domain: q.domain });
    sk.seen++;
    if (correct) sk.right++;

    let gained = 0;
    if (correct) {
      S.combo++;
      S.bestCombo = Math.max(S.bestCombo, S.combo);
      gained = 10 + (S.combo >= 3 ? 5 : 0) + (card._isRetry ? 5 : 0);
      S.missed = S.missed.filter((id) => id !== q.id);
    } else {
      S.combo = 0;
      if (!S.missed.includes(q.id)) S.missed.push(q.id);
      retries.push({ id: q.id, due: served + 3 });
    }
    S.xp += gained;

    const slot = card.querySelector(".fb-slot");
    const fb = h("div", { class: `feedback ${correct ? "ok" : "no"}` });
    fb.innerHTML = `
      <h3>${correct ? pickPraise() : "Not quite"}<small>${correct ? `+${gained} XP` : "It'll come back soon"}</small></h3>
      <p>${fill(q.why, cast, false)}</p>`;
    slot.append(fb);
    const next = h("button", { class: "btn wide next-row", type: "button" }, "Next question ↓");
    next.addEventListener("click", () => scrollToNext(card));
    card.querySelector(".card-inner").append(next);

    const streakUp = checkGoal();
    save();
    renderHud(streakUp ? "streak" : correct ? "combo" : null);
    renderChips();

    if (streakUp) {
      celebrate("🔥", `${S.streak}-day streak!`, S.streak % 7 === 0 && S.freezes > 0 ? "You earned a streak freeze 🧊" : "Daily goal complete");
    } else if (correct && [3, 5, 10, 15, 20, 25, 30, 40, 50].includes(S.combo)) {
      celebrate("⚡", `${S.combo} in a row!`, S.combo >= 10 ? "You're unstoppable" : "Combo bonus: +5 XP each");
    }
    next.focus({ preventScroll: true });
  }

  // Returns true when this answer just met today's goal.
  function checkGoal() {
    const t = todayKey();
    const d = today();
    if (d.n < S.goal || S.lastDone === t) return false;
    S.streak = S.lastDone && dayDiff(S.lastDone, t) === 1 ? S.streak + 1 : 1;
    S.lastDone = t;
    d.done = true;
    S.bestStreak = Math.max(S.bestStreak, S.streak);
    if (S.streak % 7 === 0 && S.freezes < MAX_FREEZES) S.freezes++;
    return true;
  }

  const PRAISE = ["Correct!", "Nailed it!", "Clean!", "Exactly right!", "Boom!", "Sharp!"];
  const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

  // ---------- Celebration & toast ----------
  function celebrate(emoji, title, sub) {
    const wrap = h("div", { class: "burst", role: "status" });
    wrap.innerHTML = `<div class="burst-card"><span class="e" aria-hidden="true">${emoji}</span><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
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
    setTimeout(() => wrap.remove(), 2000);
  }

  let toastTimer;
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const t = h("div", { class: "toast", role: "status" }, esc(msg));
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  // ---------- Streak view ----------
  function renderStreak() {
    rollover();
    const v = $("#view-streak");
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
      const icon = rec?.done ? "🔥" : rec?.frozen ? "🧊" : "";
      week.push(`<div class="d ${i === 0 ? "today" : ""}"><span class="dot ${cls}">${icon}</span>${names[parseKey(k).getDay()]}</div>`);
    }

    const totals = Object.values(S.days).reduce((a, d) => ({ n: a.n + d.n, c: a.c + d.c }), { n: 0, c: 0 });
    const acc = totals.n ? Math.round((totals.c / totals.n) * 100) + "%" : "–";

    v.innerHTML = `
      <div class="stack">
        <section class="panel flame-hero">
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
            <span class="ice" aria-hidden="true">${"🧊".repeat(S.freezes) || "–"}</span>
            <p><b>${S.freezes} of ${MAX_FREEZES} streak freezes.</b> A freeze covers one missed day automatically. You earn one every 7 days of streak.</p>
          </div>
        </section>
        <section class="panel">
          <span class="label-sm">Records</span>
          <div class="stats">
            <div class="stat"><b>${S.bestStreak}</b><span>Best day streak</span></div>
            <div class="stat"><b>${S.bestCombo}</b><span>Best in a row</span></div>
            <div class="stat"><b>${S.xp}</b><span>Total XP</span></div>
            <div class="stat"><b>${acc}</b><span>Accuracy (${totals.n} answered)</span></div>
          </div>
        </section>
      </div>`;
  }

  // ---------- Personalize view ----------
  function renderYou() {
    const v = $("#view-you");
    const c = S.custom;
    const proOpts = (sel) => ["he", "she", "they"].map((p) => `<option value="${p}" ${p === sel ? "selected" : ""}>${p}</option>`).join("");
    const skillRows = Object.entries(S.skills)
      .sort((a, b) => a[1].right / a[1].seen - b[1].right / b[1].seen)
      .map(([name, s]) => {
        const pct = Math.round((s.right / s.seen) * 100);
        const tone = pct >= 80 ? "" : pct >= 50 ? "mid" : "low";
        return `<div class="bar-row"><div class="top"><span>${esc(name)}</span><span>${s.right}/${s.seen} · ${pct}%</span></div><div class="bar"><i class="${tone}" style="width:${pct}%"></i></div></div>`;
      }).join("");

    v.innerHTML = `
      <div class="stack">
        <section class="panel">
          <h2>Your cast</h2>
          <p class="muted">Names in every question switch to the cast you pick.</p>
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
          <h2>Daily goal</h2>
          <p class="muted">Questions per day to keep your streak alive.</p>
          <div class="seg" id="goal-seg">${GOALS.map((g) => `<button type="button" data-g="${g}" aria-pressed="${g === S.goal}">${g} / day</button>`).join("")}</div>
        </section>
        <section class="panel">
          <h2>Skill check</h2>
          ${skillRows ? `<div class="bars">${skillRows}</div>` : '<p class="muted">Answer a few questions to see which grammar skills need work. Weakest skills show first.</p>'}
        </section>
        <section class="panel">
          <h2>Start over</h2>
          <p class="muted">Clears your streak, XP and stats on this device.</p>
          <div class="row" id="reset-row"><button class="btn ghost" type="button" id="reset-btn">Reset progress</button></div>
        </section>
      </div>`;

    const grid = $("#you-casts", v);
    const all = [...THEMES, { id: "custom", label: "Custom", people: [] }];
    for (const t of all) {
      const sub = t.id === "custom" ? "Type any names you like" : t.people.map((p) => p.name).join(", ");
      const b = h("button", { class: "cast-btn", type: "button", "data-id": t.id, "aria-pressed": String(t.id === S.themeId) }, `<b>${esc(t.label)}</b><span>${esc(sub)}</span>`);
      b.addEventListener("click", () => {
        S.themeId = t.id;
        S.castChosen = true;
        save();
        grid.querySelectorAll(".cast-btn").forEach((x) => x.setAttribute("aria-pressed", String(x.dataset.id === t.id)));
        $("#custom-box", v).hidden = t.id !== "custom";
        preview();
        castChanged();
      });
      grid.append(b);
    }

    const preview = () => {
      const sample = BY_ID["t04"];
      $("#you-preview", v).innerHTML = fill(sample.text.replace("______", sample.choices[0]));
    };
    preview();

    const bindText = (id, setter) => $(id, v).addEventListener("input", (e) => { setter(e.target.value); save(); preview(); castChanged(); });
    c.people.forEach((p, i) => {
      bindText(`#cp-${i}`, (val) => { p.name = val; });
      $(`#cpp-${i}`, v).addEventListener("change", (e) => { p.pro = e.target.value; save(); preview(); castChanged(); });
    });
    bindText("#c-place", (val) => { c.place = val; });
    bindText("#c-craft", (val) => { c.craft = val; });
    bindText("#c-event", (val) => { c.event = val; });

    $("#goal-seg", v).querySelectorAll("button").forEach((b) => b.addEventListener("click", () => {
      S.goal = Number(b.dataset.g);
      const up = checkGoal();
      save();
      $("#goal-seg", v).querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b)));
      renderHud(up ? "streak" : null);
      if (up) celebrate("🔥", `${S.streak}-day streak!`, "Daily goal complete");
    }));

    $("#reset-btn", v).addEventListener("click", () => {
      const row = $("#reset-row", v);
      row.innerHTML = '<button class="btn danger" type="button" id="reset-yes">Yes, erase everything</button><button class="btn ghost" type="button" id="reset-no">Keep my progress</button>';
      $("#reset-no", v).addEventListener("click", renderYou);
      $("#reset-yes", v).addEventListener("click", () => {
        S = structuredClone(DEFAULTS);
        save();
        renderHud();
        renderChips();
        resetFeed();
        show("feed");
        toast("Progress reset. Fresh start.");
      });
    });
  }

  let castTimer;
  function castChanged() {
    clearTimeout(castTimer);
    castTimer = setTimeout(refreshUnanswered, 150);
  }

  // ---------- Keyboard ----------
  document.addEventListener("keydown", (e) => {
    if (currentView !== "feed" || e.target.closest("input, select, textarea")) return;
    const card = activeCard;
    if (!card) return;
    const k = e.key.toLowerCase();
    const pos = "abcd".indexOf(k) !== -1 ? "abcd".indexOf(k) : "1234".indexOf(k);
    if (pos !== -1 && card._q && !card._answered) {
      e.preventDefault();
      answer(card, card._order[pos]);
    } else if ((k === "arrowdown" || k === "enter" || k === "j") && (card._answered || !card._q)) {
      if (k === "enter" && e.target.closest("button")) return;
      e.preventDefault();
      scrollToNext(card);
    }
  });

  document.addEventListener("visibilitychange", () => { if (!document.hidden) renderHud(); });

  // ---------- Boot ----------
  renderHud();
  renderChips();
  resetFeed();
})();
