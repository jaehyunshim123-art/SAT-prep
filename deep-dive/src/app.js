// Deep Dive: a focus timer where your study session is a submarine dive.
//
// Screens: home (pick a destination) → dive (live descent) → results.
// The logbook (creatures you've found) opens from home.
//
// Time is wall-clock based (Date.now), so background tabs and refreshes don't
// break the timer: the active dive is saved and resumes on reload. Leaving the
// tab mid-dive counts as "drift" and is subtracted from focused time.
//
// Dev: add ?speed=60 to the URL to run dives 60× faster.
(function () {
  "use strict";
  const DD = window.DeepDive;
  const store = DD.store;
  const S = store.state;

  const $ = (sel, el = document) => el.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const fmt = (n) => Number(Math.round(n)).toLocaleString("en-US");
  const pad = (n) => String(n).padStart(2, "0");
  const clock = (ms) => {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60);
    return h ? `${h}:${pad(m)}:${pad(s % 60)}` : `${pad(m)}:${pad(s % 60)}`;
  };
  const creature = (id) => DD.CREATURES.find((c) => c.id === id);
  const destination = (id) => DD.DESTINATIONS.find((d) => d.id === id);

  const SPEED = Math.max(1, Number(new URLSearchParams(location.search).get("speed")) || DD.defaultSpeed || 1);
  const DRIFT_WARN_MS = 10000; // away longer than this → "your sub drifted" note

  const app = $("#app");
  let picked = DD.DESTINATIONS[1].id;
  let ticker = null;
  let lastResult = null;

  // ---------- Water color ----------
  // Depth is mapped on a log scale, so the color keeps changing all the way
  // down instead of going black after the first few hundred meters.
  const STOPS = [
    [0, [92, 200, 235]],
    [0.35, [28, 128, 184]],
    [0.58, [13, 72, 122]],
    [0.75, [8, 36, 64]],
    [0.89, [4, 15, 32]],
    [1, [1, 4, 10]],
  ];
  const depthT = (m) => Math.min(1, Math.log10(m + 1) / Math.log10(11001));
  function waterColor(m) {
    const t = depthT(m);
    for (let i = 1; i < STOPS.length; i++) {
      const [t1, c1] = STOPS[i];
      const [t0, c0] = STOPS[i - 1];
      if (t <= t1) {
        const k = (t - t0) / (t1 - t0);
        return `rgb(${c0.map((v, j) => Math.round(v + (c1[j] - v) * k)).join(",")})`;
      }
    }
    return "rgb(1,4,10)";
  }
  function paintWater(m) {
    const top = waterColor(m), bottom = waterColor(m * 1.6 + 30);
    document.documentElement.style.setProperty("--water-top", top);
    document.documentElement.style.setProperty("--water-bottom", bottom);
    document.documentElement.style.setProperty("--light", String(Math.max(0, 1 - depthT(m) / 0.6)));
    $("#theme-color")?.setAttribute("content", top);
  }

  // ---------- Dive engine ----------
  function startDive(destId, task) {
    const dest = destination(destId);
    const durationMs = dest.minutes * 60000;
    // Roll this dive's sightings now: each creature above the destination
    // depth may show up, at the moment the sub passes its depth.
    const sightings = DD.CREATURES
      .filter((c) => c.depth <= dest.depth && Math.random() < DD.RARITY[c.rarity])
      .map((c) => ({ id: c.id, at: (c.depth / dest.depth) * durationMs }));
    S.active = { dest: dest.id, task: task || "", start: Date.now(), durationMs, sightings, seen: [], fresh: [], hiddenMs: 0, hiddenAt: null };
    store.save();
    showDive();
  }

  const elapsed = (a) => Math.min(a.durationMs, (Date.now() - a.start) * SPEED);
  const depthNow = (a) => (elapsed(a) / a.durationMs) * destination(a.dest).depth;

  function endDive(completed) {
    const a = S.active;
    if (!a) return;
    if (a.hiddenAt) { a.hiddenMs += Date.now() - a.hiddenAt; a.hiddenAt = null; }
    const spent = elapsed(a);
    const dive = {
      dest: a.dest,
      task: a.task,
      start: a.start,
      completed,
      reached: Math.round(depthNow(a)),
      focusedMs: Math.max(0, spent - a.hiddenMs * SPEED),
      seen: a.seen,
      fresh: a.fresh,
    };
    S.dives.push(dive);
    S.active = null;
    store.save();
    stopTicker();
    lastResult = dive;
    showResults();
  }

  function tick() {
    const a = S.active;
    if (!a) return;
    const t = elapsed(a);
    const m = depthNow(a);

    for (const s of a.sightings) {
      if (t >= s.at && !a.seen.includes(s.id)) {
        a.seen.push(s.id);
        const isNew = store.spot(s.id);
        if (isNew) a.fresh.push(s.id);
        store.save();
        announce(creature(s.id), isNew);
      }
    }

    paintWater(m);
    $("#depth").textContent = fmt(m);
    $("#zone").textContent = DD.zoneAt(m).name;
    $("#left").textContent = clock((a.durationMs - t) / SPEED);
    $("#bar").style.width = `${(t / a.durationMs) * 100}%`;
    $("#gauge-sub").style.top = `${depthT(m) * 100}%`;
    $("#count").textContent = a.seen.length;
    document.title = `${clock((a.durationMs - t) / SPEED)} · ${fmt(m)} m · Deep Dive`;

    if (t >= a.durationMs) endDive(true);
  }

  function startTicker() { stopTicker(); tick(); ticker = setInterval(tick, 250); }
  function stopTicker() { if (ticker) clearInterval(ticker); ticker = null; document.title = "Deep Dive"; }

  // Leaving the tab mid-dive: time away is "drift", not focus.
  document.addEventListener("visibilitychange", () => {
    const a = S.active;
    if (!a) return;
    if (document.hidden) {
      a.hiddenAt = Date.now();
      store.save();
    } else if (a.hiddenAt) {
      const away = Date.now() - a.hiddenAt;
      a.hiddenMs += away;
      a.hiddenAt = null;
      store.save();
      if (away > DRIFT_WARN_MS) toast(`Your sub drifted for ${clock(away)} while you were away. Stay with it!`);
    }
  });

  // ---------- Sightings ----------
  function announce(c, isNew) {
    const swim = document.createElement("div");
    swim.className = "swimmer";
    swim.textContent = c.emoji;
    swim.style.top = `${20 + Math.random() * 50}%`;
    if (Math.random() < 0.5) swim.classList.add("rtl");
    $(".sea")?.appendChild(swim);
    setTimeout(() => swim.remove(), 9000);

    const card = document.createElement("div");
    card.className = "sighting";
    card.innerHTML = `<span class="sighting-emoji">${c.emoji}</span>
      <div><div class="sighting-name">${esc(c.name)}${isNew ? ' <span class="new">NEW</span>' : ""}</div>
      <div class="sighting-fact">${esc(c.fact)}</div></div>`;
    const box = $("#sightings");
    if (!box) return;
    box.appendChild(card);
    while (box.children.length > 2) box.firstElementChild.remove(); // newest two only
    setTimeout(() => card.classList.add("out"), 7000);
    setTimeout(() => card.remove(), 7600);
  }

  function toast(text) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = text;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("out"), 4500);
    setTimeout(() => t.remove(), 5000);
  }

  // ---------- Screens ----------
  function showHome() {
    stopTicker();
    paintWater(0);
    const tot = store.totals();
    app.innerHTML = `
      <main class="screen home">
        <header class="brand">
          <h1>Deep Dive</h1>
          <p>Focus to dive. The longer you stay, the deeper you go.</p>
        </header>
        <section class="stats" aria-label="Your stats">
          <div><b>${tot.dives}</b><span>dives</span></div>
          <div><b>${(tot.minutes / 60).toFixed(1)}</b><span>hours</span></div>
          <div><b>${fmt(tot.deepest)} m</b><span>deepest</span></div>
          <button class="stat-btn" id="open-log"><b>${tot.found}/${DD.CREATURES.length}</b><span>logbook →</span></button>
        </section>
        <h2 class="label">Choose your dive</h2>
        <section class="dests" role="radiogroup" aria-label="Dive destination">
          ${DD.DESTINATIONS.map((d) => `
            <button class="dest${d.id === picked ? " on" : ""}" role="radio" aria-checked="${d.id === picked}" data-dest="${d.id}">
              <span class="dest-swatch" style="background:${waterColor(d.depth)}"></span>
              <span class="dest-main"><b>${esc(d.name)}</b><small>${esc(d.blurb)}</small></span>
              <span class="dest-meta"><b>${d.minutes} min</b><small>${fmt(d.depth)} m</small></span>
            </button>`).join("")}
        </section>
        <label class="task">
          <span class="label">What are you focusing on? <i>(optional)</i></span>
          <input id="task" maxlength="80" placeholder="e.g. Chapter 4 biology notes">
        </label>
        <button class="primary" id="go">Start dive</button>
        ${SPEED > 1 ? `<p class="dev">Running ${SPEED}× faster for testing</p>` : ""}
      </main>`;

    app.querySelectorAll(".dest").forEach((b) => b.addEventListener("click", () => {
      picked = b.dataset.dest;
      app.querySelectorAll(".dest").forEach((x) => {
        x.classList.toggle("on", x === b);
        x.setAttribute("aria-checked", String(x === b));
      });
    }));
    $("#go").addEventListener("click", () => startDive(picked, $("#task").value.trim()));
    $("#open-log").addEventListener("click", showLogbook);
  }

  function showDive() {
    const a = S.active;
    const dest = destination(a.dest);
    app.innerHTML = `
      <main class="screen dive">
        <div class="sea" aria-hidden="true">
          <div class="rays"></div>
          ${Array.from({ length: 14 }, (_, i) => `<span class="bubble" style="left:${(i * 37) % 100}%;animation-delay:${(i * 0.7) % 6}s;animation-duration:${6 + (i % 5)}s"></span>`).join("")}
          <div class="sub">${SUB_SVG}</div>
        </div>
        <div class="hud">
          <div class="hud-top">
            <div><small>Heading to</small><b>${esc(dest.name)}</b></div>
            <div class="right"><small>Spotted</small><b id="count">0</b></div>
          </div>
          ${a.task ? `<p class="hud-task">${esc(a.task)}</p>` : ""}
          <div class="readout">
            <div class="depth"><span id="depth">0</span><small>m</small></div>
            <div id="zone" class="zone">Sunlight Zone</div>
            <div id="left" class="left">--:--</div>
          </div>
          <div class="progress"><div id="bar"></div></div>
          <button class="ghost" id="surface">Surface early</button>
        </div>
        <div class="gauge" aria-hidden="true">
          ${DD.ZONES.map((z) => `<span class="gauge-tick" style="top:${depthT(z.top) * 100}%">${fmt(z.top)}</span>`).join("")}
          <span class="gauge-dest" style="top:${depthT(dest.depth) * 100}%"></span>
          <span id="gauge-sub" class="gauge-sub"></span>
        </div>
        <div id="sightings" class="sightings" aria-live="polite"></div>
      </main>`;
    // Two taps to surface, so a stray tap doesn't end the dive.
    let armed = null;
    $("#surface").addEventListener("click", (e) => {
      const btn = e.currentTarget;
      if (armed) { clearTimeout(armed); endDive(false); return; }
      btn.textContent = "Tap again to surface (dive ends unfinished)";
      btn.classList.add("armed");
      armed = setTimeout(() => { armed = null; btn.textContent = "Surface early"; btn.classList.remove("armed"); }, 3000);
    });
    startTicker();
  }

  function showResults() {
    const d = lastResult;
    const dest = destination(d.dest);
    paintWater(d.reached);
    const list = d.seen.map(creature);
    app.innerHTML = `
      <main class="screen results">
        <h1>${d.completed ? "Dive complete!" : "You surfaced early"}</h1>
        <p class="sub-head">${d.completed ? `You reached ${esc(dest.name)}.` : `Your goal was ${esc(dest.name)} (${fmt(dest.depth)} m).`}</p>
        <section class="stats">
          <div><b>${fmt(d.reached)} m</b><span>depth</span></div>
          <div><b>${clock(d.focusedMs / SPEED)}</b><span>focused</span></div>
          <div><b>${list.length}</b><span>spotted</span></div>
          <div><b>${d.fresh.length}</b><span>new</span></div>
        </section>
        ${list.length ? `<h2 class="label">Creatures you spotted</h2>
        <ul class="found">${list.map((c) => `<li><span>${c.emoji}</span>${esc(c.name)}${d.fresh.includes(c.id) ? ' <span class="new">NEW</span>' : ""}</li>`).join("")}</ul>`
        : `<p class="muted">Nothing spotted this time. Dive longer to meet more creatures.</p>`}
        <div class="row">
          <button class="primary" id="again">Dive again</button>
          <button class="ghost" id="log">Logbook</button>
        </div>
      </main>`;
    $("#again").addEventListener("click", showHome);
    $("#log").addEventListener("click", showLogbook);
  }

  function showLogbook() {
    stopTicker();
    paintWater(1500);
    const zones = DD.ZONES.map((z, i) => {
      const bottom = DD.ZONES[i + 1]?.top ?? Infinity;
      return { zone: z, list: DD.CREATURES.filter((c) => c.depth >= z.top && c.depth < bottom) };
    });
    app.innerHTML = `
      <main class="screen logbook">
        <button class="back" id="back">← Back</button>
        <h1>Logbook</h1>
        <p class="sub-head">${Object.keys(S.logbook).length} of ${DD.CREATURES.length} creatures found</p>
        ${zones.map(({ zone, list }) => `
          <h2 class="label">${esc(zone.name)} <i>${fmt(zone.top)} m+</i></h2>
          <div class="cards">
            ${list.map((c) => {
              const e = S.logbook[c.id];
              return e
                ? `<article class="card"><span class="card-emoji">${c.emoji}</span><b>${esc(c.name)}</b><small>${fmt(c.depth)} m · ${c.rarity} · seen ×${e.seen}</small><p>${esc(c.fact)}</p></article>`
                : `<article class="card locked"><span class="card-emoji">?</span><b>Undiscovered</b><small>${fmt(c.depth)} m · ${c.rarity}</small></article>`;
            }).join("")}
          </div>`).join("")}
      </main>`;
    $("#back").addEventListener("click", showHome);
  }

  const SUB_SVG = `<svg viewBox="0 0 160 90" width="160" height="90">
    <defs><linearGradient id="beam" x1="0" x2="1"><stop offset="0" stop-color="#fff6c4" stop-opacity=".55"/><stop offset="1" stop-color="#fff6c4" stop-opacity="0"/></linearGradient></defs>
    <polygon class="beam" points="128,50 300,10 300,95" fill="url(#beam)"/>
    <rect x="62" y="16" width="26" height="20" rx="6" fill="#f2b62f"/>
    <rect x="72" y="4" width="4" height="14" fill="#d79a1c"/>
    <ellipse cx="80" cy="50" rx="52" ry="24" fill="#ffc83d"/>
    <circle cx="66" cy="50" r="8" fill="#0b3550" stroke="#d79a1c" stroke-width="3"/>
    <circle cx="90" cy="50" r="8" fill="#0b3550" stroke="#d79a1c" stroke-width="3"/>
    <circle cx="128" cy="50" r="4" fill="#fff6c4"/>
    <path d="M28 50 L12 34 L12 66 Z" fill="#d79a1c"/>
  </svg>`;

  // A dive in progress survives a refresh.
  if (S.active) {
    const a = S.active;
    if (a.hiddenAt) { a.hiddenMs += Date.now() - a.hiddenAt; a.hiddenAt = null; }
    showDive(); // finishes straight away if the dive ended while the page was closed
  } else {
    showHome();
  }
})();
