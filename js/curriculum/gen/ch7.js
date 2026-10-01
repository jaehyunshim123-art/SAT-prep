// Generated questions, Chapter 7: Appositives & Non-Essential Clauses.
// "a/an" cues mark non-essential descriptions (commas or dashes on both
// sides); a title right before a name, or a "who" clause that says WHICH
// people, is essential (no commas).
(function () {
  "use strict";
  const G = window.SatWizz.gen;
  const SEMI = "A semicolon needs an independent clause on both sides.";

  const DESCS = [
    "a goalkeeper who rarely misses practice", "an exchange student from Brazil", "a self-taught pianist",
    "a former track champion", "a rookie with a fearless streak", "a chess player with a famous memory",
    "an artist who paints with coffee", "a quiet sophomore from the robotics club", "a drummer in the school jazz band",
    "a volunteer at the animal shelter", "an expert in {{SKILL}}", "a fan of old science-fiction films",
    "a sprinter who trains before sunrise", "a poet who writes on the bus", "a math whiz who loves puzzles",
    "an early riser with endless energy", "a talented singer from the choir", "a former captain of the swim team",
    "an amateur chef who hates recipes", "a skateboarder who never falls",
  ];
  const PREDS = [
    "saved three penalty shots at {{EVENT}}", "won the loudest applause at {{LOCATION}}", "finished the race in record time",
    "gave a speech that made the coach cry", "solved the puzzle in under a minute", "organized the bake sale for the new uniforms",
    "carried the team to the semifinal", "wrote the winning essay this year", "taught the younger students {{SKILL}}",
    "fixed the broken scoreboard before the game", "arrived first at {{LOCATION}} every morning", "led the warm-up before {{EVENT}}",
    "designed the poster for the spring show", "kept everyone calm during the storm", "made the final catch of the season",
    "found the missing trophy in the basement", "sang the anthem at {{EVENT}}", "painted the mural outside the gym",
    "broke the school record for push-ups", "cooked dinner for the entire team",
  ];
  const ROLES = ["The goalkeeper", "The team captain", "The exchange student", "The lead singer", "The head coach", "The debate champion", "The rookie", "The tennis player", "The poet", "The chef", "The drummer", "The physicist"];
  const WHO = [
    "who grew up near {{LOCATION}}", "who joined the team last fall", "who practices {{SKILL}} every morning",
    "who once forgot the words onstage", "who never misses a home game", "who moved here from overseas",
    "who started the school podcast", "who trained with the varsity squad", "who broke an arm last season",
    "who speaks three languages", "who designed the new jerseys", "who learned to swim at nine",
  ];
  const GROUPS = ["students", "players", "fans", "volunteers", "musicians"];
  const GROUP_WHO = ["stayed after practice", "arrived before sunrise", "signed up first", "practiced {{SKILL}} all summer"];
  const GROUP_PREDS = ["got the best seats at {{EVENT}}", "received a free T-shirt", "met {{NAME_1}} backstage"];
  const RELATIONS = ["best friend", "older sister", "first coach", "only rival", "oldest cousin", "favorite teacher", "younger brother", "biggest fan"];

  // Avoid naming the same flavor token twice in one sentence.
  const clash = (a, b) => ["SKILL", "EVENT", "LOCATION"].some((t) => a.includes(t) && b.includes(t));

  G.add(7, () => {
    const out = [];
    // 1) ______ a/an description, verb.
    for (const [d, p] of G.product(DESCS, PREDS)) {
      if (clash(d, p)) continue;
      out.push({
        skill: "a/an cue",
        text: `______ ${d}, ${p}.`,
        choices: ["{{NAME_1}},", "{{NAME_1}}", "{{NAME_1}}—", "{{NAME_1}};"],
        notes: [`Correct. "${G.cap(d)}" is non-essential (the a/an cue), so it gets a comma on both sides.`, "There's no opening comma to match the closing one.", "A dash can't pair with a comma.", SEMI],
        rule: `"A/an" before a description is a strong cue that it's non-essential: commas on both sides.`,
      });
    }
    // 2) The role ______ verb: an essential name, no commas.
    ROLES.forEach((role, r) => {
      for (let k = 0; k < 10; k++) {
        const p = PREDS[(r * 3 + k * 2) % PREDS.length];
        out.push({
          skill: "Essential names",
          text: `${role} ______ ${p}.`,
          choices: ["{{NAME_1}}", "{{NAME_1}},", ", {{NAME_1}},", "—{{NAME_1}}—"],
          notes: [`Correct. "${role}" alone doesn't say which one, so the name is essential: no commas.`, "A single comma separates the subject from its verb.", "Commas would make the name non-essential, but the title needs it to say who.", "Dashes would also mark the name as non-essential."],
          rule: `A title right before a name ("${role.toLowerCase()} {{NAME_1}}") is essential: no commas.`,
        });
      }
    });
    // 3) ______ who…, verb: a "who" clause after a specific name is non-essential.
    WHO.forEach((w, i) => {
      for (let k = 0; k < 10; k++) {
        const p = PREDS[(i * 7 + k * 3) % PREDS.length];
        if (clash(w, p)) continue;
        out.push({
          skill: "Non-essential \"who\"",
          text: `______ ${w.replace(/^who /, "")}, ${p}.`,
          choices: ["{{NAME_1}}, who", "{{NAME_1}} who", "{{NAME_1}}, that", "{{NAME_1}} who,"],
          notes: ["Correct. After a specific name, the \"who\" clause adds extra detail, so commas go on both sides.", "The closing comma has no opening partner.", "\"That\" can't follow a comma, and it doesn't start a description of a named person.", "The comma after \"who\" splits the clause."],
          rule: "After a specific name, a \"who\" clause is non-essential: commas on both sides.",
        });
      }
    });
    // 4) The group ______ (who…) verb: essential "who", no commas.
    for (const [g, w, p] of G.product(GROUPS, GROUP_WHO, GROUP_PREDS)) {
      if (clash(w, p)) continue;
      out.push({
        skill: "Essential \"who\"",
        text: `The ${g} ______ ${w} ${p}.`,
        choices: ["who", ", who", "—who", "who,"],
        notes: [`Correct. "Who ${w}" tells WHICH ${g}: essential, so no commas.`, "A comma makes the clause non-essential, and there's no closing comma.", "A dash makes it non-essential, and it has no partner.", "A comma after \"who\" splits the clause."],
        rule: "A \"who\" clause that identifies which people is essential: no commas.",
      });
    }
    // 5) One-of-a-kind relations + a/an description.
    for (const [rel, d] of G.product(RELATIONS, DESCS.slice(0, 12))) {
      const p = G.pick(PREDS.filter((x) => !clash(d, x)), rel + d);
      const [rHead, rLast] = G.lastWord(rel);
      out.push({
        skill: "One of a kind",
        text: `{{NAME_1}}'s ${rHead ? rHead + " " : ""}______ ${d}, ${p}.`,
        choices: [`${rLast},`, rLast, `${rLast}—`, `${rLast};`],
        notes: [`Correct. {{NAME_1}} has only one ${rel}, so "${d}" is extra detail: commas on both sides.`, "The closing comma has no opening partner.", "A dash can't pair with a comma.", SEMI],
        rule: `{{NAME_1}} has only one ${rel}, so the description is non-essential.`,
      });
    }
    return out;
  });
})();
