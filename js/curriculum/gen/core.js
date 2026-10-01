// SatWizz question generator: core.
//
// Each chapter file (gen/ch1.js … ch7.js) registers a function that builds
// that chapter's pool of generated questions from interchangeable parts
// (clause pairs, subjects, verbs, time clues…), written in the style of the
// chapter's hand-written set: short narrative passages, people as cast slots
// ({{NAME_1}}…), and the pack's scenery ({{LOCATION}}, {{EVENT}}, {{SKILL}}).
//
// Every generated question has the normal shape (text with one ______, 4
// choices, answer, rule, a note per choice) plus `gen: true`. Its id is a hash
// of its content ("g3-k2x9q"), so it stays the same across releases. Pools are
// deduplicated. Practice and the Derby step through each pool in a per-player
// shuffled order, so a question never repeats until the whole pool has been seen.
(function () {
  "use strict";
  const SW = window.SatWizz;
  const builders = {};

  const G = {
    // Registers a chapter's builder: () => array of question drafts.
    add(chapterId, build) { builders[chapterId] = build; },

    // Builds (once) and returns the chapter's pool.
    pool(chapterId) {
      G.cache = G.cache || {};
      if (G.cache[chapterId]) return G.cache[chapterId];
      const build = builders[chapterId];
      const seen = new Set();
      const out = [];
      for (const d of build ? build() : []) {
        const key = d.text + "|" + d.choices.join("|");
        if (seen.has(key)) continue;
        seen.add(key);
        out.push({
          id: `g${chapterId}-${SW.rng.hash(key).toString(36)}`,
          skill: d.skill,
          kind: d.kind || (chapterId === 5 ? "transition" : undefined),
          text: d.text,
          choices: d.choices,
          answer: d.answer || 0,
          notes: d.notes,
          rule: d.rule,
          gen: true,
        });
      }
      G.cache[chapterId] = out;
      return out;
    },

    // ---------- helpers for chapter builders ----------
    cap: (s) => (s.startsWith("{{") ? s : s.charAt(0).toUpperCase() + s.slice(1)),
    lastWord(s) {
      const i = s.lastIndexOf(" ");
      return [s.slice(0, i), s.slice(i + 1)];
    },
    firstWord(s) {
      const i = s.indexOf(" ");
      return [s.slice(0, i), s.slice(i + 1)];
    },
    // Every combination of the given lists (cartesian product).
    *product(...lists) {
      if (!lists.length) { yield []; return; }
      const [head, ...rest] = lists;
      for (const x of head) for (const r of G.product(...rest)) yield [x, ...r];
    },
    // Deterministic pick so the same inputs always give the same question.
    pick(list, seedStr) { return list[SW.rng.hash(seedStr) % list.length]; },
  };

  SW.gen = G;
})();
