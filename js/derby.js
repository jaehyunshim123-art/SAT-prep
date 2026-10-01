// SatWizz Vocab Derby: a wager-based horse race on advanced Vault words.
//
// Flow: intro (title + rules) → START → place a bet → race → results
// (review table, balance, Stable). The Stable sells jockey silks, mounts,
// Focus Elixirs and Starting Bursts for real Sparks.
//
//   • Bet real Sparks (50 / 100 / 250 / 500) or race for fun. The bet is taken
//     at the gate; a win pays it back ×1.5. Up to 3 betting races a day.
//   • Eight horses, 5 steps. Each turn is one advanced vocab question (Words
//     in Context, definition, synonym or antonym). Right → you gallop +1.
//     Wrong → you're held back and lose 1 Focus. Every rival rolls its own
//     chance to move each turn, whatever you answer; each has a racing style.
//   • 🧠 Focus (max 3) carries between races. At 0 you're Spooked: right
//     answers don't move you. Two right answers in a row restore 1 Focus
//     (spooked horses spend that turn recovering); a Focus Elixir refills it.
//   • You move first, so a perfect race always wins.
//
// Exposes SatWizz.derby = { RULES, MODES, HORSES, STABLE, PACE, newRace, step,
// rivalChance, makeQuestion, related, emptyStats, mergeStats, mount }.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    trackLength: 5,
    wagers: [50, 100, 250, 500],
    ratedPerDay: 3,
    focusMax: 3,
    focusRestoreStreak: 2,
  });

  const MODES = Object.freeze({
    derby: { id: "derby", name: "Grand Derby", field: 8, payout: 1.5 },
  });

  // Racing styles: each rival's chance to move +1 on a turn. Tuned by
  // simulation (see README) so accuracy, not luck, decides most races.
  const STYLES = {
    starter: { label: "Fast starter", chance: (h, r) => (r.turn <= 2 ? 0.5 : 0.26) },
    steady: { label: "Steady", chance: () => 0.33 },
    closer: { label: "Closer", chance: (h, r) => (r.turn <= 3 ? 0.18 : 0.46) },
    streaky: { label: "Streaky: speeds up after a gallop", chance: (h) => (h.hot ? 0.42 : 0.2) },
    front: { label: "Front-runner", chance: (h, r, lead) => (h.pos >= lead ? 0.42 : 0.24) },
    pouncer: { label: "Pounces on your misses", chance: (h, r, lead, correct) => (correct ? 0.18 : 0.52) },
    underdog: { label: "Underdog: surges from the back", chance: (h, r, lead, correct, last) => (h.pos <= last ? 0.46 : 0.27) },
  };

  // Overall rival speed (tuned by simulation; see README).
  // At 1.6: 90% accuracy wins ~85% of races (+27% per bet at ×1.5), 80% wins
  // ~67% (break-even), 70% wins ~47%, 60% wins ~28%.
  const PACE = { scale: 1.6 };

  // Silks map to colors in css/styles.css (.silk-*).
  const HORSES = [
    { id: "lexicon", name: "Galloping Lexicon", short: "You", silk: "volt", you: true },
    { id: "velocity", name: "Verbal Velocity", short: "Velocity", silk: "flame", style: "starter" },
    { id: "galloper", name: "Grammar Galloper", short: "Galloper", silk: "good", style: "steady" },
    { id: "syntax", name: "Syntax Sprinter", short: "Syntax", silk: "bad", style: "closer" },
    { id: "rex", name: "Thesaurus Rex", short: "T. Rex", silk: "spark", style: "streaky" },
    { id: "diction", name: "Diction Dash", short: "Diction", silk: "ice", style: "front" },
    { id: "rhetoric", name: "Rhetoric Rocket", short: "Rocket", silk: "plum", style: "pouncer" },
    { id: "prose", name: "Prose Pony", short: "Prose", silk: "slate", style: "underdog" },
  ];
  const HORSE = Object.fromEntries(HORSES.map((h) => [h.id, h]));

  // The Stable: cosmetics and power-ups, priced in real Sparks.
  const STABLE = Object.freeze({
    silks: [
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
    burst: { name: "Starting Burst", price: 500 },
  });

  const shuffle = (arr, rand) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const pick = (arr, rand) => arr[Math.floor(rand() * arr.length)];

  // ---------- Race (pure) ----------
  // focus/streak come from (and go back to) the saved stats.
  function newRace(modeId, wager, wordIds, { focus = RULES.focusMax, streak = 0, burst = false } = {}, rand = Math.random) {
    const mode = MODES[modeId];
    return {
      mode: mode.id,
      wager,
      horses: HORSES.slice(0, mode.field).map((h) => ({ id: h.id, pos: h.you && burst ? 1 : 0 })),
      words: wordIds.slice(),
      focus,
      streak,
      turn: 0,
      winner: null,
    };
  }

  function rivalChance(h, race, correct) {
    const others = race.horses.filter((x) => x !== h);
    const lead = Math.max(...others.map((x) => x.pos));
    const last = Math.min(...others.map((x) => x.pos));
    return Math.min(0.9, STYLES[HORSE[h.id].style].chance(h, race, lead, correct, last) * PACE.scale);
  }

  // Resolves one answer. Mutates the race; returns what happened, in order.
  function step(race, correct, rand = Math.random) {
    const L = RULES.trackLength;
    const [you, ...rivals] = race.horses;
    const events = [];
    const move = (h, n, kind) => {
      h.pos = Math.min(L, h.pos + n);
      events.push({ id: h.id, kind });
    };
    race.turn += 1;
    if (correct) {
      race.streak += 1;
      if (race.focus > 0) move(you, 1, "advance");
      else events.push({ id: you.id, kind: "spooked" }); // held while spooked
      if (race.focus < RULES.focusMax && race.streak >= RULES.focusRestoreStreak) {
        race.focus += 1;
        race.streak = 0;
        events.push({ id: you.id, kind: "focus" });
      }
      if (you.pos >= L) { race.winner = you.id; return events; }
    } else {
      race.streak = 0;
      race.focus = Math.max(0, race.focus - 1);
      events.push({ id: you.id, kind: race.focus === 0 ? "spook" : "slip" });
    }
    // Rivals roll independently, from the positions at the start of their turn.
    const chances = rivals.map((r) => rivalChance(r, race, correct));
    // One step at most per turn, so a perfect run (you move first) always wins.
    rivals.forEach((r, i) => {
      r.hot = r.pos < L && rand() < chances[i];
      if (r.hot) move(r, 1, "gallop");
    });
    const finished = rivals.filter((r) => r.pos >= L);
    if (finished.length) race.winner = pick(finished, rand).id; // photo finish
    return events;
  }

  // ---------- Questions (pure) ----------
  // Words whose meanings overlap. Never used as each other's distractors, so
  // every question has exactly one defensible answer.
  // Clusters also cover near-opposites, so an antonym question never has a
  // second defensible answer.
  const CLUSTERS = [
    ["mitigate", "ameliorate", "diminish", "undermine", "assuage", "exacerbate", "enervate"],
    ["corroborate", "substantiate"],
    ["novel", "innovative", "conventional", "obsolete"],
    ["tentative", "skeptical", "ambiguous", "sanguine", "ephemeral", "esoteric"],
    ["discern", "scrutinize", "meticulous", "fastidious", "perfunctory"],
    ["profound", "compelling"],
    ["pragmatic", "empirical", "quixotic", "prescient"],
    ["elucidate", "candid", "surreptitious", "obfuscate", "laconic"],
    ["obdurate", "recalcitrant", "mercurial", "vacillate", "obsequious", "reconcile"],
    ["equanimity", "temerity", "alacrity"],
  ];
  const lc = (s) => s.toLowerCase();
  const lexicon = (w) => new Set([w.word, ...w.synonyms, ...w.antonyms].map(lc));

  // True if a and b are too close in meaning to share a question.
  function related(a, b) {
    if (a.id === b.id) return true;
    if (CLUSTERS.some((c) => c.includes(a.id) && c.includes(b.id))) return true;
    const la = lexicon(a);
    for (const x of lexicon(b)) if (la.has(x)) return true;
    return false;
  }

  const KINDS = ["context", "context", "definition", "synonym", "antonym"];

  // Builds one 4-choice question about word w. `kind` is optional.
  // Returns { wordId, kind, passage?, stem, choices[4], answer, explain }.
  function makeQuestion(w, kind, rand = Math.random, words = SW.vocab.WORDS) {
    kind = kind || pick(KINDS, rand);
    const pool = shuffle(words.filter((x) => !related(w, x)), rand);
    const samePos = pool.filter((x) => x.pos === w.pos);
    const order4 = (right, wrong) => {
      const choices = shuffle([right, ...wrong.slice(0, 3)], rand);
      return { choices, answer: choices.indexOf(right) };
    };
    const summary = `“${w.word}” (${w.pos}): ${w.definition}.`;

    if (kind === "context") {
      const order = shuffle([0, 1, 2, 3], rand);
      const underlined = SW.UNDERLINE_RE.exec(w.text);
      return {
        wordId: w.id, kind,
        passage: w.text,
        stem: w.format === "meaning" ? SW.STEMS.meaning.replace("{word}", underlined[1]) : SW.STEMS.wordChoice,
        choices: order.map((i) => w.choices[i]),
        answer: order.indexOf(w.answer),
        explain: w.notes[w.answer],
      };
    }
    if (kind === "definition") {
      return {
        wordId: w.id, kind,
        stem: `Which choice best defines “${w.word}” (${w.pos})?`,
        ...order4(w.definition, pool.map((x) => x.definition)),
        explain: `${summary} 🌱 ${w.root}`,
      };
    }
    // Synonym / antonym: distractors are same-part-of-speech synonyms of
    // unrelated words. Antonym questions add one trap: a synonym of w.
    // Never offer a word that belongs to w or to any word close to it.
    const used = new Set();
    for (const x of words) if (related(w, x)) for (const t of lexicon(x)) used.add(t);
    const fillers = [];
    for (const x of samePos.length >= 3 ? samePos : pool) {
      const cand = x.synonyms.find((s) => !used.has(lc(s)) && !fillers.some((f) => lc(f) === lc(s)));
      if (cand) fillers.push(cand);
      if (fillers.length >= 3) break;
    }
    if (kind === "synonym") {
      return {
        wordId: w.id, kind,
        stem: `Which word is closest in meaning to “${w.word}”?`,
        ...order4(pick(w.synonyms, rand), fillers),
        explain: `${summary} Synonyms: ${w.synonyms.join(", ")}.`,
      };
    }
    return {
      wordId: w.id, kind: "antonym",
      stem: `Which word is most nearly OPPOSITE in meaning to “${w.word}”?`,
      ...order4(pick(w.antonyms, rand), [pick(w.synonyms, rand), ...fillers]),
      explain: `${summary} Antonyms: ${w.antonyms.join(", ")}. (Watch out: the trap choice is a synonym.)`,
    };
  }

  // ---------- Stats (kept in vocab progress, so they sync) ----------
  const emptyStats = () => ({
    day: null, rated: 0, races: 0, wins: 0, bestWin: 0,
    focus: RULES.focusMax, streak: 0, bursts: 0,
    silks: [], mounts: [], silk: null, mount: null, at: 0,
  });

  // Counters take the max, owned items the union; the newer side (at) wins
  // spendable or equipped state (focus, bursts, silk, mount).
  function mergeStats(a, b) {
    const x = { ...emptyStats(), ...(a || {}) };
    const y = { ...emptyStats(), ...(b || {}) };
    const day = [x.day, y.day].filter(Boolean).sort().pop() || null;
    const ratedOn = (s) => (s.day === day ? s.rated : 0);
    const newer = (y.at || 0) > (x.at || 0) ? y : x;
    const silks = [...new Set([...x.silks, ...y.silks])].filter((id) => STABLE.silks.some((s) => s.id === id));
    const mounts = [...new Set([...x.mounts, ...y.mounts])].filter((id) => STABLE.mounts.some((m) => m.id === id));
    return {
      day,
      rated: Math.max(ratedOn(x), ratedOn(y)),
      races: Math.max(x.races, y.races),
      wins: Math.max(x.wins, y.wins),
      bestWin: Math.max(x.bestWin, y.bestWin),
      focus: Math.min(RULES.focusMax, Math.max(0, Number(newer.focus) || 0)),
      streak: Math.max(0, Number(newer.streak) || 0),
      bursts: Math.max(0, Number(newer.bursts) || 0),
      silks,
      mounts,
      silk: silks.includes(newer.silk) ? newer.silk : null,
      mount: mounts.includes(newer.mount) ? newer.mount : null,
      at: Math.max(x.at || 0, y.at || 0),
    };
  }

  // ---------- View ----------
  // ctx: vocab's ctx plus { container, onExit }.
  function mount(ctx) {
    const { container, esc } = ctx;
    let screen = null; // null | "intro" | "setup" | "race" | "result" | "stable"
    let back = "intro"; // where the Stable's back button goes
    let setup = { wager: RULES.wagers[0], burst: false };
    let race = null; // newRace() + { q, picked, call, log: [], confirmQuit, payout }
    let armed = null; // Stable item waiting for a confirm tap
    const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mode = MODES.derby;

    const S = () => ctx.getState();
    const stats = () => {
      const p = S().vocab;
      // Normalize in place so references held across calls stay live.
      p.derby = Object.assign(p.derby || {}, mergeStats(p.derby, null));
      if (p.derby.day !== ctx.todayKey()) { p.derby.day = ctx.todayKey(); p.derby.rated = 0; }
      return p.derby;
    };
    const touch = () => { stats().at = Date.now(); };
    const ratedLeft = () => Math.max(0, RULES.ratedPerDay - stats().rated);
    const canBet = (amount) => amount === 0 || (ratedLeft() > 0 && (S().sparks || 0) >= amount);
    const fmt = (n) => Number(n).toLocaleString();
    const payoutFor = (wager) => Math.round(wager * mode.payout);
    const myEmoji = () => (STABLE.mounts.find((m) => m.id === stats().mount) || { emoji: "🏇" }).emoji;
    const mySilk = () => (stats().silk ? `silk-${stats().silk}` : `silk-${HORSE.lexicon.silk}`);
    const focusBar = (f, label = true) => `<span class="focus-bar${f === 0 ? " spooked" : ""}" role="img" aria-label="Focus ${f} of ${RULES.focusMax}">${label ? "🧠 " : ""}${"■".repeat(f)}${"□".repeat(RULES.focusMax - f)}</span>`;

    function go(next) {
      screen = next;
      armed = null;
      render();
      container.scrollTop = 0;
    }
    const open = () => { ctx.sfx.play("tap"); go("intro"); };
    const openStable = () => { back = screen && screen !== "stable" ? screen : "intro"; if (back === "race") back = "intro"; go("stable"); };

    function render() {
      if (screen === "intro") return renderIntro();
      if (screen === "setup") return renderSetup();
      if (screen === "race") return renderRace();
      if (screen === "result") return renderResult();
      if (screen === "stable") return renderStable();
    }

    // Lanes: name + track with tick marks and a finish line. The horse's
    // position is a CSS variable, so moves animate in place.
    function lanes(horses, compact = false) {
      return `
        <ol class="track${compact ? " compact" : ""}" aria-label="Race track, ${RULES.trackLength} steps to the finish">
          ${horses.map((h, i) => {
            const meta = HORSE[h.id];
            const silk = meta.you ? mySilk() : `silk-${meta.silk}`;
            return `
            <li class="lane ${silk}${meta.you ? " you" : ""}" data-horse="${h.id}" aria-label="${esc(meta.name)}${meta.you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}">
              <span class="lane-name" aria-hidden="true"><i class="silk-dot">${i + 1}</i><span class="nm-long">${esc(meta.name)}</span><span class="nm-short">${esc(meta.short)}</span></span>
              <span class="lane-track" aria-hidden="true"><span class="lane-horse" style="--p:${h.pos}">${meta.you ? myEmoji() : "🏇"}</span></span>
              <span class="lane-pos" aria-hidden="true">${h.pos}/${RULES.trackLength}</span>
            </li>`;
          }).join("")}
        </ol>`;
    }
    const startLanes = () => lanes(HORSES.slice(0, mode.field).map((h) => ({ id: h.id, pos: 0 })));

    // ---------- Intro ----------
    function renderIntro() {
      const st = stats();
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-exit">✕ Back to the Vault</button>
            <span class="pill-sm">⚡ ${fmt(S().sparks || 0)}</span>
          </div>
          <section class="panel derby-intro">
            <pre class="derby-banner" aria-label="SAT Vocabulary Derby">=================================
 🐎 SAT VOCABULARY DERBY 🐎
=================================</pre>
            <p class="muted center">Where precise words win photo finishes.</p>
            <ol class="rule-list">
              <li><b>Bet before every race:</b> ${RULES.wagers.join(", ")} ⚡ or a Fun run. A win pays your bet back <b>×${mode.payout}</b>; a loss forfeits it. ${RULES.ratedPerDay} betting races a day.</li>
              <li><b>One advanced SAT word per turn.</b> Right → you gallop +1. Wrong → you're held back.</li>
              <li><b>Seven rivals roll every turn</b>, whatever you answer, and each has its own style. A perfect run always wins; one slip can cost the race.</li>
              <li><b>🧠 Focus:</b> each miss costs 1. At 0 you're <b>Spooked</b> and right answers won't move you. Two right in a row restore 1 Focus, or drink a ${STABLE.elixir.name} (${fmt(STABLE.elixir.price)} ⚡). Focus carries between races.</li>
              <li><b>After the race:</b> your balance, a review table of every word, and the 🛍️ Stable.</li>
            </ol>
            <div class="intro-focus">Your Focus: ${focusBar(st.focus)}${st.focus === 0 ? ' <b class="bad-text">Spooked</b>' : ""}</div>
            <button class="btn wide start-btn" type="button" id="derby-start-race">START ▶</button>
            <button class="btn ghost wide" type="button" id="derby-stable">🛍️ Visit the Stable</button>
          </section>
          <section class="panel">
            <h2>The field</h2>
            <ul class="field-list">
              ${HORSES.map((h, i) => `<li class="${h.you ? mySilk() : `silk-${h.silk}`}"><i class="silk-dot" aria-hidden="true">${i + 1}</i><b>${esc(h.name)}</b><span class="muted small">${h.you ? "You" : esc(STYLES[h.style].label)}</span></li>`).join("")}
            </ul>
          </section>
          <section class="panel derby-stats">
            <div><b>${st.races}</b><span>Races</span></div>
            <div><b>${st.wins}</b><span>Wins</span></div>
            <div><b>${st.races ? Math.round((st.wins / st.races) * 100) : 0}%</b><span>Win rate</span></div>
            <div><b>${fmt(st.bestWin)}</b><span>Best payout ⚡</span></div>
          </section>
        </div>`;
      container.querySelector("#derby-exit").addEventListener("click", exit);
      container.querySelector("#derby-start-race").addEventListener("click", () => { ctx.sfx.play("tap"); go("setup"); });
      container.querySelector("#derby-stable").addEventListener("click", openStable);
      container.querySelector("#derby-start-race").focus({ preventScroll: true });
    }

    // ---------- Bet ----------
    function renderSetup() {
      const sparks = S().sparks || 0;
      const st = stats();
      const left = ratedLeft();
      if (!canBet(setup.wager)) setup.wager = RULES.wagers.find(canBet) || 0;
      if (!st.bursts) setup.burst = false;
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-back">← Rules</button>
            <span class="pill-sm">⚡ ${fmt(sparks)}</span>
          </div>
          <section class="panel">
            <span class="label-sm">SAT Vocabulary Derby</span>
            <h2>🏇 Place your bet</h2>
            <p class="muted">A win pays your bet back ×${mode.payout}. Bet what your accuracy can back up.</p>
            <div class="wager-chips" role="radiogroup" aria-label="Wager">
              ${[0, ...RULES.wagers].map((a) => `
                <button class="wchip" type="button" role="radio" data-wager="${a}" aria-checked="${a === setup.wager}" ${canBet(a) ? "" : "disabled"}>
                  <b>${a ? fmt(a) : "Fun"}</b>
                  <small>${a ? `+${fmt(payoutFor(a) - a)}` : "no bet"}</small>
                </button>`).join("")}
            </div>
            <p class="muted small">${left ? `${left} of ${RULES.ratedPerDay} betting races left today.` : "No betting races left today. Fun runs are unlimited!"}
              ${setup.wager ? ` Your ${fmt(setup.wager)} ⚡ goes in at the gate; a win pays back ${fmt(payoutFor(setup.wager))} ⚡.` : ""}</p>
            <div class="setup-row">
              <span>Focus ${focusBar(st.focus, false)}${st.focus === 0 ? ' <b class="bad-text">Spooked</b>' : ""}</span>
              ${st.bursts ? `<label class="toggle"><input type="checkbox" id="use-burst" ${setup.burst ? "checked" : ""}><span>Use a Starting Burst (${st.bursts} left)</span></label>` : ""}
            </div>
            ${startLanes()}
            <button class="btn wide" type="button" id="derby-go">🔔 ${setup.wager ? `Bet ${fmt(setup.wager)} ⚡ & start` : "Start the fun run"}</button>
          </section>
        </div>`;
      container.querySelector("#derby-back").addEventListener("click", () => go("intro"));
      container.querySelectorAll(".wchip:not(:disabled)").forEach((b) => b.addEventListener("click", () => {
        setup.wager = Number(b.dataset.wager);
        ctx.sfx.play("tap");
        renderSetup();
      }));
      container.querySelector("#use-burst")?.addEventListener("change", (e) => { setup.burst = e.target.checked; });
      container.querySelector("#derby-go").addEventListener("click", start);
    }

    function start() {
      const st = stats();
      const wager = canBet(setup.wager) ? setup.wager : 0;
      if (wager) {
        S().sparks -= wager; // in at the gate
        st.rated += 1;
        ctx.renderHud(["sparks"]);
      }
      const burst = setup.burst && st.bursts > 0;
      if (burst) st.bursts -= 1;
      setup.burst = false;
      touch();
      ctx.save();
      // Advanced words lead; core words fill in if a long race runs out.
      const W = SW.vocab.WORDS;
      const ids = [...shuffle(W.filter((w) => w.level === "advanced"), Math.random), ...shuffle(W.filter((w) => w.level !== "advanced"), Math.random)].map((w) => w.id);
      race = newRace(mode.id, wager, ids, { focus: st.focus, streak: st.streak, burst });
      race.log = [];
      race.call = burst ? "And they're off! 🔔 Your Starting Burst puts you a step ahead." : "And they're off! 🔔";
      nextQuestion();
      ctx.sfx.play("bell");
      go("race");
    }

    function nextQuestion() {
      if (race.turn >= race.words.length) race.words = race.words.concat(shuffle(race.words, Math.random));
      const w = SW.vocab.WORDS.find((x) => x.id === race.words[race.turn]);
      race.q = makeQuestion(w);
      race.picked = null;
    }

    // ---------- Race ----------
    function focusPanel() {
      const f = race.focus;
      const status = f === 0
        ? `<b class="bad-text">Spooked!</b> Answer ${RULES.focusRestoreStreak} in a row to recover (${race.streak}/${RULES.focusRestoreStreak}).`
        : f < RULES.focusMax ? `${RULES.focusRestoreStreak} in a row restores 1 (${race.streak}/${RULES.focusRestoreStreak}).` : "Full focus.";
      const price = STABLE.elixir.price;
      return `
        <div class="focus-row" id="focus-row">
          ${focusBar(f)}<span class="muted small">${status}</span>
          ${f < RULES.focusMax && race.winner === null ? `<button class="mini-btn" type="button" id="derby-elixir" ${(S().sparks || 0) < price ? "disabled" : ""}>🧪 ${fmt(price)} ⚡</button>` : ""}
        </div>`;
    }

    function renderRace() {
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-quit">${race.confirmQuit ? `Tap again to forfeit ${fmt(race.wager)} ⚡` : "✕ Leave race"}</button>
            <span class="muted small">${race.wager ? `Bet ${fmt(race.wager)} ⚡ · pays ${fmt(payoutFor(race.wager))}` : "Fun run"}</span>
          </div>
          <section class="panel track-panel" id="track-panel">
            <div id="derby-track">${lanes(race.horses, true)}</div>
            <div id="focus-slot">${focusPanel()}</div>
            <p class="race-call" id="race-call" aria-live="polite">${esc(race.call)}</p>
            <div id="derby-next-slot"></div>
          </section>
          <section class="card-inner bb vocab-card" id="derby-q"></section>
        </div>`;
      container.querySelector("#derby-quit").addEventListener("click", quit);
      wireFocus();
      renderQuestion();
    }

    function wireFocus() {
      container.querySelector("#derby-elixir")?.addEventListener("click", drinkElixir);
    }

    function drinkElixir() {
      const price = STABLE.elixir.price;
      if (!race || race.focus >= RULES.focusMax || (S().sparks || 0) < price) return;
      S().sparks -= price;
      race.focus = RULES.focusMax;
      race.streak = 0;
      const st = stats();
      st.focus = race.focus;
      st.streak = 0;
      touch();
      ctx.save();
      ctx.renderHud(["sparks"]);
      ctx.sfx.play("combo");
      race.call = `🧪 Focus Elixir! Galloping Lexicon is locked in again.`;
      container.querySelector("#race-call").textContent = race.call;
      container.querySelector("#focus-slot").innerHTML = focusPanel();
      wireFocus();
    }

    function renderQuestion() {
      const q = race.q;
      const el = container.querySelector("#derby-q");
      const answered = race.picked !== null;
      const w = SW.vocab.WORDS.find((x) => x.id === q.wordId);
      const passage = q.passage
        ? ctx.fill(q.passage)
          .replace("______", answered ? `<mark class="fill-in">${esc(q.choices[q.answer])}</mark>` : '<span class="blank" role="img" aria-label="blank"></span>')
          .replace(SW.UNDERLINE_RE, '<u class="target">$1</u>')
        : "";
      const kindLabel = { context: "Words in Context", definition: "Definition", synonym: "Synonym", antonym: "Antonym" }[q.kind];
      const right = race.picked === q.answer;
      el.innerHTML = `
        <div class="bb-top">
          <span class="bb-num">${race.turn + (answered ? 0 : 1)}</span>
          <span class="bb-meta">${kindLabel}</span>
        </div>
        ${passage ? `<div class="bb-passage"><p class="passage">${passage}</p></div>` : ""}
        <p class="bb-stem">${esc(q.stem)}</p>
        <ol class="choices">
          ${q.choices.map((c, i) => {
            let cls = "";
            if (answered) cls = i === q.answer ? "right" : i === race.picked ? "wrong" : "dim";
            return `<li><button class="choice ${cls}" type="button" data-ci="${i}" ${answered ? "disabled" : ""} aria-label="(${"ABCD"[i]}) ${esc(c)}">
              <span class="letter" aria-hidden="true">${"ABCD"[i]}</span><span class="txt">${esc(c)}</span>
            </button></li>`;
          }).join("")}
        </ol>
        ${answered ? `
          <div class="feedback ${right ? "ok" : "no"}">
            <h3>${right ? "Correct!" : "Not quite. You're held back."}</h3>
            <p>${ctx.fill(q.explain, undefined, false)}</p>
            ${right ? "" : `<p class="muted small">🔁 “${esc(w.word)}” is flagged for review in the Vault.</p>`}
          </div>` : ""}`;
      container.querySelector("#derby-next-slot").innerHTML = answered
        ? `<button class="btn wide" type="button" id="derby-next">${race.winner ? "See the results 🏁" : "Next question →"}</button>`
        : "";
      el.querySelectorAll(".choice:not(:disabled)").forEach((b) => {
        b.addEventListener("pointerdown", () => ctx.sfx.play("tap"));
        b.addEventListener("click", () => answer(Number(b.dataset.ci)));
      });
      container.querySelector("#derby-next")?.addEventListener("click", advance);
    }

    function callFor(events) {
      const name = (id) => HORSE[id].name;
      const parts = [];
      for (const e of events) {
        if (e.kind === "advance") parts.push("Galloping Lexicon gallops ahead!");
        if (e.kind === "slip") parts.push("A slip! You're held back and lose 1 Focus.");
        if (e.kind === "spook") parts.push("😵 Spooked! Focus is gone. Right answers won't move you until you recover.");
        if (e.kind === "spooked") parts.push("Right, but still spooked: you hold your ground.");
        if (e.kind === "focus") parts.push("🧠 Focus restored +1.");
      }
      const moved = events.filter((e) => e.kind === "gallop").map((e) => name(e.id));
      if (moved.length) parts.push(`${moved.join(", ")} ${moved.length === 1 ? "moves" : "move"} up.`);
      else if (!race.winner || race.winner !== "lexicon") parts.push("The rivals hold.");
      if (race.winner) parts.push(race.winner === "lexicon" ? "🏁 Galloping Lexicon wins!" : `🏁 ${name(race.winner)} crosses the line first!`);
      return parts.join(" ");
    }

    function answer(ci) {
      if (race.picked !== null || race.winner) return;
      const q = race.q;
      const correct = ci === q.answer;
      race.picked = ci;
      race.log.push({ wordId: q.wordId, kind: q.kind, correct });
      if (!correct) SW.vocab.flag(S().vocab, q.wordId);
      ctx.recordAnswer(correct);
      const events = step(race, correct);
      race.call = callFor(events);
      race.confirmQuit = false;
      const st = stats();
      st.focus = race.focus; // Focus carries over between races
      st.streak = race.streak;
      touch();
      ctx.sfx.play(correct ? "correct" : "wrong");
      if (correct) ctx.sfx.buzz(50);
      if (events.some((e) => e.kind === "gallop" || e.kind === "advance")) setTimeout(() => ctx.sfx.play("gallop"), 120);
      ctx.save();
      // Move horses in place so the CSS transition animates them.
      for (const h of race.horses) {
        const lane = container.querySelector(`.lane[data-horse="${h.id}"]`);
        if (!lane) continue;
        lane.querySelector(".lane-horse").style.setProperty("--p", h.pos);
        lane.querySelector(".lane-pos").textContent = `${h.pos}/${RULES.trackLength}`;
        lane.setAttribute("aria-label", `${HORSE[h.id].name}${HORSE[h.id].you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}`);
        lane.classList.toggle("moved", events.some((e) => e.id === h.id && (e.kind === "gallop" || e.kind === "advance")));
        lane.classList.toggle("spooked", Boolean(HORSE[h.id].you) && race.focus === 0);
      }
      container.querySelector("#race-call").textContent = race.call;
      container.querySelector("#focus-slot").innerHTML = focusPanel();
      wireFocus();
      container.querySelector("#derby-quit").textContent = "✕ Leave race";
      renderQuestion();
      container.querySelector("#track-panel").scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      container.querySelector("#derby-next")?.focus({ preventScroll: true });
      if (race.winner) settle();
    }

    function settle() {
      const st = stats();
      const won = race.winner === "lexicon";
      const payout = won && race.wager ? payoutFor(race.wager) : 0;
      st.races += 1;
      if (won) st.wins += 1;
      if (payout) {
        ctx.earn(payout);
        st.bestWin = Math.max(st.bestWin, payout);
      }
      race.payout = payout;
      touch();
      ctx.save();
      ctx.renderHud(payout ? ["sparks"] : []);
      setTimeout(() => {
        if (won) {
          ctx.sfx.play("complete");
          ctx.celebrate("🏆", "You won the Derby!", payout ? `+${fmt(payout)} ⚡ Sparks` : "Fun run victory");
        } else ctx.sfx.play("wrong");
      }, reducedMotion() ? 0 : 650);
    }

    function advance() {
      if (race.winner) return go("result");
      nextQuestion();
      renderQuestion();
      container.querySelectorAll(".lane.moved").forEach((l) => l.classList.remove("moved"));
      container.scrollTop = 0;
      container.querySelector("#derby-q .choice")?.focus({ preventScroll: true });
    }

    function quit() {
      if (race.wager && !race.confirmQuit) {
        race.confirmQuit = true;
        container.querySelector("#derby-quit").textContent = `Tap again to forfeit ${fmt(race.wager)} ⚡`;
        return;
      }
      if (race.wager) { stats().races += 1; touch(); ctx.save(); } // a scratched bet counts as a loss
      race = null;
      go("setup");
    }

    // ---------- Results ----------
    function renderResult() {
      const won = race.winner === "lexicon";
      const standings = race.horses.slice().sort((a, b) => (b.id === race.winner) - (a.id === race.winner) || b.pos - a.pos);
      const right = race.log.filter((r) => r.correct).length;
      const rows = race.log.map((r) => {
        const w = SW.vocab.WORDS.find((x) => x.id === r.wordId);
        return `<tr class="${r.correct ? "ok" : "no"}">
          <td><b>${esc(w.word)}</b><br><small class="muted">${esc(w.pos)}</small></td>
          <td>${esc(w.definition)}<br><small class="muted">≈ ${w.synonyms.map(esc).join(", ")}</small></td>
          <td class="res" aria-label="${r.correct ? "correct" : "missed"}">${r.correct ? "✓" : "✗"}</td>
        </tr>`;
      }).join("");
      container.innerHTML = `
        <div class="stack vault derby">
          <section class="panel sprint-summary">
            <span class="complete-star" aria-hidden="true">${won ? "🏆" : "🐎"}</span>
            <h2>${won ? "You won the Derby!" : `${esc(HORSE[race.winner].name)} wins`}</h2>
            <p class="derby-payout ${won ? "ok" : "no"}">${race.wager
              ? won ? `+${fmt(race.payout)} ⚡ · your ${fmt(race.wager)} ⚡ bet paid ×${mode.payout}` : `−${fmt(race.wager)} ⚡ · better luck next race`
              : "Fun run: no Sparks on the line"}</p>
            <p class="wallet-line">Balance: <b>⚡ ${fmt(S().sparks || 0)}</b> · Focus ${focusBar(race.focus, false)}</p>
            <ol class="standings">
              ${standings.map((h, i) => `<li class="${HORSE[h.id].you ? `${mySilk()} you` : `silk-${HORSE[h.id].silk}`}"><i class="silk-dot" aria-hidden="true">${i + 1}</i>${esc(HORSE[h.id].name)}<span class="muted small">${h.pos}/${RULES.trackLength}</span></li>`).join("")}
            </ol>
          </section>
          <section class="panel">
            <h2>Vocabulary review <small class="muted">${right} of ${race.log.length} right</small></h2>
            <div class="table-wrap">
              <table class="review-table">
                <thead><tr><th scope="col">Word</th><th scope="col">Meaning</th><th scope="col"><span class="sr-only">Result</span></th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            ${race.log.some((r) => !r.correct) ? '<p class="muted small">Missed words are flagged 🔁. They lead your next flashcard deck and sprint.</p>' : ""}
          </section>
          <div class="stack">
            <button class="btn wide" type="button" id="derby-again">🏇 Race again</button>
            <button class="btn ghost wide" type="button" id="derby-stable">🛍️ Visit the Stable</button>
            <button class="btn ghost wide" type="button" id="derby-home">Back to the Vault</button>
          </div>
        </div>`;
      race = null;
      container.querySelector("#derby-again").addEventListener("click", () => go("setup"));
      container.querySelector("#derby-stable").addEventListener("click", () => { back = "setup"; go("stable"); });
      container.querySelector("#derby-home").addEventListener("click", exit);
    }

    // ---------- Stable ----------
    function renderStable() {
      const st = stats();
      const sparks = S().sparks || 0;
      const btn = (key, price, { owned, equipped, disabled } = {}) => {
        if (equipped) return '<button class="buy" type="button" disabled>Equipped</button>';
        if (owned) return `<button class="buy owned" type="button" data-equip="${key}">Equip</button>`;
        if (disabled) return `<button class="buy" type="button" disabled>${esc(disabled)}</button>`;
        if (sparks < price) return `<button class="buy" type="button" disabled>Need ${fmt(price - sparks)} more</button>`;
        return `<button class="buy${armed === key ? " confirm" : ""}" type="button" data-buy="${key}">${armed === key ? `Confirm ${fmt(price)} ⚡` : `${fmt(price)} ⚡`}</button>`;
      };
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="stable-back">← Back</button>
            <span class="pill-sm">⚡ ${fmt(sparks)}</span>
          </div>
          <section class="panel">
            <span class="label-sm">SAT Vocabulary Derby</span>
            <h2>🛍️ The Stable</h2>
            <p class="muted">Gear for Galloping Lexicon. Prices are steep. Earn them with accuracy and smart bets.</p>
          </section>
          <section class="panel">
            <h2>Power-ups</h2>
            <div class="shop-list">
              <article class="shop-item">
                <span class="shop-icon" aria-hidden="true">🧪</span>
                <div class="shop-info"><b>${STABLE.elixir.name}</b><span>Refill Focus to ${RULES.focusMax} right now. You have ${focusBar(st.focus, false)}</span></div>
                ${btn("elixir", STABLE.elixir.price, { disabled: st.focus >= RULES.focusMax ? "Focus full" : "" })}
              </article>
              <article class="shop-item">
                <span class="shop-icon" aria-hidden="true">💨</span>
                <div class="shop-info"><b>${STABLE.burst.name}</b><span>Start a race 1 step ahead. Owned: ${st.bursts}</span></div>
                ${btn("burst", STABLE.burst.price)}
              </article>
            </div>
          </section>
          <section class="panel">
            <h2>Jockey silks</h2>
            <div class="shop-list">
              ${[{ id: null, name: "Classic Blue", price: 0 }, ...STABLE.silks].map((s) => `
                <article class="shop-item silk-${s.id || HORSE.lexicon.silk}">
                  <span class="silk-dot big" aria-hidden="true">1</span>
                  <div class="shop-info"><b>${esc(s.name)}</b><span>${s.id ? "Jockey silks" : "Default"}</span></div>
                  ${btn(`silk:${s.id || ""}`, s.price, { owned: !s.id || st.silks.includes(s.id), equipped: st.silk === s.id })}
                </article>`).join("")}
            </div>
          </section>
          <section class="panel">
            <h2>Mounts</h2>
            <div class="shop-list">
              ${[{ id: null, name: "Thoroughbred", emoji: "🏇", price: 0 }, ...STABLE.mounts].map((m) => `
                <article class="shop-item">
                  <span class="shop-icon mount" aria-hidden="true">${m.emoji}</span>
                  <div class="shop-info"><b>${esc(m.name)}</b><span>${m.id ? "Races in your lane" : "Default"}</span></div>
                  ${btn(`mount:${m.id || ""}`, m.price, { owned: !m.id || st.mounts.includes(m.id), equipped: st.mount === m.id })}
                </article>`).join("")}
            </div>
          </section>
        </div>`;
      container.querySelector("#stable-back").addEventListener("click", () => go(back));
      container.querySelectorAll("[data-buy]").forEach((b) => b.addEventListener("click", () => buy(b.dataset.buy)));
      container.querySelectorAll("[data-equip]").forEach((b) => b.addEventListener("click", () => equip(b.dataset.equip)));
    }

    function priceOf(key) {
      if (key === "elixir") return STABLE.elixir.price;
      if (key === "burst") return STABLE.burst.price;
      const [kind, id] = key.split(":");
      return (kind === "silk" ? STABLE.silks : STABLE.mounts).find((x) => x.id === id).price;
    }

    // Two taps: the first arms the button, the second buys.
    function buy(key) {
      if (armed !== key) { armed = key; ctx.sfx.play("tap"); return renderStable(); }
      const price = priceOf(key);
      const st = stats();
      if ((S().sparks || 0) < price) return;
      S().sparks -= price;
      if (key === "elixir") { st.focus = RULES.focusMax; st.streak = 0; }
      else if (key === "burst") st.bursts += 1;
      else {
        const [kind, id] = key.split(":");
        if (kind === "silk") { st.silks.push(id); st.silk = id; } else { st.mounts.push(id); st.mount = id; }
      }
      armed = null;
      touch();
      ctx.save();
      ctx.renderHud(["sparks"]);
      ctx.sfx.play("combo");
      ctx.toast(key === "elixir" ? "🧪 Focus refilled!" : key === "burst" ? "💨 Starting Burst added" : "New gear equipped!");
      renderStable();
    }

    function equip(key) {
      const [kind, id] = key.split(":");
      const st = stats();
      if (kind === "silk") st.silk = id || null;
      else st.mount = id || null;
      touch();
      ctx.save();
      ctx.sfx.play("tap");
      renderStable();
    }

    function exit() {
      screen = null;
      race = null;
      ctx.onExit();
    }

    // A–D or 1–4 answer; works while the Vocab tab is showing.
    document.addEventListener("keydown", (e) => {
      if (screen !== "race" || !race || race.picked !== null || container.hidden) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, select, textarea") || document.querySelector('[aria-modal="true"]')) return;
      const k = e.key.toLowerCase();
      const i = "abcd".includes(k) && k.length === 1 ? "abcd".indexOf(k) : "1234".indexOf(e.key);
      if (i >= 0) { e.preventDefault(); answer(i); }
    });

    return {
      open,
      openStable: () => { back = "intro"; go("stable"); },
      render,
      active: () => screen !== null,
      racing: () => screen === "race",
    };
  }

  SW.derby = { RULES, MODES, HORSES, STABLE, PACE, newRace, step, rivalChance, makeQuestion, related, emptyStats, mergeStats, mount };
})();
