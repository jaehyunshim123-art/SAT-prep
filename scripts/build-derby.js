// Builds the standalone SAT Vocabulary Derby: one self-contained HTML file
// (derby/index.html) that runs by double-click or on any static host.
//
//   node scripts/build-derby.js
//
// It inlines the same tested sources the SatWizz app uses (styles, word bank,
// Derby engine and views, sounds) plus a small standalone shell: HUD, a
// localStorage save, and the context object SatWizz.derby.mount() expects.
// Re-run it after changing any of the files listed in SOURCES.
"use strict";

const fs = require("fs");
const path = require("path");

const repo = path.resolve(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(repo, f), "utf8");
// Keep inlined code from closing its own <script>/<style> tag early.
const safeScript = (code) => code.replace(/<\/script/gi, "<\\/script");
const safeStyle = (code) => code.replace(/<\/style/gi, "<\\/style");

// Order matters: themes (pronouns, default cast) → questions (stems) →
// derby (engine) → vocab (words; uses SatWizz.derby at call time) → sfx.
const SOURCES = ["js/themes.js", "js/questions.js", "js/focus.js", "js/derby.js", "js/fishing.js", "js/vocab.js", "js/sfx.js"];

// The standalone shell: state, HUD, toasts, celebrations and the Derby ctx.
const SHELL = String.raw`
(function () {
  "use strict";

  const SW = window.SatWizz;
  const KEY = "satwizz-derby.v1";
  const START_BALANCE = 2500;
  const cast = SW.themes.find((t) => t.id === "everyday"); // John, Jane, Sam
  const $ = (sel) => document.querySelector(sel);
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

  // {{NAME_1}}, {{NAME_2_POSS}}, {{LOCATION}}, … → the default cast.
  const PLACEHOLDER = /\{\{(?:NAME_([123])(?:_(POSS|OBJ))?|(LOCATION|EVENT|SKILL))\}\}/g;
  function fill(template, c = cast, mark = true) {
    return esc(template).replace(PLACEHOLDER, (m, n, form, flavorKey) => {
      if (n) {
        const p = c.people[Number(n) - 1];
        if (form) return esc(SW.pronouns[p.pro][form === "POSS" ? "his" : "him"]);
        return mark ? '<span class="cast">' + esc(p.name) + "</span>" : esc(p.name);
      }
      const flavor = { LOCATION: c.place, SKILL: c.craft, EVENT: c.event }[flavorKey];
      return flavor != null ? esc(flavor) : m;
    });
  }

  const pad = (n) => String(n).padStart(2, "0");
  const todayKey = () => { const d = new Date(); return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

  // ---------- Save (localStorage; the game still plays if it's blocked) ----------
  let canSave = true;
  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { canSave = false; return null; }
  }
  const saved = load() || {};
  const S = {
    sparks: Number.isFinite(saved.sparks) ? Math.max(0, saved.sparks) : START_BALANCE,
    muted: Boolean(saved.muted),
    stipendDay: saved.stipendDay || null,
    answered: saved.answered || 0,
    correct: saved.correct || 0,
    vocab: SW.vocab.mergeProgress(saved.vocab, null), // word flags + Derby stats, gear, Focus
  };
  function save() {
    if (!canSave) return;
    try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { canSave = false; toast("Progress can't be saved in this browser mode."); }
  }

  // ---------- Shell ----------
  const app = $("#app");
  app.innerHTML =
    '<header class="hud">' +
      '<div class="brand" aria-label="SAT Vocabulary Derby">🐎 SAT Vocab <span>Derby</span></div>' +
      '<span class="pill sparks" id="hud-sparks" title="Your Sparks balance"></span>' +
      '<button class="pill" id="hud-sound" type="button"></button>' +
    "</header>" +
    '<main class="view scrollview solo" id="view-derby"></main>' +
    '<footer class="disclaimer">SatWizz is an independent practice tool and is not affiliated with or endorsed by the College Board. Names in practice sentences are used for fun and don\'t imply any endorsement or affiliation.</footer>';

  const fmt = new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 });
  function renderHud(bump) {
    const pill = $("#hud-sparks");
    pill.textContent = "⚡ " + (S.sparks >= 10000 ? fmt.format(S.sparks) : S.sparks.toLocaleString());
    pill.setAttribute("aria-label", S.sparks + " Sparks");
    if (bump && bump.includes("sparks")) { pill.classList.remove("bump"); void pill.offsetWidth; pill.classList.add("bump"); }
    const sound = $("#hud-sound");
    sound.textContent = S.muted ? "🔇" : "🔊";
    sound.setAttribute("aria-label", S.muted ? "Sound off" : "Sound on");
    sound.setAttribute("aria-pressed", String(!S.muted));
    SW.focus.paint(S.vocab.derby ? S.vocab.derby.focus : 100); // low-Focus blur
  }
  $("#hud-sound").addEventListener("click", () => {
    S.muted = !S.muted;
    SW.sfx.setMuted(S.muted);
    save();
    renderHud();
    SW.sfx.play("tap");
  });
  SW.sfx.setMuted(S.muted);

  let toastTimer;
  function toast(msg) {
    document.querySelector(".toast")?.remove();
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = msg;
    document.body.append(t);
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.remove(), 3200);
  }

  const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  function celebrate(emoji, title, sub) {
    const wrap = document.createElement("div");
    wrap.className = "burst";
    wrap.setAttribute("role", "status");
    wrap.innerHTML = '<div class="burst-card"><span class="e" aria-hidden="true">' + emoji + "</span><b>" + esc(title) + "</b><span>" + esc(sub) + "</span></div>";
    document.body.append(wrap);
    if (!reducedMotion()) {
      const colors = ["var(--flame)", "var(--flame-2)", "var(--volt)", "var(--good)", "var(--ice)"];
      for (let i = 0; i < 26; i++) {
        const c = document.createElement("i");
        c.className = "confetti";
        const angle = Math.random() * Math.PI * 2;
        const dist = 120 + Math.random() * 180;
        c.style.setProperty("--dx", Math.cos(angle) * dist + "px");
        c.style.setProperty("--dy", Math.sin(angle) * dist + "px");
        c.style.setProperty("--rot", Math.random() * 720 - 360 + "deg");
        c.style.background = colors[i % colors.length];
        document.body.append(c);
        setTimeout(() => c.remove(), 1400);
      }
    }
    setTimeout(() => wrap.remove(), 2000);
  }

  // ---------- The Derby ----------
  const derby = SW.derby.mount({
    container: $("#view-derby"),
    standalone: true,
    getState: () => S,
    save,
    esc,
    fill: (text, c, mark) => fill(text, c || cast, mark),
    todayKey,
    sfx: SW.sfx,
    toast,
    celebrate,
    earn: (n) => { S.sparks += n; return n; },
    recordAnswer: (ok) => { S.answered += 1; if (ok) S.correct += 1; },
    renderHud,
    shake: () => SW.focus.shake(),
    onExit: () => derby.open(),
  });

  renderHud();
  save(); // first visit: store the 2,500 starting balance
  derby.open();
  if (!canSave) toast("Saving is off in this browser mode. You can still race.");
})();
`;

