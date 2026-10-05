// Deep Dive: saved progress (localStorage). Every read and write is guarded,
// so the site still works in a private window with storage blocked.
//
// Shape: { logbook: { [creatureId]: { seen, first } }, dives: [...], active }
//   active is the dive in progress, saved so a refresh resumes it.
(function () {
  "use strict";
  const DD = (window.DeepDive = window.DeepDive || {});
  const KEY = "deepdive.v1";

  const blank = () => ({ logbook: {}, dives: [], active: null });

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? Object.assign(blank(), JSON.parse(raw)) : blank();
    } catch (e) {
      return blank();
    }
  }

  const state = load();

  DD.store = {
    state,
    save() {
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* storage blocked */ }
    },
    // Records a sighting; returns true the first time this creature is seen.
    spot(id) {
      const entry = state.logbook[id];
      if (entry) { entry.seen += 1; return false; }
      state.logbook[id] = { seen: 1, first: Date.now() };
      return true;
    },
    totals() {
      const dives = state.dives.filter((d) => d.completed);
      return {
        dives: dives.length,
        minutes: Math.round(state.dives.reduce((s, d) => s + d.focusedMs, 0) / 60000),
        deepest: state.dives.reduce((m, d) => Math.max(m, d.reached), 0),
        found: Object.keys(state.logbook).length,
      };
    },
  };
})();
