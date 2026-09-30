// SatWizz curriculum framework.
//
// Loaded BEFORE the chapter files. It defines:
//   • CURRICULUM_PLAN: the 9-chapter sequence (plus an optional bonus chapter)
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

  // The 9-chapter sequence. Chapters unlock in this order.
  SW.CURRICULUM_PLAN = [
    { id: 1, short: "Complete Sentences", title: "Identifying Independent Clauses" },
    { id: 2, short: "Connecting Clauses", title: "Connecting Independent Clauses" },
    { id: 3, short: "Subject-Verb Agreement", title: "Subject-Verb Agreement" },
    { id: 4, short: "Verb vs. Non-Verb", title: "Verb vs. Non-Verb Identification" },
    { id: 5, short: "Verb Tenses", title: "Verb Tenses" },
    { id: 6, short: "Transitions", title: "Transitions" },
    { id: 7, short: "Semicolons, Colons, Dashes", title: "Punctuation Fundamentals: Semicolons, Colons, Dashes" },
    { id: 8, short: "Appositives", title: "Appositives & Non-Essential Clauses" },
    { id: 9, short: "Modifiers & Parallelism", title: "Modifiers & Parallelism" },
    { id: 10, short: "Pronouns & Possessives", title: "Bonus: Pronouns & Possessives", bonus: true },
  ];

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

  const registered = [];

  SW.curriculum = {
    addChapter(def) {
      const plan = SW.CURRICULUM_PLAN.find((p) => p.id === def.id);
      if (!plan) console.warn(`SatWizz: chapter ${def.id} isn't in CURRICULUM_PLAN`);
      registered.push({ ...plan, ...def, questions: def.questions || [] });
    },

    // Orders chapters and exposes SatWizz.chapters / SatWizz.questions.
    // Planned chapters without a file yet show up with no questions.
    build() {
      const byId = new Map(registered.map((c) => [c.id, c]));
      SW.chapters = SW.CURRICULUM_PLAN
        .map((p) => byId.get(p.id) || { ...p, pause: null, questions: [] })
        .concat(registered.filter((c) => !SW.CURRICULUM_PLAN.some((p) => p.id === c.id)))
        .sort((a, b) => a.id - b.id);
      SW.questions = SW.chapters.flatMap((ch) => ch.questions.map((q) => Object.assign(q, { chapterId: ch.id })));
      SW.chapterById = (id) => SW.chapters.find((c) => c.id === id);
      SW.CORE_CHAPTERS = SW.chapters.filter((c) => !c.bonus).length;
      return SW.chapters;
    },
  };
})();
