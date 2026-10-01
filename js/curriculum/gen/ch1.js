// Generated questions, Chapter 1: Independent Clause Connectors & Sentence Boundaries.
// Two independent clauses meet at the blank; the choices are the legal joints
// (period, semicolon, comma + FANBOYS) and the classic traps (comma splice,
// run-on, FANBOYS without a comma, "however" with only commas…).
(function () {
  "use strict";
  const G = window.SatWizz.gen;
  const RULE = "Two independent clauses need a period, a semicolon, or a comma + FANBOYS between them.";

  // [first IC, second IC, relationship]
  const PAIRS = [
    ["{{NAME_1}} practiced {{SKILL}} for three straight hours", "the coach still asked for one more round", "contrast"],
    ["{{NAME_1}} arrived at {{LOCATION}} an hour early", "the doors stayed locked until noon", "contrast"],
    ["the forecast promised clear skies for {{EVENT}}", "a storm rolled in just before the opening ceremony", "contrast"],
    ["{{NAME_2}} memorized every line of the speech", "the microphone cut out halfway through", "contrast"],
    ["the crowd at {{LOCATION}} chanted {{NAME_1_POSS}} name", "{{NAME_1}} never once looked up from the notebook", "contrast"],
    ["{{NAME_3}} had never lost a match at {{EVENT}}", "the newcomer from the north looked dangerous", "contrast"],
    ["the tickets sold out in four minutes", "half the seats were empty when the lights went down", "contrast"],
    ["{{NAME_1}} wanted to rest after the long trip", "{{NAME_2}} insisted on one last practice at {{LOCATION}}", "contrast"],
    ["{{NAME_2}} trained at {{LOCATION}} all summer", "the first game of the season still went badly", "contrast"],
    ["the review panel loved the first draft", "{{NAME_1}} rewrote the ending anyway", "contrast"],
    ["{{NAME_1}} forgot to charge the camera", "nobody filmed the winning moment at {{EVENT}}", "result"],
    ["the bus broke down outside {{LOCATION}}", "{{NAME_2}} walked the last two miles", "result"],
    ["{{NAME_1}} studied {{SKILL}} every night for a month", "the final test felt surprisingly easy", "result"],
    ["the power went out across the whole block", "the band rehearsed by flashlight", "result"],
    ["{{NAME_3}} lost the only copy of the playbook", "the coach rewrote every play from memory", "result"],
    ["the rain flooded the field before {{EVENT}}", "the organizers moved everything indoors", "result"],
    ["{{NAME_2}} trained harder than anyone at {{LOCATION}}", "the captain chose {{NAME_2}} to lead the warm-up", "result"],
    ["the old scoreboard kept freezing", "the referees tracked points on a whiteboard", "result"],
    ["{{NAME_1}} missed the early train", "the opening speech started without {{NAME_1_OBJ}}", "result"],
    ["the new stadium lights were twice as bright", "night games felt like noon", "result"],
    ["{{NAME_1}} designed the poster for {{EVENT}}", "{{NAME_2}} wrote every word of the program", "addition"],
    ["the museum near {{LOCATION}} opened a new wing", "the café downstairs started serving breakfast", "addition"],
    ["{{NAME_3}} fixed the broken speakers", "{{NAME_1}} tuned every guitar backstage", "addition"],
    ["the students painted a mural on the gym wall", "the teachers planted a garden by the entrance", "addition"],
    ["{{NAME_2}} led the morning warm-up", "{{NAME_3}} ran the afternoon drills", "addition"],
    ["the library extended its hours for exam week", "the cafeteria added a late-night snack bar", "addition"],
    ["{{NAME_1}} packed an extra jacket", "the nights at {{LOCATION}} can be bitterly cold", "reason"],
    ["the crowd went silent", "{{NAME_2}} was about to attempt the final shot", "reason"],
    ["{{NAME_3}} skipped dessert at the party", "the first round of {{EVENT}} started early the next morning", "reason"],
    ["the coach grinned at the scoreboard", "the team had finally broken the school record", "reason"],
    ["{{NAME_1}} kept the old notebook", "every page held a memory from {{EVENT}}", "reason"],
    ["the volunteers worked straight through lunch", "the stage had to be ready by sunset", "reason"],
  ];
  const CONJ = { contrast: ["but", "yet"], result: ["so"], addition: ["and"], reason: ["for"] };
  const ADVERB = { contrast: "however", result: "therefore", addition: "moreover", reason: "after all" };
  const REL_WORD = { contrast: "contrast", result: "result", addition: "added point", reason: "reason" };

  // Mix-and-match scenes: any action + any second action read as "and" (addition).
  const ACTIONS = [
    "{{NAME_1}} practiced {{SKILL}} at {{LOCATION}} after school",
    "{{NAME_1}} reviewed the game film twice before {{EVENT}}",
    "{{NAME_1}} set up the folding chairs in the main hall",
    "{{NAME_1}} printed the schedules for {{EVENT}}",
    "{{NAME_1}} swept the stage before the dress rehearsal",
    "{{NAME_1}} wrote a thank-you note to every volunteer",
    "{{NAME_1}} tested the sound system one last time",
    "{{NAME_1}} carried the trophies up from the basement",
    "{{NAME_1}} stretched for twenty minutes before the warm-up",
    "{{NAME_1}} mapped the fastest route to {{LOCATION}}",
  ];
  const SECONDS = [
    "{{NAME_2}} timed every attempt with a stopwatch",
    "{{NAME_2}} took careful notes in the front row",
    "{{NAME_3}} handed out water bottles to the team",
    "{{NAME_3}} filmed the whole session on a phone",
    "the rest of the team cheered from the bleachers",
    "the coach marked each mistake on a clipboard",
    "{{NAME_2}} hung the banners above the entrance",
    "{{NAME_3}} checked the lights over the stage",
  ];

  // Dependent clause first: DC, IC.
  const DCS = [
    ["Because {{NAME_1}} had stayed up late studying {{SKILL}}", "{{NAME_1}} nearly slept through the alarm"],
    ["Although the gym at {{LOCATION}} was freezing", "the team practiced in short sleeves"],
    ["When {{NAME_2}} finally reached the stage", "the crowd rose to its feet"],
    ["Because the bus arrived twenty minutes late", "the parade before {{EVENT}} started without the drummer"],
    ["Although {{NAME_3}} had never played chess before", "{{NAME_3}} won the first two games"],
    ["Since the lights at {{LOCATION}} kept flickering", "the coach ended practice early"],
    ["When the final buzzer sounded", "{{NAME_1}} dropped to the floor in relief"],
    ["Although the recipe looked simple", "the first batch burned in six minutes"],
    ["Because {{NAME_2}} had trained at {{LOCATION}} all winter", "the spring season felt easy"],
    ["While {{NAME_1}} rehearsed {{SKILL}} backstage", "the audience slowly filled the hall"],
    ["After the storm knocked out the scoreboard", "the referees kept score on paper"],
    ["If the weather clears by noon", "the first round of {{EVENT}} will start on time"],
  ];

  function boundary(a, b, rel, form, distractors, seed) {
    const [aHead, aLast] = G.lastWord(a);
    const [bFirst, bRest] = G.firstWord(b);
    const conj = G.pick(CONJ[rel], seed);
    const adv = ADVERB[rel];
    const J = {
      period: [`${aLast}. ${G.cap(bFirst)}`, "Correct. The period ends the first independent clause, and the second one starts a new sentence."],
      semicolon: [`${aLast}; ${bFirst}`, "Correct. A semicolon joins two closely related independent clauses."],
      conj: [`${aLast}, ${conj} ${bFirst}`, `Correct. A comma + "${conj}" joins the two independent clauses and shows the ${REL_WORD[rel]}.`],
      splice: [`${aLast}, ${bFirst}`, "Comma splice: a comma alone can't join two independent clauses."],
      runon: [`${aLast} ${bFirst}`, "Run-on: two independent clauses are fused with no punctuation at all."],
      noComma: [`${aLast} ${conj} ${bFirst}`, `Two independent clauses joined by "${conj}" need a comma before the conjunction.`],
      adverb: [`${aLast}, ${adv}, ${bFirst}`, `"${G.cap(adv)}" isn't a FANBOYS word, so with only commas this is a comma splice. It needs a semicolon or a period before it.`],
      commaAfter: [`${aLast}, ${conj}, ${bFirst}`, `No comma follows a FANBOYS conjunction: write ", ${conj} ${bFirst}".`],
      semiConj: [`${aLast}; ${conj}, ${bFirst}`, `A semicolon plus "${conj}" with a comma after it isn't a legal joint; write ", ${conj}".`],
    };
    const picked = [form, ...distractors];
    return {
      skill: form === "period" ? "IC. IC" : form === "semicolon" ? "IC; IC" : "IC, FANBOYS IC",
      text: `${G.cap(aHead)} ______ ${bRest}.`,
      choices: picked.map((k) => J[k][0]),
      notes: picked.map((k) => J[k][1]),
      rule: form === "conj" ? `IC, FANBOYS IC: a comma + "${conj}" joins two independent clauses.` : RULE,
    };
  }

  const WRONG_SETS = [
    ["splice", "runon", "noComma"],
    ["splice", "adverb", "commaAfter"],
    ["runon", "adverb", "semiConj"],
  ];

  G.add(1, () => {
    const out = [];
    PAIRS.forEach(([a, b, rel], i) => {
      for (const form of ["period", "semicolon", "conj"]) {
        WRONG_SETS.forEach((ws, k) => {
          // Skip combos where a "wrong" joint would equal the right one.
          out.push(boundary(a, b, rel, form, ws, `${i}${form}${k}`));
        });
      }
    });
    let n = 0;
    for (const [a, b] of G.product(ACTIONS, SECONDS)) {
      const form = ["period", "semicolon", "conj"][n % 3];
      out.push(boundary(a, b, "addition", form, WRONG_SETS[n % WRONG_SETS.length], `s${n}`));
      n++;
    }
    for (const [dc, ic] of DCS) {
      const [dcHead, dcLast] = G.lastWord(dc);
      const [icFirst, icRest] = G.firstWord(ic);
      out.push({
        skill: "DC, IC",
        text: `${dcHead} ______ ${icRest}.`,
        choices: [`${dcLast}, ${icFirst}`, `${dcLast}; ${icFirst}`, `${dcLast}. ${G.cap(icFirst)}`, `${dcLast}, and ${icFirst}`],
        notes: [
          `Correct. "${G.firstWord(dc)[0]}…" opens a dependent clause, so a comma connects it to the independent clause.`,
          "A semicolon needs an independent clause on both sides; the opening clause is dependent.",
          "A period would leave the opening dependent clause as a fragment.",
          "The dependent clause already connects to the main clause; adding \"and\" uses two connectors.",
        ],
        rule: "DC, IC: a dependent clause that comes first is followed by a comma.",
      });
    }
    return out;
  });
})();
