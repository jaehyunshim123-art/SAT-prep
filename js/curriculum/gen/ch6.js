// Generated questions, Chapter 6: Punctuation Fundamentals (Semicolon, Dash, Colon).
(function () {
  "use strict";
  const G = window.SatWizz.gen;
  const SEMI_IC = "A semicolon needs a complete independent clause on BOTH sides.";
  const DASH_PAIR = "Dashes come in pairs around non-essential information: if one dash opens it, another must close it.";

  // Lists for colon questions: [plural noun, three items]
  const LISTS = [
    ["snacks", "a banana, a granola bar, and a bottle of water"],
    ["tools", "a hammer, a tape measure, and a box of nails"],
    ["songs", "a ballad, a dance track, and the school anthem"],
    ["rules", "arrive early, stay hydrated, and never argue with the referee"],
    ["souvenirs", "a pennant, a signed program, and a ticket stub"],
    ["drills", "sprints, passing patterns, and penalty kicks"],
    ["supplies", "poster board, glitter glue, and three thick markers"],
    ["costumes", "a cape, a crown, and a pair of silver boots"],
    ["books", "a mystery, a biography, and a book of poems"],
    ["goals", "win the opener, beat the rival school, and reach {{EVENT}}"],
    ["instruments", "a violin, a snare drum, and a borrowed trumpet"],
    ["ingredients", "flour, butter, and a pinch of cinnamon"],
  ];
  const INTROS = [
    (n) => `{{NAME_1}} packed only three ${n} for {{EVENT}}`,
    (n) => `The coach at {{LOCATION}} asked for three ${n}`,
    (n) => `{{NAME_2}} needed just three ${n} before the trip`,
    (n) => `The checklist on {{NAME_3_POSS}} door named three ${n}`,
  ];

  // Dash-pair appositives: [noun, appositive, rest of the sentence]
  const DASHES = [
    ["secret weapon", "an hour of extra sprints after every practice", "explains the speed in the final minutes"],
    ["newest invention", "a backpack that charges a phone while you walk", "won first prize at the science fair"],
    ["favorite spot", "a bench behind the bleachers at {{LOCATION}}", "is where every big decision gets made"],
    ["lucky charm", "a frayed red wristband from {{EVENT}}", "never leaves the equipment bag"],
    ["biggest fear", "forgetting the words in front of a crowd", "never came true"],
    ["first coach", "a retired champion who still runs every morning", "taught the basics of {{SKILL}}"],
    ["morning routine", "twenty push-ups, a cold shower, and oatmeal", "hasn't changed in three years"],
    ["proudest moment", "a buzzer-beater in the regional semifinal", "is still replayed on the school website"],
    ["oldest friend", "a neighbor who moved away in fifth grade", "flew in to watch {{EVENT}}"],
    ["best idea", "a car wash to pay for new uniforms", "raised twice the money anyone expected"],
    ["strangest habit", "talking to the ball before every free throw", "always makes the crowd laugh"],
    ["favorite book", "a battered paperback about a lost explorer", "sits on the nightstand"],
  ];
  const OWNERS = ["{{NAME_1}}'s", "{{NAME_2}}'s", "The team's", "The coach's"];

  // Two contrasting ICs: a semicolon (a colon would wrongly signal an explanation).
  const SEMI_PAIRS = [
    ["{{NAME_1}} writes most songs on guitar", "the ballads are composed on piano"],
    ["the first half was slow and careful", "the second half was a sprint"],
    ["{{NAME_2}} won the first title at seventeen", "the last one came at thirty-five"],
    ["the morning session covered {{SKILL}}", "the afternoon focused on teamwork"],
    ["penguins cannot fly", "they are, however, excellent swimmers"],
    ["the home crowd was loud", "the visiting fans were even louder"],
    ["{{NAME_3}} prefers early practices", "{{NAME_1}} does best at night"],
    ["the old gym had no air conditioning", "the new one has too much"],
    ["the rookies made every easy shot", "the veterans missed most of theirs"],
    ["the bus left {{LOCATION}} at dawn", "the first fans arrived at noon"],
    ["the debate team won the trophy", "the robotics club took home the cash prize"],
    ["the opening act played for an hour", "the headliner played for twenty minutes"],
  ];
  // IC: explanation.
  const EXPLAIN = [
    ["{{NAME_1}} had one reason for staying up all night", "the final exam covered the entire year"],
    ["The plan for {{EVENT}} was simple", "arrive early, warm up, and stay calm"],
    ["Coach {{NAME_2}} gave the team one rule", "finish your homework before you touch the ball"],
    ["The experiment failed for an obvious reason", "someone had unplugged the freezer overnight"],
    ["The crowd went silent for a good reason", "{{NAME_3}} was attempting the final shot"],
    ["{{NAME_1}} finally understood the problem", "the instructions had been printed upside down"],
    ["The new schedule had one big flaw", "practice started before the buses arrived"],
    ["The recipe needed one more thing", "a pinch of salt in the frosting"],
    ["{{NAME_2}} learned a hard lesson at {{LOCATION}}", "talent never beats a team that works harder"],
    ["The museum guard gave one warning", "no flash photography near the paintings"],
    ["The band chose its name for a simple reason", "every member was born in June"],
    ["The coach saw the real problem", "nobody was talking on defense"],
  ];
  // Non-essential "which" clauses that need their closing comma.
  const THINGS = ["trophy", "jersey", "medal", "banner", "photograph"];
  const WHICH = ["which {{NAME_1}} won at {{EVENT}}", "which {{NAME_2}} keeps behind glass", "which hung in the old gym for years", "which the coach signed last spring"];
  const PREDS = ["now sits in the front office", "is older than most of the players", "will be auctioned for charity", "draws a crowd every time it comes out"];
  // Semicolons in a list whose items have commas.
  const CITIES = [["Tokyo", "Japan"], ["Seoul", "South Korea"], ["Sydney", "Australia"], ["Lima", "Peru"], ["Nairobi", "Kenya"], ["Toronto", "Canada"], ["Lisbon", "Portugal"], ["Cairo", "Egypt"]];

  G.add(6, () => {
    const out = [];
    // 1) IC: list.
    for (const [[n, items], intro, v] of G.product(LISTS, INTROS, [0, 1])) {
      const ic = intro(n);
      const [head, last] = G.lastWord(ic);
      const wrong = v === 0
        ? [[`${last};`, `${SEMI_IC} The list isn't an independent clause.`], [`${last}, such as:`, "Never put a colon after \"such as.\""], [`${last}, and`, "\"And\" makes the list read as extra items instead of the three just announced."]]
        : [[`${last},`, "A comma can't introduce a list after a complete independent clause like this; use a colon."], [`${last}—such as`, "\"Such as\" adds nothing here, and the dash leaves an awkward fragment."], [last, "With no punctuation, the list runs straight into the clause."]];
      out.push({
        skill: "Colon + list",
        text: `${head} ______ ${items}.`,
        choices: [`${last}:`, ...wrong.map((w) => w[0])],
        notes: ["Correct. The words before the colon form a complete independent clause, and the colon introduces the list.", ...wrong.map((w) => w[1])],
        rule: "IC: list. A colon needs a complete independent clause before it.",
      });
    }
    // 2) No colon after a verb, "such as", or a preposition (physical things only).
    for (const [n, items] of LISTS.filter(([n]) => !["rules", "goals", "drills"].includes(n))) {
      out.push({
        skill: "No colon after a verb",
        text: `The three ${n} {{NAME_1}} brought to {{LOCATION}} ______ ${items}.`,
        choices: ["were", "were:", "were;", "were—"],
        notes: ["Correct. Nothing separates a verb from its complement.", `"The three ${n} {{NAME_1}} brought were" isn't a complete clause, so no colon.`, SEMI_IC, "A dash would split the verb from its complement."],
        rule: "Never put a colon or other break between a verb and its complement.",
      });
      out.push({
        skill: "No colon after \"such as\"",
        text: `{{NAME_2}} packed ${n} such ______ ${items}.`,
        choices: ["as", "as:", "as;", "as—"],
        notes: ["Correct. \"Such as\" already introduces the examples; no punctuation follows it.", "A colon can't follow \"such as\"; the words before it aren't a complete clause.", SEMI_IC, "A dash would cut \"such as\" off from its examples."],
        rule: "No punctuation after \"such as\".",
      });
      out.push({
        skill: "No colon after a preposition",
        text: `The checklist for {{EVENT}} calls ______ ${items}.`,
        choices: ["for", "for:", "for;", "for—"],
        notes: ["Correct. A preposition runs straight into its objects.", "\"The checklist calls for\" isn't a complete clause, so no colon.", SEMI_IC, "A dash would split the preposition from its objects."],
        rule: "No colon after a preposition.",
      });
    }
    // 3) Dash pairs: open and close.
    for (const [[noun, appos, rest], owner] of G.product(DASHES, OWNERS)) {
      const [nHead, nLast] = G.lastWord(`${owner} ${noun}`);
      out.push({
        skill: "Dash pair (opening)",
        text: `${nHead} ______ ${appos}—${rest}.`,
        choices: [`${nLast}—`, `${nLast},`, `${nLast};`, `${nLast}:`],
        notes: ["Correct. This dash opens the appositive, and the dash after it closes it.", "A comma can't pair with a dash.", SEMI_IC, `A colon would separate the subject from its verb "${G.firstWord(rest)[0]}."`],
        rule: DASH_PAIR,
      });
      const [aHead, aLast] = G.lastWord(appos);
      out.push({
        skill: "Dash pair (closing)",
        text: `${owner} ${noun}—${aHead} ______ ${rest}.`,
        choices: [`${aLast}—`, `${aLast},`, `${aLast};`, aLast],
        notes: ["Correct. The closing dash matches the one after the noun.", "A comma can't close what a dash opened.", SEMI_IC, "Without a closing dash, the appositive never ends."],
        rule: DASH_PAIR,
      });
    }
    // 4) IC; IC (contrast).
    for (const [a, b] of SEMI_PAIRS) {
      const [aHead, aLast] = G.lastWord(a);
      const [bFirst, bRest] = G.firstWord(b);
      out.push({
        skill: "Semicolon",
        text: `${G.cap(aHead)} ______ ${bRest}.`,
        choices: [`${aLast}; ${bFirst}`, `${aLast}, ${bFirst}`, `${aLast}: ${bFirst}`, `${aLast} ${bFirst}`],
        notes: ["Correct. Both halves are independent clauses, and a semicolon joins them.", "A comma alone between two independent clauses is a comma splice.", "A colon would mean the second half explains the first; it doesn't, it contrasts.", "Two independent clauses with no punctuation are a run-on."],
        rule: "Two contrasting independent clauses: a semicolon.",
      });
    }
    // 5) IC: explanation.
    for (const [a, b] of EXPLAIN) {
      const [aHead, aLast] = G.lastWord(a);
      out.push({
        skill: "Colon + explanation",
        text: `${aHead} ______ ${b}.`,
        choices: [`${aLast}:`, `${aLast},`, aLast, `${aLast}, which`],
        notes: ["Correct. The colon introduces the explanation the first clause promises.", "A comma between two independent clauses is a comma splice.", "Two independent clauses with no punctuation are a run-on.", "\"Which\" doesn't fit; the second part is a full clause, not a description."],
        rule: "IC: explanation. The colon introduces what the first clause sets up.",
      });
    }
    // 6) Non-essential "which" clauses close with a comma.
    for (const [thing, which, pred] of G.product(THINGS, WHICH, PREDS)) {
      const [wHead, wLast] = G.lastWord(which);
      out.push({
        skill: "Matching commas",
        text: `The ${thing}, ${wHead} ______ ${pred}.`,
        choices: [`${wLast},`, `${wLast}—`, `${wLast};`, wLast],
        notes: ["Correct. A non-essential clause opened with a comma closes with a comma.", "A dash can't close what a comma opened.", SEMI_IC, "Without the closing comma, the clause runs into the main verb."],
        rule: "A non-essential clause opened with a comma must close with a comma.",
      });
    }
    // 7) Semicolons separate list items that contain commas.
    for (let i = 0; i < CITIES.length; i++) {
      for (let j = 0; j < CITIES.length; j++) {
        for (let k = 0; k < CITIES.length; k++) {
          if (i === j || j === k || i === k || (i + j + k) % 3) continue;
          const [c1, n1] = CITIES[i];
          const [c2, n2] = CITIES[j];
          const [c3, n3] = CITIES[k];
          out.push({
            skill: "Semicolons in a list",
            text: `{{NAME_1}}'s tour stopped in ${c1}, ______ ${c2}, ${n2}; and ${c3}, ${n3}.`,
            choices: [`${n1};`, `${n1},`, `${n1}:`, n1],
            notes: [`Correct. It matches the semicolon before "and ${c3}."`, "A comma here blurs where one city's entry ends.", "A colon doesn't separate list items.", "A missing separator runs the entries together."],
            rule: "When list items contain commas, separate the items with semicolons.",
          });
        }
      }
    }
    return out;
  });
})();
