// SatWizz Focus Meter (0–100%), shared by Practice, the Vocab Derby and
// the standalone Derby. State logic is pure; paint()/shake() touch the page.
//
//   • A wrong answer costs 25%. A rushed answer (faster than `rushMs`) costs 10%.
//   • Only two right answers in a row (+25%) or a Focus Elixir (back to 100%)
//     restore it.
//   • Every hour Focus recharges to 100% on its own (hourly()).
//   • Low Focus (under 50%) outlines open questions in orange; critical
//     (under 25%) in red and shakes the screen on a miss. Question text is
//     never blurred. In the Derby, missing Focus locks each
//     question for up to 9s while the rivals keep running, plus 4s after a miss.
//
// `st` is any object holding { focus, focusStreak } (the app state, or the
// standalone Derby's stats).
(function () {
  "use strict";
  const SW = (window.SatWizz = window.SatWizz || {});

  const RULES = Object.freeze({
    max: 100,
    miss: 25,
    rush: 10,
    restore: 25,
    restoreStreak: 2,
    low: 50,
    critical: 25,
    practiceRushMs: 3000, // nobody reads a passage and its choices in under 3s
    derbyRushMs: 1500,
    lockMax: 9, // seconds of Derby lock at 0% Focus
    stumble: 4, // extra lock after a wrong answer
    elixirPrice: 500,
    rechargeMs: 60 * 60 * 1000, // full recharge every hour
  });

  const clamp = (n) => Math.max(0, Math.min(RULES.max, Math.round(Number(n) || 0)));

  // Applies one answer. Returns what changed so the UI can say so.
  function apply(st, { correct, ms = Infinity, rushMs = RULES.practiceRushMs }) {
    const before = clamp(st.focus);
    let restored = false;
    let f = before;
    if (correct) {
      st.focusStreak = (st.focusStreak || 0) + 1;
      if (st.focusStreak >= RULES.restoreStreak) {
        st.focusStreak = 0;
        if (f < RULES.max) restored = true;
        f += RULES.restore;
      }
    } else {
      st.focusStreak = 0;
      f -= RULES.miss;
    }
    const rushed = ms < rushMs;
    if (rushed) f -= RULES.rush;
    st.focus = clamp(f);
    return { before, after: st.focus, delta: st.focus - before, rushed, restored };
  }

  function refill(st, now = Date.now()) {
    st.focus = RULES.max;
    st.focusStreak = 0;
    st.focusResetAt = now; // an Elixir also restarts the hourly clock
  }

  // The hourly recharge: once an hour has passed since the last one, Focus
  // goes back to 100%. Returns true when it refilled a meter that wasn't full.
  // A missing clock starts now.
  function hourly(st, now = Date.now()) {
    if (!st.focusResetAt || st.focusResetAt > now) {
      st.focusResetAt = now;
      return false;
    }
    if (now - st.focusResetAt < RULES.rechargeMs) return false;
    const wasLow = clamp(st.focus) < RULES.max;
    st.focus = RULES.max;
    st.focusStreak = 0;
    // Keep the hourly rhythm: the next recharge is a whole number of hours on.
    st.focusResetAt += Math.floor((now - st.focusResetAt) / RULES.rechargeMs) * RULES.rechargeMs;
    return wasLow;
  }
  // Minutes until the next hourly recharge.
  const nextRechargeMin = (st, now = Date.now()) =>
    Math.max(1, Math.ceil(((st.focusResetAt || now) + RULES.rechargeMs - now) / 60000));

  // Seconds the next Derby question stays locked.
  const lockFor = (focus, lastWrong) =>
    Math.round(((RULES.max - clamp(focus)) / RULES.max) * RULES.lockMax * 10) / 10 + (lastWrong ? RULES.stumble : 0);

  const level = (focus) => (focus < RULES.critical ? "critical" : focus < RULES.low ? "low" : "ok");

  // A small meter: <span class="fmeter …"><i style="width:…"></i></span> 75%
  const meterHtml = (focus, label = true) => {
    const f = clamp(focus);
    return `<span class="fmeter ${level(f)}" role="meter" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${f}" aria-label="Focus ${f}%">${label ? '<b aria-hidden="true">🧠</b>' : ""}<span class="fmeter-bar" aria-hidden="true"><i style="width:${f}%"></i></span><span class="fmeter-num" aria-hidden="true">${f}%</span></span>`;
  };

  // Screen effects (browser only): <body data-focus="ok|low|critical"> drives
  // the low-Focus outline in CSS (question text is never blurred); shake() runs a one-off shake on a miss at critical Focus.
  function paint(focus) {
    if (typeof document === "undefined") return;
    document.body.dataset.focus = level(clamp(focus));
  }
  function shake(el) {
    if (typeof document === "undefined") return;
    const target = el || document.getElementById("app") || document.body;
    target.classList.remove("focus-shake");
    void target.offsetWidth;
    target.classList.add("focus-shake");
    setTimeout(() => target.classList.remove("focus-shake"), 600);
  }

  SW.focus = { RULES, apply, refill, hourly, nextRechargeMin, lockFor, level, clamp, meterHtml, paint, shake };
})();
