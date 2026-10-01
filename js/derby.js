// SatWizz Vocab Derby: a wager-based horse race on advanced Vault words.
//
// Flow: intro (title + rules) → START → place a bet → race → results
// (review table, balance, Stable). The Stable sells jockey silks, mounts,
// Focus Elixirs and Starting Bursts for real Sparks.
//
//   • Bet real Sparks (50 / 100 / 250 / 500) or race for fun. The bet is taken
//     at the gate; a win pays it back ×1.5. No daily limit.
//   • Eight horses, 5 steps, one race clock that never pauses. Each right
//     answer moves you +1.
//   • The seven rivals are independent CPU players: on their own timers they
//     read a question, answer in their own time range and are right at their
//     own rate (Verbal Velocity 1–3s at 60%, Grammar Galloper 5–8s at 85%, …),
//     moving live whether or not you answer. They race to win: rivals falling
//     behind push the pace, leaders guard, and anyone one step out kicks for
//     home. A live commentary feed reports every CPU answer.
//   • 🧠 Focus (0–100%, js/focus.js) carries between races and is the same
//     meter as Practice. A miss costs 25% and a rushed answer (under 1.5s)
//     10%. Missing Focus locks each question for up to 9s while the rivals
//     keep running, plus 4s after a miss. Two right in a row restore 25%; a
//     Focus Elixir (500 ⚡) refills it.
//
// Exposes SatWizz.derby = { RULES, MODES, HORSES, PROFILES, CPU, PENALTY,
// TACTICS, STABLE, newRace, tick, playerAnswer, lockFor, tacticFor,
// makeQuestion, related, emptyStats, mergeStats, priceOf, buyItem, mount }.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    trackLength: 5,
    wagers: [50, 100, 250, 500],
    focusMax: 100, // Focus Meter, 0-100% (js/focus.js)
    focusRestoreStreak: 2,
  });

  const MODES = Object.freeze({
    derby: { id: "derby", name: "Grand Derby", field: 8, payout: 1.5 },
  });

  // ---------- CPU rivals ----------
  // Every rival is a CPU player on its own clock, running continuously whether
  // or not you answer. Each attempt = reading a question (CPU.read, like you)
  // + its answer time (min–max seconds), then it is right with probability
  // `acc` (+1 step). Tactics (below) adjust each attempt to try to win.
  const CPU = {
    // Seconds a CPU spends reading each question before its answer clock.
    // Tuned by simulation of the real-time race (8 horses, Focus carrying
    // over as 0-100%, lock penalties, ~2s reading feedback): 8s/question at
    // 90% wins ~94% of races, 10s at 85% ~71% (break-even at ×1.5), 12s at
    // 80% ~37%, 15s at 75% ~11%. A player who never answers loses in ~90s.
    read: [12, 16],
  };
  const PROFILES = {
    velocity: { label: "Fast & unsteady", min: 1, max: 3, acc: 0.6, rush: true },
    galloper: { label: "Slow & precise", min: 5, max: 8, acc: 0.85 },
    syntax: { label: "Quick & solid", min: 2, max: 4, acc: 0.66, rush: true },
    rex: { label: "Erratic", min: 1, max: 7, acc: 0.68 },
    diction: { label: "Balanced", min: 3, max: 5, acc: 0.7 },
    rhetoric: { label: "Reckless", min: 1, max: 2, acc: 0.54, rush: true },
    prose: { label: "Careful", min: 6, max: 9, acc: 0.95 },
  };

  // Focus penalties: seconds your next question stays locked while the CPUs
  // keep racing (see js/focus.js).
  const PENALTY = {
    lockMax: 9, // at 0% Focus, scaled by missing Focus, on every question
    stumble: 4, // extra on each wrong answer
  };
  const FOCUS = () => SW.focus;

  // Silks map to colors in css/styles.css (.silk-*).
  const HORSES = [
    { id: "lexicon", name: "Galloping Lexicon", short: "You", silk: "volt", you: true },
    { id: "velocity", name: "Verbal Velocity", short: "Velocity", silk: "flame" },
    { id: "galloper", name: "Grammar Galloper", short: "Galloper", silk: "good" },
    { id: "syntax", name: "Syntax Sprinter", short: "Syntax", silk: "bad" },
    { id: "rex", name: "Thesaurus Rex", short: "T. Rex", silk: "spark" },
    { id: "diction", name: "Diction Dash", short: "Diction", silk: "ice" },
    { id: "rhetoric", name: "Rhetoric Rocket", short: "Rocket", silk: "plum" },
    { id: "prose", name: "Prose Pony", short: "Prose", silk: "slate" },
  ];
  const HORSE = Object.fromEntries(HORSES.map((h) => [h.id, h]));

  // The Stable: cosmetics and power-ups, priced in real Sparks.
  const STABLE = Object.freeze({
    silks: [
      { id: "gold", name: "Scholar's Gold", price: 500 },
      { id: "ink", name: "Midnight Ink", price: 500 },
      { id: "crimson", name: "Crimson Cadence", price: 500 },
      { id: "emerald", name: "Emerald Essay", price: 500 },
    ],
    mounts: [
      { id: "pegasus", name: "Pegasus of Prose", emoji: "🦄", price: 500 },
      { id: "zebra", name: "Zebra of Zeugma", emoji: "🦓", price: 500 },
      { id: "dragon", name: "Dragon of Diction", emoji: "🐉", price: 500 },
      { id: "stag", name: "Stag of Syntax", emoji: "🦌", price: 500 },
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
  const between = (a, b, rand) => a + rand() * (b - a);
  const round1 = (n) => Math.round(n * 10) / 10;

  // One CPU attempt: how long it reads, how long it answers, and the result.
  // The tactic (chosen from the race state when the attempt starts) changes
  // how the rival runs it.
  function attempt(r, race, rand) {
    const p = PROFILES[r.id];
    const tactic = race ? tacticFor(r, race) : "steady";
    const t = TACTICS[tactic];
    const rd = (race && race.read) || CPU.read; // grammar races read longer passages
    const read = between(rd[0], rd[1], rand) * t.read;
    const answer = between(p.min, p.max, rand) * t.answer;
    const acc = Math.min(0.98, Math.max(0.05, p.acc + t.acc));
    return { read, answer, total: read + answer, correct: rand() < acc, tactic };
  }

  // CPUs race to win: each attempt's tactic depends on where they stand.
  const TACTICS = {
    steady: { label: "", read: 1, answer: 1, acc: 0 },
    push: { label: "pushing the pace", badge: "🔥", read: 0.8, answer: 0.7, acc: -0.08 },
    kick: { label: "kicking for home", badge: "⚡", read: 1, answer: 0.8, acc: 0 },
    guard: { label: "guarding the lead", badge: "🛡️", read: 1, answer: 1, acc: 0.06 },
  };
  function tacticFor(r, race) {
    const L = RULES.trackLength;
    const others = race.horses.filter((h) => h !== r);
    const lead = Math.max(...others.map((h) => h.pos));
    if (r.pos >= L - 1) return "kick"; // one step from the line: sprint
    if (lead - r.pos >= 2) return "push"; // falling behind: skim and rush
    if (r.pos > lead) return "guard"; // out in front: play it safe
    return "steady";
  }

  // ---------- Race (pure) ----------
  // The race runs on one continuous clock (seconds). Each CPU has `next`: the
  // race time when its current attempt lands. focus/streak come from (and go
  // back to) the saved stats.
  // `wordIds` is the question queue: vocab word ids, or any items a question
  // source understands. `read` overrides CPU.read for this race.
  function newRace(modeId, wager, wordIds, { focus = RULES.focusMax, streak = 0, burst = false, read = null } = {}, rand = Math.random) {
    const mode = MODES[modeId];
    const race = {
      mode: mode.id,
      read,
      wager,
      horses: HORSES.slice(0, mode.field).map((h) => ({ id: h.id, pos: h.you && burst ? 1 : 0 })),
      words: wordIds.slice(),
      focus,
      streak,
      clock: 0,
      turn: 0,
      winner: null,
    };
    for (const r of race.horses.slice(1)) {
      Object.assign(r, { tries: 0, hits: 0, tactic: "steady" });
      r.pending = attempt(r, race, rand);
      r.next = r.pending.total;
    }
    return race;
  }

  // Advances the race to `toClock`, resolving every CPU attempt that lands by
  // then in time order. Stops at the moment a CPU crosses the line.
  // Returns [{ id, at, read, answer, correct, pos, tactic }].
  function tick(race, toClock, rand = Math.random) {
    const L = RULES.trackLength;
    const events = [];
    if (race.winner) return events;
    const rivals = race.horses.slice(1);
    for (;;) {
      let r = null;
      for (const x of rivals) if (x.pos < L && x.next <= toClock && (!r || x.next < r.next)) r = x;
      if (!r) break;
      const a = r.pending;
      r.tries += 1;
      if (a.correct) { r.pos += 1; r.hits += 1; }
      events.push({ id: r.id, at: r.next, read: a.read, answer: a.answer, correct: a.correct, pos: r.pos, tactic: a.tactic });
      if (r.pos >= L) {
        race.winner = r.id;
        race.clock = r.next;
        return events;
      }
      const at = r.next;
      r.pending = attempt(r, race, rand);
      r.tactic = r.pending.tactic;
      r.next = at + r.pending.total;
    }
    race.clock = Math.max(race.clock, toClock);
    return events;
  }

  // Your answer, at the current race clock (call tick() up to now first).
  // `seconds` is your think time (a rushed answer under 1.5s costs Focus).
  function playerAnswer(race, correct, seconds = Infinity) {
    const L = RULES.trackLength;
    const you = race.horses[0];
    const out = { correct, at: race.clock, focusBefore: race.focus, restored: false };
    if (race.winner) return { ...out, late: true };
    race.turn += 1;
    const st = { focus: race.focus, focusStreak: race.streak };
    const res = FOCUS().apply(st, { correct, ms: seconds * 1000, rushMs: FOCUS().RULES.derbyRushMs });
    race.focus = st.focus;
    race.streak = st.focusStreak;
    out.restored = res.restored;
    out.rushed = res.rushed;
    out.delta = res.delta;
    if (correct) {
      you.pos = Math.min(L, you.pos + 1);
      if (you.pos >= L) race.winner = you.id;
    }
    out.focusAfter = race.focus;
    return out;
  }

  // Seconds before the next question's choices unlock: up to 9s for missing
  // Focus, plus a stumble after a wrong answer. The race (and the CPUs) keep
  // running meanwhile.
  function lockFor(focus, lastWrong) {
    return FOCUS().lockFor(focus, lastWrong);
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
    focus: RULES.focusMax, focusStreak: 0, fv: 2, bursts: 0,
    silks: [], mounts: [], silk: null, mount: null, at: 0,
  });

  // Counters take the max, owned items the union; the newer side (at) wins
  // spendable or equipped state (focus, bursts, silk, mount).
  function mergeStats(a, b) {
    // fv 2: Focus is 0-100% (it used to be 0-3 bars): older stats start full.
    const up = (s) => (s && !s.fv ? { ...s, focus: RULES.focusMax, focusStreak: 0, fv: 2 } : s || {});
    const x = { ...emptyStats(), ...up(a) };
    const y = { ...emptyStats(), ...up(b) };
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
      focus: Math.min(RULES.focusMax, Math.max(0, Math.round(Number(newer.focus) || 0))),
      focusStreak: Math.max(0, Number(newer.focusStreak) || 0),
      fv: 2,
      bursts: Math.max(0, Number(newer.bursts) || 0),
      silks,
      mounts,
      silk: silks.includes(newer.silk) ? newer.silk : null,
      mount: mounts.includes(newer.mount) ? newer.mount : null,
      at: Math.max(x.at || 0, y.at || 0),
    };
  }

  // ---------- Stable purchases (pure) ----------
  // key: "elixir" | "burst" | "silk:<id>" | "mount:<id>". Spends state.sparks,
  // updates the Derby stats (owned + equipped gear) or refills Focus
  // (focusState: whatever holds { focus, focusStreak }).
  function priceOf(key) {
    if (key === "elixir") return STABLE.elixir.price;
    if (key === "burst") return STABLE.burst.price;
    const [kind, id] = key.split(":");
    const item = (kind === "silk" ? STABLE.silks : kind === "mount" ? STABLE.mounts : []).find((x) => x.id === id);
    return item ? item.price : null;
  }
  function buyItem(st, state, key, focusState = st) {
    const price = priceOf(key);
    if (price == null) return { ok: false, reason: "unknown" };
    const [kind, id] = key.split(":");
    if ((kind === "silk" && st.silks.includes(id)) || (kind === "mount" && st.mounts.includes(id))) return { ok: false, reason: "owned" };
    if (key === "elixir" && focusState.focus >= RULES.focusMax) return { ok: false, reason: "full" };
    if ((state.sparks || 0) < price) return { ok: false, reason: "short", need: price - (state.sparks || 0) };
    state.sparks -= price;
    if (key === "elixir") FOCUS().refill(focusState);
    else if (key === "burst") st.bursts += 1;
    else if (kind === "silk") { st.silks.push(id); st.silk = id; } else { st.mounts.push(id); st.mount = id; }
    st.at = Date.now();
    return { ok: true, spent: price };
  }

  // ---------- Question sources ----------
  // The race asks whatever a source serves. A source is:
  //   { title, banner, tagline, intro (rule text), read ([min, max] CPU reading
  //     seconds), draw() → queue items, question(item) → a question,
  //     onAnswer(q, correct), missNote(q), lateNote(q),
  //     review: { title, head: [a, b], row(q) → [aHtml, bHtml], note },
  //     unitHtml?() / wireUnit?(el, rerender): an optional unit picker }
  // A question: { meta, passage (template with ______ or ""), stem,
  //   choices (templates), answer, explain (template) }.
  // The default is the Vault's advanced vocabulary (the standalone Derby).
  const KIND_LABEL = { context: "Words in Context", definition: "Definition", synonym: "Synonym", antonym: "Antonym" };
  function vocabSource(ctx) {
    const W = () => SW.vocab.WORDS;
    const word = (q) => W().find((x) => x.id === q.wordId);
    return {
      title: "SAT Vocabulary Derby",
      banner: "=== 🐎 SATWIZZ VOCAB DERBY 🐎 ===",
      tagline: "Where precise words win photo finishes.",
      intro: "Answer advanced SAT words as fast and as accurately as you can.",
      read: null,
      // Advanced words lead; core words fill in if a long race runs out.
      draw: () => [...shuffle(W().filter((w) => w.level === "advanced"), Math.random), ...shuffle(W().filter((w) => w.level !== "advanced"), Math.random)].map((w) => w.id),
      question: (id) => {
        const q = makeQuestion(W().find((x) => x.id === id));
        return { ...q, meta: KIND_LABEL[q.kind] };
      },
      onAnswer: (q, correct) => { if (!correct && !ctx.standalone) SW.vocab.flag(ctx.getState().vocab, q.wordId); },
      missNote: (q) => (ctx.standalone ? "" : `🔁 “${ctx.esc(word(q).word)}” is flagged for review in the Vocab Vault.`),
      lateNote: (q) => `“${ctx.esc(word(q).word)}”: ${ctx.esc(word(q).definition)}.`,
      review: {
        title: "Vocabulary review",
        head: ["Word", "Meaning"],
        row: (q) => {
          const w = word(q);
          return [`<b>${ctx.esc(w.word)}</b><br><small class="muted">${ctx.esc(w.pos)}</small>`, `${ctx.esc(w.definition)}<br><small class="muted">≈ ${w.synonyms.map(ctx.esc).join(", ")}</small>`];
        },
        note: ctx.standalone ? "" : "Missed words are flagged 🔁. They lead your next flashcard deck and sprint.",
      },
    };
  }

  // ---------- View ----------
  // ctx: vocab's ctx plus { container, onExit, focusState?, tab?, standalone?, shake? }.
  function mount(ctx) {
    const { container, esc } = ctx;
    let screen = null; // null | "intro" | "setup" | "race" | "result" | "stable"
    let back = "intro"; // where the Stable's back button goes
    let setup = { wager: RULES.wagers[0], burst: false };
    let race = null; // newRace() + { q, picked, call, log: [], confirmQuit, payout }
    let armed = null; // Stable item waiting for a confirm tap
    const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const mode = MODES.derby;
    // Standalone build (derby/index.html): no Vault around it, so Vault links
    // and notes are hidden, and a once-a-day stipend keeps a broke player in
    // the game (Sparks only come from betting there).
    const solo = Boolean(ctx.standalone);
    // Own tab in the app (no "Back to the Vault"; leaving goes to the intro).
    const tab = Boolean(ctx.tab);
    const src = ctx.source || vocabSource(ctx);
    const STIPEND = 250;

    const S = () => ctx.getState();
    const stats = () => {
      const p = S().vocab;
      // Normalize in place so references held across calls stay live.
      p.derby = Object.assign(p.derby || {}, mergeStats(p.derby, null));
      if (p.derby.day !== ctx.todayKey()) { p.derby.day = ctx.todayKey(); p.derby.rated = 0; }
      return p.derby;
    };
    const touch = () => { stats().at = Date.now(); };
    // Bet any amount you can afford, as often as you like (no daily cap).
    const canBet = (amount) => amount === 0 || (S().sparks || 0) >= amount;
    const fmt = (n) => Number(n).toLocaleString();
    const payoutFor = (wager) => Math.round(wager * mode.payout);
    const myEmoji = () => (STABLE.mounts.find((m) => m.id === stats().mount) || { emoji: "🏇" }).emoji;
    const mySilk = () => (stats().silk ? `silk-${stats().silk}` : `silk-${HORSE.lexicon.silk}`);
    // Focus lives in the app state (ctx.focusState(), shared with Practice), or
    // in the Derby stats in the standalone build.
    const fst = () => (ctx.focusState ? ctx.focusState() : stats());
    const focusNote = (f) => (f < RULES.focusMax ? ` <b class="bad-text">${lockFor(f, false)}s lock per question</b>` : "");
    const focusBar = (f, label = true) => FOCUS().meterHtml(f, label);

    function go(next) {
      screen = next;
      armed = null;
      render();
      container.scrollTop = 0;
    }
    const open = () => { ctx.sfx.play("tap"); go("intro"); };
    const openStable = () => { back = screen && screen !== "stable" ? screen : "intro"; if (back === "race") back = "intro"; go("stable"); };

    function render() {
      // Standalone: Focus recharges to 100% every hour (the app does this itself).
      if (solo && screen !== "race" && FOCUS().hourly(fst())) { touch(); ctx.save(); }
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
              <span class="lane-track" aria-hidden="true"><span class="lane-horse" style="--p:${h.pos}">${meta.you ? myEmoji() : "🏇"}</span>${meta.you ? "" : '<span class="tactic"></span>'}</span>
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
            ${solo || tab ? '<span class="label-sm">Welcome to the track</span>' : '<button class="linkbtn" type="button" id="derby-exit">✕ Back to the Vocab Vault</button>'}
            <span class="pill-sm">⚡ ${fmt(S().sparks || 0)}</span>
          </div>
          ${solo && stipendOpen() ? `
          <section class="panel stipend">
            <p><b>Running low?</b> The Stable lends a hand once a day.</p>
            <button class="btn wide" type="button" id="derby-stipend">Claim a ${STIPEND} ⚡ stable stipend</button>
          </section>` : ""}
          <section class="panel derby-intro">
            <pre class="derby-banner" aria-label="${esc(src.title)}">${esc(src.banner)}</pre>
            <p class="muted center">${esc(src.tagline)}</p>
            ${src.unitHtml ? `<div class="derby-unit">${src.unitHtml()}</div>` : ""}
            <ol class="rule-list">
              <li><b>Bet before every race:</b> ${RULES.wagers.join(", ")} ⚡ or a Fun run. A win pays your bet back <b>×${mode.payout}</b>; a loss forfeits it. Bet on as many races as you like.</li>
              <li><b>The race never pauses ⏱.</b> ${esc(src.intro)} Right → you gallop +1. Wrong → you're held back.</li>
              <li><b>Seven CPU rivals race on their own.</b> Each reads a question (${(src.read || CPU.read)[0]}–${(src.read || CPU.read)[1]}s), answers at its own speed and accuracy, and moves live whether or not you answer. They race to win: trailing rivals push the pace 🔥, leaders guard 🛡️, and anyone one step out kicks for home ⚡.</li>
              <li><b>🧠 Focus (0–100%):</b> a miss costs ${FOCUS().RULES.miss}% and locks your next question for ${PENALTY.stumble}s; rushing (under ${FOCUS().RULES.derbyRushMs / 1000}s) costs ${FOCUS().RULES.rush}%. Missing Focus locks every question for up to ${PENALTY.lockMax}s while the rivals keep running (question text always stays sharp). Only 2 right in a row (+${FOCUS().RULES.restore}%) or a ${STABLE.elixir.name} (${fmt(STABLE.elixir.price)} ⚡) restore it, and it recharges to 100% every hour on its own. Focus carries between races${solo ? "" : " and is the same meter as Practice"}.</li>
              <li><b>After the race:</b> your balance, a review of every question, and the 🛍️ Stable.</li>
            </ol>
            <div class="intro-focus">Your Focus: ${focusBar(fst().focus)}${focusNote(fst().focus)}</div>
            <button class="btn wide start-btn" type="button" id="derby-start-race">Start Derby ▶</button>
            <button class="btn ghost wide" type="button" id="derby-stable">🛍️ Visit the Stable</button>
          </section>
          <section class="panel">
            <h2>The field</h2>
            <ul class="field-list">
              ${HORSES.map((h, i) => `<li class="${h.you ? mySilk() : `silk-${h.silk}`}"><i class="silk-dot" aria-hidden="true">${i + 1}</i><b>${esc(h.name)}</b><span class="muted small">${h.you ? "You" : `${esc(PROFILES[h.id].label)} · ${PROFILES[h.id].min}–${PROFILES[h.id].max}s · ${Math.round(PROFILES[h.id].acc * 100)}%`}</span></li>`).join("")}
            </ul>
          </section>
          <section class="panel derby-stats">
            <div><b>${st.races}</b><span>Races</span></div>
            <div><b>${st.wins}</b><span>Wins</span></div>
            <div><b>${st.races ? Math.round((st.wins / st.races) * 100) : 0}%</b><span>Win rate</span></div>
            <div><b>${fmt(st.bestWin)}</b><span>Best payout ⚡</span></div>
          </section>
        </div>`;
      container.querySelector("#derby-exit")?.addEventListener("click", exit);
      if (src.wireUnit) src.wireUnit(container, () => renderIntro());
      container.querySelector("#derby-stipend")?.addEventListener("click", claimStipend);
      container.querySelector("#derby-start-race").addEventListener("click", () => { ctx.sfx.play("tap"); go("setup"); });
      container.querySelector("#derby-stable").addEventListener("click", openStable);
      container.querySelector("#derby-start-race").focus({ preventScroll: true });
    }

    // Standalone only: below the smallest bet, once per day.
    function stipendOpen() {
      return (S().sparks || 0) < RULES.wagers[0] && S().stipendDay !== ctx.todayKey();
    }
    function claimStipend() {
      if (!stipendOpen()) return;
      S().stipendDay = ctx.todayKey();
      ctx.earn(STIPEND);
      ctx.save();
      ctx.renderHud(["sparks"]);
      ctx.sfx.play("combo");
      ctx.toast(`+${STIPEND} ⚡ from the Stable. Spend it wisely!`);
      renderIntro();
    }

    // ---------- Bet ----------
    function renderSetup() {
      const sparks = S().sparks || 0;
      const st = stats();
      if (!canBet(setup.wager)) setup.wager = RULES.wagers.find(canBet) || 0;
      if (!st.bursts) setup.burst = false;
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-back">← Rules</button>
            <span class="pill-sm">⚡ ${fmt(sparks)}</span>
          </div>
          <section class="panel">
            <span class="label-sm">${esc(src.title)}</span>
            <h2>🏇 Place your bet</h2>
            ${src.unitHtml ? `<div class="derby-unit">${src.unitHtml()}</div>` : ""}
            <p class="muted">A win pays your bet back ×${mode.payout}. Bet what your accuracy can back up.</p>
            <div class="wager-chips" role="radiogroup" aria-label="Wager">
              ${[0, ...RULES.wagers].map((a) => `
                <button class="wchip" type="button" role="radio" data-wager="${a}" aria-checked="${a === setup.wager}" ${canBet(a) ? "" : "disabled"}>
                  <b>${a ? fmt(a) : "Fun"}</b>
                  <small>${a ? `+${fmt(payoutFor(a) - a)}` : "no bet"}</small>
                </button>`).join("")}
            </div>
            <p class="muted small">${setup.wager ? "" : "Fun runs don't touch your Sparks."}
              ${setup.wager ? ` Your ${fmt(setup.wager)} ⚡ goes in at the gate; a win pays back ${fmt(payoutFor(setup.wager))} ⚡.` : ""}</p>
            <div class="setup-row">
              <span>Focus ${focusBar(fst().focus, false)}${focusNote(fst().focus)}</span>
              ${st.bursts ? `<label class="toggle"><input type="checkbox" id="use-burst" ${setup.burst ? "checked" : ""}><span>Use a Starting Burst (${st.bursts} left)</span></label>` : ""}
            </div>
            ${startLanes()}
            <button class="btn wide" type="button" id="derby-go">🔔 ${setup.wager ? `Bet ${fmt(setup.wager)} ⚡ & start` : "Start the fun run"}</button>
          </section>
        </div>`;
      container.querySelector("#derby-back").addEventListener("click", () => go("intro"));
      if (src.wireUnit) src.wireUnit(container, () => renderSetup());
      container.querySelectorAll(".wchip:not(:disabled)").forEach((b) => b.addEventListener("click", () => {
        setup.wager = Number(b.dataset.wager);
        ctx.sfx.play("tap");
        renderSetup();
      }));
      container.querySelector("#use-burst")?.addEventListener("change", (e) => { setup.burst = e.target.checked; });
      container.querySelector("#derby-go").addEventListener("click", start);
    }

    // ---------- Real-time race loop ----------
    // The race clock never pauses: not while you read feedback, not when the
    // tab is hidden. Each tick advances the CPUs (catching up after a throttled
    // or hidden tab), counts down any Focus lock, and runs your think timer.
    let loopId = null;
    let lastTick = 0;
    let lastGallop = 0;
    function startClock() {
      stopClock();
      lastTick = performance.now();
      loopId = setInterval(loop, 100);
    }
    function stopClock() {
      clearInterval(loopId);
      loopId = null;
    }
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
      const events = tick(race, race.clock + dt);
      if (events.length) onCpuEvents(events);
      if (race.winner) return cpuWon();
      if (screen !== "race" || container.hidden) return;
      const timer = container.querySelector("#derby-timer");
      if (timer) timer.textContent = `⏱ ${race.qClock.toFixed(1)}s`;
      const clock = container.querySelector("#race-clock");
      if (clock) clock.textContent = mmss(race.clock);
      if (race.picked === null) {
        const lock = container.querySelector("#derby-lock-left");
        if (lock) lock.textContent = race.lockLeft.toFixed(1);
        if (race.lockShown && race.lockLeft <= 0) renderQuestion(); // unlock the choices
      }
    }

    const FEED_SHOWN = 6; // newest commentary lines on screen
    const mmss = (t) => `${Math.floor(t / 60)}:${String(Math.floor(t % 60)).padStart(2, "0")}`;
    const secs = (n) => `${Math.max(1, Math.round(n))}s`;

    function feed(html) {
      race.feed.unshift(html);
      race.feed.length = Math.min(race.feed.length, 12);
      const el = container.querySelector("#race-log");
      if (el) el.innerHTML = race.feed.slice(0, FEED_SHOWN).join("");
    }

    function paintLanes(changed) {
      for (const h of race.horses) {
        const lane = container.querySelector(`.lane[data-horse="${h.id}"]`);
        if (!lane) continue;
        lane.querySelector(".lane-horse").style.setProperty("--p", h.pos);
        lane.querySelector(".lane-pos").textContent = `${h.pos}/${RULES.trackLength}`;
        lane.setAttribute("aria-label", `${HORSE[h.id].name}${HORSE[h.id].you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}`);
        lane.classList.toggle("spooked", Boolean(HORSE[h.id].you) && race.focus < FOCUS().RULES.critical);
        const badge = lane.querySelector(".tactic");
        if (badge) badge.textContent = h.tactic && TACTICS[h.tactic].badge ? TACTICS[h.tactic].badge : "";
        if (changed.has(h.id)) {
          lane.classList.remove("moved");
          void lane.offsetWidth; // restart the hop animation
          lane.classList.add("moved");
        }
      }
    }

    // Who leads outright (ties keep the previous leader).
    function leaderOf() {
      const top = Math.max(...race.horses.map((h) => h.pos));
      const at = race.horses.filter((h) => h.pos === top);
      return at.length === 1 && top > 0 ? at[0].id : race.leader;
    }

    function announce(text) {
      race.call = text;
      const el = container.querySelector("#race-call");
      if (el) el.textContent = text;
    }

    function onCpuEvents(events) {
      const moved = new Set();
      for (const e of events) {
        const p = PROFILES[e.id];
        const n = HORSES.findIndex((h) => h.id === e.id) + 1;
        const tactic = TACTICS[e.tactic].label ? `, ${TACTICS[e.tactic].label},` : "";
        feed(`<li class="silk-${HORSE[e.id].silk} ${e.correct ? "ok" : "no"}"><i class="silk-dot" aria-hidden="true">${n}</i><span><time>${mmss(e.at)}</time> ${esc(HORSE[e.id].name)}${tactic} ${p.rush ? `rushed an answer in ${secs(e.answer)}` : `spent ${secs(e.answer)}`} and ${e.correct ? "got it right ✓" : "missed ✗"}</span></li>`);
        if (e.correct) moved.add(e.id);
      }
      if (screen === "race" && !container.hidden) paintLanes(moved);
      if (moved.size && performance.now() - lastGallop > 1500) {
        lastGallop = performance.now();
        if (!container.hidden) ctx.sfx.play("gallop");
      }
      // Announce lead changes and rivals closing on the line.
      const lead = leaderOf();
      if (lead && lead !== race.leader && lead !== "lexicon") announce(`${HORSE[lead].name} takes the lead!`);
      race.leader = lead;
      for (const id of moved) {
        const h = race.horses.find((x) => x.id === id);
        if (h.pos === RULES.trackLength - 1) announce(`⚠️ ${HORSE[id].name} is one step from the line!`);
      }
    }

    // A rival crossed the line, maybe while you were still thinking.
    function cpuWon() {
      if (race.picked === null && race.q) race.log.push({ q: race.q, correct: false, unanswered: true });
      announce(`🏁 ${HORSE[race.winner].name} crossed the line${race.picked === null ? " while you were thinking" : ""}!`);
      settle();
      if (screen !== "race") return;
      renderQuestion();
      container.querySelector("#focus-slot").innerHTML = focusPanel();
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
      race = newRace(mode.id, wager, src.draw(), { focus: FOCUS().clamp(fst().focus), streak: fst().focusStreak || 0, burst, read: src.read });
      Object.assign(race, { log: [], times: [], feed: [], leader: burst ? "lexicon" : null, lastWrong: false, lockLeft: 0, lockShown: false });
      race.call = burst ? "And they're off! 🔔 Your Starting Burst puts you a step ahead." : "And they're off! 🔔 The rivals are already reading.";
      nextQuestion();
      ctx.sfx.play("bell");
      go("race");
      startClock();
    }

    function nextQuestion() {
      if (race.turn >= race.words.length) race.words = race.words.concat(src.more ? src.more() : shuffle(race.words, Math.random));
      race.q = src.question(race.words[race.turn]);
      race.picked = null;
      race.qClock = 0;
      race.lockLeft = lockFor(race.focus, race.lastWrong);
    }

    // ---------- Race ----------
    function focusPanel() {
      const f = race.focus;
      const status = f < RULES.focusMax
        ? `<b class="bad-text">${lockFor(f, false)}s</b> lock before each question. ${RULES.focusRestoreStreak} right in a row: +${FOCUS().RULES.restore}% (${race.streak}/${RULES.focusRestoreStreak}).`
        : "Full focus: no lock.";
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
            <span class="muted small"><span class="race-clock" id="race-clock" aria-label="Race time">${mmss(race.clock)}</span> · ${race.wager ? `Bet ${fmt(race.wager)} ⚡ · pays ${fmt(payoutFor(race.wager))}` : "Fun run"}</span>
          </div>
          <section class="panel track-panel" id="track-panel">
            <div id="derby-track">${lanes(race.horses, true)}</div>
            <div id="focus-slot">${focusPanel()}</div>
            <p class="race-call" id="race-call" aria-live="polite">${esc(race.call)}</p>
            <div id="derby-next-slot"></div>
          </section>
          <section class="card-inner bb vocab-card" id="derby-q"></section>
          <section class="panel race-feed">
            <span class="label-sm">Live commentary</span>
            <ul class="race-log" id="race-log" aria-label="Race commentary">${race.feed.slice(0, FEED_SHOWN).join("")}</ul>
          </section>
        </div>`;
      container.querySelector("#derby-quit").addEventListener("click", quit);
      paintLanes(new Set());
      wireFocus();
      renderQuestion();
    }

    function wireFocus() {
      container.querySelector("#derby-elixir")?.addEventListener("click", drinkElixir);
    }

    function drinkElixir() {
      const price = STABLE.elixir.price;
      if (!race || race.winner || race.focus >= RULES.focusMax || (S().sparks || 0) < price) return;
      S().sparks -= price;
      race.focus = RULES.focusMax;
      race.streak = 0;
      race.lockLeft = 0; // locked in again: no hesitation
      FOCUS().refill(fst());
      touch();
      ctx.save();
      ctx.renderHud(["sparks"]);
      ctx.sfx.play("combo");
      announce(`🧪 ${STABLE.elixir.name}! Galloping Lexicon is locked in again.`);
      container.querySelector("#focus-slot").innerHTML = focusPanel();
      wireFocus();
      paintLanes(new Set());
      if (race.picked === null) renderQuestion();
    }

    function renderQuestion() {
      const q = race.q;
      const el = container.querySelector("#derby-q");
      if (!el) return;
      const answered = race.picked !== null;
      const over = Boolean(race.winner);
      const locked = !answered && !over && race.lockLeft > 0;
      race.lockShown = locked;
      const passage = q.passage
        ? ctx.fill(q.passage, q.cast)
          .replace("______", answered ? `<mark class="fill-in">${ctx.fill(q.choices[q.answer], q.cast, false)}</mark>` : '<span class="blank" role="img" aria-label="blank"></span>')
          .replace(SW.UNDERLINE_RE, '<u class="target">$1</u>')
        : "";
      const kindLabel = esc(q.meta || "");
      const right = race.picked === q.answer;
      el.classList.toggle("answered", answered || over); // the low-Focus outline only marks open questions
      el.dataset.qid = q.id || q.wordId || "";
      el.innerHTML = `
        <div class="bb-top">
          <span class="bb-num">${race.turn + (answered ? 0 : 1)}</span>
          <span class="bb-meta">${kindLabel}</span>
          <span class="q-timer" id="derby-timer" aria-hidden="true">⏱ ${race.qClock.toFixed(1)}s</span>
        </div>
        ${passage ? `<div class="bb-passage"><p class="passage">${passage}</p></div>` : ""}
        <p class="bb-stem">${esc(q.stem)}</p>
        ${locked ? `<p class="lock-overlay" role="status">🧠 Rattled… choices unlock in <b id="derby-lock-left">${race.lockLeft.toFixed(1)}</b>s. The rivals keep running.</p>` : ""}
        <ol class="choices${locked ? " locked" : ""}">
          ${q.choices.map((c, i) => {
            let cls = "";
            if (answered) cls = i === q.answer ? "right" : i === race.picked ? "wrong" : "dim";
            const txt = ctx.fill(c, q.cast, false);
            return `<li><button class="choice ${cls}" type="button" data-ci="${i}" ${answered || over || locked ? "disabled" : ""} aria-label="(${"ABCD"[i]}) ${txt.replace(/<[^>]+>/g, "")}">
              <span class="letter" aria-hidden="true">${"ABCD"[i]}</span><span class="txt">${txt}</span>
            </button></li>`;
          }).join("")}
        </ol>
        ${answered ? `
          <div class="feedback ${right ? "ok" : "no"}">
            <h3>${right ? "Correct!" : `Not quite. You're held back, and your next question locks for ${PENALTY.stumble}s+.`}</h3>
            ${q.rule ? `<p class="rule-line"><b>Rule:</b> ${ctx.fill(q.rule, q.cast, false)}</p>` : ""}
            ${!right && q.notes ? `<p><b>Your pick:</b> ${ctx.fill(q.notes[race.picked], q.cast, false)}</p>` : ""}
            <p>${ctx.fill(q.explain, q.cast, false)}</p>
            ${right || !src.missNote(q) ? "" : `<p class="muted small">${src.missNote(q)}</p>`}
          </div>` : over ? `<div class="feedback no"><h3>Too late!</h3><p>${esc(HORSE[race.winner].name)} finished before you answered. ${src.lateNote(q)}</p></div>` : ""}`;
      container.querySelector("#derby-next-slot").innerHTML = over
        ? '<button class="btn wide" type="button" id="derby-next">See the results 🏁</button>'
        : answered
          ? '<button class="btn wide" type="button" id="derby-next">Next question →</button><p class="muted small center">Rivals don\'t wait. Tap Next when ready.</p>'
          : "";
      el.querySelectorAll(".choice:not(:disabled)").forEach((b) => {
        b.addEventListener("pointerdown", () => ctx.sfx.play("tap"));
        b.addEventListener("click", () => answer(Number(b.dataset.ci)));
      });
      container.querySelector("#derby-next")?.addEventListener("click", advance);
    }

    function answer(ci) {
      if (!race || race.picked !== null || race.winner || race.lockLeft > 0) return;
      loop(); // bring the race up to this exact moment first
      if (race.winner) return;
      const q = race.q;
      const correct = ci === q.answer;
      const seconds = race.qClock;
      const res = playerAnswer(race, correct, seconds);
      race.picked = ci;
      race.lastWrong = !correct;
      race.log.push({ q, correct });
      race.times.push(seconds);
      src.onAnswer(q, correct);
      ctx.recordAnswer(correct);
      race.confirmQuit = false;
      fst().focus = race.focus; // Focus carries over between races (and into Practice)
      fst().focusStreak = race.streak;
      touch();
      if (!correct && race.focus < FOCUS().RULES.critical) ctx.shake?.();
      ctx.renderHud([]);
      ctx.sfx.play(correct ? "correct" : "wrong");
      if (correct) ctx.sfx.buzz(50);
      ctx.save();
      feed(`<li class="${mySilk()} ${correct ? "ok" : "no"} mine"><i class="silk-dot" aria-hidden="true">1</i><span><time>${mmss(race.clock)}</time> <b>You</b> answered in ${seconds.toFixed(1)}s and ${correct ? "got it right ✓" : "missed ✗"}${res.delta ? ` · 🧠 ${res.delta > 0 ? "+" : "−"}${Math.abs(res.delta)}% Focus${res.rushed ? " (rushed)" : ""}` : ""}</span></li>`);
      paintLanes(new Set(correct ? ["lexicon"] : []));
      if (correct) setTimeout(() => ctx.sfx.play("gallop"), 120);
      race.leader = leaderOf();
      announce(race.winner === "lexicon" ? "🏁 Galloping Lexicon wins!" : `You ${correct ? "got it right" : "missed"} in ${seconds.toFixed(1)}s.`);
      container.querySelector("#focus-slot").innerHTML = focusPanel();
      wireFocus();
      container.querySelector("#derby-quit").textContent = "✕ Leave race";
      if (race.winner) settle();
      renderQuestion();
      container.querySelector("#track-panel").scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      container.querySelector("#derby-next")?.focus({ preventScroll: true });
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
      stopClock();
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
      stopClock();
      race = null;
      go("setup");
    }

    // ---------- Results ----------
    function renderResult() {
      const won = race.winner === "lexicon";
      const standings = race.horses.slice().sort((a, b) => (b.id === race.winner) - (a.id === race.winner) || b.pos - a.pos);
      const right = race.log.filter((r) => r.correct).length;
      const answered = race.log.filter((r) => !r.unanswered).length;
      const rows = race.log.map((r) => {
        const [a, b] = src.review.row(r.q);
        const res = r.unanswered ? ["skip", "not answered", "—"] : r.correct ? ["ok", "correct", "✓"] : ["no", "missed", "✗"];
        return `<tr class="${res[0]}">
          <td>${a}</td>
          <td>${b}</td>
          <td class="res" aria-label="${res[1]}">${res[2]}</td>
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
            <p class="muted small">Your average think time: ${race.times.length ? (race.times.reduce((a, b) => a + b, 0) / race.times.length).toFixed(1) : "—"}s · race time ${mmss(race.clock)}</p>
            <ol class="standings">
              ${standings.map((h, i) => `<li class="${HORSE[h.id].you ? `${mySilk()} you` : `silk-${HORSE[h.id].silk}`}"><i class="silk-dot" aria-hidden="true">${i + 1}</i>${esc(HORSE[h.id].name)}<span class="muted small">${h.pos}/${RULES.trackLength}</span></li>`).join("")}
            </ol>
          </section>
          <section class="panel">
            <h2>${esc(src.review.title)} <small class="muted">${right} of ${answered} right</small></h2>
            <div class="table-wrap">
              <table class="review-table">
                <thead><tr><th scope="col">${esc(src.review.head[0])}</th><th scope="col">${esc(src.review.head[1])}</th><th scope="col"><span class="sr-only">Result</span></th></tr></thead>
                <tbody>${rows}</tbody>
              </table>
            </div>
            ${src.review.note && race.log.some((r) => !r.correct && !r.unanswered) ? `<p class="muted small">${esc(src.review.note)}</p>` : ""}
          </section>
          <div class="stack">
            <button class="btn wide" type="button" id="derby-again">🏇 Race again</button>
            <button class="btn ghost wide" type="button" id="derby-stable">🛍️ Visit the Stable</button>
            <button class="btn ghost wide" type="button" id="derby-home">${solo || tab ? "📜 Rules & stats" : "Back to the Vocab Vault"}</button>
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
                <div class="shop-info"><b>${STABLE.elixir.name}</b><span>Refill Focus to 100% right now. You have ${focusBar(fst().focus, false)}</span></div>
                ${btn("elixir", STABLE.elixir.price, { disabled: fst().focus >= RULES.focusMax ? "Focus full" : "" })}
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

    // Two taps: the first arms the button, the second buys.
    function buy(key) {
      if (armed !== key) { armed = key; ctx.sfx.play("tap"); return renderStable(); }
      if (!buyItem(stats(), S(), key, fst()).ok) return;
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
      stopClock();
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
      sync: () => loop(), // repaint the live race at once (e.g. when its tab is shown again)
    };
  }

  SW.derby = { RULES, MODES, HORSES, PROFILES, CPU, PENALTY, TACTICS, STABLE, newRace, tick, playerAnswer, lockFor, tacticFor, makeQuestion, related, emptyStats, mergeStats, priceOf, buyItem, mount };
})();
