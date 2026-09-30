// SatWizz curriculum loader.
//
// Each chapter lives in js/curriculum/chN.js and pushes itself onto
// SatWizz.chapterData. This file (loaded after them) puts the chapters in
// order and builds the flat question list the app uses.
//
// Chapter:  { id, short, title, bonus?, pause: { summary, rules[], patterns[{f, ok}], example }, questions[] }
// Question: { id, skill, kind?, shortcut?, forms?, text, choices[4], answer, notes[4] }
//   text      one "______" blank; each choice replaces exactly the blank
//   answer    index of the correct choice (choices are shuffled on screen)
//   notes     one note per choice: why it works (at `answer`) or why it fails
//   kind      "transition" swaps in the logical-transition prompt
//   shortcut  "3:1" or "2:1" answer-choice ratio check (see chapter 3's lesson),
//             with `forms` marking each choice s (singular verb), p (plural verb)
//             or x (non-verb)
//
// Placeholders, filled from the chosen cast:
//   {{NAME_1}} {{NAME_2}} {{NAME_3}}      people
//   {{NAME_1_POSS}} / {{NAME_1_OBJ}}      his/her/their, him/her/them (any NAME_n)
//   {{LOCATION}} {{EVENT}} {{SKILL}}      theme flavor; always mid-sentence
// Never make a subject pronoun agree with a verb: custom casts can use "they".
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  SW.chapters = (SW.chapterData || []).slice().sort((a, b) => a.id - b.id);
  SW.questions = SW.chapters.flatMap((ch) => ch.questions.map((q) => Object.assign(q, { chapterId: ch.id })));
  SW.chapterById = (id) => SW.chapters.find((c) => c.id === id);
  SW.CORE_CHAPTERS = SW.chapters.filter((c) => !c.bonus).length; // 9
})();
