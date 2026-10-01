// Generated questions, Chapter 3: Verb vs. Non-Verb Identification (Appositives).
// Does the blank need a conjugated main verb, or a non-verb (participle)
// because the sentence already has its main verb?
(function () {
  "use strict";
  const G = window.SatWizz.gen;
  const TWO_VERBS = "The sentence already has its main verb later on, so a second conjugated verb here creates two verbs with no conjunction.";
  const FRAGMENT = "Without a conjugated verb, the sentence has no main verb, so it becomes a fragment.";

  // Participle phrases (verb forms + what follows the blank).
  const PARTS = [
    { ing: "gathering", s: "gathers", past: "gathered", rest: "{{NAME_1_POSS}} notes for one last review" },
    { ing: "clutching", s: "clutches", past: "clutched", rest: "the trophy with both hands" },
    { ing: "hoping", s: "hopes", past: "hoped", rest: "to impress the judges at {{EVENT}}" },
    { ing: "realizing", s: "realizes", past: "realized", rest: "that the clock was about to run out" },
    { ing: "balancing", s: "balances", past: "balanced", rest: "a tray of water bottles on one arm" },
    { ing: "humming", s: "hums", past: "hummed", rest: "the team's fight song under {{NAME_1_POSS}} breath" },
    { ing: "squinting", s: "squints", past: "squinted", rest: "at the scoreboard across {{LOCATION}}" },
    { ing: "ignoring", s: "ignores", past: "ignored", rest: "the rain pouring down on the bleachers" },
    { ing: "counting", s: "counts", past: "counted", rest: "the seconds left on the clock" },
    { ing: "carrying", s: "carries", past: "carried", rest: "a stack of programs for {{EVENT}}" },
    { ing: "remembering", s: "remembers", past: "remembered", rest: "every tip from {{NAME_1_POSS}} coach" },
    { ing: "practicing", s: "practices", past: "practiced", rest: "{{SKILL}} in {{NAME_1_POSS}} head" },
    { ing: "adjusting", s: "adjusts", past: "adjusted", rest: "the strap of {{NAME_1_POSS}} helmet" },
    { ing: "waving", s: "waves", past: "waved", rest: "to the fans in the upper deck" },
    { ing: "tapping", s: "taps", past: "tapped", rest: "a pencil against the desk" },
    { ing: "dodging", s: "dodges", past: "dodged", rest: "two defenders near the sideline" },
    { ing: "whispering", s: "whispers", past: "whispered", rest: "a quick thank-you to the stage crew" },
    { ing: "shielding", s: "shields", past: "shielded", rest: "{{NAME_1_POSS}} eyes from the stage lights" },
    { ing: "rereading", s: "rereads", past: "reread", rest: "the final page of the script" },
    { ing: "tightening", s: "tightens", past: "tightened", rest: "the laces on {{NAME_1_POSS}} shoes" },
  ];
  const MAINS = [
    "walked confidently onto the stage at {{LOCATION}}",
    "took a deep breath and stepped forward",
    "finally broke into a wide grin",
    "nodded once at the coach",
    "won the loudest applause of the night",
    "sprinted toward the finish line",
    "answered the reporter's question without hesitating",
    "set a new record at {{EVENT}}",
    "pushed open the heavy doors of {{LOCATION}}",
    "slipped quietly into the front row",
    "waited for the referee's whistle",
    "glanced at the crowd for a split second",
    "climbed the steps to the podium",
    "raised one hand to signal the band",
    "stepped up to the microphone",
    "jogged back to the starting line",
    "smiled for the cameras at {{EVENT}}",
    "handed the medal to the youngest fan",
    "refused to give up on the final round",
    "earned a standing ovation from the judges",
  ];
  const TITLES = ["Team captain", "Star student", "Lead singer", "Head chef", "Rookie striker", "Debate champion", "Chess prodigy", "Festival director"];

  // Main-verb-needed sentences: the subject is long, and the blank is its verb.
  const MAIN_VERB = [
    { subj: "The notes that {{NAME_1}} wrote at {{LOCATION}}", forms: ["explain", "explaining", "to explain", "having explained"], rest: "every rule for {{EVENT}}" },
    { subj: "The players who stayed late after practice", forms: ["deserve", "deserving", "to deserve", "having deserved"], rest: "a spot in the starting lineup" },
    { subj: "Every spring, the volunteers at {{LOCATION}}", forms: ["repaint", "repainting", "to repaint", "having repainted"], rest: "the bleachers before {{EVENT}}" },
    { subj: "The letters that {{NAME_2}} saved from {{EVENT}}", forms: ["reveal", "revealing", "to reveal", "having revealed"], rest: "how nervous everyone really was" },
    { subj: "The coaches who designed the new drills", forms: ["believe", "believing", "to believe", "having believed"], rest: "that speed matters more than size" },
    { subj: "The photos hanging in the hallway of {{LOCATION}}", forms: ["show", "showing", "to show", "having shown"], rest: "every champion since the school opened" },
    { subj: "Twice a week, {{NAME_1}} and {{NAME_3}}", forms: ["practice", "practicing", "to practice", "having practiced"], rest: "{{SKILL}} before sunrise" },
    { subj: "The judges at {{EVENT}}", forms: ["award", "awarding", "to award", "having awarded"], rest: "extra points for creativity" },
    { subj: "In {{NAME_2_POSS}} latest interview, the reporter", forms: ["argues", "arguing", "to argue", "having argued"], rest: "that the rookies changed the season" },
    { subj: "The students who joined the club last fall", forms: ["run", "running", "to run", "having run"], rest: "the snack stand at every home game" },
    { subj: "The jersey that {{NAME_3}} wore at {{EVENT}}", forms: ["hangs", "hanging", "to hang", "having hung"], rest: "in a frame above the front desk" },
    { subj: "The drills that the new coach brought to {{LOCATION}}", forms: ["focus", "focusing", "to focus", "having focused"], rest: "on footwork and patience" },
    { subj: "The fans waiting outside the arena", forms: ["chant", "chanting", "to chant", "having chanted"], rest: "{{NAME_1_POSS}} name every few minutes" },
    { subj: "The playlist that {{NAME_2}} made for the bus ride", forms: ["includes", "including", "to include", "having included"], rest: "forty songs and one very long speech" },
    { subj: "Each morning, the groundskeepers at {{LOCATION}}", forms: ["mow", "mowing", "to mow", "having mowed"], rest: "the field in perfect stripes" },
    { subj: "The reporter who covered {{EVENT}}", forms: ["describes", "describing", "to describe", "having described"], rest: "the final minute as pure chaos" },
  ];

  G.add(3, () => {
    const out = [];
    // 1) Name, ______ (participle)…, main verb.
    for (const [p, main] of G.product(PARTS, MAINS)) {
      out.push({
        skill: "Participle modifiers",
        text: `{{NAME_1}}, ______ ${p.rest}, ${main}.`,
        choices: [p.ing, p.past, p.s, `was ${p.ing}`],
        notes: [
          `Correct. "${G.cap(p.ing)} ${p.rest}" is a non-verb modifier set off by commas; the main verb comes later.`,
          `"${G.cap(p.past)}" acts as a second main verb next to the real one.`,
          TWO_VERBS,
          TWO_VERBS,
        ],
        rule: `The main verb comes after the second comma. The blank opens a modifier, so it needs a non-verb (-ing) form.`,
      });
    }
    // 2) Title ______ …, verb (the sample's "player Stephen Curry, intending…" pattern).
    for (const [t, p] of G.product(TITLES, PARTS)) {
      const main = G.pick(MAINS, t + p.ing);
      out.push({
        skill: "Appositive + modifier",
        text: `${t} ______ ${p.rest}, ${main}.`,
        choices: [`{{NAME_1}}, ${p.ing}`, `{{NAME_1}}, ${p.s}`, `{{NAME_1}} ${p.s}`, `{{NAME_1}} is ${p.ing}`],
        notes: [
          `Correct. "${t} {{NAME_1}}" is the subject, "${p.ing} ${p.rest}" is a modifier set off by commas, and "${G.firstWord(main)[0]}" is the only main verb.`,
          "A comma between the subject and a conjugated verb, plus two main verbs.",
          `${TWO_VERBS} It's also missing the comma that pairs with the one before "${G.firstWord(main)[0]}."`,
          TWO_VERBS,
        ],
        rule: `Main verb: "${G.firstWord(main)[0]}." The blank opens a non-essential modifier: Name, -ing…, verb.`,
      });
    }
    // 3) The subject is long and needs its main verb.
    for (const m of MAIN_VERB) {
      for (let k = 0; k < 1; k++) {
        out.push({
          skill: "Finding the main verb",
          text: `${m.subj} ______ ${m.rest}.`,
          choices: m.forms,
          notes: [`Correct. "${m.forms[0]}" is the conjugated main verb the subject needs.`, FRAGMENT, FRAGMENT, FRAGMENT],
          rule: "Everything before the blank is the subject (with its describing phrases); the sentence still needs a main verb.",
        });
      }
    }
    return out;
  });
})();
