// Generated questions, Chapter 2: Subject-Verb Agreement.
// The subject's number decides the verb; the traps are the nouns parked in
// prepositional phrases, parentheticals and inverted sentences.
(function () {
  "use strict";
  const G = window.SatWizz.gen;

  const BE = {
    sg: ["is", "are", "were", "have been"],
    pl: ["are", "is", "was", "has been"],
  };
  const HAVE = {
    sg: ["has", "have", "are", "were"],
    pl: ["have", "has", "is", "was"],
  };
  const plural = (w) => `"${w}" is plural`;
  const singular = (w) => `"${w}" is singular`;

  // Subjects with interrupting phrases that hide a trap noun of the other number.
  const SUBJECTS = [
    { n: "sg", head: "The collection", ofs: ["of rare trading cards", "of signed jerseys", "of old concert posters"], where: ["in {{NAME_1_POSS}} closet", "under the stairs at {{LOCATION}}"], be: ["worth more than {{NAME_1_POSS}} first car", "older than anyone at {{EVENT}} realized"], have: ["grown every year since middle school"] },
    { n: "sg", head: "The box", ofs: ["of old medals", "of handwritten letters", "of spare batteries"], where: ["behind the lockers", "in the back of {{NAME_2_POSS}} van"], be: ["heavier than it looks", "labeled in {{NAME_2_POSS}} neat handwriting"], have: ["sat untouched since last spring"] },
    { n: "sg", head: "The list", ofs: ["of songs for the encore", "of drills for {{EVENT}}", "of volunteers"], where: ["taped to the door", "on the coach's clipboard"], be: ["longer than last year's", "written in bright red marker"], have: ["changed three times this week"] },
    { n: "sg", head: "The stack", ofs: ["of practice tests", "of library books", "of fan letters"], where: ["on {{NAME_3_POSS}} desk", "beside the printer at {{LOCATION}}"], be: ["almost a foot tall", "ready for {{NAME_3}} to sort"], have: ["doubled since Monday"] },
    { n: "sg", head: "The schedule", ofs: ["of rehearsals", "of away games", "of guest speakers"], where: ["for {{EVENT}}", "pinned outside the main office"], be: ["packed from morning to night", "posted online every Sunday"], have: ["kept the whole team busy"] },
    { n: "sg", head: "The pair", ofs: ["of lucky sneakers", "of cleats", "of headphones"], where: ["that {{NAME_1}} wore at {{EVENT}}", "in the trophy case"], be: ["worn out at the toes", "now on display at {{LOCATION}}"], have: ["survived four seasons of practice"] },
    { n: "sg", head: "The recipe", ofs: ["for the team's famous cookies", "for {{NAME_2_POSS}} grandmother's dumplings"], where: ["that several bakeries have tried to copy", "in the old binder"], be: ["still a closely guarded secret", "simpler than most people think"], have: ["stayed in the family for decades"] },
    { n: "sg", head: "The goal", ofs: ["of the new training drills", "of the weekend workshops"], where: ["at {{LOCATION}}", "led by {{NAME_3}}"], be: ["to build speed under pressure", "to prepare everyone for {{EVENT}}"], have: ["shifted toward teamwork this year"] },
    { n: "sg", head: "The noise", ofs: ["of the cheering fans", "of the drums"], where: ["outside the arena", "in the hallway near {{LOCATION}}"], be: ["loud enough to rattle the windows", "the reason {{NAME_1}} wore earplugs"], have: ["kept the neighbors awake"] },
    { n: "sg", head: "The number", ofs: ["of fans waiting for autographs", "of students signed up for {{SKILL}}"], where: ["outside the gate", "at {{LOCATION}}"], be: ["larger than anyone expected", "higher than last year"], have: ["grown every hour"] },
    { n: "pl", head: "The trophies", ofs: ["in the glass case", "on the top shelf"], where: ["beside the coach's desk", "at the front of {{LOCATION}}"], be: ["covered in a thin layer of dust", "older than the gym itself"], have: ["moved twice since the remodel"] },
    { n: "pl", head: "The posters", ofs: ["on the wall", "above the stage"], where: ["of the music room", "in {{NAME_1_POSS}} bedroom"], be: ["signed by every member of the cast", "starting to curl at the edges"], have: ["hung there since {{EVENT}}"] },
    { n: "pl", head: "The notes", ofs: ["in the margin", "on the back page"], where: ["of {{NAME_2_POSS}} playbook", "of the old script"], be: ["more useful than the book itself", "written in tiny blue print"], have: ["helped every new player"] },
    { n: "pl", head: "The players", ofs: ["on the team", "from the visiting school"], where: ["that won the regional title", "at {{LOCATION}}"], be: ["ready for {{EVENT}}", "staying an extra hour tonight"], have: ["practiced {{SKILL}} all week"] },
    { n: "pl", head: "The tickets", ofs: ["for the final", "for the opening night"], where: ["of the season", "at {{LOCATION}}"], be: ["sold out within minutes", "taped to {{NAME_3_POSS}} fridge"], have: ["become nearly impossible to find"] },
    { n: "pl", head: "The lights", ofs: ["above the court", "in the main hall"], where: ["of the old building", "at {{LOCATION}}"], be: ["brighter than they need to be", "on a timer this week"], have: ["flickered since the storm"] },
    { n: "pl", head: "The instructions", ofs: ["in the manual", "on the whiteboard"], where: ["for the new equipment", "beside the door to {{LOCATION}}"], be: ["clearer than last year's", "written for beginners"], have: ["saved {{NAME_1}} hours of guessing"] },
    { n: "pl", head: "The results", ofs: ["of the survey", "of the final round"], where: ["at {{EVENT}}", "posted by the judges"], be: ["surprising to almost everyone", "available on the school website"], have: ["changed how the coaches plan practice"] },
  ];

  // Parenthetical phrases: Name, along with…, verb.
  const LINKERS = ["along with", "as well as", "together with", "in addition to"];
  const GROUPS = ["{{NAME_1_POSS}} teammates", "{{NAME_1_POSS}} two best friends", "{{NAME_1_POSS}} cousins", "the rest of the crew", "{{NAME_1_POSS}} bandmates"];
  const ACTS = [
    { s: "holds", base: "hold", ing: "holding", pp: "held", obj: "a full rehearsal before every show at {{LOCATION}}" },
    { s: "practices", base: "practice", ing: "practicing", pp: "practiced", obj: "{{SKILL}} every morning before school" },
    { s: "arrives", base: "arrive", ing: "arriving", pp: "arrived", obj: "at {{LOCATION}} an hour before {{EVENT}}" },
    { s: "eats", base: "eat", ing: "eating", pp: "eaten", obj: "a huge breakfast on game days" },
    { s: "studies", base: "study", ing: "studying", pp: "studied", obj: "the playbook on the long bus rides" },
    { s: "writes", base: "write", ing: "writing", pp: "written", obj: "a goal for the week on the whiteboard" },
    { s: "reviews", base: "review", ing: "reviewing", pp: "reviewed", obj: "the game film every Sunday night" },
    { s: "stretches", base: "stretch", ing: "stretching", pp: "stretched", obj: "for twenty minutes before every practice" },
  ];
  const PL_NOUNS = ["players", "singers", "volunteers", "coaches", "drummers", "judges", "students", "dancers"];

  G.add(2, () => {
    const out = [];
    // 1) Interrupting phrases.
    for (const s of SUBJECTS) {
      const noun = s.head.replace(/^The /, "").toLowerCase();
      for (const [of, where] of G.product(s.ofs, s.where)) {
        const sub = `${s.head} ${of} ${where}`;
        const forms = [...s.be.map((p) => ["be", p]), ...s.have.map((p) => ["have", p])];
        for (const [kind, pred] of forms) {
          const set = (kind === "be" ? BE : HAVE)[s.n];
          const num = s.n === "sg" ? "singular" : "plural";
          out.push({
            skill: "Prepositional traps",
            text: `${sub} ______ ${pred}.`,
            choices: set,
            notes: [
              `Correct. The subject is "${noun}" (${num}), so "${set[0]}" agrees with it.`,
              ...set.slice(1).map((w) => `${s.n === "sg" ? plural(w) : singular(w)}, but the subject "${noun}" is ${num}. The nouns inside "${of} ${where}" are a trap.`),
            ],
            rule: `Cross out "${of} ${where}": the subject is "${noun}" (${num}).`,
          });
        }
      }
    }
    // 2) Parentheticals: Name, along with…, verb.
    for (const [linker, group, a] of G.product(LINKERS, GROUPS, ACTS)) {
      out.push({
        skill: "Parenthetical phrases",
        text: `{{NAME_1}}, ${linker} ${group}, ______ ${a.obj}.`,
        choices: [a.s, a.base, `are ${a.ing}`, `have ${a.pp}`],
        notes: [
          `Correct. "${linker} ${group}" is set off by commas, so the subject is just {{NAME_1}}: one person, singular verb "${a.s}".`,
          `"${a.base}" is plural; the group in the commas isn't part of the subject.`,
          `"Are ${a.ing}" is plural.`,
          `"Have ${a.pp}" is plural.`,
        ],
        rule: `"${G.cap(linker)}…" is parenthetical; the subject is {{NAME_1}} (singular).`,
      });
    }
    // 3) Each of / One of / Every one of → singular.
    const STARTS = [["Each of the", "Each"], ["One of the", "One"], ["Every one of the", "Every one"]];
    for (const [[start, word], noun] of G.product(STARTS, PL_NOUNS)) {
      for (const [set, pred] of [[BE.sg, "ready for {{EVENT}}"], [HAVE.sg, "signed up for extra practice at {{LOCATION}}"]]) {
        out.push({
          skill: "Each / one of",
          text: `${start} ${noun} working with {{NAME_1}} ______ ${pred}.`,
          choices: set,
          notes: [
            `Correct. The subject is "${word}", which is singular.`,
            ...set.slice(1).map((w) => `${plural(w)}; it agrees with "${noun}", but the subject is "${word}".`),
          ],
          rule: `"${word} of the…" is singular, even when a plural noun follows.`,
        });
      }
    }
    // 4) Neither/nor and either/or: the verb agrees with the closer subject.
    for (const noun of PL_NOUNS) {
      for (const [lead, tail] of [["Neither", "nor"], ["Either", "or"]]) {
        out.push({
          skill: "Either/or, neither/nor",
          text: `${lead} {{NAME_1}} ${tail} the ${noun} ______ ready when the curtain rose at {{EVENT}}.`,
          choices: ["were", "was", "is", "has been"],
          notes: [
            `Correct. With ${lead.toLowerCase()}/${tail}, the verb agrees with the closer subject: "the ${noun}" (plural).`,
            `"Was" agrees with {{NAME_1}}, but the closer subject is "the ${noun}".`,
            `"Is" is singular and the wrong tense for a past event.`,
            `"Has been" is singular.`,
          ],
          rule: `${lead}/${tail}: the verb agrees with the subject closer to it.`,
        });
        out.push({
          skill: "Either/or, neither/nor",
          text: `${lead} the ${noun} ${tail} {{NAME_1}} ______ ready when the curtain rose at {{EVENT}}.`,
          choices: ["was", "were", "are", "have been"],
          notes: [
            `Correct. The closer subject is {{NAME_1}}, one person, so the verb is singular.`,
            `"Were" agrees with "the ${noun}", but the closer subject is {{NAME_1}}.`,
            `"Are" is plural and the wrong tense for a past event.`,
            `"Have been" is plural.`,
          ],
          rule: `${lead}/${tail}: the verb agrees with the subject closer to it.`,
        });
      }
    }
    // 5) There is / there are: the subject comes after the verb.
    const THINGS = [["three hidden passages", "pl"], ["a hidden passage", "sg"], ["several spare jerseys", "pl"], ["a spare jersey", "sg"], ["dozens of signed programs", "pl"], ["a signed program", "sg"], ["two extra tickets", "pl"], ["an extra ticket", "sg"]];
    const SPOTS = ["beneath the stage at {{LOCATION}}", "in the van, according to {{NAME_2}}", "behind the scoreboard, says {{NAME_3}}"];
    for (const [[thing, n], spot] of G.product(THINGS, SPOTS)) {
      const set = n === "pl" ? ["are", "is", "was", "has been"] : ["is", "are", "were", "have been"];
      out.push({
        skill: "There is / there are",
        text: `There ______ ${thing} ${spot}.`,
        choices: set,
        notes: [
          `Correct. In "There is/are" sentences the subject comes after the verb: "${thing}" (${n === "pl" ? "plural" : "singular"}).`,
          ...set.slice(1).map((w) => `"${w}" doesn't agree with "${thing}".`),
        ],
        rule: "In \"There is/are\" sentences, the subject comes after the verb.",
      });
    }
    // 6) Compound subjects: A and B → plural.
    for (const [pair, a] of G.product([["{{NAME_1}}", "{{NAME_2}}"], ["{{NAME_2}}", "{{NAME_3}}"], ["{{NAME_1}}", "the coach"]], ACTS)) {
      out.push({
        skill: "Compound subjects",
        text: `${pair[0]} and ${pair[1]} ______ ${a.obj}.`,
        choices: [a.base, a.s, `is ${a.ing}`, `has ${a.pp}`],
        notes: [
          `Correct. Two subjects joined by "and" are plural: "${a.base}".`,
          `"${a.s}" is singular, but "A and B" is plural.`,
          `"Is ${a.ing}" is singular.`,
          `"Has ${a.pp}" is singular.`,
        ],
        rule: "A and B make a plural subject.",
      });
    }
    return out;
  });
})();