const css = read("css/styles.css");
const scripts = SOURCES.map((f) => "\n/* ===== " + f + " ===== */\n" + read(f)).join("\n");

const html = `<!doctype html>
<!-- Generated by scripts/build-derby.js from the SatWizz sources. Edit those, then rebuild. -->
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>SAT Vocabulary Derby</title>
<meta name="description" content="SAT Vocabulary Derby: race seven CPU rivals by answering advanced Digital SAT vocabulary questions. Bet Sparks, keep your Focus, and kit out your horse in the Stable.">
<meta name="theme-color" content="#eaeef8" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#0d1322" media="(prefers-color-scheme: dark)">
<link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Ctext y='.9em' font-size='90'%3E%F0%9F%90%8E%3C/text%3E%3C/svg%3E">
<!-- Optional web fonts; the page falls back to system fonts offline. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap">
<style>
${safeStyle(css)}
/* ---------- Standalone build ---------- */
.scrollview.solo { padding-block: 4px 24px; }
.stipend p { margin: 0; }
.solo .pill-sm { display: none; } /* the header already shows the balance */
</style>
</head>
<body>
<div id="app"></div>
<noscript><p style="padding:16px">SAT Vocabulary Derby needs JavaScript to run.</p></noscript>
<script>
${safeScript(scripts)}
</script>
<script>
${safeScript(SHELL)}
</script>
</body>
</html>
`;

const out = path.join(repo, "derby", "index.html");
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`wrote ${path.relative(repo, out)} (${(html.length / 1024).toFixed(0)} KB)`);
