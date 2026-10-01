// Registers the pop-culture question sets (clause-derby/src/ch1.js … ch7.js,
// shared with the standalone Clause Derby game) as the first part of
// chapters 1–7. Load after the ClauseBank files and before js/curriculum/chN.js,
// whose extra practice is appended to the same chapters.
// Each question keeps its `rule` line (shown in the explanation drawer) and
// its `kind` ("transition" questions get the transition stem).
(function () {
  "use strict";
  const SW = window.SatWizz;
  const bank = window.ClauseBank;
  if (!bank) return;
  for (const ch of bank.chapters) {
    SW.curriculum.addChapter({
      id: ch.id,
      pause: { summary: ch.focus, rules: ch.rules.slice(), patterns: [], example: "" },
      questions: ch.questions.map((q) => ({
        id: `pop-${q.id}`, // "pop-c1-01": the bare ids clash with the extra practice ids (c6-17…)
        skill: q.skill,
        kind: q.kind,
        text: q.text,
        choices: q.choices,
        answer: q.answer,
        notes: q.notes,
        rule: q.rule,
      })),
    });
  }
})();
