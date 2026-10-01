// SAT Wizz: Clause Derby: a Digital SAT grammar race.
//
// Screens: intro → chapter select → (chapter rules) → bet → live race →
// results + Post-Race Vault. Shop is reachable from chapter select and results.
//
// The race engine is the SatWizz Derby engine (js/derby.js): seven CPU rivals
// read and answer on their own clocks (Verbal Velocity 1–3s at 60%, Grammar
// Galloper 5–8s at 85%, …), move live whether or not you answer, and switch
// tactics to win. This file handles the player, Focus, economy and UI.
(function () {
  "use strict";

  const SW = window.SatWizz;
  const D = SW.derby;
  const BANK = window.ClauseBank;
  // The bank uses cast placeholders ({{NAME_1}}, {{NAME_1_POSS}}…) so the SatWizz
  // site can swap in purchased character casts. This standalone game uses one
  // generic cast.
  const CAST = [{ name: "Alex", poss: "their", obj: "them" }, { name: "Jordan", poss: "their", obj: "them" }, { name: "Sam", poss: "their", obj: "them" }];
  const castFill = (t) => String(t).replace(/\{\{NAME_([123])(?:_(POSS|OBJ))?\}\}/g, (m, n, form) => {
    const p = CAST[n - 1];
    return form === "POSS" ? p.poss : form === "OBJ" ? p.obj : p.name;
  });
  for (const ch of BANK.chapters) {
    ch.rules = ch.rules.map(castFill);
    ch.focus = castFill(ch.focus);
    for (const q of ch.questions) {
      q.text = castFill(q.text);
      q.rule = castFill(q.rule);
      q.choices = q.choices.map(castFill);
      q.notes = q.notes.map(castFill);
    }
  }
  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (n) => Number(n).toLocaleString("en-US");
  const shuffle = (arr) => { const a = arr.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
  const pad = (n) => String(n).padStart(2, "0");
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
  const mmss = (t) => `${Math.floor(t / 60)}:${pad(Math.floor(t % 60))}`;

  const RULES = Object.freeze({
    startBalance: 2500,
    wagers: [50, 100, 250, 500],
    payout: 1.5,
    unlockAt: 15, // correct answers (of 25) that unlock the next chapter
    focusMiss: 25, // Focus lost per wrong answer
    focusSlow: 10, // Focus lost for a slow answer…
    slowAfter: 25, // …over this many seconds of think time
    focusRestore: 25, // Focus regained per 2 right answers in a row
    restoreStreak: 2,
    lockMax: 9, // seconds of lock at 0% Focus (scales with missing Focus)
    stumble: 4, // extra lock after a wrong answer
    stipend: 250,
    trackLength: D.RULES.trackLength,
  });

  // Grammar passages are longer than vocab cards, so the CPUs read longer too.
  // Tuned by simulation (8 horses, Focus carrying over, ~3s on feedback):
  // 10s/question at 90% wins ~99% of races, 15s at 85% ~78%, 20s at 80% ~33%,
  // 25s at 75% ~4%. Break-even at ×1.5 is about 16s/question at 84%.
  D.CPU.read[0] = 20;
  D.CPU.read[1] = 26;

  const SHOP = Object.freeze({
    skins: [
      { id: "gold", name: "Scholar's Gold", price: 1000 },
      { id: "ink", name: "Midnight Ink", price: 1000 },
      { id: "crimson", name: "Crimson Cadence", price: 1000 },
      { id: "emerald", name: "Emerald Essay", price: 1000 },
    ],
    mounts: [
      { id: "pegasus", name: "Pegasus of Prose", emoji: "🦄", price: 1500 },
      { id: "zebra", name: "Zebra of Zeugma", emoji: "🦓", price: 1500 },
      { id: "dragon", name: "Dragon of Diction", emoji: "🐉", price: 1500 },
      { id: "stag", name: "Stag of Syntax", emoji: "🦌", price: 1500 },
    ],
    elixir: { name: "Focus Elixir", price: 500 },
  });

  // ---------- Pure rules (exported for tests) ----------
  // Updates { focus, streak } after an answer; returns the Focus change.
  function applyAnswer(st, correct, seconds) {
    const before = st.focus;
    if (correct) {
      st.streak += 1;
      if (st.streak >= RULES.restoreStreak) {
        st.streak = 0;
        st.focus += RULES.focusRestore;
      }
    } else {
      st.streak = 0;
      st.focus -= RULES.focusMiss;
    }
    if (seconds > RULES.slowAfter) st.focus -= RULES.focusSlow;
    st.focus = clamp(st.focus, 0, 100);
    return st.focus - before;
  }
  // Seconds the next question stays locked (the rivals keep running).
  const lockFor = (focus, lastWrong) => Math.round(((100 - focus) / 100) * RULES.lockMax * 10) / 10 + (lastWrong ? RULES.stumble : 0);
  const correctCount = (results, ch) => ch.questions.filter((q) => results[q.id] && results[q.id].c > 0).length;
  // Unseen first, then questions you last missed, then the rest.
  function drawQueue(ch, results) {
    const unseen = shuffle(ch.questions.filter((q) => !results[q.id]));
    const missed = shuffle(ch.questions.filter((q) => results[q.id] && !results[q.id].last));
    const rest = shuffle(ch.questions.filter((q) => results[q.id] && results[q.id].last));
    return [...unseen, ...missed, ...rest];
  }
  window.ClauseDerby = { RULES, SHOP, applyAnswer, lockFor, correctCount, drawQueue };

  // ---------- State (localStorage; plays unsaved if blocked) ----------
  const KEY = "sat-wizz-clause-derby.v1";
  let canSave = true;
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { canSave = false; return null; }
  }
  const saved = load() || {};
  const S = {
    sparks: Number.isFinite(saved.sparks) ? Math.max(0, saved.sparks) : RULES.startBalance,
    focus: Number.isFinite(saved.focus) ? clamp(saved.focus, 0, 100) : 100,
    streak: saved.streak || 0,
    unlocked: Array.isArray(saved.unlocked) && saved.unlocked.length ? saved.unlocked : [1],
    results: saved.results || {}, // { qid: { c: timesRight, w: timesWrong, last: bool } }
    skins: saved.skins || [],
    mounts: saved.mounts || [],
    skin: saved.skin || null,
    mount: saved.mount || null,
    stats: { races: 0, wins: 0, bestWin: 0, ...(saved.stats || {}) },
    stipendDay: saved.stipendDay || null,
    muted: Boolean(saved.muted),
  };
  function save() {
    if (!canSave) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { canSave = false; toast("Progress can't be saved in this browser mode."); }
  }
  SW.sfx.setMuted(S.muted);

  // ---------- Shell ----------
  const app = $("#app");
  app.innerHTML = `
    <header class="top">
      <button class="brand" id="brand" type="button" aria-label="SAT Wizz: Clause Derby, home">🐎 <span class="pre">SAT Wizz </span><span class="name">Clause Derby</span></button>
      <span class="pill spark" id="hud-sparks"></span>
      <button class="pill icon" id="hud-sound" type="button"></button>
    </header>
    <main id="screen" class="screen" tabindex="-1"></main>
    <footer class="disclaimer">SAT Wizz is an independent practice tool and is not affiliated with or endorsed by the College Board. Names in practice passages are used for fun and don't imply any endorsement or affiliation.</footer>`;
  const screenEl = $("#screen");

  function renderHud(bump) {
    const pill = $("#hud-sparks");
    pill.textContent = `⚡ ${fmt(S.sparks)}`;
    pill.setAttribute("aria-label", `${S.sparks} Sparks`);
    if (bump) { pill.classList.remove("bump"); void pill.offsetWidth; pill.classList.add("bump"); }
    const snd = $("#hud-sound");
    snd.textContent = S.muted ? "🔇" : "🔊";
    snd.setAttribute("aria-label", S.muted ? "Sound off" : "Sound on");
    snd.setAttribute("aria-pressed", String(!S.muted));
  }
  $("#hud-sound").addEventListener("click", () => { S.muted = !S.muted; SW.sfx.setMuted(S.muted); save(); renderHud(); SW.sfx.play("tap"); });
  $("#brand").addEventListener("click", () => { if (screen !== "race") go("intro"); });

  let toastTimer;
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3000);
  }
  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function celebrate(emoji, title, sub) {
    const wrap = document.createElement("div");
    wrap.className = "burst";
    wrap.setAttribute("role", "status");
    wrap.innerHTML = `<div class="burst-card"><span class="e" aria-hidden="true">${emoji}</span><b>${esc(title)}</b><span>${esc(sub)}</span></div>`;
    document.body.append(wrap);
    setTimeout(() => wrap.remove(), 2000);
  }

  // ---------- Navigation ----------
  let screen = "intro";
  let chapterId = 1;
  let wager = RULES.wagers[0];
  let race = null;
  let armed = null;
  let shopBack = "chapters";
  const chapter = (id) => BANK.chapters.find((c) => c.id === id);

  function go(next, opts = {}) {
    screen = next;
    armed = null;
    if (opts.chapter) chapterId = opts.chapter;
    ({ intro: renderIntro, chapters: renderChapters, rules: renderRules, bet: renderBet, race: renderRace, result: renderResult, shop: renderShop })[next]();
    screenEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  const focusClass = (f) => (f < 25 ? "critical" : f < 50 ? "low" : "ok");
  const focusMeter = (f, big = false) => `
    <div class="focus ${focusClass(f)}${big ? " big" : ""}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f}" aria-label="Focus ${f}%">
      <span class="focus-label">🧠 Focus</span>
      <span class="focus-track"><i style="width:${f}%"></i></span>
      <b class="focus-num">${f}%</b>
    </div>`;

  // ---------- Intro ----------
  function renderIntro() {
    screenEl.innerHTML = `
      <section class="card intro">
        <pre class="banner" aria-label="SAT Wizz: Vocab Derby">=====================================
 🐎 SAT WIZZ: VOCAB DERBY 🐎
=====================================</pre>
        <p class="tagline">Race seven CPU rivals through the Digital SAT grammar rules.</p>
        <ol class="rules">
          <li><b>Pick a chapter</b>, from Clause Connectors to Appositives. Get ${RULES.unlockAt} of 25 right to unlock the next one.</li>
          <li><b>Bet before every race</b> (${RULES.wagers.join(" / ")} ⚡ or a fun run). Win and your bet pays back <b>×${RULES.payout}</b>; lose and it's gone.</li>
          <li><b>The race never pauses.</b> Seven CPU rivals read and answer on their own clocks: Verbal Velocity answers in 1–3s at 60%, Grammar Galloper in 5–8s at 85%. Right answer → you gallop +1. First to ${RULES.trackLength} wins.</li>
          <li><b>🧠 Focus (0–100%).</b> A miss costs ${RULES.focusMiss}%, and a slow answer (over ${RULES.slowAfter}s) costs ${RULES.focusSlow}%. Low Focus blurs and shakes the screen and locks each question while rivals run. Only 2 right in a row (+${RULES.focusRestore}%) or a Focus Elixir (${fmt(SHOP.elixir.price)} ⚡) restore it.</li>
          <li><b>After each race</b>, the Post-Race Vault explains every question, choice by choice.</li>
        </ol>
        ${focusMeter(S.focus, true)}
        ${S.sparks < RULES.wagers[0] && S.stipendDay !== todayKey() ? `<button class="btn ghost wide" id="stipend" type="button">Running low? Claim a ${RULES.stipend} ⚡ stipend (once a day)</button>` : ""}
        <button class="btn wide big" id="start" type="button">Start Game ▶</button>
      </section>
      <section class="card stats">
        <div><b>${fmt(S.stats.races)}</b><span>Races</span></div>
        <div><b>${fmt(S.stats.wins)}</b><span>Wins</span></div>
        <div><b>${S.unlocked.length}/7</b><span>Chapters</span></div>
        <div><b>${fmt(S.stats.bestWin)}</b><span>Best payout</span></div>
      </section>`;
    $("#start").addEventListener("click", () => { SW.sfx.play("tap"); go("chapters"); });
    $("#stipend")?.addEventListener("click", () => {
      S.stipendDay = todayKey();
      S.sparks += RULES.stipend;
      save(); renderHud(true); SW.sfx.play("combo");
      toast(`+${RULES.stipend} ⚡ from the Stable. Spend it wisely!`);
      renderIntro();
    });
    $("#start").focus({ preventScroll: true });
  }

  // ---------- Chapter select ----------
  function renderChapters() {
    screenEl.innerHTML = `
      <div class="row-between">
        <h1 class="h1">Chapters</h1>
        <button class="btn ghost small" id="to-shop" type="button">🛍️ Shop</button>
      </div>
      <ol class="chapters">
        ${BANK.chapters.map((ch) => {
          const done = correctCount(S.results, ch);
          const open = S.unlocked.includes(ch.id);
          const pct = Math.round((done / ch.questions.length) * 100);
          const status = !open ? "🔒" : done === ch.questions.length ? "✓" : done >= RULES.unlockAt ? "★" : "";
          return `
          <li>
            <button class="chapter${open ? "" : " locked"}" type="button" data-ch="${ch.id}" ${open ? "" : 'aria-disabled="true"'}>
              <span class="ch-num">${ch.id}</span>
              <span class="ch-body">
                <b>${esc(ch.title)}</b>
                <span class="ch-progress"><i style="width:${pct}%"></i></span>
                <small>${open ? `${done}/${ch.questions.length} mastered${done < RULES.unlockAt && ch.id < 7 ? ` · ${RULES.unlockAt - done} more to unlock Ch ${ch.id + 1}` : ""}` : `Get ${RULES.unlockAt} right in Chapter ${ch.id - 1} to unlock`}</small>
              </span>
              <span class="ch-status" aria-hidden="true">${status}</span>
            </button>
          </li>`;
        }).join("")}
      </ol>`;
    $("#to-shop").addEventListener("click", () => { shopBack = "chapters"; go("shop"); });
    screenEl.querySelectorAll(".chapter").forEach((b) => b.addEventListener("click", () => {
      const id = Number(b.dataset.ch);
      if (!S.unlocked.includes(id)) { toast(`Get ${RULES.unlockAt} right in Chapter ${id - 1} first.`); SW.sfx.play("wrong"); return; }
      SW.sfx.play("tap");
      go("rules", { chapter: id });
    }));
  }

  // ---------- Chapter rules ----------
  function renderRules() {
    const ch = chapter(chapterId);
    screenEl.innerHTML = `
      <button class="link" id="back" type="button">← Chapters</button>
      <section class="card">
        <span class="eyebrow">Chapter ${ch.id}</span>
        <h1 class="h1">${esc(ch.title)}</h1>
        <p class="lead">${esc(ch.focus)}</p>
        <ul class="rule-list">${ch.rules.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>
        <button class="btn wide big" id="to-bet" type="button">Place your bet ▶</button>
      </section>`;
    $("#back").addEventListener("click", () => go("chapters"));
    $("#to-bet").addEventListener("click", () => { SW.sfx.play("tap"); go("bet"); });
  }

  // ---------- Bet ----------
  function renderBet() {
    const ch = chapter(chapterId);
    if (wager && S.sparks < wager) wager = RULES.wagers.find((w) => S.sparks >= w) || 0;
    screenEl.innerHTML = `
      <button class="link" id="back" type="button">← Chapter ${ch.id} rules</button>
      <section class="card">
        <span class="eyebrow">Chapter ${ch.id} · ${esc(ch.short)}</span>
        <h1 class="h1">🏇 Place your bet</h1>
        <p class="lead">A win pays your bet back ×${RULES.payout}. The bet goes in at the gate.</p>
        <div class="chips" role="radiogroup" aria-label="Wager">
          ${[0, ...RULES.wagers].map((a) => `
            <button class="chip" type="button" role="radio" data-wager="${a}" aria-checked="${a === wager}" ${a && S.sparks < a ? "disabled" : ""}>
              <b>${a ? fmt(a) : "Fun"}</b><small>${a ? `+${fmt(Math.round(a * RULES.payout) - a)}` : "no bet"}</small>
            </button>`).join("")}
        </div>
        ${focusMeter(S.focus)}
        <ol class="field">
          ${D.HORSES.map((h, i) => `<li class="${silkOf(h)}"><i class="dot">${i + 1}</i><b>${esc(h.name)}</b><small>${h.you ? "You" : `${esc(D.PROFILES[h.id].label)} · ${D.PROFILES[h.id].min}–${D.PROFILES[h.id].max}s · ${Math.round(D.PROFILES[h.id].acc * 100)}%`}</small></li>`).join("")}
        </ol>
        <button class="btn wide big" id="go" type="button">🔔 ${wager ? `Bet ${fmt(wager)} ⚡ & start` : "Start the fun run"}</button>
      </section>`;
    $("#back").addEventListener("click", () => go("rules"));
    screenEl.querySelectorAll(".chip:not(:disabled)").forEach((b) => b.addEventListener("click", () => { wager = Number(b.dataset.wager); SW.sfx.play("tap"); renderBet(); }));
    $("#go").addEventListener("click", startRace);
  }

  const silkOf = (h) => (h.you ? `silk-${S.skin || "you"}` : `silk-${h.silk}`);
  const myMount = () => (SHOP.mounts.find((m) => m.id === S.mount) || { emoji: "🏇" }).emoji;

  // ---------- Race ----------
  let loopId = null;
  let lastTick = 0;
  let lastGallop = 0;

  function startRace() {
    const ch = chapter(chapterId);
    const bet = wager && S.sparks >= wager ? wager : 0;
    if (bet) { S.sparks -= bet; renderHud(true); }
    save();
    race = D.newRace("derby", bet, []);
    Object.assign(race, {
      chapter: ch.id,
      queue: drawQueue(ch, S.results),
      qi: -1,
      log: [],
      feed: [],
      times: [],
      lastWrong: false,
      leader: null,
      call: "And they're off! 🔔 The rivals are already reading.",
    });
    nextQuestion();
    SW.sfx.play("bell");
    go("race");
    lastTick = performance.now();
    clearInterval(loopId);
    loopId = setInterval(loop, 100);
  }

  function nextQuestion() {
    race.qi += 1;
    if (race.qi >= race.queue.length) { race.queue = race.queue.concat(shuffle(race.queue)); }
    race.q = race.queue[race.qi];
    race.order = shuffle([0, 1, 2, 3]);
    race.picked = null;
    race.qClock = 0;
    race.lockLeft = lockFor(S.focus, race.lastWrong);
  }

  // The race clock never pauses: each tick advances the CPUs (catching up
  // after a throttled or hidden tab), the Focus lock and your think timer.
  function loop() {
    if (!race || race.winner) return;
    const now = performance.now();
    const dt = Math.max(0, (now - lastTick) / 1000);
    lastTick = now;
    if (race.picked === null) {
      const locked = Math.min(race.lockLeft, dt);
      race.lockLeft -= locked;
      race.qClock += dt - locked;
    }
    const events = D.tick(race, race.clock + dt);
    if (events.length) onCpu(events);
    if (race.winner) return cpuWon();
    if (screen !== "race") return;
    const t = $("#q-timer"); if (t) t.textContent = `⏱ ${race.qClock.toFixed(1)}s`;
    const c = $("#race-clock"); if (c) c.textContent = mmss(race.clock);
    if (race.picked === null) {
      const l = $("#lock-left"); if (l) l.textContent = race.lockLeft.toFixed(1);
      if (race.lockShown && race.lockLeft <= 0) renderQuestion();
    }
  }

  function lanesHtml() {
    return `<ol class="track" aria-label="Race track, ${RULES.trackLength} steps">
      ${race.horses.map((h, i) => {
        const meta = D.HORSES.find((x) => x.id === h.id);
        return `<li class="lane ${silkOf(meta)}${meta.you ? " you" : ""}" data-horse="${h.id}" aria-label="${esc(meta.name)}${meta.you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}">
          <span class="lane-name" aria-hidden="true"><i class="dot">${i + 1}</i><span class="nm-long">${esc(meta.name)}</span><span class="nm-short">${esc(meta.short)}</span></span>
          <span class="lane-track" aria-hidden="true"><span class="horse" style="--p:${h.pos}">${meta.you ? myMount() : "🏇"}</span>${meta.you ? "" : '<span class="tactic"></span>'}</span>
          <span class="lane-pos" aria-hidden="true">${h.pos}/${RULES.trackLength}</span>
        </li>`;
      }).join("")}
    </ol>`;
  }

  function paintLanes(moved = new Set()) {
    for (const h of race.horses) {
      const lane = $(`.lane[data-horse="${h.id}"]`);
      if (!lane) continue;
      const meta = D.HORSES.find((x) => x.id === h.id);
      lane.querySelector(".horse").style.setProperty("--p", h.pos);
      lane.querySelector(".lane-pos").textContent = `${h.pos}/${RULES.trackLength}`;
      lane.setAttribute("aria-label", `${meta.name}${meta.you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}`);
      const badge = lane.querySelector(".tactic");
      if (badge) badge.textContent = h.tactic && D.TACTICS[h.tactic].badge ? D.TACTICS[h.tactic].badge : "";
      if (moved.has(h.id)) { lane.classList.remove("moved"); void lane.offsetWidth; lane.classList.add("moved"); }
    }
  }

  function renderRace() {
    screenEl.innerHTML = `
      <div class="race-top">
        <button class="link" id="quit" type="button">${race.confirmQuit ? `Tap again to forfeit ${fmt(race.wager)} ⚡` : "✕ Leave race"}</button>
        <span class="muted"><b class="mono" id="race-clock">${mmss(race.clock)}</b> · Ch ${race.chapter} · ${race.wager ? `Bet ${fmt(race.wager)} ⚡` : "Fun run"}</span>
      </div>
      <section class="card track-card">
        ${lanesHtml()}
        <div id="focus-slot">${focusRow()}</div>
        <p class="call" id="race-call" aria-live="polite">${esc(race.call)}</p>
        <div id="next-slot"></div>
      </section>
      <section class="card qcard" id="qcard"></section>
      <section class="card feed-card">
        <span class="eyebrow">Live commentary</span>
        <ul class="feed" id="feed" aria-label="Race commentary">${race.feed.slice(0, 6).join("")}</ul>
      </section>`;
    $("#quit").addEventListener("click", quit);
    paintLanes();
    paintFocus(); // blur/tint the card when you start a race with low Focus
    renderQuestion();
  }

  function focusRow() {
    return `<div class="focus-row">${focusMeter(S.focus)}${S.focus < 100 && !race.winner ? `<button class="btn small elixir" id="elixir" type="button" ${S.sparks < SHOP.elixir.price ? "disabled" : ""}>🧪 ${fmt(SHOP.elixir.price)} ⚡</button>` : ""}</div>
      <p class="muted small">${S.focus < 100 ? `Locked ${lockFor(S.focus, false)}s before each question · 2 right in a row: +${RULES.focusRestore}% (${S.streak}/${RULES.restoreStreak})` : "Full Focus: no lock."}</p>`;
  }
  function wireFocus() { $("#elixir")?.addEventListener("click", drinkElixir); }
  function paintFocus() {
    const slot = $("#focus-slot");
    if (slot) { slot.innerHTML = focusRow(); wireFocus(); }
    screenEl.classList.toggle("focus-low", S.focus < 50 && S.focus >= 25);
    screenEl.classList.toggle("focus-critical", S.focus < 25);
  }

  function drinkElixir() {
    if (!race || race.winner || S.focus >= 100 || S.sparks < SHOP.elixir.price) return;
    S.sparks -= SHOP.elixir.price;
    S.focus = 100;
    S.streak = 0;
    race.lockLeft = 0;
    save(); renderHud(true); SW.sfx.play("combo");
    announce("🧪 Focus Elixir! Galloping Lexicon is locked in again.");
    paintFocus();
    if (race.picked === null) renderQuestion();
  }

  function announce(text) {
    race.call = text;
    const el = $("#race-call");
    if (el) el.textContent = text;
  }
  function feed(html) {
    race.feed.unshift(html);
    race.feed.length = Math.min(race.feed.length, 12);
    const el = $("#feed");
    if (el) el.innerHTML = race.feed.slice(0, 6).join("");
  }

  function onCpu(events) {
    const moved = new Set();
    for (const e of events) {
      const meta = D.HORSES.find((h) => h.id === e.id);
      const p = D.PROFILES[e.id];
      const tactic = D.TACTICS[e.tactic].label ? `, ${D.TACTICS[e.tactic].label},` : "";
      const n = D.HORSES.indexOf(meta) + 1;
      const secs = `${Math.max(1, Math.round(e.answer))}s`;
      feed(`<li class="silk-${meta.silk} ${e.correct ? "ok" : "no"}"><i class="dot">${n}</i><span><time>${mmss(e.at)}</time> ${esc(meta.name)}${tactic} ${p.rush ? `rushed an answer in ${secs}` : `spent ${secs}`} and ${e.correct ? "got it right ✓" : "missed ✗"}</span></li>`);
      if (e.correct) moved.add(e.id);
    }
    if (screen === "race") paintLanes(moved);
    if (moved.size && performance.now() - lastGallop > 1500) { lastGallop = performance.now(); SW.sfx.play("gallop"); }
    const top = Math.max(...race.horses.map((h) => h.pos));
    const leaders = race.horses.filter((h) => h.pos === top);
    const lead = leaders.length === 1 && top > 0 ? leaders[0].id : race.leader;
    if (lead && lead !== race.leader && lead !== "lexicon") announce(`${D.HORSES.find((h) => h.id === lead).name} takes the lead!`);
    race.leader = lead;
    for (const id of moved) if (race.horses.find((h) => h.id === id).pos === RULES.trackLength - 1) announce(`⚠️ ${D.HORSES.find((h) => h.id === id).name} is one step from the line!`);
  }

  function renderPassage(q, filled) {
    return esc(q.text).replace("______", filled != null ? `<mark class="fill">${esc(filled)}</mark>` : '<span class="blank" role="img" aria-label="blank"></span>');
  }

  function renderQuestion() {
    const card = $("#qcard");
    if (!card) return;
    const q = race.q;
    const answered = race.picked !== null;
    const over = Boolean(race.winner);
    const locked = !answered && !over && race.lockLeft > 0;
    race.lockShown = locked;
    const right = answered && race.picked === q.answer;
    card.classList.toggle("answered", answered || over); // reviewing isn't blurred
    const plain = (note) => note.replace(/^Correct\.\s*/, "");
    card.innerHTML = `
      <div class="q-top">
        <span class="q-num">${race.qi + 1}</span>
        <span class="eyebrow">${esc(q.skill)}</span>
        <span class="q-timer mono" id="q-timer" aria-hidden="true">⏱ ${race.qClock.toFixed(1)}s</span>
      </div>
      <div class="passage"><p>${renderPassage(q, answered || over ? q.choices[q.answer] : null)}</p></div>
      <p class="stem">${esc(BANK.stemFor(q))}</p>
      ${locked ? `<p class="lock" role="status">🧠 Rattled… choices unlock in <b id="lock-left">${race.lockLeft.toFixed(1)}</b>s. The rivals keep running.</p>` : ""}
      <ol class="choices${locked ? " locked" : ""}">
        ${race.order.map((ci, pos) => {
          let cls = "";
          if (answered) cls = ci === q.answer ? "right" : ci === race.picked ? "wrong" : "dim";
          else if (over) cls = ci === q.answer ? "right" : "dim";
          return `<li><button class="choice ${cls}" type="button" data-ci="${ci}" ${answered || over || locked ? "disabled" : ""} aria-label="(${"ABCD"[pos]}) ${esc(q.choices[ci])}">
            <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span><span class="txt">${esc(q.choices[ci])}</span></button></li>`;
        }).join("")}
      </ol>
      ${answered ? `
        <div class="feedback ${right ? "ok" : "no"}">
          <h3>${right ? "Correct! You gallop ahead." : `Not quite. You're held back, and your next question locks for ${RULES.stumble}s+.`}</h3>
          <p class="rule">📏 ${esc(q.rule)}</p>
          ${right ? `<p>${esc(q.notes[q.answer])}</p>` : `<p><b>Your pick:</b> ${esc(q.notes[race.picked])}</p><p><b>Answer:</b> ${esc(plain(q.notes[q.answer]))}</p>`}
        </div>` : over ? `<div class="feedback no"><h3>Too late!</h3><p class="rule">📏 ${esc(q.rule)}</p></div>` : ""}`;
    $("#next-slot").innerHTML = over
      ? '<button class="btn wide big" id="next" type="button">See the results 🏁</button>'
      : answered ? '<button class="btn wide" id="next" type="button">Next question →</button><p class="muted small center">Rivals don\'t wait. Tap Next when ready.</p>' : "";
    card.querySelectorAll(".choice:not(:disabled)").forEach((b) => {
      b.addEventListener("pointerdown", () => SW.sfx.play("tap"));
      b.addEventListener("click", () => answer(Number(b.dataset.ci)));
    });
    $("#next")?.addEventListener("click", advance);
  }

  function answer(ci) {
    if (!race || race.picked !== null || race.winner || race.lockLeft > 0) return;
    loop(); // bring the race up to this exact moment first
    if (race.winner) return;
    const q = race.q;
    const correct = ci === q.answer;
    const seconds = race.qClock;
    race.picked = ci;
    race.lastWrong = !correct;
    race.times.push(seconds);
    race.log.push({ q, picked: ci, order: race.order.slice(), correct, seconds });
    const r = S.results[q.id] || { c: 0, w: 0, last: false };
    if (correct) r.c += 1; else r.w += 1;
    r.last = correct;
    S.results[q.id] = r;
    const delta = applyAnswer(S, correct, seconds);
    const you = race.horses[0];
    if (correct) {
      you.pos = Math.min(RULES.trackLength, you.pos + 1);
      if (you.pos >= RULES.trackLength) race.winner = "lexicon";
    }
    const unlockedNow = maybeUnlock();
    save();
    SW.sfx.play(correct ? "correct" : "wrong");
    if (correct) { SW.sfx.buzz(50); setTimeout(() => SW.sfx.play("gallop"), 120); }
    const slow = seconds > RULES.slowAfter;
    feed(`<li class="silk-${S.skin || "you"} ${correct ? "ok" : "no"} mine"><i class="dot">1</i><span><time>${mmss(race.clock)}</time> <b>You</b> answered in ${seconds.toFixed(1)}s and ${correct ? "got it right ✓" : "missed ✗"}${delta ? ` · Focus ${delta > 0 ? "+" : ""}${delta}%` : ""}${slow ? " (slow)" : ""}</span></li>`);
    paintLanes(new Set(correct ? ["lexicon"] : []));
    paintFocus();
    if (!correct && S.focus < 25 && !reducedMotion()) {
      screenEl.classList.remove("shake"); void screenEl.offsetWidth; screenEl.classList.add("shake");
    }
    announce(race.winner === "lexicon" ? "🏁 Galloping Lexicon wins!" : `You ${correct ? "got it right" : "missed"} in ${seconds.toFixed(1)}s.`);
    if (unlockedNow) toast(`🔓 Chapter ${unlockedNow} unlocked!`);
    $("#quit").textContent = "✕ Leave race";
    race.confirmQuit = false;
    if (race.winner) settle();
    renderQuestion();
    $("#next")?.focus({ preventScroll: true });
  }

  function maybeUnlock() {
    const ch = chapter(race.chapter);
    const next = ch.id + 1;
    if (next <= 7 && !S.unlocked.includes(next) && correctCount(S.results, ch) >= RULES.unlockAt) {
      S.unlocked.push(next);
      return next;
    }
    return 0;
  }

  function cpuWon() {
    if (race.picked === null && race.q) race.log.push({ q: race.q, picked: null, order: race.order.slice(), correct: false, unanswered: true });
    announce(`🏁 ${D.HORSES.find((h) => h.id === race.winner).name} crossed the line${race.picked === null ? " while you were thinking" : ""}!`);
    settle();
    if (screen !== "race") return;
    renderQuestion();
    paintFocus();
  }

  function settle() {
    clearInterval(loopId);
    const won = race.winner === "lexicon";
    const payout = won && race.wager ? Math.round(race.wager * RULES.payout) : 0;
    S.stats.races += 1;
    if (won) S.stats.wins += 1;
    if (payout) { S.sparks += payout; S.stats.bestWin = Math.max(S.stats.bestWin, payout); }
    race.payout = payout;
    save();
    renderHud(Boolean(payout));
    setTimeout(() => {
      if (won) { SW.sfx.play("complete"); celebrate("🏆", "You won the race!", payout ? `+${fmt(payout)} ⚡ Sparks` : "Fun run victory"); }
      else SW.sfx.play("wrong");
    }, reducedMotion() ? 0 : 600);
  }

  function advance() {
    if (race.winner) return go("result");
    nextQuestion();
    renderQuestion();
    screenEl.querySelectorAll(".lane.moved").forEach((l) => l.classList.remove("moved"));
    screenEl.scrollTop = 0;
    window.scrollTo(0, 0);
  }

  function quit() {
    if (race.wager && !race.confirmQuit) {
      race.confirmQuit = true;
      $("#quit").textContent = `Tap again to forfeit ${fmt(race.wager)} ⚡`;
      return;
    }
    clearInterval(loopId);
    if (race.wager) { S.stats.races += 1; save(); }
    race = null;
    screenEl.classList.remove("focus-low", "focus-critical", "shake");
    go("bet");
  }

  // ---------- Results + Post-Race Vault ----------
  function renderResult() {
    screenEl.classList.remove("focus-low", "focus-critical", "shake");
    const won = race.winner === "lexicon";
    const winner = D.HORSES.find((h) => h.id === race.winner);
    const standings = race.horses.slice().sort((a, b) => (b.id === race.winner) - (a.id === race.winner) || b.pos - a.pos);
    const answered = race.log.filter((l) => !l.unanswered);
    const right = answered.filter((l) => l.correct).length;
    const vault = race.log.map((l, i) => {
      const q = l.q;
      const mark = l.unanswered ? ["skip", "—", "Not answered"] : l.correct ? ["ok", "✓", "Correct"] : ["no", "✗", "Missed"];
      return `
        <details class="vault-item ${mark[0]}"${!l.correct ? " open" : ""}>
          <summary><span class="res" aria-label="${mark[2]}">${mark[1]}</span><b>Q${i + 1} · ${esc(q.skill)}</b>${l.seconds != null ? `<small class="mono">${l.seconds.toFixed(1)}s</small>` : ""}</summary>
          <p class="passage small">${renderPassage(q, q.choices[q.answer])}</p>
          <p class="rule">📏 ${esc(q.rule)}</p>
          <ol class="why">
            ${l.order.map((ci, pos) => `<li class="${ci === q.answer ? "right" : ci === l.picked ? "wrong" : ""}"><span class="letter">${"ABCD"[pos]}</span><div><b>${esc(q.choices[ci])}</b>${ci === q.answer ? ' <em>Answer</em>' : ""}${ci === l.picked && ci !== q.answer ? " <em>Your pick</em>" : ""}<p>${esc(q.notes[ci])}</p></div></li>`).join("")}
          </ol>
        </details>`;
    }).join("");
    const ch = chapter(race.chapter);
    screenEl.innerHTML = `
      <section class="card result">
        <span class="big-emoji" aria-hidden="true">${won ? "🏆" : "🐎"}</span>
        <h1 class="h1">${won ? "You won the race!" : `${esc(winner.name)} wins`}</h1>
        <p class="payout ${won ? "ok" : "no"}">${race.wager ? (won ? `+${fmt(race.payout)} ⚡ · your ${fmt(race.wager)} ⚡ bet paid ×${RULES.payout}` : `−${fmt(race.wager)} ⚡ · better luck next race`) : "Fun run: no Sparks on the line"}</p>
        <p class="muted">Balance <b>⚡ ${fmt(S.sparks)}</b> · Race time ${mmss(race.clock)} · ${right}/${answered.length} right</p>
        ${focusMeter(S.focus)}
        <p class="muted small">Chapter ${ch.id}: ${correctCount(S.results, ch)}/25 mastered${ch.id < 7 ? (S.unlocked.includes(ch.id + 1) ? ` · Chapter ${ch.id + 1} unlocked` : ` · ${RULES.unlockAt - correctCount(S.results, ch)} more to unlock Chapter ${ch.id + 1}`) : ""}</p>
        <ol class="standings">${standings.map((h, i) => { const m = D.HORSES.find((x) => x.id === h.id); return `<li class="${silkOf(m)}${m.you ? " you" : ""}"><i class="dot">${i + 1}</i>${esc(m.name)}<small>${h.pos}/${RULES.trackLength}</small></li>`; }).join("")}</ol>
      </section>
      <section class="card">
        <span class="eyebrow">Post-Race Vault</span>
        <h2 class="h2">Every question, explained</h2>
        <div class="vault">${vault || '<p class="muted">No questions this race.</p>'}</div>
      </section>
      <div class="actions">
        <button class="btn wide big" id="again" type="button">🏇 Race again</button>
        <button class="btn ghost wide" id="to-chapters" type="button">📚 Chapters</button>
        <button class="btn ghost wide" id="to-shop" type="button">🛍️ Shop</button>
      </div>`;
    race = null;
    $("#again").addEventListener("click", () => go("bet"));
    $("#to-chapters").addEventListener("click", () => go("chapters"));
    $("#to-shop").addEventListener("click", () => { shopBack = "chapters"; go("shop"); });
  }

  // ---------- Shop ----------
  function renderShop() {
    const btn = (key, price, { owned, equipped, off } = {}) => {
      if (equipped) return '<button class="buy" type="button" disabled>Equipped</button>';
      if (owned) return `<button class="buy owned" type="button" data-equip="${key}">Equip</button>`;
      if (off) return `<button class="buy" type="button" disabled>${esc(off)}</button>`;
      if (S.sparks < price) return `<button class="buy" type="button" disabled>Need ${fmt(price - S.sparks)}</button>`;
      return `<button class="buy${armed === key ? " confirm" : ""}" type="button" data-buy="${key}">${armed === key ? `Confirm ${fmt(price)}` : `${fmt(price)} ⚡`}</button>`;
    };
    screenEl.innerHTML = `
      <button class="link" id="back" type="button">← Back</button>
      <h1 class="h1">🛍️ Shop</h1>
      <p class="lead">Prices are steep. Earn them with accurate, fast racing and smart bets.</p>
      <section class="card">
        <h2 class="h2">Focus</h2>
        ${focusMeter(S.focus)}
        <div class="item"><span class="item-icon">🧪</span><div><b>${SHOP.elixir.name}</b><small>Refill Focus to 100% instantly.</small></div>${btn("elixir", SHOP.elixir.price, { off: S.focus >= 100 ? "Focus full" : "" })}</div>
      </section>
      <section class="card">
        <h2 class="h2">Jockey Skins</h2>
        ${[{ id: null, name: "Classic Blue", price: 0 }, ...SHOP.skins].map((s) => `
          <div class="item silk-${s.id || "you"}"><span class="item-icon"><i class="dot big">1</i></span><div><b>${esc(s.name)}</b><small>${s.id ? "Your silks on the track" : "Default"}</small></div>${btn(`skin:${s.id || ""}`, s.price, { owned: !s.id || S.skins.includes(s.id), equipped: S.skin === s.id })}</div>`).join("")}
      </section>
      <section class="card">
        <h2 class="h2">Custom Mounts</h2>
        ${[{ id: null, name: "Thoroughbred", emoji: "🏇", price: 0 }, ...SHOP.mounts].map((m) => `
          <div class="item"><span class="item-icon mount">${m.emoji}</span><div><b>${esc(m.name)}</b><small>${m.id ? "Races in your lane" : "Default"}</small></div>${btn(`mount:${m.id || ""}`, m.price, { owned: !m.id || S.mounts.includes(m.id), equipped: S.mount === m.id })}</div>`).join("")}
      </section>`;
    $("#back").addEventListener("click", () => go(shopBack));
    screenEl.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
    screenEl.querySelectorAll("[data-equip]").forEach((b) => b.addEventListener("click", () => equip(b.dataset.equip)));
  }

  function priceOf(key) {
    if (key === "elixir") return SHOP.elixir.price;
    const [kind, id] = key.split(":");
    return (kind === "skin" ? SHOP.skins : SHOP.mounts).find((x) => x.id === id).price;
  }
  function buy(key) {
    if (armed !== key) { armed = key; SW.sfx.play("tap"); return renderShop(); }
    const price = priceOf(key);
    if (S.sparks < price) return;
    S.sparks -= price;
    if (key === "elixir") { S.focus = 100; S.streak = 0; }
    else {
      const [kind, id] = key.split(":");
      if (kind === "skin") { S.skins.push(id); S.skin = id; } else { S.mounts.push(id); S.mount = id; }
    }
    armed = null;
    save(); renderHud(true); SW.sfx.play("combo");
    toast(key === "elixir" ? "🧪 Focus restored to 100%!" : "New gear equipped!");
    renderShop();
  }
  function equip(key) {
    const [kind, id] = key.split(":");
    if (kind === "skin") S.skin = id || null; else S.mount = id || null;
    save(); SW.sfx.play("tap"); renderShop();
  }

  // A–D or 1–4 answer during a race.
  document.addEventListener("keydown", (e) => {
    if (screen !== "race" || !race || race.picked !== null || e.altKey || e.ctrlKey || e.metaKey) return;
    const k = e.key.toLowerCase();
    const pos = k.length === 1 && "abcd".includes(k) ? "abcd".indexOf(k) : "1234".indexOf(e.key);
    if (pos >= 0) { e.preventDefault(); answer(race.order[pos]); }
  });

  renderHud();
  save();
  go("intro");
  if (!canSave) toast("Saving is off in this browser mode. You can still race.");
})();
