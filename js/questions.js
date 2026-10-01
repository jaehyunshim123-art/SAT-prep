// SatWizz curriculum framework.
//
// Loaded BEFORE the chapter files. It defines:
//   • CURRICULUM_PLAN: the 7-chapter sequence (plus two bonus chapters)
//   • STEMS: the official Digital SAT question stems
//   • SatWizz.curriculum.addChapter(): how a chapter file registers itself
//   • SatWizz.curriculum.build(): called once by the app after every chapter
//     file has loaded; orders chapters and builds the flat question list
//
// ─── Adding or filling a chapter (Phase 2) ─────────────────────────────────
// Create js/curriculum/chN.js, add a <script> for it in index.html (after this
// file, before js/app.js), and register it:
//
//   SatWizz.curriculum.addChapter({
//     id: 3,                                   // must match CURRICULUM_PLAN
//     short: "Subject-Verb Agreement",         // chapter bar / drawer label
//     title: "Subject-Verb Agreement",         // lesson card heading
//     pause: {                                 // the "Explanation Pause" lesson
//       summary: "One or two plain sentences.",
//       rules: ["Rule 1…", "Rule 2…"],
//       patterns: [{ f: "The box [of pens] is", ok: true }, { f: "…", ok: false }],
//       example: "A worked example with {{NAME_1}}.",
//     },
//     questions: [ /* see QUESTION FORMAT */ ],
//   });
//
// ─── QUESTION FORMAT (Digital SAT / Bluebook style) ─────────────────────────
//   {
//     id: "c3-1",                 // unique
//     skill: "Prepositional traps",
//     stem: "conventions",        // key of STEMS (optional; see defaults below)
//     text: "Passage of 1–3 sentences with ONE target: a blank ______ or an [[underlined segment]].",
//     choices: ["A", "B", "C", "D"],
//     answer: 0,                  // index into choices (shuffled on screen)
//     notes: ["why A works/fails", "…B", "…C", "…D"],
//     shortcut: "3:1" | "2:1",    // optional verb-choice ratio check
//     forms: ["s", "p", "p", "p"],// with shortcut: s/p verb, x non-verb
//   }
//   Stem defaults: "transition" if kind === "transition", otherwise
//   "conventions" for blanks and "conventionsUnderlined" for [[underlines]].
//
// ─── Placeholders (keep passages original; the cast fills them in) ─────────
//   {{NAME_1}} {{NAME_2}} {{NAME_3}}      people
//   {{NAME_1_POSS}} / {{NAME_1_OBJ}}      his/her/their, him/her/them (any NAME_n)
//   {{LOCATION}} {{EVENT}} {{SKILL}}      theme flavor; always mid-sentence
//   Never make a subject pronoun agree with a verb: custom casts can use "they".
//
// Run `node scripts/validate-content.js` after editing.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  // The 7-chapter sequence, then two bonus chapters. Chapters unlock in this order.
  // Each core chapter leads with its pop-culture set (clause-derby/src/chN.js,
  // registered by js/curriculum/clause.js), then the extra practice in
  // js/curriculum/chN.js.
  SW.CURRICULUM_PLAN = [
    { id: 1, short: "Clause Connectors", title: "Independent Clause Connectors & Sentence Boundaries" },
    { id: 2, short: "Subject-Verb Agreement", title: "Subject-Verb Agreement" },
    { id: 3, short: "Verb vs. Non-Verb", title: "Verb vs. Non-Verb Identification (Appositives)" },
    { id: 4, short: "Verb Tenses", title: "Verb Tenses & Aspect" },
    { id: 5, short: "Logical Transitions", title: "Logical Transitions" },
    { id: 6, short: "Semicolons, Dashes, Colons", title: "Punctuation Fundamentals (Semicolon, Dash, Colon)" },
    { id: 7, short: "Appositives", title: "Appositives & Non-Essential Clauses" },
    { id: 8, short: "Modifiers & Parallelism", title: "Bonus: Modifiers & Parallelism", bonus: true },
    { id: 9, short: "Pronouns & Possessives", title: "Bonus: Pronouns & Possessives", bonus: true },
  ];

  // Saves from before the 7-chapter curriculum (SAVE_VERSION < 3) used ids 1-10:
  // old → new chapter id. Old chapter 1 (complete sentences) was retired.
  SW.LEGACY_CHAPTER_MAP = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 7: 6, 8: 7, 9: 8, 10: 9 };

  // Share of a chapter's questions you need right to unlock the next one.
  SW.UNLOCK_SHARE = 0.6;

  // Official Digital SAT question stems. {word} is filled for vocab "meaning" items.
  SW.STEMS = {
    conventions: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    conventionsUnderlined: "Which choice conforms to the conventions of Standard English?",
    transition: "Which choice completes the text with the most logical transition?",
    wordChoice: "Which choice completes the text with the most logical and precise word or phrase?",
    meaning: "As used in the text, what does the word “{word}” most nearly mean?",
  };

  // [[underlined segment]] marker used in passages.
  SW.UNDERLINE_RE = /\[\[([^\]]+)\]\]/;

  // Which stem a question shows.
  SW.stemFor = function stemFor(q) {
    if (q.stem && SW.STEMS[q.stem]) return SW.STEMS[q.stem];
    if (q.kind === "transition") return SW.STEMS.transition;
    return SW.UNDERLINE_RE.test(q.text) ? SW.STEMS.conventionsUnderlined : SW.STEMS.conventions;
  };

  // Seeded randomness (stable per user): question casts and the no-repeat
  // order of generated questions.
  SW.rng = {
    hash(str) {
      let h = 2166136261;
      for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
      return h >>> 0;
    },
    // mulberry32
    make(seed) {
      let a = seed >>> 0;
      return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
      };
    },
    shuffle(arr, seed) {
      const r = SW.rng.make(seed);
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(r() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
  };

  const registered = [];

  SW.curriculum = {
    // A chapter can register more than once (pop-culture set, then extra
    // practice): questions are appended, and the first registration's title
    // and lesson win. Lesson patterns/example missing from it are filled in.
    addChapter(def) {
      const plan = SW.CURRICULUM_PLAN.find((p) => p.id === def.id);
      if (!plan) console.warn(`SatWizz: chapter ${def.id} isn't in CURRICULUM_PLAN`);
      const prev = registered.find((c) => c.id === def.id);
      if (!prev) {
        registered.push({ ...def, ...plan, questions: (def.questions || []).slice() });
        return;
      }
      prev.questions.push(...(def.questions || []));
      if (!prev.pause) prev.pause = def.pause;
      else if (def.pause) {
        if (!prev.pause.patterns || !prev.pause.patterns.length) prev.pause.patterns = def.pause.patterns || [];
        if (!prev.pause.example) prev.pause.example = def.pause.example || "";
      }
    },

    // Orders chapters and exposes SatWizz.chapters / SatWizz.questions.
    // Planned chapters without a file yet show up with no questions.
    build() {
      const byId = new Map(registered.map((c) => [c.id, c]));
      SW.chapters = SW.CURRICULUM_PLAN
        .map((p) => byId.get(p.id) || { ...p, pause: null, questions: [] })
        .concat(registered.filter((c) => !SW.CURRICULUM_PLAN.some((p) => p.id === c.id)))
        .sort((a, b) => a.id - b.id);
      // Generated pools (js/curriculum/gen/): thousands of extra questions per
      // chapter, served after the core set and never repeated (see app.js).
      for (const ch of SW.chapters) ch.pool = SW.gen ? SW.gen.pool(ch.id).map((q) => Object.assign(q, { chapterId: ch.id })) : [];
      SW.questions = SW.chapters.flatMap((ch) => [...ch.questions.map((q) => Object.assign(q, { chapterId: ch.id })), ...ch.pool]);
      SW.chapterById = (id) => SW.chapters.find((c) => c.id === id);
      SW.CORE_CHAPTERS = SW.chapters.filter((c) => !c.bonus).length;
      return SW.chapters;
    },
  };
})();
