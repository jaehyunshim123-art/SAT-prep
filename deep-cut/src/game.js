// Deep Cut: name the answer nobody else thinks of.
//
// Seven prompts a day, 25 seconds each, one answer per prompt. A correct answer
// sends you down by how rare it is (Obvious → Rare). Everyone gets the same
// seven prompts on the same day; Practice deals a random seven any time.
//
// Answers are matched against the bank in prompts.js: case, accents,
// punctuation, "the/a/an", plurals and one-letter typos are forgiven. An answer
// that isn't on the list doesn't use up your turn; try another while time lasts.
(function () {
  "use strict";
  const DC = window.DeepCut;

  const ROUND = 7;
  const SECONDS = 25;
  const EPOCH = Date.UTC(2026, 9, 1); // Deep Cut #1 is Oct 1, 2026
  const KEY = "deepcut.v1";

  const TIERS = [
    { name: "Obvious", depth: 120, mark: "🟦" },
    { name: "Common", depth: 340, mark: "🔷" },
    { name: "Uncommon", depth: 620, mark: "🟪" },
    { name: "Rare", depth: 900, mark: "🟩" },
  ];
  const MISS_MARK = "❌";
  const RANKS = [
    [0, "Paddler"], [1500, "Snorkeler"], [2600, "Reef Diver"], [3600, "Twilight Diver"], [4600, "Midnight Diver"], [5600, "Abyssal Legend"],
  ];

  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (n) => Math.round(n).toLocaleString("en-US");
  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  // ---------- Matching ----------
  const norm = (s) => String(s).toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
    .replace(/&/g, " and ").replace(/['’]/g, "").replace(/[^a-z0-9]+/g, " ").trim()
    .replace(/^(the|a|an) /, "");
  const singular = (s) => s.replace(/(ies)$/, "y").replace(/(ches|shes|xes|sses)$/, (m) => m.slice(0, -2)).replace(/([^s])s$/, "$1");

  function lev(a, b, max) {
    if (Math.abs(a.length - b.length) > max) return max + 1;
    let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
    for (let i = 1; i <= a.length; i++) {
      const cur = [i];
      let best = i;
      for (let j = 1; j <= b.length; j++) {
        cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        best = Math.min(best, cur[j]);
      }
      if (best > max) return max + 1;
      prev = cur;
    }
    return prev[b.length];
  }

  // Builds { key → answer } for one prompt. An answer listed twice keeps its
  // first (more common) tier.
  function indexPrompt(p) {
    if (p.index) return p.index;
    const index = new Map();
    p.tiers.forEach((list, tier) => list.forEach((entry) => {
      const names = entry.split("|");
      const answer = { name: cap(names[0]), tier };
      for (const n of names) {
        const k = norm(n);
        if (!index.has(k)) index.set(k, answer);
        if (!index.has(singular(k))) index.set(singular(k), answer);
      }
    }));
    return (p.index = index);
  }

  function judge(p, text) {
    const index = indexPrompt(p);
    const k = norm(text);
    if (!k) return null;
    const hit = index.get(k) || index.get(singular(k));
    if (hit) return hit;
    if (k.length < 5) return null;
    const max = k.length >= 9 ? 2 : 1;
    for (const [key, answer] of index) if (key.length >= 4 && lev(k, key, max) <= max) return answer;
    return null;
  }

  // Each answer gets a fixed little depth bonus so ties are rare.
  const jitter = (s) => { let h = 7; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h % 60; };
  const depthFor = (answer) => TIERS[answer.tier].depth + jitter(answer.name);

  // ---------- Days & dealing ----------
  const dayNumber = () => {
    const d = new Date();
    return Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - EPOCH) / 86400000) + 1;
  };
  function rng(seed) {
    return () => { seed |= 0; seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  }
  function deal(rand) {
    const ids = DC.PROMPTS.map((p) => p.id);
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    return ids.slice(0, ROUND);
  }
  const prompt = (id) => DC.PROMPTS.find((p) => p.id === id);

  // ---------- Saved state ----------
  let saved = { daily: {}, best: 0, streak: 0, lastDay: 0 };
  try { saved = Object.assign(saved, JSON.parse(localStorage.getItem(KEY)) || {}); } catch (e) { /* storage blocked */ }
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) { /* storage blocked */ } };

  // ---------- Game ----------
  const app = $("#app");
  let game = null; // { mode, day, ids, i, answers: [{ id, text, name, tier, depth }], deadline }
  let timer = null;

  function newGame(mode) {
    const day = dayNumber();
    const ids = mode === "daily" ? deal(rng(day * 9973)) : deal(Math.random);
    game = { mode, day, ids, i: 0, answers: [] };
    if (mode === "daily") {
      // Resume a daily dive after a refresh. The prompt that was on screen counts as missed.
      const d = saved.daily[day];
      if (d && !d.done) {
        game.answers = d.answers;
        if (d.onScreen === game.answers.length) game.answers.push(miss(ids[game.answers.length]));
        game.i = game.answers.length;
      }
    }
    if (game.i >= ROUND) return finish();
    showPrompt();
  }

  const miss = (id) => ({ id, text: "", name: null, tier: -1, depth: 0 });
  const total = (answers) => answers.reduce((s, a) => s + a.depth, 0);

  function persist(extra) {
    if (game.mode !== "daily") return;
    saved.daily[game.day] = Object.assign({ answers: game.answers, done: false }, extra);
    save();
  }

  function record(answer) {
    clearInterval(timer);
    game.answers.push(answer);
    persist();
    showReveal(answer);
  }

  function finish() {
    clearInterval(timer);
    const depth = total(game.answers);
    if (game.mode === "daily") {
      persist({ done: true });
      if (saved.lastDay !== game.day) {
        saved.streak = saved.lastDay === game.day - 1 ? saved.streak + 1 : 1;
        saved.lastDay = game.day;
      }
      saved.best = Math.max(saved.best, depth);
      save();
    }
    showResults();
  }

  // ---------- Water ----------
  // Same idea as Deep Dive: the page darkens as your total depth grows.
  const STOPS = [[0, [27, 118, 160]], [0.4, [12, 66, 104]], [0.65, [7, 36, 62]], [0.85, [4, 17, 33]], [1, [2, 6, 14]]];
  function water(m) {
    const t = Math.min(1, m / 6000);
    let c = STOPS[STOPS.length - 1][1];
    for (let i = 1; i < STOPS.length; i++) {
      if (t <= STOPS[i][0]) {
        const [t0, c0] = STOPS[i - 1], [t1, c1] = STOPS[i], k = (t - t0) / (t1 - t0);
        c = c0.map((v, j) => Math.round(v + (c1[j] - v) * k));
        break;
      }
    }
    document.documentElement.style.setProperty("--water", `rgb(${c.join(",")})`);
  }

  // ---------- Screens ----------
  function showHome() {
    clearInterval(timer);
    water(0);
    const day = dayNumber();
    const today = saved.daily[day];
    const played = today && today.done;
    app.innerHTML = `
      <main class="screen home">
        <p class="eyebrow">Daily word dive · #${day}</p>
        <h1 class="logo">Deep<br>Cut</h1>
        <p class="lede">Seven prompts. ${SECONDS} seconds each. Any right answer counts, but the ones nobody else thinks of take you deepest.</p>
        <ol class="ladder" aria-label="How deep each kind of answer takes you">
          ${TIERS.map((t, i) => `<li class="tier-${i}"><span>${t.name}</span><b>~${fmt(t.depth)} m</b></li>`).join("")}
        </ol>
        ${played
          ? `<button class="primary" id="today">See today's dive · ${fmt(total(today.answers))} m</button>`
          : `<button class="primary" id="play">${today ? "Resume" : "Start"} today's dive</button>`}
        <button class="ghost" id="practice">Practice round</button>
        <dl class="record">
          <div><dt>Streak</dt><dd>${saved.streak}</dd></div>
          <div><dt>Best dive</dt><dd>${fmt(saved.best)} m</dd></div>
        </dl>
      </main>`;
    $("#play")?.addEventListener("click", () => newGame("daily"));
    $("#today")?.addEventListener("click", () => { game = { mode: "daily", day, ids: deal(rng(day * 9973)), answers: today.answers }; showResults(); });
    $("#practice").addEventListener("click", () => newGame("practice"));
  }

  function showPrompt() {
    const p = prompt(game.ids[game.i]);
    if (game.mode === "daily") persist({ onScreen: game.i });
    const depth = total(game.answers);
    water(depth);
    app.innerHTML = `
      <main class="screen play">
        <header class="play-head">
          <span>${game.mode === "daily" ? `#${game.day}` : "Practice"} · ${game.i + 1} of ${ROUND}</span>
          <span class="mono">${fmt(depth)} m</span>
        </header>
        <div class="pips" aria-hidden="true">${game.ids.map((_, i) => `<i class="${i < game.i ? "done" : i === game.i ? "now" : ""}"></i>`).join("")}</div>
        <section class="card">
          <p class="cat">${esc(p.cat)}</p>
          <h2 class="q">${esc(p.q)}</h2>
          <form id="form" autocomplete="off">
            <input id="answer" aria-label="Your answer" placeholder="Type one answer" maxlength="60" autocapitalize="off" spellcheck="false">
            <button class="primary" type="submit">Lock it in</button>
          </form>
          <p id="note" class="note" role="status"></p>
        </section>
        <div class="clock"><div id="fuse"></div><span id="secs" class="mono">${SECONDS}</span></div>
      </main>`;
    const input = $("#answer");
    input.focus();
    $("#form").addEventListener("submit", (e) => {
      e.preventDefault();
      const text = input.value.trim();
      if (!text) return;
      const hit = judge(p, text);
      if (!hit) {
        $("#note").textContent = `“${text}” isn't on our list. Try another!`;
        input.select();
        return;
      }
      record({ id: p.id, text, name: hit.name, tier: hit.tier, depth: depthFor(hit) });
    });

    game.deadline = Date.now() + SECONDS * 1000;
    const tick = () => {
      const left = Math.max(0, game.deadline - Date.now());
      $("#fuse").style.transform = `scaleX(${left / (SECONDS * 1000)})`;
      $("#secs").textContent = Math.ceil(left / 1000);
      document.querySelector(".clock").classList.toggle("low", left < 6000);
      if (left <= 0) record(miss(p.id));
    };
    clearInterval(timer);
    tick();
    timer = setInterval(tick, 100);
  }

  function showReveal(a) {
    const p = prompt(a.id);
    water(total(game.answers));
    const t = TIERS[a.tier];
    app.innerHTML = `
      <main class="screen reveal">
        <p class="cat">${esc(p.q)}</p>
        ${a.name
          ? `<p class="said">${esc(a.name)}</p>
             <p class="verdict tier-${a.tier}">${t.name}</p>
             <p class="drop mono">+${fmt(a.depth)} m</p>`
          : `<p class="said muted">Time's up</p><p class="drop mono">+0 m</p>`}
        <p class="hint">Deep cuts here include ${esc(examples(p).join(", "))}.</p>
        <button class="primary" id="next">${game.answers.length < ROUND ? "Next prompt" : "See my dive"}</button>
      </main>`;
    const next = () => (game.answers.length < ROUND ? (game.i = game.answers.length, showPrompt()) : finish());
    $("#next").addEventListener("click", next);
    $("#next").focus();
  }

  // Three rare answers to show what "deep" looks like for this prompt.
  const examples = (p) => p.tiers[3].slice(0, 12).map((e) => cap(e.split("|")[0])).sort(() => Math.random() - 0.5).slice(0, 3);

  function shareText() {
    const head = game.mode === "daily" ? `Deep Cut #${game.day}` : "Deep Cut practice";
    return `${head} · ${fmt(total(game.answers))} m\n${game.answers.map((a) => (a.tier < 0 ? MISS_MARK : TIERS[a.tier].mark)).join("")}`;
  }

  function showResults() {
    const depth = total(game.answers);
    const rank = RANKS.filter(([m]) => depth >= m).pop()[1];
    water(depth);
    app.innerHTML = `
      <main class="screen results">
        <p class="eyebrow">${game.mode === "daily" ? `Deep Cut #${game.day}` : "Practice round"}</p>
        <p class="total mono">${fmt(depth)}<small> m</small></p>
        <p class="rank">${rank}</p>
        <ol class="log">
          ${game.answers.map((a) => {
            const p = prompt(a.id);
            return `<li>
              <span class="log-q">${esc(cap(p.q.replace(/^Name (a |an )?/, "")))}</span>
              <span class="log-a">${a.name ? esc(a.name) : '<span class="muted">No answer</span>'}</span>
              <span class="pill ${a.tier < 0 ? "miss" : `tier-${a.tier}`}">${a.tier < 0 ? "Miss" : TIERS[a.tier].name}</span>
              <span class="mono log-m">${fmt(a.depth)} m</span>
            </li>`;
          }).join("")}
        </ol>
        <pre class="share" id="share-text">${esc(shareText())}</pre>
        <div class="row">
          <button class="primary" id="copy">Copy result</button>
          <button class="ghost" id="home">${game.mode === "daily" ? "Practice round" : "Play again"}</button>
        </div>
        <button class="link" id="back">Back to start</button>
      </main>`;
    $("#copy").addEventListener("click", async (e) => {
      const btn = e.currentTarget;
      try {
        await navigator.clipboard.writeText(shareText());
        btn.textContent = "Copied!";
      } catch (err) {
        const r = document.createRange(); r.selectNodeContents($("#share-text"));
        const s = getSelection(); s.removeAllRanges(); s.addRange(r);
        btn.textContent = "Selected. Press Ctrl+C / ⌘C";
      }
    });
    $("#home").addEventListener("click", () => newGame("practice"));
    $("#back").addEventListener("click", showHome);
  }

  DC.judge = judge; // handy in the console: DeepCut.judge(DeepCut.PROMPTS[0], "kiwis")
  showHome();
})();
