// Generated questions, Chapter 4: Verb Tenses & Aspect.
// An explicit time clue decides the tense: past (happened), present perfect
// (until now), past perfect (had happened, before another past event),
// future (will happen) and future perfect (by a future deadline).
(function () {
  "use strict";
  const G = window.SatWizz.gen;

  // base, s, past, past participle, what follows, durative (works with "for three years")
  const VERBS = [
    ["practice", "practices", "practiced", "practiced", "{{SKILL}} at {{LOCATION}}", true],
    ["coach", "coaches", "coached", "coached", "the youngest players at {{LOCATION}}", true],
    ["write", "writes", "wrote", "written", "a new song for {{EVENT}}", false],
    ["lead", "leads", "led", "led", "the morning warm-up", true],
    ["study", "studies", "studied", "studied", "the playbook on every bus ride", true],
    ["train", "trains", "trained", "trained", "with the varsity squad", true],
    ["perform", "performs", "performed", "performed", "at {{EVENT}}", false],
    ["volunteer", "volunteers", "volunteered", "volunteered", "at the food bank near {{LOCATION}}", true],
    ["teach", "teaches", "taught", "taught", "{{SKILL}} to beginners", true],
    ["run", "runs", "ran", "run", "the snack stand at home games", true],
    ["build", "builds", "built", "built", "a robot for the science fair", false],
    ["sing", "sings", "sang", "sung", "the anthem at {{EVENT}}", false],
    ["draw", "draws", "drew", "drawn", "the posters for {{EVENT}}", false],
    ["win", "wins", "won", "won", "the opening round", false],
    ["organize", "organizes", "organized", "organized", "the fundraiser for the new scoreboard", false],
    ["record", "records", "recorded", "recorded", "a podcast about {{SKILL}}", true],
    ["mentor", "mentors", "mentored", "mentored", "two first-year students", true],
    ["direct", "directs", "directed", "directed", "the spring play", false],
    ["captain", "captains", "captained", "captained", "the debate team", true],
    ["design", "designs", "designed", "designed", "the jerseys for {{EVENT}}", false],
    ["photograph", "photographs", "photographed", "photographed", "every home game", true],
    ["edit", "edits", "edited", "edited", "the school newspaper", true],
    ["host", "hosts", "hosted", "hosted", "the talent show", false],
    ["rebuild", "rebuilds", "rebuilt", "rebuilt", "the old bleachers", false],
    ["climb", "climbs", "climbed", "climbed", "the rock wall at {{LOCATION}}", false],
  ];

  const T = {
    past: {
      clues: ["Last summer", "Two years ago", "Yesterday afternoon", "In 2019", "During last year's season"],
      answer: (v) => v[2],
      wrong: (v) => [[v[1], "The present doesn't match a finished past time."], [`will ${v[0]}`, "The future can't happen in the past."], [`has ${v[3]}`, "The present perfect can't be used with a finished past time."]],
      rule: (c) => `"${c}" marks a finished past time, so use the simple past.`,
      skill: "Past",
    },
    presPerf: {
      clues: ["Since the start of the season", "So far this year", "Since last fall", "Over the past three months"],
      answer: (v) => `has ${v[3]}`,
      wrong: (v) => [[v[2], `The simple past ignores the "until now" time frame.`], [`had ${v[3]}`, "The past perfect needs a past reference point."], [`will ${v[0]}`, "The future contradicts a time frame that runs up to now."]],
      rule: (c) => `"${c}" means from then until now: the present perfect.`,
      skill: "Present perfect",
    },
    pastPerf: {
      clues: ["By the time {{NAME_2}} showed up", "By the time the reporters arrived", "By the time the final bell rang"],
      answer: (v) => `had ${v[3]}`,
      wrong: (v) => [[v[1], "The present doesn't fit a past story."], [`will ${v[0]}`, "The future doesn't fit a past story."], [`has ${v[3]}`, "The present perfect doesn't sit inside a past narrative."]],
      rule: () => "One past event happened before another past event: the earlier one takes the past perfect (had + past participle).",
      skill: "Past perfect",
    },
    future: {
      clues: ["Next spring", "Tomorrow morning", "Later this week", "Next month"],
      answer: (v) => `will ${v[0]}`,
      wrong: (v) => [[v[2], "The past contradicts a future time."], [`has ${v[3]}`, "The present perfect points back to now, not ahead."], [`had ${v[3]}`, "The past perfect is for the past."]],
      rule: (c) => `"${c}" is in the future: will + verb.`,
      skill: "Future",
    },
    futPerf: {
      clues: ["By the end of next season", "By next June", "By the time {{NAME_2}} graduates"],
      answer: (v) => `will have ${v[3]}`,
      wrong: (v) => [[v[2], "The past contradicts a future deadline."], [`has ${v[3]}`, "The present perfect stops at now, not at the future deadline."], [`had ${v[3]}`, "The past perfect is for the past."]],
      rule: (c) => `"${c}" is a future deadline: the future perfect (will have + past participle).`,
      skill: "Future perfect",
      tail: " for three straight years",
      durativeOnly: true,
    },
  };

  G.add(4, () => {
    const out = [];
    for (const [key, t] of Object.entries(T)) {
      for (const [clue, v] of G.product(t.clues, VERBS)) {
        if (t.durativeOnly && !v[5]) continue;
        // Don't name the same place or event twice in one sentence.
        if ((/LOCATION/.test(clue) && /LOCATION/.test(v[4])) || (/EVENT/.test(clue) && /EVENT/.test(v[4]))) continue;
        const wrong = t.wrong(v);
        out.push({
          skill: t.skill,
          text: `${clue}, {{NAME_1}} ______ ${v[4]}${t.tail || ""}.`,
          choices: [t.answer(v), ...wrong.map((w) => w[0])],
          notes: [`Correct. "${clue}" calls for "${t.answer(v)}".`, ...wrong.map((w) => w[1])],
          rule: t.rule(clue),
        });
      }
    }
    return out;
  });
})();
