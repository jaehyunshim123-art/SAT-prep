// SatWizz Vocab Derby: a wager-based horse race powered by Vocab Vault words.
//
//   • Bet real Sparks (10 / 25 / 50) or race for fun. The bet is taken at the
//     gate; a win pays it back doubled. Up to 3 betting races a day; fun runs
//     are unlimited.
//   • Six horses. Each turn is one SAT vocab question: Words in Context,
//     definition, synonym or antonym. Right → your horse gallops +1. Wrong →
//     you stay put and a random rival surges +1 (and the word is flagged 🔁
//     for review). Rivals also gallop on their own, so misses are costly.
//   • First horse to step 5 wins. You move first, so a perfect race always wins.
//
// Exposes SatWizz.derby = { RULES, MODES, HORSES, newRace, step, makeQuestion,
// related, emptyStats, mergeStats, mount }.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    trackLength: 5,
    wagers: [10, 25, 50],
    ratedPerDay: 3,
  });

  // pace: each rival's chance to gallop +1 on its own every turn. Tuned by
  // simulation: about 81% wins at 80% accuracy, 55% at 65%, 27% at 50%.
  const MODES = Object.freeze({
    derby: {
      id: "derby", name: "Grand Derby", icon: "🏆", field: 6, payout: 2, pace: 0.35,
      blurb: "Rivals gallop every turn, and every miss gives one a surge.",
    },
  });

  // Silks map to theme colors in css/styles.css (.silk-*).
  const HORSES = [
    { id: "lexicon", name: "Galloping Lexicon", short: "Lexicon", silk: "volt", you: true },
    { id: "velocity", name: "Verbal Velocity", short: "Velocity", silk: "flame" },
    { id: "galloper", name: "Grammar Galloper", short: "Galloper", silk: "good" },
    { id: "syntax", name: "Syntax Sprinter", short: "Syntax", silk: "bad" },
    { id: "rex", name: "Thesaurus Rex", short: "T. Rex", silk: "spark" },
    { id: "diction", name: "Diction Dash", short: "Diction", silk: "ice" },
  ];
  const HORSE = Object.fromEntries(HORSES.map((h) => [h.id, h]));

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
  function newRace(modeId, wager, wordIds, rand = Math.random) {
    const mode = MODES[modeId];
    return {
      mode: mode.id,
      wager,
      horses: HORSES.slice(0, mode.field).map((h) => ({ id: h.id, pos: 0 })),
      words: shuffle(wordIds, rand),
      turn: 0,
      winner: null,
    };
  }

  // Resolves one answer. Mutates the race; returns what happened, in order.
  function step(race, correct, rand = Math.random) {
    const L = RULES.trackLength;
    const mode = MODES[race.mode];
    const [you, ...rivals] = race.horses;
    const events = [];
    const move = (h, kind) => {
      h.pos = Math.min(L, h.pos + 1);
      events.push({ id: h.id, kind });
    };
    race.turn += 1;
    if (correct) {
      move(you, "advance");
      if (you.pos >= L) { race.winner = you.id; return events; }
    } else {
      move(pick(rivals, rand), "surge");
    }
    if (mode.pace) for (const r of rivals) if (r.pos < L && rand() < mode.pace) move(r, "gallop");
    const finished = rivals.filter((r) => r.pos >= L);
    if (finished.length) race.winner = pick(finished, rand).id; // photo finish
    return events;
  }

  // ---------- Questions (pure) ----------
  // Words whose meanings overlap. Never used as each other's distractors, so
  // every question has exactly one defensible answer.
  const CLUSTERS = [
    ["mitigate", "ameliorate", "diminish", "undermine"],
    ["corroborate", "substantiate"],
    ["novel", "innovative", "conventional", "obsolete"],
    ["tentative", "skeptical", "ambiguous"],
    ["discern", "scrutinize", "meticulous"],
    ["profound", "compelling"],
    ["pragmatic", "empirical"],
    ["elucidate", "candid"],
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
    const used = lexicon(w);
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
  const emptyStats = () => ({ day: null, rated: 0, races: 0, wins: 0, bestWin: 0 });

  function mergeStats(a, b) {
    const x = { ...emptyStats(), ...(a || {}) };
    const y = { ...emptyStats(), ...(b || {}) };
    const day = [x.day, y.day].filter(Boolean).sort().pop() || null;
    const ratedOn = (s) => (s.day === day ? s.rated : 0);
    return {
      day,
      rated: Math.max(ratedOn(x), ratedOn(y)),
      races: Math.max(x.races, y.races),
      wins: Math.max(x.wins, y.wins),
      bestWin: Math.max(x.bestWin, y.bestWin),
    };
  }

  // ---------- View ----------
  // ctx: vocab's ctx plus { container, onExit }.
  function mount(ctx) {
    const { container, esc } = ctx;
    let screen = null; // null | "setup" | "race" | "result"
    let setup = { mode: "derby", wager: RULES.wagers[0] };
    let race = null; // newRace() + { q, picked, events, call, log: [], confirmQuit }
    const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

    const S = () => ctx.getState();
    const stats = () => {
      const p = S().vocab;
      p.derby = mergeStats(p.derby, null);
      if (p.derby.day !== ctx.todayKey()) { p.derby.day = ctx.todayKey(); p.derby.rated = 0; }
      return p.derby;
    };
    const ratedLeft = () => Math.max(0, RULES.ratedPerDay - stats().rated);
    const canBet = (amount) => amount === 0 || (ratedLeft() > 0 && (S().sparks || 0) >= amount);
    const fmt = (n) => Number(n).toLocaleString();

    function open() {
      ctx.sfx.play("tap");
      screen = "setup";
      if (!canBet(setup.wager)) setup.wager = RULES.wagers.find(canBet) || 0;
      render();
      container.scrollTop = 0;
    }

    function render() {
      if (screen === "setup") return renderSetup();
      if (screen === "race") return renderRace();
      if (screen === "result") return renderResult();
    }

    // Lanes: name + track with tick marks and a finish line. The horse's
    // position is a CSS variable, so moves animate in place.
    function lanes(horses, mode, compact = false) {
      return `
        <ol class="track${compact ? " compact" : ""}" aria-label="Race track, ${RULES.trackLength} steps to the finish">
          ${horses.map((h, i) => {
            const meta = HORSE[h.id];
            return `
            <li class="lane silk-${meta.silk}${meta.you ? " you" : ""}" data-horse="${h.id}" aria-label="${esc(meta.name)}${meta.you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}">
              <span class="lane-name" aria-hidden="true"><i class="silk-dot">${i + 1}</i><span class="nm-long">${esc(meta.name)}</span><span class="nm-short">${meta.you ? "You" : esc(meta.short)}</span></span>
              <span class="lane-track" aria-hidden="true">
                <span class="lane-horse" style="--p:${h.pos}">🏇</span>
              </span>
              <span class="lane-pos" aria-hidden="true">${h.pos}/${RULES.trackLength}</span>
            </li>`;
          }).join("")}
        </ol>
        ${compact ? "" : `<p class="muted small track-note">${esc(MODES[mode].blurb)}</p>`}`;
    }

    function renderSetup() {
      const sparks = S().sparks || 0;
      const st = stats();
      const left = ratedLeft();
      if (!canBet(setup.wager)) setup.wager = 0;
      const mode = MODES[setup.mode];
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-exit">✕ Back to the Vault</button>
            <span class="pill-sm">⚡ ${fmt(sparks)}</span>
          </div>
          <section class="panel">
            <span class="label-sm">Vocab Derby</span>
            <h2>🏇 Place your bet</h2>
            <p class="muted">${mode.field} horses, ${RULES.trackLength} steps to the 🏁. Answer right to gallop; miss, and a rival surges ahead. A win pays your bet back ${mode.payout}×.</p>
            <span class="label-sm">Your wager</span>
            <div class="wager-chips" role="radiogroup" aria-label="Wager">
              ${[0, ...RULES.wagers].map((a) => `
                <button class="wchip" type="button" role="radio" data-wager="${a}" aria-checked="${a === setup.wager}" ${canBet(a) ? "" : "disabled"}>
                  <b>${a ? `${a} ⚡` : "Fun run"}</b>
                  <small>${a ? `win +${a * (mode.payout - 1)}` : "no bet"}</small>
                </button>`).join("")}
            </div>
            <p class="muted small">${left ? `${left} of ${RULES.ratedPerDay} betting races left today.` : "No betting races left today. Fun runs are unlimited!"}
              ${setup.wager ? ` Your ${setup.wager} ⚡ goes in at the gate; a win pays back ${setup.wager * mode.payout} ⚡.` : ""}</p>
            ${lanes(HORSES.slice(0, mode.field).map((h) => ({ id: h.id, pos: 0 })), mode.id)}
            <button class="btn wide" type="button" id="derby-go">🔔 ${setup.wager ? `Bet ${setup.wager} ⚡ & start` : "Start the fun run"}</button>
          </section>
          <section class="panel derby-stats">
            <div><b>${st.races}</b><span>Races</span></div>
            <div><b>${st.wins}</b><span>Wins</span></div>
            <div><b>${st.races ? Math.round((st.wins / st.races) * 100) : 0}%</b><span>Win rate</span></div>
            <div><b>${fmt(st.bestWin)}</b><span>Best payout ⚡</span></div>
          </section>
        </div>`;
      container.querySelector("#derby-exit").addEventListener("click", exit);
      container.querySelectorAll(".wchip:not(:disabled)").forEach((b) => b.addEventListener("click", () => {
        setup.wager = Number(b.dataset.wager);
        ctx.sfx.play("tap");
        renderSetup();
      }));
      container.querySelector("#derby-go").addEventListener("click", start);
    }

    function start() {
      const wager = canBet(setup.wager) ? setup.wager : 0;
      if (wager) {
        S().sparks -= wager; // in at the gate
        stats().rated += 1;
        ctx.save();
        ctx.renderHud(["sparks"]);
      }
      race = newRace(setup.mode, wager, SW.vocab.WORDS.map((w) => w.id));
      race.log = [];
      race.call = "And they're off! 🔔";
      nextQuestion();
      screen = "race";
      ctx.sfx.play("bell");
      renderRace();
      container.scrollTop = 0;
    }

    function nextQuestion() {
      // Cycle through the shuffled words; reshuffle if a long race runs out.
      if (race.turn >= race.words.length) race.words = race.words.concat(shuffle(race.words, Math.random));
      const w = SW.vocab.WORDS.find((x) => x.id === race.words[race.turn]);
      race.q = makeQuestion(w);
      race.picked = null;
      race.events = [];
    }

    function renderRace() {
      const mode = MODES[race.mode];
      container.innerHTML = `
        <div class="stack vault derby">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="derby-quit">${race.confirmQuit ? `Tap again to forfeit ${race.wager} ⚡` : "✕ Leave race"}</button>
            <span class="muted small">${race.wager ? `Bet ${race.wager} ⚡ · pays ${race.wager * mode.payout}` : "Fun run"}</span>
          </div>
          <section class="panel track-panel" id="track-panel">
            <div id="derby-track">${lanes(race.horses, race.mode, true)}</div>
            <p class="race-call" id="race-call" aria-live="polite">${esc(race.call)}</p>
            <div id="derby-next-slot"></div>
          </section>
          <section class="card-inner bb vocab-card" id="derby-q"></section>
        </div>`;
      container.querySelector("#derby-quit").addEventListener("click", quit);
      renderQuestion();
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
          <div class="feedback ${race.picked === q.answer ? "ok" : "no"}">
            <h3>${race.picked === q.answer ? "Correct! You gallop ahead." : "Not quite. A rival surges!"}</h3>
            <p>${ctx.fill(q.explain, undefined, false)}</p>
            ${race.picked === q.answer ? "" : `<p class="muted small">🔁 “${esc(w.word)}” is flagged for review in the Vault.</p>`}
          </div>` : ""}`;
      // The Next button sits under the race call, next to the horses.
      container.querySelector("#derby-next-slot").innerHTML = answered
        ? `<button class="btn wide" type="button" id="derby-next">${race.winner ? "See the results 🏁" : "Next question →"}</button>`
        : "";
      el.querySelectorAll(".choice:not(:disabled)").forEach((b) => {
        b.addEventListener("pointerdown", () => ctx.sfx.play("tap"));
        b.addEventListener("click", () => answer(Number(b.dataset.ci)));
      });
      container.querySelector("#derby-next")?.addEventListener("click", advance);
    }

    function callFor(events, correct) {
      const name = (id) => HORSE[id].name;
      const surge = events.find((e) => e.kind === "surge");
      const gallops = events.filter((e) => e.kind === "gallop").map((e) => name(e.id));
      const parts = [];
      if (correct) parts.push(`${name("lexicon")} gallops ahead!`);
      if (surge) parts.push(`${name(surge.id)} surges on your miss!`);
      if (gallops.length) parts.push(`${gallops.join(", ")} ${gallops.length === 1 ? "moves" : "move"} up.`);
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
      race.call = callFor(events, correct);
      race.confirmQuit = false;
      ctx.sfx.play(correct ? "correct" : "wrong");
      if (correct) ctx.sfx.buzz(50);
      setTimeout(() => ctx.sfx.play("gallop"), 120);
      ctx.save();
      // Move horses in place so the CSS transition animates them.
      for (const h of race.horses) {
        const lane = container.querySelector(`.lane[data-horse="${h.id}"]`);
        if (!lane) continue;
        lane.querySelector(".lane-horse").style.setProperty("--p", h.pos);
        lane.querySelector(".lane-pos").textContent = `${h.pos}/${RULES.trackLength}`;
        lane.setAttribute("aria-label", `${HORSE[h.id].name}${HORSE[h.id].you ? " (you)" : ""}: ${h.pos} of ${RULES.trackLength}`);
        lane.classList.toggle("moved", events.some((e) => e.id === h.id));
      }
      container.querySelector("#race-call").textContent = race.call;
      container.querySelector("#derby-quit").textContent = "✕ Leave race";
      renderQuestion();
      // Bring the track into view so the move is visible.
      container.querySelector("#track-panel").scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
      container.querySelector("#derby-next")?.focus({ preventScroll: true });
      if (race.winner) settle();
    }

    function settle() {
      const st = stats();
      const won = race.winner === "lexicon";
      const payout = won && race.wager ? race.wager * MODES[race.mode].payout : 0;
      st.races += 1;
      if (won) st.wins += 1;
      if (payout) {
        ctx.earn(payout);
        st.bestWin = Math.max(st.bestWin, payout);
      }
      race.payout = payout;
      ctx.save();
      ctx.renderHud(payout ? ["sparks"] : []);
      setTimeout(() => {
        if (won) {
          ctx.sfx.play("complete");
          ctx.celebrate("🏆", "You won the race!", payout ? `+${payout} ⚡ Sparks` : "Fun run victory");
        } else ctx.sfx.play("wrong");
      }, reducedMotion() ? 0 : 650);
    }

    function advance() {
      if (race.winner) {
        screen = "result";
        renderResult();
        container.scrollTop = 0;
        return;
      }
      nextQuestion();
      renderQuestion();
      container.querySelectorAll(".lane.moved").forEach((l) => l.classList.remove("moved"));
      container.scrollTop = 0;
      container.querySelector("#derby-q .choice")?.focus({ preventScroll: true });
    }

    function quit() {
      if (race.wager && !race.confirmQuit) {
        race.confirmQuit = true;
        container.querySelector("#derby-quit").textContent = `Tap again to forfeit ${race.wager} ⚡`;
        return;
      }
      if (race.wager) { stats().races += 1; ctx.save(); } // a scratched bet counts as a loss
      race = null;
      screen = "setup";
      renderSetup();
    }

    function renderResult() {
      const won = race.winner === "lexicon";
      const standings = race.horses.slice().sort((a, b) => (b.id === race.winner) - (a.id === race.winner) || b.pos - a.pos);
      const recap = [];
      for (const r of race.log) {
        const w = SW.vocab.WORDS.find((x) => x.id === r.wordId);
        recap.push(`<li class="sum-row ${r.correct ? "ok" : "no"}">
          <span aria-hidden="true">${r.correct ? "✓" : "✗"}</span>
          <div><b>${esc(w.word)}</b> <small class="muted">${esc(w.pos)}</small><br><span class="muted small">${esc(w.definition)}</span></div>
        </li>`);
      }
      const right = race.log.filter((r) => r.correct).length;
      container.innerHTML = `
        <div class="stack vault derby">
          <section class="panel sprint-summary">
            <span class="complete-star" aria-hidden="true">${won ? "🏆" : "🐎"}</span>
            <h2>${won ? "You won the race!" : `${esc(HORSE[race.winner].name)} wins`}</h2>
            <p class="derby-payout ${won ? "ok" : "no"}">${race.wager
              ? won ? `+${race.payout} ⚡ · your ${race.wager} ⚡ bet paid ${MODES[race.mode].payout}×` : `−${race.wager} ⚡ · better luck next race`
              : "Fun run: no Sparks on the line"}</p>
            <p class="muted">Bankroll: ⚡ ${fmt(S().sparks || 0)}</p>
            <ol class="standings">
              ${standings.map((h, i) => `<li class="silk-${HORSE[h.id].silk}${HORSE[h.id].you ? " you" : ""}"><i class="silk-dot" aria-hidden="true">${i + 1}</i>${esc(HORSE[h.id].name)}<span class="muted small">${h.pos}/${RULES.trackLength}</span></li>`).join("")}
            </ol>
          </section>
          <section class="panel">
            <h2>Words this race <small class="muted">${right} of ${race.log.length} right</small></h2>
            <ul class="sum-list">${recap.join("")}</ul>
            ${race.log.some((r) => !r.correct) ? '<p class="muted small">Missed words are flagged 🔁. They lead your next flashcard deck and sprint.</p>' : ""}
          </section>
          <div class="stack">
            <button class="btn wide" type="button" id="derby-again">🏇 Race again</button>
            <button class="btn ghost wide" type="button" id="derby-home">Back to the Vault</button>
          </div>
        </div>`;
      race = null;
      container.querySelector("#derby-again").addEventListener("click", open);
      container.querySelector("#derby-home").addEventListener("click", exit);
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
      const i = "abcd".indexOf(e.key.toLowerCase()) >= 0 ? "abcd".indexOf(e.key.toLowerCase()) : "1234".indexOf(e.key);
      if (i >= 0) { e.preventDefault(); answer(i); }
    });

    return {
      open,
      render,
      active: () => screen !== null,
      racing: () => screen === "race",
    };
  }

  SW.derby = { RULES, MODES, HORSES, newRace, step, makeQuestion, related, emptyStats, mergeStats, mount };
})();
