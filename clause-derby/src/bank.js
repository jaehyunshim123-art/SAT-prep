// SAT Wizz: Clause Derby question bank core.
// Chapter files call ClauseBank.add({ id, title, short, focus, rules, questions }).
// Each question: { id, skill, kind?, text (one "______" blank), choices[4],
// answer (index), rule (the principle it tests), notes[4] (why each choice
// is right or wrong, same order as choices) }. Choices are shuffled on screen.
(function () {
  "use strict";
  const STEMS = {
    conventions: "Which choice completes the text so that it conforms to the conventions of Standard English?",
    transition: "Which choice completes the text with the most logical transition?",
  };
  const chapters = [];
  window.ClauseBank = {
    STEMS,
    chapters,
    add(ch) {
      ch.questions.forEach((q) => { q.chapter = ch.id; q.kind = q.kind || ch.kind || "conventions"; });
      chapters.push(ch);
      chapters.sort((a, b) => a.id - b.id);
    },
    // Q(id, skill, text, choices, answer, rule, notes)
    Q: (id, skill, text, choices, answer, rule, notes) => ({ id, skill, text, choices, answer, rule, notes }),
    // B(ruleName, q): marks q as its chapter's benchmark for the
    // Review for Understanding test, with the rule name the diagnostic shows.
    B: (ruleName, q) => Object.assign(q, { benchmark: true, ruleName }),
    stemFor: (q) => STEMS[q.kind] || STEMS.conventions,
  };
})();
