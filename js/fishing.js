// SatWizz Vocab Fishing: a Vault game where you hook the fish carrying the
// right definition.
//
//   • A round is 8 casts. Each cast shows a word (part of speech and its
//     context sentence) and sends a school of 4 fish swimming across the
//     water, each carrying a definition. Tap (or press 1–4) the fish with the
//     right one before the 20s line timer runs out.
//   • Hook the right fish: +5 ⚡ and the word's review flag clears. Hook a wrong
//     one, or let the timer run out, and the school scatters: the word is
//     flagged 🔁 for review. A perfect round pays +20 ⚡.
//   • Rods give small perks and spots set the scenery and the word pool. Both
//     are sold in the Shop (500 ⚡ each); the Bamboo Rod and Village Pond are free.
//
// Exposes SatWizz.fishing = { RULES, RODS, SPOTS, emptyStats, mergeStats,
// buyItem, poolFor, makeCast, mount }.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    casts: 8,
    fish: 4,
    lineSeconds: 20,
    catchSparks: 5,
    perfectSparks: 20,
    swimSeconds: [7, 10], // one crossing of the water, per fish
  });

  // Rods: small perks. Spots: scenery + which words bite.
  const RODS = [
    { id: "bamboo", name: "Bamboo Rod", emoji: "🎋", price: 0, perk: "No perk. A classic." },
    { id: "graphite", name: "Steady Graphite", emoji: "🎣", price: 500, perk: "Fish swim 25% slower.", slow: 1.25 },
    { id: "reel", name: "Second-Chance Reel", emoji: "🧵", price: 500, perk: "Your first wrong hook each round doesn't scare the school off.", secondChance: true },
    { id: "golden", name: "Golden Lure", emoji: "✨", price: 500, perk: "+2 ⚡ on every catch.", bonus: 2 },
  ];
  const SPOTS = [
    { id: "pond", name: "Village Pond", emoji: "🪷", price: 0, desc: "Core high-frequency words.", pool: "core" },
    { id: "lake", name: "Misty Lake", emoji: "🌫️", price: 500, desc: "Advanced words only.", pool: "advanced" },
    { id: "reef", name: "Coral Reef", emoji: "🪸", price: 500, desc: "All 55 Vault words.", pool: "all" },
    { id: "bay", name: "Moonlit Bay", emoji: "🌙", price: 500, desc: "Words you flagged for review bite first.", pool: "review" },
  ];
  const rodById = (id) => RODS.find((r) => r.id === id) || RODS[0];
  const spotById = (id) => SPOTS.find((s) => s.id === id) || SPOTS[0];
  const FISH = ["🐟", "🐠", "🐡", "🦈"];

  const rnd = Math.random;
  const shuffle = (arr, rand = rnd) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // ---------- Stats (kept in the Vault progress as vocab.fishing) ----------
  const emptyStats = () => ({ rounds: 0, catches: 0, perfect: 0, best: 0, rods: [], spots: [], rod: "bamboo", spot: "pond", at: 0 });
  function mergeStats(a, b) {
    const x = { ...emptyStats(), ...(a || {}) };
    const y = { ...emptyStats(), ...(b || {}) };
    const newer = (y.at || 0) > (x.at || 0) ? y : x;
    const rods = [...new Set([...x.rods, ...y.rods])].filter((id) => RODS.some((r) => r.id === id && r.price));
    const spots = [...new Set([...x.spots, ...y.spots])].filter((id) => SPOTS.some((s) => s.id === id && s.price));
    const owns = (list, id, cat) => !cat.find((c) => c.id === id)?.price || list.includes(id);
    return {
      rounds: Math.max(x.rounds, y.rounds),
      catches: Math.max(x.catches, y.catches),
      perfect: Math.max(x.perfect, y.perfect),
      best: Math.max(x.best, y.best),
      rods,
      spots,
      rod: owns(rods, newer.rod, RODS) ? newer.rod : "bamboo",
      spot: owns(spots, newer.spot, SPOTS) ? newer.spot : "pond",
      at: Math.max(x.at || 0, y.at || 0),
    };
  }

  // key: "rod:<id>" | "spot:<id>". Spends state.sparks, owns + equips the item.
  function buyItem(st, state, key) {
    const [kind, id] = key.split(":");
    const item = (kind === "rod" ? RODS : kind === "spot" ? SPOTS : []).find((x) => x.id === id);
    if (!item || !item.price) return { ok: false, reason: "unknown" };
    const list = kind === "rod" ? st.rods : st.spots;
    if (list.includes(id)) return { ok: false, reason: "owned" };
    if ((state.sparks || 0) < item.price) return { ok: false, reason: "short", need: item.price - (state.sparks || 0) };
    state.sparks -= item.price;
    list.push(id);
    if (kind === "rod") st.rod = id; else st.spot = id;
    st.at = Date.now();
    return { ok: true, spent: item.price, item };
  }

  // ---------- Rounds (pure) ----------
  // Words for a round at a spot. `progress` is the Vault progress (review flags).
  function poolFor(spotId, progress, words = SW.vocab.WORDS, rand = rnd) {
    const spot = spotById(spotId);
    if (spot.pool === "core") return shuffle(words.filter((w) => w.level !== "advanced"), rand);
    if (spot.pool === "advanced") return shuffle(words.filter((w) => w.level === "advanced"), rand);
    if (spot.pool === "review") {
      const flagged = (w) => Boolean(progress && progress.words && progress.words[w.id] && progress.words[w.id].review);
      return [...shuffle(words.filter(flagged), rand), ...shuffle(words.filter((w) => !flagged(w)), rand)];
    }
    return shuffle(words, rand);
  }

  // One cast: the word plus 4 fish (definitions), one of them right. Words
  // close in meaning (SatWizz.derby.related) never swim together.
  function makeCast(w, words = SW.vocab.WORDS, rand = rnd) {
    const others = shuffle(words.filter((x) => !SW.derby.related(w, x)), rand).slice(0, RULES.fish - 1);
    const fish = shuffle([w, ...others], rand).map((x, i) => ({ wordId: x.id, def: x.definition, right: x.id === w.id, kind: FISH[i % FISH.length] }));
    return { wordId: w.id, fish, answer: fish.findIndex((f) => f.right) };
  }

  // ---------- View ----------
  // ctx: { container, getState, save, esc, fill, sfx, toast, celebrate, earn,
  //        recordAnswer, renderHud, onExit, openShop }
  function mount(ctx) {
    const { container, esc } = ctx;
    let screen = null; // null | "dock" | "cast" | "result"
    let round = null; // { words, i, cast, results: [], earned, saved (reel used), timer, left, done }
    const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const S = () => ctx.getState();
    // Kept in the Vault progress (S.vocab.fishing), so it syncs with an account.
    const st = () => {
      const p = S().vocab;
      p.fishing = Object.assign(p.fishing || {}, mergeStats(p.fishing, null));
      return p.fishing;
    };
    const touch = () => { st().at = Date.now(); };
    const W = () => SW.vocab.WORDS;
    const word = (id) => W().find((w) => w.id === id);
    const fmt = (n) => Number(n || 0).toLocaleString("en-US");
    const banner = "=== 🎣 SATWIZZ VOCAB FISHING 🎣 ===";

    function go(next) {
      screen = next;
      render();
      container.scrollTop = 0;
    }
    function render() {
      if (screen === "dock") return renderDock();
      if (screen === "cast") return renderCast();
      if (screen === "result") return renderResult();
    }

    // ---------- Dock: rules, gear, start ----------
    function renderDock() {
      const s = st();
      const rod = rodById(s.rod);
      const spot = spotById(s.spot);
      const ownsRod = (r) => !r.price || s.rods.includes(r.id);
      const ownsSpot = (x) => !x.price || s.spots.includes(x.id);
      container.innerHTML = `
        <div class="stack vault fishing spot-${spot.id}">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="fish-exit">✕ Back to the Vault</button>
            <span class="pill-sm">⚡ ${fmt(S().sparks)}</span>
          </div>
          <section class="panel fish-intro">
            <pre class="derby-banner fish-banner" aria-label="SatWizz Vocab Fishing">${banner}</pre>
            <p class="muted center">Hook the fish that carries the right definition.</p>
            <ol class="rule-list">
              <li><b>${RULES.casts} casts a round.</b> Each cast shows a word and sends ${RULES.fish} fish across the water, each carrying a definition.</li>
              <li><b>Tap the right fish</b> (or press 1–${RULES.fish}) before the ${RULES.lineSeconds}s line runs out: +${RULES.catchSparks} ⚡${rod.bonus ? ` (+${rod.bonus} with your ${esc(rod.name)})` : ""}.</li>
              <li><b>Wrong fish or no bite?</b> The school scatters, and the word is flagged 🔁 for review.</li>
              <li><b>Perfect round</b> (${RULES.casts}/${RULES.casts}): +${RULES.perfectSparks} ⚡ bonus.</li>
            </ol>
            <button class="btn wide start-btn" type="button" id="fish-start">Cast off at ${esc(spot.name)} ${spot.emoji}</button>
          </section>
          <section class="panel">
            <h2>Your rod</h2>
            <div class="gear-list" role="radiogroup" aria-label="Rod">
              ${RODS.map((r) => `
                <button class="gear${s.rod === r.id ? " on" : ""}" type="button" role="radio" aria-checked="${s.rod === r.id}" data-rod="${r.id}" ${ownsRod(r) ? "" : "disabled"}>
                  <span class="gear-ico" aria-hidden="true">${r.emoji}</span>
                  <span class="gear-info"><b>${esc(r.name)}</b><small>${ownsRod(r) ? esc(r.perk) : `🔒 ${fmt(r.price)} ⚡ in the Shop · ${esc(r.perk)}`}</small></span>
                </button>`).join("")}
            </div>
            <h2>Your spot</h2>
            <div class="gear-list" role="radiogroup" aria-label="Fishing spot">
              ${SPOTS.map((x) => `
                <button class="gear${s.spot === x.id ? " on" : ""}" type="button" role="radio" aria-checked="${s.spot === x.id}" data-spot="${x.id}" ${ownsSpot(x) ? "" : "disabled"}>
                  <span class="gear-ico" aria-hidden="true">${x.emoji}</span>
                  <span class="gear-info"><b>${esc(x.name)}</b><small>${ownsSpot(x) ? esc(x.desc) : `🔒 ${fmt(x.price)} ⚡ in the Shop · ${esc(x.desc)}`}</small></span>
                </button>`).join("")}
            </div>
            ${ctx.openShop ? '<button class="btn ghost wide" type="button" id="fish-shop">🛍️ More rods and spots in the Shop</button>' : ""}
          </section>
          <section class="panel derby-stats">
            <div><b>${fmt(s.rounds)}</b><span>Rounds</span></div>
            <div><b>${fmt(s.catches)}</b><span>Catches</span></div>
            <div><b>${s.best}/${RULES.casts}</b><span>Best round</span></div>
            <div><b>${fmt(s.perfect)}</b><span>Perfect</span></div>
          </section>
        </div>`;
      container.querySelector("#fish-exit").addEventListener("click", exit);
      container.querySelector("#fish-start").addEventListener("click", start);
      container.querySelector("#fish-shop")?.addEventListener("click", () => ctx.openShop());
      container.querySelectorAll("[data-rod]:not(:disabled)").forEach((b) => b.addEventListener("click", () => { st().rod = b.dataset.rod; touch(); ctx.save(); ctx.sfx.play("tap"); renderDock(); }));
      container.querySelectorAll("[data-spot]:not(:disabled)").forEach((b) => b.addEventListener("click", () => { st().spot = b.dataset.spot; touch(); ctx.save(); ctx.sfx.play("tap"); renderDock(); }));
      container.querySelector("#fish-start").focus({ preventScroll: true });
    }

    // ---------- A round ----------
    function start() {
      ctx.sfx.play("tap");
      const words = poolFor(st().spot, S().vocab).slice(0, RULES.casts);
      round = { words, i: 0, results: [], earned: 0, saved: false };
      nextCast();
      go("cast");
    }

    function nextCast() {
      round.cast = makeCast(round.words[round.i]);
      round.left = RULES.lineSeconds;
      round.done = false;
      round.scared = new Set(); // fish that swam off after a Second-Chance miss
      round.picked = null;
      clearInterval(round.timer);
      round.timer = setInterval(tickLine, 250);
    }

    function tickLine() {
      if (!round || round.done) return;
      if (container.hidden) return; // paused while another tab is showing
      round.left = Math.max(0, round.left - 0.25);
      const bar = container.querySelector("#line-left");
      if (bar) bar.style.width = `${(round.left / RULES.lineSeconds) * 100}%`;
      const t = container.querySelector("#line-secs");
      if (t) t.textContent = `${Math.ceil(round.left)}s`;
      if (round.left <= 0) finishCast(null);
    }

    function renderCast() {
      const c = round.cast;
      const w = word(c.wordId);
      const rod = rodById(st().rod);
      const spot = spotById(st().spot);
      const swim = (i) => {
        const [a, b] = RULES.swimSeconds;
        const base = a + ((i * 7919 + round.i * 104729) % 1000) / 1000 * (b - a);
        return (base * (rod.slow || 1)).toFixed(2);
      };
      container.innerHTML = `
        <div class="stack vault fishing spot-${spot.id}">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="fish-quit">✕ Reel in</button>
            <span class="muted small" aria-live="polite">Cast ${round.i + 1} of ${round.words.length} · ${round.results.filter((r) => r.caught).length} caught</span>
          </div>
          <section class="card-inner bb fish-word">
            <div class="bb-top"><span class="bb-num">${round.i + 1}</span><span class="bb-meta">Hook the definition of</span><span class="q-timer" aria-hidden="true">🎣 <span id="line-secs">${Math.ceil(round.left)}s</span></span></div>
            <p class="fish-target"><b>${esc(w.word)}</b> <small class="muted">${esc(w.pos)}</small>${SW.speech ? SW.speech.button(w.word, esc, "sm") : ""}</p>
            <p class="fish-context">${ctx.fill(w.text).replace("______", `<b class="fc-hl">${esc(w.word)}</b>`).replace(SW.UNDERLINE_RE, '<b class="fc-hl">$1</b>')}</p>
            <div class="line-bar" aria-hidden="true"><i id="line-left" style="width:${(round.left / RULES.lineSeconds) * 100}%"></i></div>
          </section>
          <section class="water${reducedMotion() ? " still" : ""}" id="water" aria-label="Fish">
            ${c.fish.map((f, i) => `
              <div class="lane-water">
                <button class="fish${i % 2 ? " rtl" : ""}" type="button" data-fish="${i}" style="--swim:${swim(i)}s;--delay:-${(i * 1.7).toFixed(1)}s" aria-label="Fish ${i + 1}: ${esc(f.def)}">
                  <span class="fish-body" aria-hidden="true">${f.kind}</span><span class="fish-def"><b>${i + 1}</b> ${esc(f.def)}</span>
                </button>
              </div>`).join("")}
          </section>
          <div id="fish-feedback" aria-live="polite"></div>
        </div>`;
      container.querySelector("#fish-quit").addEventListener("click", quit);
      container.querySelectorAll("[data-fish]").forEach((b) => b.addEventListener("click", () => hook(Number(b.dataset.fish))));
      paintCast();
    }

    // Marks fish after a hook / scatter and shows the feedback + Next button.
    function paintCast() {
      const c = round.cast;
      container.querySelectorAll("[data-fish]").forEach((b) => {
        const i = Number(b.dataset.fish);
        b.classList.toggle("gone", round.scared.has(i));
        if (round.done) {
          b.disabled = true;
          b.classList.toggle("caught", i === c.answer && round.picked === i);
          b.classList.toggle("reveal", i === c.answer && round.picked !== i);
          b.classList.toggle("wrong", i === round.picked && i !== c.answer);
        } else b.disabled = round.scared.has(i);
      });
      container.querySelector("#water")?.classList.toggle("stopped", round.done);
      if (!round.done) return;
      const w = word(c.wordId);
      const r = round.results[round.results.length - 1];
      container.querySelector("#fish-feedback").innerHTML = `
        <div class="feedback ${r.caught ? "ok" : "no"}">
          <h3>${r.caught ? "🎣 Caught it!" : round.picked === null ? "⏱ The school swam off" : "💨 It got away"}<small>${r.caught ? `+${r.sparks} ⚡` : "🔁 flagged for review"}</small></h3>
          <p><b>${esc(w.word)}</b> (${esc(w.pos)}): ${esc(w.definition)}.</p>
          <p class="muted small">🌱 ${esc(w.root)} · ≈ ${w.synonyms.map(esc).join(", ")}</p>
        </div>
        <button class="btn wide" type="button" id="fish-next">${round.i + 1 >= round.words.length ? "See your catch 🧺" : "Next cast →"}</button>`;
      container.querySelector("#fish-next").addEventListener("click", advance);
      container.querySelector("#fish-next").focus({ preventScroll: true });
      container.querySelector("#fish-feedback").scrollIntoView({ block: "nearest", behavior: reducedMotion() ? "auto" : "smooth" });
    }

    function hook(i) {
      if (!round || round.done || round.scared.has(i)) return;
      const c = round.cast;
      if (i !== c.answer && rodById(st().rod).secondChance && !round.saved) {
        // Second-Chance Reel: that fish swims off, the rest stay.
        round.saved = true;
        round.scared.add(i);
        ctx.sfx.play("wrong");
        ctx.toast("🧵 Second-Chance Reel: that one swam off. Try again!");
        paintCast();
        return;
      }
      finishCast(i);
    }

    function finishCast(i) {
      const c = round.cast;
      round.done = true;
      round.picked = i;
      clearInterval(round.timer);
      const caught = i === c.answer;
      const p = S().vocab;
      let sparks = 0;
      if (caught) {
        sparks = RULES.catchSparks + (rodById(st().rod).bonus || 0);
        ctx.earn(sparks);
        round.earned += sparks;
        if (p.words[c.wordId]) p.words[c.wordId].review = false;
        ctx.sfx.play("correct");
        ctx.sfx.buzz(50);
      } else {
        SW.vocab.flag(p, c.wordId);
        ctx.sfx.play("wrong");
      }
      round.results.push({ wordId: c.wordId, caught, sparks });
      ctx.recordAnswer(caught);
      touch();
      ctx.save();
      ctx.renderHud(caught ? ["sparks"] : []);
      paintCast();
    }

    function advance() {
      round.i += 1;
      if (round.i >= round.words.length) return finishRound();
      nextCast();
      renderCast();
      container.querySelector("[data-fish]")?.focus({ preventScroll: true });
    }

    function finishRound() {
      const s = st();
      const caught = round.results.filter((r) => r.caught).length;
      const perfect = caught === round.words.length;
      if (perfect) {
        ctx.earn(RULES.perfectSparks);
        round.earned += RULES.perfectSparks;
        s.perfect += 1;
      }
      s.rounds += 1;
      s.catches += caught;
      s.best = Math.max(s.best, caught);
      round.caught = caught;
      round.perfect = perfect;
      touch();
      ctx.save();
      ctx.renderHud(["sparks"]);
      if (perfect) ctx.celebrate("🎣", "Perfect round!", `+${RULES.perfectSparks} ⚡ bonus`);
      go("result");
    }

    function renderResult() {
      const spot = spotById(st().spot);
      container.innerHTML = `
        <div class="stack vault fishing spot-${spot.id}">
          <section class="panel sprint-summary">
            <span class="complete-star" aria-hidden="true">${round.perfect ? "🏆" : "🧺"}</span>
            <h2>${round.caught} of ${round.words.length} caught</h2>
            <p class="derby-payout ok">+${fmt(round.earned)} ⚡${round.perfect ? ` · includes the +${RULES.perfectSparks} perfect bonus` : ""}</p>
            <ul class="sum-list">
              ${round.results.map((r) => {
                const w = word(r.wordId);
                return `<li class="sum-row ${r.caught ? "ok" : "no"}"><span aria-label="${r.caught ? "caught" : "missed"}">${r.caught ? "🐟" : "✗"}</span><b>${esc(w.word)}</b><span class="muted small">${esc(w.definition)}</span></li>`;
              }).join("")}
            </ul>
            ${round.caught < round.words.length ? '<p class="muted small">Missed words are flagged 🔁. They lead your next flashcard deck and sprint.</p>' : ""}
          </section>
          <div class="stack">
            <button class="btn wide" type="button" id="fish-again">🎣 Fish again</button>
            <button class="btn ghost wide" type="button" id="fish-dock">Change rod or spot</button>
            <button class="btn ghost wide" type="button" id="fish-exit">Back to the Vault</button>
          </div>
        </div>`;
      round = null;
      container.querySelector("#fish-again").addEventListener("click", start);
      container.querySelector("#fish-dock").addEventListener("click", () => go("dock"));
      container.querySelector("#fish-exit").addEventListener("click", exit);
    }

    function quit() {
      if (round) clearInterval(round.timer);
      round = null;
      go("dock");
    }
    function exit() {
      if (round) clearInterval(round.timer);
      round = null;
      screen = null;
      ctx.onExit();
    }

    // 1–4 hooks a fish while a cast is open.
    document.addEventListener("keydown", (e) => {
      if (screen !== "cast" || !round || round.done || container.hidden) return;
      if (e.altKey || e.ctrlKey || e.metaKey || e.target.closest("input, select, textarea") || document.querySelector('[aria-modal="true"]')) return;
      const i = "1234".indexOf(e.key);
      if (i >= 0) { e.preventDefault(); hook(i); }
    });

    return {
      open: () => { ctx.sfx.play("tap"); go("dock"); },
      render,
      active: () => screen !== null,
      playing: () => screen === "cast",
    };
  }

  SW.fishing = { RULES, RODS, SPOTS, rodById, spotById, emptyStats, mergeStats, buyItem, poolFor, makeCast, mount };
})();
