// SatWizz curriculum: 9 chapters of SAT grammar, in order, plus a bonus chapter.
//
// Each chapter opens with an "Explanation Pause" (`pause`), then practice
// questions. The pause rules double as the Focus Break summary.
//
// Question fields:
//   text     sentence with one "______" blank; each choice replaces exactly the blank
//   choices  4 options; `answer` is the index of the correct one (shuffled on screen)
//   kind     "transition" uses the logical-transition prompt instead of the grammar one
//
// Placeholders (filled from the chosen cast):
//   {{NAME_1}} {{NAME_2}} {{NAME_3}}      people
//   {{NAME_1_POSS}} / {{NAME_1_OBJ}}      his/her/their, him/her/them (any NAME_n)
//   {{LOCATION}} {{EVENT}} {{SKILL}}      theme flavor; use mid-sentence only
// Never make a subject pronoun agree with a verb: custom casts can use "they".
//
// Shorthand used in the lessons:
//   IC = independent clause (subject + main verb, complete thought)
//   DC = dependent clause (starts with because, although, when, which, who...)
//   conj = FANBOYS (for, and, nor, but, or, yet, so)
//   LW = linking word (however, therefore, moreover, nevertheless, instead...)
//   Flexpos = "flexible position": an LW can slide around inside its clause,
//             which is why it can never join two clauses on its own.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  SW.chapters = [
    // ---------------------------------------------------------------- 1
    {
      id: 1,
      short: "Independent Clauses",
      title: "Identifying Independent Clauses",
      pause: {
        summary: "Every sentence needs at least one independent clause (IC): a subject plus a main verb that forms a complete thought. Anything less is a fragment.",
        rules: [
          "IC = subject + main (conjugated) verb + complete thought.",
          "Relative pronouns (which, that, who, whose) start a sub-element inside the sentence. The verb after them belongs to that sub-element, not to the main clause.",
          "Strip out the relative clause and check what's left. If the subject has no main verb, it's a fragment.",
          "Starting with because, although, when or which turns a clause into a dependent clause (DC). A DC alone is a fragment.",
        ],
        patterns: [
          { f: "Subject + verb", ok: true },
          { f: "Subject + that/which clause (no main verb)", ok: false },
          { f: "Because + clause, alone", ok: false },
        ],
        example: "The telescope [that {{NAME_1}} built] captures sharp images. → main clause: The telescope captures.",
      },
      questions: [
        {
          id: "c1-1", skill: "Relative clause traps",
          text: "The telescope that {{NAME_1}} built last summer ______ sharp images of Saturn's rings.",
          choices: ["captures", "capturing", "which captures", "that captures"],
          answer: 0,
          why: "\"That {{NAME_1}} built last summer\" is a relative clause, so \"The telescope\" still needs a main verb. \"Capturing\" isn't a main verb, and \"which/that captures\" just starts another relative clause.",
        },
        {
          id: "c1-2", skill: "Relative clause traps",
          text: "{{NAME_2}}, who had never performed at {{LOCATION}} before, ______ nervous but ready.",
          choices: ["felt", "feeling", "who felt", "having felt"],
          answer: 0,
          why: "The \"who\" clause is extra information. Remove it and you get \"{{NAME_2}} ______ nervous but ready,\" which needs the main verb \"felt.\"",
        },
        {
          id: "c1-3", skill: "Main verbs",
          text: "The notebook that {{NAME_1}} carried to every practice ______ filled with sketches, formulas, and reminders.",
          choices: ["was", "being", "having been", "to be"],
          answer: 0,
          why: "The subject \"The notebook\" needs a main verb. \"Being,\" \"having been\" and \"to be\" can't be main verbs, so they would leave a fragment.",
        },
        {
          id: "c1-4", skill: "Fragments",
          text: "After months of preparation for {{EVENT}}, ______",
          choices: [
            "{{NAME_3}} finally felt confident.",
            "{{NAME_3}}, who finally felt confident.",
            "{{NAME_3}} finally feeling confident.",
            "which gave {{NAME_3}} confidence at last.",
          ],
          answer: 0,
          why: "Only the first choice gives the sentence a subject with a main verb (\"{{NAME_3}} felt\"). The others end with a relative clause, an -ing word, or a dangling \"which,\" so no IC is formed.",
        },
        {
          id: "c1-5", skill: "Relative clause traps",
          text: "The coach whose drills {{NAME_2}} practiced every morning ______ a former champion.",
          choices: ["was", "being", "who was", "whose career was"],
          answer: 0,
          why: "\"Whose drills {{NAME_2}} practiced every morning\" describes the coach. The subject \"The coach\" still needs its own main verb: \"was.\"",
        },
        {
          id: "c1-6", skill: "Relative clause traps",
          text: "The old arena where {{NAME_1}} first watched {{EVENT}} ______ torn down last year.",
          choices: ["was", "being", "that was", "which was"],
          answer: 0,
          why: "\"Where {{NAME_1}} first watched {{EVENT}}\" is a sub-element. The main clause is \"The old arena was torn down.\"",
        },
        {
          id: "c1-7", skill: "Fragments",
          text: "{{NAME_2}} arrived at {{LOCATION}} early. ______ to review {{SKILL}} before anyone else showed up.",
          choices: ["{{NAME_2}} wanted", "Wanting", "Because {{NAME_2}} wanted", "Which allowed {{NAME_2}}"],
          answer: 0,
          why: "The second sentence needs its own IC. \"Wanting…\" has no main verb, \"Because…\" is a DC, and \"Which…\" is a relative clause, so all three are fragments.",
        },
      ],
    },

    // ---------------------------------------------------------------- 2
    {
      id: 2,
      short: "Connecting Clauses",
      title: "Connecting Independent Clauses",
      pause: {
        summary: "Two clauses can only be joined in a few legal ways. Learn the valid patterns and spot the invalid ones.",
        rules: [
          "Valid: IC, conj IC · IC, DC · IC; IC · IC DC · DC, IC",
          "Invalid: IC, conj DC · DC, DC (no IC at all) · IC; DC (a semicolon needs an IC on both sides)",
          "A comma alone can't join two ICs. IC, IC is a comma splice.",
          "Linking words (LW) like however and therefore are Flexpos: they can move around, so they never join clauses. IC, LW, IC is a comma splice. Use IC; LW, IC.",
          "After ; LW, the clause must still be an IC. IC; LW, DC is invalid.",
        ],
        patterns: [
          { f: "IC, conj IC", ok: true },
          { f: "DC, IC", ok: true },
          { f: "IC; IC", ok: true },
          { f: "IC DC", ok: true },
          { f: "IC, IC", ok: false },
          { f: "IC; DC", ok: false },
          { f: "IC, LW, IC", ok: false },
          { f: "IC; LW, DC", ok: false },
        ],
        example: "{{NAME_1}} practiced daily; however, {{NAME_2}} rested.  ✓ IC; LW, IC",
      },
      questions: [
        {
          id: "c2-1", skill: "Comma splices",
          text: "{{NAME_1}} spent the entire summer working on ______ September, even the harshest critics admitted that the effort had paid off.",
          choices: ["{{SKILL}}. By", "{{SKILL}}, by", "{{SKILL}} by", "{{SKILL}} by,"],
          answer: 0,
          why: "Both halves are ICs. A period separates them. \"IC, IC\" is a comma splice, and no punctuation makes a run-on.",
        },
        {
          id: "c2-2", skill: "IC, conj IC",
          text: "The crowd at {{LOCATION}} went silent, ______ was about to attempt something no one had seen before.",
          choices: ["and {{NAME_2}}", "{{NAME_2}}", "and, {{NAME_2}}", "{{NAME_2}},"],
          answer: 0,
          why: "Two ICs joined by a comma need a FANBOYS conjunction: IC, conj IC. Without \"and\" it's a comma splice, and no comma belongs after \"and.\"",
        },
        {
          id: "c2-3", skill: "DC, IC",
          text: "Because {{NAME_1}} had never seen snow ______ winter trip felt like a real adventure.",
          choices: ["before, the", "before the", "before; the", "before: the"],
          answer: 0,
          why: "The sentence opens with a DC (\"Because…\"), so the pattern is DC, IC. A semicolon or colon needs an IC before it.",
        },
        {
          id: "c2-4", skill: "IC DC",
          text: "{{NAME_2}} kept practicing ______ the lights at {{LOCATION}} shut off for the night.",
          choices: ["until", "; until", ". Until", ": until"],
          answer: 0,
          why: "IC DC needs no punctuation when the DC comes second. \"IC; DC\" is invalid, and \". Until…\" leaves the DC as a fragment.",
        },
        {
          id: "c2-5", skill: "IC, conj DC",
          text: "{{NAME_3}} studied the playbook every night, ______ knew every play before {{EVENT}}.",
          choices: ["so {{NAME_3}}", "so because {{NAME_3}}", "because, {{NAME_3}}", "{{NAME_3}}"],
          answer: 0,
          why: "\"IC, so IC\" is valid. \"so because…\" makes IC, conj DC, which is invalid. \"IC, IC\" with no conjunction is a comma splice.",
        },
        {
          id: "c2-6", skill: "IC; IC",
          text: "The first half of {{EVENT}} was ______ second half was a blur of highlights.",
          choices: ["slow; the", "slow, the", "slow the", "slow; while the"],
          answer: 0,
          why: "Both sides are ICs, so a semicolon works. \"; while the…\" puts a DC after the semicolon (IC; DC), which is invalid.",
        },
        {
          id: "c2-7", skill: "DC, DC",
          text: "Although {{NAME_1}} was exhausted after {{EVENT}}, ______",
          choices: [
            "{{NAME_1}} still reviewed the notes from the day.",
            "because the notes from the day still needed review.",
            "which meant reviewing the notes from the day.",
            "while the notes from the day still waited for review.",
          ],
          answer: 0,
          why: "The sentence starts with a DC, so it needs an IC after the comma (DC, IC). The other choices add a second DC, and DC, DC never makes a sentence.",
        },
        {
          id: "c2-8", skill: "IC; LW, DC",
          text: "{{NAME_3}} missed the early ______ still made it to {{LOCATION}} on time.",
          choices: ["bus; however, {{NAME_3}}", "bus, however, {{NAME_3}}", "bus; however, although {{NAME_3}}", "bus however {{NAME_3}}"],
          answer: 0,
          why: "\"However\" is a linking word, so it needs a semicolon before it and an IC after it. \", however,\" is a comma splice, and \"; however, although…\" puts a DC after the LW.",
        },
      ],
    },

    // ---------------------------------------------------------------- 3
    {
      id: 3,
      short: "Subject-Verb Agreement",
      title: "Subject-Verb Agreement",
      pause: {
        summary: "A singular subject takes a singular verb, and a plural subject takes a plural verb. The trick is finding the real subject.",
        rules: [
          "Cross out prepositional phrases (of the…, in the…, with the…) between the subject and verb. The subject is never inside one.",
          "\"Along with,\" \"as well as\" and \"together with\" don't make a subject plural.",
          "Two subjects joined by \"and\" are plural. With either/or and neither/nor, the verb matches the closer subject.",
          "Each, every, one and a collection/list/group are singular.",
          "In inverted sentences (\"There are…,\" \"At the back sits…\"), the subject comes after the verb.",
        ],
        patterns: [
          { f: "The box [of pens] is", ok: true },
          { f: "The box [of pens] are", ok: false },
          { f: "Each [of the drills] targets", ok: true },
        ],
        example: "The list [of {{NAME_1_POSS}} goals] is taped to the mirror.",
      },
      questions: [
        {
          id: "c3-1", skill: "Prepositional traps",
          text: "The collection of trophies in {{NAME_1_POSS}} display cabinet ______ grown every single year.",
          choices: ["has", "have", "are", "were"],
          answer: 0,
          why: "Cross out \"of trophies in… cabinet.\" The subject is \"collection\" (singular), so use \"has.\"",
        },
        {
          id: "c3-2", skill: "Compound subjects",
          text: "{{NAME_1}} and {{NAME_2}} ______ been friends since their very first day at {{LOCATION}}.",
          choices: ["have", "has", "is", "was"],
          answer: 0,
          why: "Two subjects joined by \"and\" make a plural subject, which takes \"have.\"",
        },
        {
          id: "c3-3", skill: "Neither/nor",
          text: "Neither {{NAME_1}} nor {{NAME_2}}'s teammates ______ ready for the surprise announcement.",
          choices: ["were", "was", "is", "has been"],
          answer: 0,
          why: "With neither/nor, the verb matches the closer subject. \"Teammates\" is plural, so the verb is \"were.\"",
        },
        {
          id: "c3-4", skill: "Prepositional traps",
          text: "Each of the practice drills that {{NAME_3}} designed ______ a specific weakness.",
          choices: ["targets", "target", "are targeting", "have targeted"],
          answer: 0,
          why: "\"Each\" is the subject and it's singular. \"Drills\" sits inside the phrase \"of the practice drills.\"",
        },
        {
          id: "c3-5", skill: "Inverted sentences",
          text: "At the back of the room ______ a stack of old notebooks that once belonged to {{NAME_1}}.",
          choices: ["sits", "sit", "are sitting", "have sat"],
          answer: 0,
          why: "The sentence is inverted. The real subject is \"a stack\" (singular), so the verb is \"sits.\"",
        },
        {
          id: "c3-6", skill: "Along with",
          text: "{{NAME_1}}, along with {{NAME_2}} and {{NAME_3}}, ______ planning a surprise for the coach.",
          choices: ["is", "are", "were", "have been"],
          answer: 0,
          why: "\"Along with…\" doesn't add to the subject. The subject is still just {{NAME_1}}, so use \"is.\"",
        },
        {
          id: "c3-7", skill: "Inverted sentences",
          text: "There ______ several reasons why {{NAME_2}} decided to switch positions this season.",
          choices: ["were", "was", "is", "has been"],
          answer: 0,
          why: "In \"there\" sentences the subject comes after the verb. \"Several reasons\" is plural, so use \"were.\"",
        },
      ],
    },

    // ---------------------------------------------------------------- 4
    {
      id: 4,
      short: "Verb vs. Non-Verb",
      title: "Verb vs. Non-Verb Identification",
      pause: {
        summary: "First decide whether the blank is the sentence's main verb or a describing word. Then pick the form.",
        rules: [
          "If the sentence has no main verb yet, the blank needs a conjugated verb (performed, is, runs).",
          "If the sentence already has a main verb, the blank is usually a non-finite form: an -ing participle (reviewing) or an infinitive (to create).",
          "Non-finite forms (-ing, to + verb, having + -ed) can never be the main verb on their own.",
          "Commas around an interrupter (, hoping to impress,) hide the subject from its verb. Skip the interrupter and look for the verb.",
        ],
        patterns: [
          { f: "{{NAME_1}} performed", ok: true },
          { f: "{{NAME_1}} performing (alone)", ok: false },
          { f: "…stayed late, reviewing notes", ok: true },
        ],
        example: "{{NAME_1}}, hoping to win, trained daily. → main verb: trained",
      },
      questions: [
        {
          id: "c4-1", skill: "Main verb needed",
          text: "{{NAME_1}}, hoping to impress the judges at {{EVENT}}, ______ a routine no one had tried before.",
          choices: ["performed", "performing", "to perform", "having performed"],
          answer: 0,
          why: "Skip the interrupter \"hoping to impress…\" and the sentence is \"{{NAME_1}} ______ a routine.\" It needs a main verb: \"performed.\"",
        },
        {
          id: "c4-2", skill: "Main verb needed",
          text: "Determined to improve at {{SKILL}}, {{NAME_2}} ______ extra practice every weekend.",
          choices: ["scheduled", "scheduling", "to schedule", "having scheduled"],
          answer: 0,
          why: "\"Determined to improve…\" is an opening modifier. The subject {{NAME_2}} still needs its main verb: \"scheduled.\"",
        },
        {
          id: "c4-3", skill: "Participles",
          text: "{{NAME_3}} stayed late at {{LOCATION}}, ______ every mistake from the morning session.",
          choices: ["reviewing", "reviewed", "reviews", "has reviewed"],
          answer: 0,
          why: "The IC already has its verb (\"stayed\"). After the comma, the blank adds detail, so it takes the -ing participle \"reviewing.\" A second main verb after a comma would be a splice.",
        },
        {
          id: "c4-4", skill: "Infinitives",
          text: "The goal of the new schedule is ______ more time for {{SKILL}}.",
          choices: ["to create", "creates", "created", "has created"],
          answer: 0,
          why: "The main verb is \"is.\" What follows names the goal, so it takes the infinitive \"to create.\"",
        },
        {
          id: "c4-5", skill: "Participles",
          text: "The volunteers ______ at {{LOCATION}} every Saturday include {{NAME_1}} and {{NAME_2}}.",
          choices: ["working", "work", "works", "have worked"],
          answer: 0,
          why: "The main verb is \"include.\" The blank describes which volunteers, so it takes the participle \"working.\"",
        },
        {
          id: "c4-6", skill: "Main verb needed",
          text: "{{NAME_2}}'s plan for {{EVENT}} ______ simple: practice a little every day.",
          choices: ["was", "being", "to be", "having been"],
          answer: 0,
          why: "The subject \"plan\" has no verb yet. Only \"was\" is a main verb, and a colon needs an IC on its left.",
        },
        {
          id: "c4-7", skill: "Participles",
          text: "Before {{EVENT}}, {{NAME_3}} practiced for hours, ______ each move until it felt automatic.",
          choices: ["repeating", "repeated", "repeats", "and repeating"],
          answer: 0,
          why: "\"Practiced\" is the main verb. The phrase after the comma describes how, so it takes \"repeating.\" \"And repeating\" isn't parallel with \"practiced.\"",
        },
      ],
    },

    // ---------------------------------------------------------------- 5
    {
      id: 5,
      short: "Verb Tenses",
      title: "Verb Tenses",
      pause: {
        summary: "Match the verb's tense to the timeline. Look for time clues and keep tenses consistent unless the time actually changes.",
        rules: [
          "Finished past (last year, yesterday, in 2019) takes the simple past: broke, ran.",
          "Since or for + time up to now takes the present perfect: has organized.",
          "An earlier past, before another past event, takes the past perfect: had finished.",
          "Done by a future point takes the future perfect: will have trained.",
          "\"Right now\" or \"currently\" takes the present progressive: is revising.",
          "After would have, has or had, use the past participle: would have run, not would have ran.",
        ],
        patterns: [
          { f: "Last spring, {{NAME_1}} broke", ok: true },
          { f: "Since 2019, {{NAME_1}} organized", ok: false },
          { f: "would have ran", ok: false },
        ],
        example: "By the time the bus arrived, {{NAME_2}} had already finished.",
      },
      questions: [
        {
          id: "c5-1", skill: "Time clues",
          text: "Last spring, {{NAME_1}} ______ a school record that had stood for twenty years.",
          choices: ["broke", "breaks", "will break", "has been breaking"],
          answer: 0,
          why: "\"Last spring\" is finished past time, so use the simple past \"broke.\"",
        },
        {
          id: "c5-2", skill: "Past perfect",
          text: "By the time the bus arrived, {{NAME_2}} ______ already finished the entire reading assignment.",
          choices: ["had", "has", "have", "will have"],
          answer: 0,
          why: "The finishing happened before another past event (the bus arriving). That takes the past perfect: \"had finished.\"",
        },
        {
          id: "c5-3", skill: "Verb forms",
          text: "{{NAME_3}} would have ______ the race if the storm had not delayed the start.",
          choices: ["run", "ran", "runned", "running"],
          answer: 0,
          why: "\"Would have\" takes the past participle. The past participle of \"run\" is \"run.\"",
        },
        {
          id: "c5-4", skill: "Present perfect",
          text: "Every year since 2019, {{NAME_1}} ______ the charity run at {{LOCATION}}.",
          choices: ["has organized", "organized", "will organize", "had organized"],
          answer: 0,
          why: "\"Since 2019\" describes something that started in the past and continues now, which takes the present perfect \"has organized.\"",
        },
        {
          id: "c5-5", skill: "Future perfect",
          text: "By the time {{EVENT}} begins next month, {{NAME_2}} ______ for six straight weeks.",
          choices: ["will have trained", "trained", "has trained", "had trained"],
          answer: 0,
          why: "The training will be complete by a future point (next month). That takes the future perfect \"will have trained.\"",
        },
        {
          id: "c5-6", skill: "Consistency",
          text: "When {{NAME_3}} walked into {{LOCATION}}, the crowd ______ to cheer.",
          choices: ["began", "begins", "will begin", "has begun"],
          answer: 0,
          why: "\"Walked\" sets the story in the past. The crowd's reaction happened at the same time, so keep the past tense: \"began.\"",
        },
        {
          id: "c5-7", skill: "Time clues",
          text: "Right now, {{NAME_1}} ______ the final draft of a speech for {{EVENT}}.",
          choices: ["is revising", "revised", "had revised", "will have revised"],
          answer: 0,
          why: "\"Right now\" means it's in progress, which takes the present progressive \"is revising.\"",
        },
      ],
    },

    // ---------------------------------------------------------------- 6
    {
      id: 6,
      short: "Transitions",
      title: "Transitions",
      pause: {
        summary: "Choose the transition by the relationship between the ideas, then punctuate it like the linking word it is.",
        rules: [
          "Contrast (the next idea goes against the last): however, nevertheless, instead, by contrast.",
          "Cause and effect (the next idea is a result): therefore, as a result, consequently.",
          "Addition (the next idea adds more in the same direction): moreover, additionally, furthermore.",
          "Example: for instance, for example. Sequence: first, next, finally. Restatement: in other words.",
          "Connector rules: no \", LW\" comma splice (IC, however, IC); no \"; LW\" before a DC; and \"though\" can't start a clause after a semicolon (IC; though, IC is illegal).",
        ],
        patterns: [
          { f: "IC. However, IC", ok: true },
          { f: "IC; however, IC", ok: true },
          { f: "IC, however, IC", ok: false },
          { f: "IC; though, IC", ok: false },
        ],
        example: "{{NAME_1}} missed practice. Nevertheless, {{NAME_1}} started the game.",
      },
      questions: [
        {
          id: "c6-1", skill: "Contrast", kind: "transition",
          text: "{{NAME_1}} missed the first three practices of the season. ______ {{NAME_1}} was named a starter for the opening game.",
          choices: ["Nevertheless,", "Therefore,", "For example,", "Similarly,"],
          answer: 0,
          why: "Being named a starter is surprising after missing practice. \"Nevertheless\" signals that contrast.",
        },
        {
          id: "c6-2", skill: "Cause and effect", kind: "transition",
          text: "{{NAME_2}} studied the playbook every night for a month. ______ {{NAME_2}} knew every play by heart before the first game.",
          choices: ["As a result,", "However,", "Instead,", "In contrast,"],
          answer: 0,
          why: "Knowing every play is the result of studying every night. That's cause and effect.",
        },
        {
          id: "c6-3", skill: "Examples", kind: "transition",
          text: "{{NAME_3}} has several rituals before {{EVENT}}. ______ {{NAME_3}} always listens to the same song while warming up.",
          choices: ["For instance,", "Nonetheless,", "Meanwhile,", "In other words,"],
          answer: 0,
          why: "The second sentence gives one specific ritual, which is an example of the first sentence's claim.",
        },
        {
          id: "c6-4", skill: "Contrast", kind: "transition",
          text: "{{NAME_1}} does {{NAME_1_POSS}} best practicing alone in the early morning. {{NAME_2}}, ______ prefers a noisy gym full of teammates.",
          choices: ["by contrast,", "similarly,", "therefore,", "for example,"],
          answer: 0,
          why: "The two people have opposite habits, so the transition should show contrast.",
        },
        {
          id: "c6-5", skill: "Contrast", kind: "transition",
          text: "Critics predicted that {{NAME_2}} would struggle at {{EVENT}}. ______ {{NAME_2}} delivered the best performance of {{NAME_2_POSS}} career.",
          choices: ["Instead,", "Additionally,", "Similarly,", "Consequently,"],
          answer: 0,
          why: "What happened was the opposite of the prediction. \"Instead\" shows one outcome replacing the expected one.",
        },
        {
          id: "c6-6", skill: "Addition", kind: "transition",
          text: "{{NAME_3}} became the youngest person ever to win the award. ______ {{NAME_3}} donated the prize money to a local after-school program.",
          choices: ["Moreover,", "However,", "Regardless,", "Otherwise,"],
          answer: 0,
          why: "The second sentence adds another impressive fact on top of the first, so it's addition.",
        },
        {
          id: "c6-7", skill: "Connector punctuation",
          text: "{{NAME_2}} hoped for a week of ______ the schedule had other plans.",
          choices: ["rest; however,", "rest, however,", "rest; however", "rest however,"],
          answer: 0,
          why: "\"However\" joins two ICs here, so it takes a semicolon before it and a comma after it. \"IC, however, IC\" is a comma splice.",
        },
        {
          id: "c6-8", skill: "Connector punctuation",
          text: "{{NAME_1}} expected to lose the ______ won by a single point.",
          choices: ["match; instead, {{NAME_1}}", "match; though, {{NAME_1}}", "match, instead, {{NAME_1}}", "match instead {{NAME_1}}"],
          answer: 0,
          why: "\"; instead,\" correctly joins two ICs. \"IC; though, IC\" is illegal because \"though\" can't open a clause that way. \", instead,\" is a comma splice.",
        },
      ],
    },

    // ---------------------------------------------------------------- 7
    {
      id: 7,
      short: "Semicolons, Colons, Dashes",
      title: "Punctuation Fundamentals: Semicolons, Colons, Dashes",
      pause: {
        summary: "Each strong punctuation mark has a job, and each one has a rule about what must come before it.",
        rules: [
          "Semicolon: IC; IC. Also separates list items that already contain commas: A, B; C, D; and E, F.",
          "Colon: the left side MUST be an IC. The right side can be an IC, a list or a noun phrase that elaborates.",
          "Single dash: works like a colon or comma after an IC. The left side MUST be an IC. Never put a dash before FANBOYS.",
          "\", which\" starts a non-essential relative clause (a DC). It needs a comma, not a semicolon or period.",
        ],
        patterns: [
          { f: "IC: list", ok: true },
          { f: "The skills are: list", ok: false },
          { f: "IC—elaboration", ok: true },
          { f: "IC—but IC", ok: false },
          { f: "noun, which…", ok: true },
        ],
        example: "{{NAME_1}} packed three things: water, snacks, and a map.",
      },
      questions: [
        {
          id: "c7-1", skill: "Colons",
          text: "{{NAME_2}} packed only three things for the ______ a notebook, a phone charger, and a lucky wristband.",
          choices: ["trip:", "trip;", "trip, including:", "trip, they were"],
          answer: 0,
          why: "The left side is an IC, and a list follows, so use a colon. A semicolon can't introduce a list, and a colon can't follow \"including.\"",
        },
        {
          id: "c7-2", skill: "Colons",
          text: "{{NAME_3}} had exactly one goal for ______ stay calm no matter what happened.",
          choices: ["{{EVENT}}: to", "{{EVENT}}; to", "{{EVENT}}. To", "{{EVENT}} to"],
          answer: 0,
          why: "The IC before the colon sets up what the goal was. \"To stay calm…\" isn't an IC, so a semicolon or period won't work.",
        },
        {
          id: "c7-3", skill: "Semicolon lists",
          text: "{{NAME_1}}'s summer tour stopped in three cities: Lisbon, ______ Madrid, Spain; and Paris, France.",
          choices: ["Portugal;", "Portugal,", "Portugal:", "Portugal"],
          answer: 0,
          why: "The list items already contain commas (city, country), so semicolons separate the items. The later items use them too.",
        },
        {
          id: "c7-4", skill: "Single dashes",
          text: "{{NAME_1}} finally understood what the coach ______ is only useful when it is focused.",
          choices: ["meant—practice", "meant, practice", "meant practice", "meant; and practice"],
          answer: 0,
          why: "The left side is an IC, and the right side explains it, so a single dash works like a colon. A comma alone would make a splice.",
        },
        {
          id: "c7-5", skill: "Dashes and FANBOYS",
          text: "The rain at {{LOCATION}} kept ______ the game went on anyway.",
          choices: ["falling, but", "falling—but", "falling; but", "falling but,"],
          answer: 0,
          why: "Two ICs joined by \"but\" take a comma: IC, conj IC. Never put a dash (or a semicolon) before a FANBOYS word.",
        },
        {
          id: "c7-6", skill: ", which clauses",
          text: "{{NAME_2}} donated the prize money to the community ______ used it to buy new laptops.",
          choices: ["library, which", "library which", "library; which", "library. Which"],
          answer: 0,
          why: "\"Which used it…\" is a non-essential DC, so it takes a comma. A semicolon or period would leave it as a fragment.",
        },
        {
          id: "c7-7", skill: "Colons",
          text: "The three skills tested at {{EVENT}} ______ speed, accuracy, and focus.",
          choices: ["are", "are:", "are;", "are—"],
          answer: 0,
          why: "\"The three skills tested at {{EVENT}} are\" isn't an IC, so no colon or dash can follow it. The list completes the sentence directly.",
        },
        {
          id: "c7-8", skill: "Colons",
          text: "{{NAME_3}} learned an important ______ hard work beats talent when talent doesn't work hard.",
          choices: ["lesson:", "lesson,", "lesson", "lesson, that"],
          answer: 0,
          why: "The IC on the left names a lesson, and the IC on the right spells it out. That's a colon's job. A comma would make a splice.",
        },
      ],
    },

    // ---------------------------------------------------------------- 8
    {
      id: 8,
      short: "Appositives",
      title: "Appositives & Non-Essential Clauses",
      pause: {
        summary: "Extra information is set off on both sides with matching punctuation. Essential information takes no punctuation at all.",
        rules: [
          "Non-essential (you could delete it): wrap it symmetrically: , info , or — info —. Never mix a dash with a comma.",
          "Test: cover the extra info with your thumb. The sentence should still work.",
          "Essential (it tells you which one): no commas. \"The researcher {{NAME_1}} presented…\" has no commas.",
          "Essential \"who\" or \"that\" clauses (Students who finish early…) take no commas either.",
        ],
        patterns: [
          { f: "{{NAME_1}}, a captain, won", ok: true },
          { f: "{{NAME_1}}—a captain, won", ok: false },
          { f: "The researcher {{NAME_1}} spoke", ok: true },
          { f: "The researcher, {{NAME_1}} spoke", ok: false },
        ],
        example: "{{NAME_2}}, the youngest player on the team, scored the winning point.",
      },
      questions: [
        {
          id: "c8-1", skill: "Dash pairs",
          text: "{{NAME_2}}'s coach—a former champion who rarely handed out ______ called the performance \"nearly flawless.\"",
          choices: ["compliments—", "compliments,", "compliments;", "compliments"],
          answer: 0,
          why: "The extra information opens with a dash, so it must close with a dash. The punctuation has to be symmetrical.",
        },
        {
          id: "c8-2", skill: "Comma pairs",
          text: "{{NAME_3}}, who had never lost a match at ______ the final with total confidence.",
          choices: ["home, entered", "home entered", "home; entered", "home—entered"],
          answer: 0,
          why: "\"Who had never lost a match at home\" opens with a comma, so it must close with a comma before the main verb \"entered.\"",
        },
        {
          id: "c8-3", skill: "Essential appositives",
          text: "Longtime rivals ______ met again in the final round, and the crowd could barely contain its excitement.",
          choices: ["{{NAME_1}} and {{NAME_2}}", "{{NAME_1}}, and {{NAME_2}},", "{{NAME_1}} and {{NAME_2}},", ", {{NAME_1}} and {{NAME_2}},"],
          answer: 0,
          why: "The names identify which rivals, so they're essential and take no commas. A comma also can't separate a subject from its verb.",
        },
        {
          id: "c8-4", skill: "Essential appositives",
          text: "The researcher ______ presented the findings at {{EVENT}}.",
          choices: ["{{NAME_1}}", "{{NAME_1}},", ", {{NAME_1}},", ", {{NAME_1}}"],
          answer: 0,
          why: "The name tells you which researcher, so it's essential. No commas go around it or between the subject and the verb.",
        },
        {
          id: "c8-5", skill: "Comma pairs",
          text: "{{NAME_2}}, the youngest player on the ______ scored the winning point.",
          choices: ["team,", "team", "team—", "team;"],
          answer: 0,
          why: "The appositive opens with a comma after {{NAME_2}}, so it closes with a comma. A dash wouldn't match.",
        },
        {
          id: "c8-6", skill: "Comma pairs",
          text: "{{NAME_1}}'s mentor, a retired teacher from the ______ taught {{NAME_1_OBJ}} everything about {{SKILL}}.",
          choices: ["neighborhood,", "neighborhood", "neighborhood—", "neighborhood;"],
          answer: 0,
          why: "\"A retired teacher from the neighborhood\" is extra information opened by a comma, so it needs a closing comma.",
        },
        {
          id: "c8-7", skill: "Essential clauses",
          text: "Students ______ the chapter early can start the bonus review.",
          choices: ["who finish", "who finish,", ", who finish", ", who finish,"],
          answer: 0,
          why: "\"Who finish the chapter early\" tells you which students, so it's essential and takes no commas.",
        },
      ],
    },

    // ---------------------------------------------------------------- 9
    {
      id: 9,
      short: "Modifiers & Parallelism",
      title: "Modifiers & Parallelism",
      pause: {
        summary: "Descriptions must sit right next to what they describe, and paired or listed items must share the same form.",
        rules: [
          "An introductory phrase describes whatever comes immediately after the comma. That noun must be the thing being described.",
          "Dangling modifier: \"Exhausted, the couch looked great\" means the couch was exhausted.",
          "Parallelism: in A and B, or in A, B, and C, every item takes the same form (running, lifting, swimming).",
          "Compare like with like: a score to a score (\"{{NAME_3}}'s\"), not a score to a person.",
        ],
        patterns: [
          { f: "Exhausted, {{NAME_1}} sat down", ok: true },
          { f: "Exhausted, dinner was eaten", ok: false },
          { f: "to read, to write, and to draw", ok: true },
          { f: "to read, to write, and drawing", ok: false },
        ],
        example: "Known for staying calm, {{NAME_1}} took the final shot.",
      },
      questions: [
        {
          id: "c9-1", skill: "Dangling modifiers",
          text: "Exhausted after hours of practice, ______",
          choices: [
            "{{NAME_1}} finally sat down to eat dinner.",
            "dinner was finally eaten by {{NAME_1}}.",
            "the couch was where {{NAME_1}} finally collapsed.",
            "{{NAME_1_POSS}} dinner was finally ready.",
          ],
          answer: 0,
          why: "The opening phrase describes whoever was exhausted. That's {{NAME_1}}, who has to come right after the comma.",
        },
        {
          id: "c9-2", skill: "Dangling modifiers",
          text: "Known for staying calm under pressure, ______",
          choices: [
            "{{NAME_1}} was chosen to take the final shot.",
            "the coach chose {{NAME_1}} to take the final shot.",
            "the final shot was given to {{NAME_1}}.",
            "{{NAME_1_POSS}} coach picked {{NAME_1_OBJ}} for the final shot.",
          ],
          answer: 0,
          why: "The person known for staying calm is {{NAME_1}}, so {{NAME_1}} must be the subject right after the modifier.",
        },
        {
          id: "c9-3", skill: "Dangling modifiers",
          text: "Walking into {{LOCATION}} for the first time, ______",
          choices: [
            "{{NAME_2}} noticed how quiet the room was.",
            "the quiet of the room surprised {{NAME_2}}.",
            "the room seemed quiet to {{NAME_2}}.",
            "{{NAME_2_POSS}} first impression was the quiet.",
          ],
          answer: 0,
          why: "The one walking in is {{NAME_2}}, not the quiet, the room or an impression. {{NAME_2}} must touch the modifier.",
        },
        {
          id: "c9-4", skill: "Parallelism",
          text: "{{NAME_1}}'s morning routine includes stretching, lifting weights, and ______",
          choices: ["running sprints.", "to run sprints.", "sprints are run.", "{{NAME_1}} runs sprints."],
          answer: 0,
          why: "List items must share a form. \"Stretching\" and \"lifting\" are -ing words, so the third item is \"running.\"",
        },
        {
          id: "c9-5", skill: "Parallelism",
          text: "{{NAME_3}} likes to read, to write, and ______",
          choices: ["to draw.", "drawing.", "draws.", "to drawing."],
          answer: 0,
          why: "The first two items are infinitives (to read, to write), so the third must be too: \"to draw.\"",
        },
        {
          id: "c9-6", skill: "Parallelism",
          text: "For {{NAME_2}}, winning {{EVENT}} was less about talent than about ______ every single day.",
          choices: ["showing up", "to show up", "you show up", "it was showing up"],
          answer: 0,
          why: "A/B parallelism: \"about talent\" pairs with \"about showing up.\" Both objects of \"about\" are noun forms.",
        },
        {
          id: "c9-7", skill: "Logical comparisons",
          text: "{{NAME_2}}'s score on the practice test was higher than ______",
          choices: ["{{NAME_3}}'s.", "{{NAME_3}}.", "{{NAME_3}}s.", "{{NAME_3}}s'."],
          answer: 0,
          why: "Compare a score to a score, not a score to a person. \"{{NAME_3}}'s\" means \"{{NAME_3}}'s score.\"",
        },
      ],
    },

    // ---------------------------------------------------------------- 10 (bonus)
    {
      id: 10,
      bonus: true,
      short: "Pronouns & Possessives",
      title: "Bonus: Pronouns & Possessives",
      pause: {
        summary: "Apostrophes show ownership, not plurals. Pronouns must match the noun they replace and play the right role in the sentence.",
        rules: [
          "One owner: add 's ({{NAME_1}}'s). Plural owners: make it plural, then add the apostrophe (twins').",
          "Plain plurals never take an apostrophe (three records).",
          "It's = it is. Its = belonging to it. \"Its'\" is never correct.",
          "Pronoun case: cover the other person to test it. \"Chose me\" means \"chose {{NAME_2}} and me\" is right.",
          "Who is for subjects, whom for objects (also after prepositions), and whose for ownership.",
        ],
        patterns: [
          { f: "the players' lockers", ok: true },
          { f: "three record's", ok: false },
          { f: "The team lost its captain", ok: true },
        ],
        example: "To whom did {{NAME_1}} give the twins' jerseys?",
      },
      questions: [
        {
          id: "c10-1", skill: "Plural possessives",
          text: "Both of the ______ jerseys were signed by {{NAME_1}} after the game.",
          choices: ["twins'", "twin's", "twins", "twins's"],
          answer: 0,
          why: "\"Both\" means more than one twin, and the jerseys belong to them. The plural possessive is \"twins'.\"",
        },
        {
          id: "c10-2", skill: "Its vs. it's",
          text: "The committee announced that ______ new captain would be {{NAME_3}}.",
          choices: ["its", "it's", "their", "its'"],
          answer: 0,
          why: "\"Committee\" is singular, and its possessive is \"its.\" \"It's\" means \"it is.\"",
        },
        {
          id: "c10-3", skill: "Singular possessives",
          text: "Everyone admired ______ determination to finish despite the pouring rain.",
          choices: ["{{NAME_1}}'s", "{{NAME_1}}s", "{{NAME_1}}s'", "{{NAME_1}}"],
          answer: 0,
          why: "The determination belongs to one person, so add an apostrophe plus s.",
        },
        {
          id: "c10-4", skill: "Plurals",
          text: "By the end of the year, {{NAME_2}} had broken three long-standing ______",
          choices: ["records.", "record's.", "records'.", "record."],
          answer: 0,
          why: "Nothing belongs to the records, so use a plain plural with no apostrophe.",
        },
        {
          id: "c10-5", skill: "Pronoun agreement",
          text: "When {{NAME_1}} and {{NAME_2}} finished the project, the teacher praised ______ for their careful research.",
          choices: ["them", "him", "her", "us"],
          answer: 0,
          why: "The pronoun refers to two people, so it must be plural: \"them.\"",
        },
        {
          id: "c10-6", skill: "Pronoun agreement",
          text: "The fans waved ______ scarves as {{NAME_1}} walked out at {{LOCATION}}.",
          choices: ["their", "its", "his or her", "there"],
          answer: 0,
          why: "\"Fans\" is plural, so the possessive pronoun is \"their.\" \"There\" refers to a place.",
        },
        {
          id: "c10-7", skill: "Pronoun case",
          text: "The coach chose {{NAME_2}} and ______ to lead the warm-up before {{EVENT}}.",
          choices: ["me", "I", "myself", "mine"],
          answer: 0,
          why: "The pronoun is the object of \"chose.\" Drop \"{{NAME_2}} and\" to test it: \"chose me,\" not \"chose I.\"",
        },
        {
          id: "c10-8", skill: "Who / whom / whose",
          text: "The mentor to ______ {{NAME_1}} owed the most was a retired teacher from the neighborhood.",
          choices: ["whom", "who", "which", "what"],
          answer: 0,
          why: "After a preposition (\"to\"), use the object form \"whom\" for a person.",
        },
        {
          id: "c10-9", skill: "Who / whom / whose",
          text: "{{NAME_1}} is the kind of teammate ______ encouragement makes everyone around {{NAME_1_OBJ}} better.",
          choices: ["whose", "who's", "who is", "which"],
          answer: 0,
          why: "The encouragement belongs to the teammate, so use the possessive \"whose.\" \"Who's\" means \"who is.\"",
        },
        {
          id: "c10-10", skill: "Plural possessives",
          text: "All of the ______ lockers were covered with posters of {{NAME_1}}.",
          choices: ["players'", "player's", "players", "players's"],
          answer: 0,
          why: "The lockers belong to many players, so use the plural possessive \"players'.\"",
        },
      ],
    },
  ];

  // Flat list for lookups, with each question tagged by chapter.
  SW.questions = SW.chapters.flatMap((ch) => ch.questions.map((q) => Object.assign(q, { chapterId: ch.id })));
  SW.chapterById = (id) => SW.chapters.find((c) => c.id === id);
  SW.CORE_CHAPTERS = SW.chapters.filter((c) => !c.bonus).length; // 9
})();
