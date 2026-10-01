// Rule names for the Diagnostic screen: SatWizz.ruleName(q) turns a
// question's skill into the named rule it tests ("Terminal Boundary Rule",
// "Restrictive Title Rule"…). A question's own `ruleName` wins; a skill with
// no match falls back to the chapter title. SatWizz.ruleExplain(q) is the
// short explanation: the rule line plus the note on the correct answer.
(function () {
  "use strict";
  const SW = window.SatWizz;

  // [skill pattern, rule name], first match wins, per chapter.
  const TABLE = {
    1: [
      [/^IC\. /, "Terminal Boundary Rule"],
      [/^IC; (however|nevertheless|then)|; LW/, "Semicolon + Conjunctive Adverb"],
      [/^IC; /, "Semicolon Boundary Rule"],
      [/FANBOYS|^IC, (and|conj)/, "FANBOYS Connector Rule"],
      [/^DC, |^IC DC|DC$/, "Dependent Clause Comma Rule"],
      [/splice/i, "Comma Splice"],
      [/Compound predicate|no split/i, "Compound Predicate (No Comma)"],
      [/list/i, "Semicolons in a Complex List"],
      [/Flexpos|LW/, "Linking Word Placement"],
      [/noun phrase/i, "Descriptive Phrase After a Clause"],
    ],
    2: [
      [/Preposition|Long interrupter|Interrupted/i, "Prepositional Trap"],
      [/Parenthetical|Along with|As well as|Including/i, "Parenthetical Phrase Rule"],
      [/Either|Neither/i, "Proximity Rule (either/or)"],
      [/Compound/i, "Compound Subject Rule"],
      [/Each|Every|One of/i, "Each / One-of Singular Rule"],
      [/There|Inverted|Flipped/i, "Inverted Sentence Rule"],
      [/Collective/i, "Collective Noun Rule"],
      [/number of/i, "\"A Number\" vs. \"The Number\""],
      [/3:1/, "3:1 Shortcut"],
      [/.*/, "Subject–Verb Agreement"],
    ],
    3: [
      [/Title/i, "Restrictive Title Rule"],
      [/Appositive/i, "Appositive + Modifier Rule"],
      [/Participle|Non-verb|Reduced/i, "Participle Modifier (Non-Verb)"],
      [/main verb|Main verb/i, "Main Verb Rule"],
    ],
    4: [
      [/Past perfect/i, "Past Perfect Sequence"],
      [/Present perfect/i, "Present Perfect (Until Now)"],
      [/Future perfect/i, "Future Perfect Deadline"],
      [/Future/i, "Future Time Clue"],
      [/^Past$|Time clue/i, "Finished-Past Time Clue"],
      [/Present/i, "Present Tense for General Facts"],
      [/Consistency/i, "Tense Consistency"],
      [/Conditional/i, "Conditional Rule"],
      [/participle/i, "Past Participle Form"],
    ],
    5: [
      [/Concession|Though/i, "Concession Transition"],
      [/Contrast/i, "Contrast Transition"],
      [/Cause|Result/i, "Cause–Effect Transition"],
      [/Example/i, "Example Transition"],
      [/Addition|Elaboration|Emphasis/i, "Addition Transition"],
      [/Similar|Comparison/i, "Similarity Transition"],
      [/Sequence|Summary/i, "Sequence Transition"],
      [/punctuation|Flexpos/i, "Transition Punctuation"],
    ],
    6: [
      [/Dash pair/i, "Dash Pair Rule"],
      [/Single dash/i, "Single Dash Rule"],
      [/Semicolons? (in a )?list/i, "Semicolons in a Complex List"],
      [/Semicolon/i, "Semicolon Boundary Rule"],
      [/such as|after a verb|preposition|before object/i, "No Colon Mid-Clause"],
      [/Colon/i, "Colon After a Complete Clause"],
      [/Matching|Comma/i, "Matching Punctuation Pairs"],
      [/FANBOYS/i, "FANBOYS Connector Rule"],
      [/which/i, "Non-Essential \"which\""],
      [/DC/, "Dependent Clause Comma Rule"],
    ],
    7: [
      [/a\/an/i, "Non-Essential Appositive (a/an cue)"],
      [/Essential (title|name)/i, "Restrictive Title Rule"],
      [/Essential/i, "Essential Clause Rule"],
      [/Non-essential|who clause|which after/i, "Non-Essential Clause Rule"],
      [/one of (a|its) kind|Only one/i, "One-of-a-Kind Rule"],
      [/which vs that/i, "\"Which\" vs. \"That\""],
      [/Dash|Comma pair|Matching/i, "Matching Punctuation Pairs"],
    ],
  };

  SW.ruleName = function (q) {
    if (q.ruleName) return q.ruleName;
    const chId = q.chapterId || q.chapter;
    const hit = (TABLE[chId] || []).find(([re]) => re.test(q.skill || ""));
    if (hit) return hit[1];
    if (q.skill && chId > 7) return q.skill;
    const ch = SW.chapterById && SW.chapterById(chId);
    return ch ? ch.title.replace(/^Bonus: /, "") : q.skill || "Grammar rule";
  };

  // Two short sentences: the principle, then why the right answer works.
  // Older questions have no rule line, so the chapter's focus stands in.
  SW.ruleExplain = function (q) {
    const note = (q.notes && q.notes[q.answer]) || "";
    const why = note.replace(/^Correct\.?\s*/, "");
    let rule = q.rule;
    if (!rule) {
      const ch = SW.chapterById && SW.chapterById(q.chapterId || q.chapter);
      rule = ch && ch.pause && ch.pause.summary;
    }
    return [rule, why].filter(Boolean).join(" ");
  };
})();
