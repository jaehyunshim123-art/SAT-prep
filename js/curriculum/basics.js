// The gentle start for every chapter, written for students around a 1000 SAT
// score: a plain-English lesson (loaded first, so it's the lesson each
// chapter shows) and 8-12 easy starter questions with short sentences.
// Starters are `level: 1`; the chapter's other practice is level 2 and the
// SAT-style passages (clause-derby/src/) are level 3, so every chapter runs
// easy → hard (see SatWizz.curriculum.build).
//
// Terms are defined before they're used: Chapter 1 teaches subject, verb,
// independent clause (IC), dependent clause (DC), fragment and FANBOYS, and
// later lessons only use words already taught (with a quick reminder).
//
// Load after js/questions.js and BEFORE js/curriculum/clause.js.
(function () {
  "use strict";
  const SW = window.SatWizz;
  const easy = (questions) => questions.map((q) => ({ ...q, level: 1 }));

  // ---------- Chapter 1 (id 10): Complete Sentences ----------
  SW.curriculum.addChapter({
    id: 10,
    pause: {
      summary: "Every grammar question on the SAT builds on one idea: a complete sentence needs a subject, a verb, and a complete thought. This chapter also teaches the words the rest of SatWizz uses, so take a minute with each one.",
      rules: [
        "**Subject** = who or what the sentence is about. **Verb** = what the subject does or is (runs, is, studied). “{{NAME_1}} studied.” has both.",
        "**Independent clause (IC)** = a complete sentence: subject + verb + complete thought. It can stand alone. “{{NAME_1}} won the race.”",
        "**Dependent clause (DC)** = has a subject and a verb but CAN'T stand alone, because it starts with a **dependent word** like because, although, when, if, since, while, after or unless. “Because {{NAME_1}} won the race” leaves you waiting for more.",
        "**Fragment** = words that look like a sentence but aren't one: no verb, an -ing word instead of a verb, or a DC all by itself.",
        "-ing words (running) and “to” words (to run) are NOT verbs on their own. “{{NAME_2}} running every morning.” is a fragment. “{{NAME_2}} runs every morning.” is a sentence.",
        "Who, which and that usually start a describing part. Skip it to find the real sentence: “The coach [who helped {{NAME_3}}] smiled.” → “The coach smiled.”",
        "**FANBOYS** = the 7 joining words: For, And, Nor, But, Or, Yet, So. You'll use them in Chapter 2 to join two ICs.",
      ],
      patterns: [
        { f: "{{NAME_1}} studied.", ok: true },
        { f: "Although {{NAME_1}} studied.", ok: false },
        { f: "{{NAME_1}} studying.", ok: false },
        { f: "Because it rained, {{NAME_1}} stayed in.", ok: true },
      ],
      example: "IC: “{{NAME_1}} passed the test.” DC: “because the test was easy.” Together: “{{NAME_1}} passed the test because the test was easy.” The IC can stand alone; the DC can't.",
    },
    questions: easy([
      {
        id: "e10-1", skill: "Finding the real verb",
        text: "{{NAME_1}} ______ to school every day.",
        choices: ["walks", "walking", "to walk", "having walked"],
        answer: 0,
        notes: [
          "“Walks” is a real verb, so “{{NAME_1}} walks to school every day” is a complete sentence.",
          "“Walking” is an -ing word. It can't be the verb by itself, so this is a fragment.",
          "“To walk” is a “to” word. It can't be the main verb.",
          "“Having walked” is an -ing form, so the sentence still has no real verb.",
        ],
      },
      {
        id: "e10-2", skill: "Finding the real verb",
        text: "The dog ______ loudly at the mail carrier.",
        choices: ["barked", "barking", "to bark", "having barked"],
        answer: 0,
        notes: [
          "Subject (the dog) + verb (barked) + complete thought. That's an IC.",
          "“The dog barking loudly” has no real verb. It's a fragment.",
          "“To bark” can't be the main verb of a sentence.",
          "“Having barked” is an -ing form, not a full verb.",
        ],
      },
      {
        id: "e10-3", skill: "Finding the real verb",
        text: "{{NAME_2}} ______ a great book last night.",
        choices: ["read", "reading", "to read", "having read"],
        answer: 0,
        notes: [
          "“{{NAME_2}} read a great book last night” has a subject and a real verb.",
          "“Reading” is an -ing word, so the sentence is a fragment.",
          "“To read” is a “to” word. It can't be the main verb.",
          "“Having read” still isn't a full verb, so the thought is incomplete.",
        ],
      },
      {
        id: "e10-4", skill: "Finding the real verb",
        text: "The students ______ tired after the long test.",
        choices: ["were", "being", "to be", "having been"],
        answer: 0,
        notes: [
          "“Were” is a verb (a form of “to be”), so “The students were tired” is complete.",
          "“Being” is an -ing word. “The students being tired” is a fragment.",
          "“To be” can't be the main verb.",
          "“Having been” is an -ing form, so there's still no real verb.",
        ],
      },
      {
        id: "e10-5", skill: "Complete vs. fragment",
        text: "After lunch, ______",
        choices: ["{{NAME_1}} played soccer.", "{{NAME_1}} playing soccer.", "because {{NAME_1}} played soccer.", "which was soccer."],
        answer: 0,
        notes: [
          "“{{NAME_1}} played soccer” is an IC: subject + verb + complete thought.",
          "“Playing” is an -ing word, so there's no real verb.",
          "“Because” makes it a DC. Two pieces that can't stand alone still don't make a sentence.",
          "“Which was soccer” is only a describing part. There's no IC anywhere.",
        ],
      },
      {
        id: "e10-6", skill: "Complete vs. fragment",
        text: "Because it was raining, ______",
        choices: ["the game was canceled.", "the game being canceled.", "which canceled the game.", "since the game was canceled."],
        answer: 0,
        notes: [
          "“Because it was raining” is a DC, so it needs an IC after it. “The game was canceled” is an IC.",
          "“Being canceled” is an -ing form, so there's still no real verb.",
          "“Which canceled the game” is a describing part, not an IC.",
          "“Since” starts another DC. Two DCs together are still a fragment.",
        ],
      },
      {
        id: "e10-7", skill: "Skip the describing part",
        text: "The pizza that {{NAME_2}} ordered ______ cold.",
        choices: ["was", "being", "to be", "that was"],
        answer: 0,
        notes: [
          "Skip “that {{NAME_2}} ordered.” The real sentence is “The pizza was cold.”",
          "“Being” is an -ing word, not a verb.",
          "“To be” can't be the main verb.",
          "“That was” adds another describing part. The pizza still never gets its own verb.",
        ],
      },
      {
        id: "e10-8", skill: "Skip the describing part",
        text: "{{NAME_1}}, who loves music, ______ the guitar.",
        choices: ["plays", "playing", "who plays", "to play"],
        answer: 0,
        notes: [
          "Skip “who loves music.” The real sentence is “{{NAME_1}} plays the guitar.”",
          "“Playing” is an -ing word, so the sentence has no verb.",
          "“Who plays” is another describing part. {{NAME_1}} still never does anything.",
          "“To play” can't be the main verb.",
        ],
      },
      {
        id: "e10-9", skill: "Complete vs. fragment",
        text: "The bus was late. ______",
        choices: ["{{NAME_3}} missed the first class.", "Missing the first class.", "Because {{NAME_3}} missed the first class.", "Which made {{NAME_3}} miss the first class."],
        answer: 0,
        notes: [
          "“{{NAME_3}} missed the first class” has a subject, a verb and a complete thought.",
          "“Missing the first class” has no subject and no real verb. It's a fragment.",
          "“Because…” is a DC standing alone, so it's a fragment.",
          "A sentence can't start with “Which…” like this. It's only a describing part.",
        ],
      },
      {
        id: "e10-10", skill: "Finding the real verb",
        text: "When the bell rang, the students ______ the room.",
        choices: ["left", "leaving", "to leave", "who left"],
        answer: 0,
        notes: [
          "“When the bell rang” is a DC. “The students left the room” is the IC it needs.",
          "“Leaving” is an -ing word, so the IC has no verb.",
          "“To leave” can't be the main verb.",
          "“Who left” is a describing part, so there's still no IC.",
        ],
      },
      {
        id: "e10-11", skill: "Finding the real verb",
        text: "The phone on the table ______ suddenly.",
        choices: ["rang", "ringing", "to ring", "having rung"],
        answer: 0,
        notes: [
          "“The phone rang suddenly” is complete. “On the table” just tells where the phone is.",
          "“Ringing” is an -ing word, so it's a fragment.",
          "“To ring” can't be the main verb.",
          "“Having rung” is an -ing form, not a real verb.",
        ],
      },
      {
        id: "e10-12", skill: "Hanging words",
        text: "______ {{NAME_2}} finished the homework, {{NAME_2}} watched a movie.",
        choices: ["After", "Finished", "Finishing", "{{NAME_2}} finished it and"],
        answer: 0,
        notes: [
          "“After {{NAME_2}} finished the homework” is a DC, and the comma connects it to the IC “{{NAME_2}} watched a movie.” ✓",
          "“Finished {{NAME_2}} finished…” doesn't make sense.",
          "“Finishing {{NAME_2}} finished…” doesn't make sense either.",
          "This repeats the action and leaves a messy, broken sentence.",
        ],
      },
    ]),
  });

  // ---------- Chapter 2 (id 1): Joining Sentences ----------
  SW.curriculum.addChapter({
    id: 1,
    pause: {
      summary: "Two complete sentences (two ICs) can't be glued together with just a comma. There are three safe ways to join them, and the SAT tests them constantly.",
      rules: [
        "Quick review: an **IC** is a complete sentence (subject + verb + complete thought). A **DC** starts with a word like because, although or when and can't stand alone.",
        "Safe way 1, a period: “The rain stopped. The game started.”",
        "Safe way 2, a semicolon (;), which works just like a period: “The rain stopped; the game started.”",
        "Safe way 3, a comma + a FANBOYS word (For, And, Nor, But, Or, Yet, So): “The rain stopped, so the game started.”",
        "Never: IC, IC. Two sentences with only a comma between them is a **comma splice**, the most common SAT trap.",
        "However, therefore and also are NOT FANBOYS. Between two ICs they need a semicolon or a period: “IC; however, IC.”",
        "DC first? Put a comma after it: “Because it rained, the game stopped.” DC second? Usually no comma: “The game stopped because it rained.”",
      ],
      patterns: [
        { f: "IC. IC", ok: true },
        { f: "IC; IC", ok: true },
        { f: "IC, and IC", ok: true },
        { f: "IC, IC", ok: false },
        { f: "IC, however, IC", ok: false },
      ],
      example: "“The rain stopped, the game continued.” ✗ comma splice → “The rain stopped, so the game continued.” ✓",
    },
    questions: easy([
      {
        id: "e1-1", skill: "IC, FANBOYS IC",
        text: "{{NAME_1}} was ______ {{NAME_2}} shared a sandwich.",
        choices: ["hungry, so", "hungry,", "hungry so", "hungry, therefore"],
        answer: 0,
        notes: [
          "Two ICs joined by a comma + “so” (a FANBOYS word). That's safe way 3.",
          "A comma alone between two ICs is a comma splice.",
          "A FANBOYS word joining two ICs needs a comma before it.",
          "“Therefore” isn't a FANBOYS word, so a comma before it is still a comma splice.",
        ],
      },
      {
        id: "e1-2", skill: "IC; IC",
        text: "The sun came ______ snow began to melt.",
        choices: ["out; the", "out, the", "out the", "out, and, the"],
        answer: 0,
        notes: [
          "A semicolon joins two ICs, just like a period would.",
          "Comma splice: a comma alone can't join two ICs.",
          "No punctuation at all crashes two ICs together (a run-on).",
          "There's no comma after “and” when it joins two ICs.",
        ],
      },
      {
        id: "e1-3", skill: "IC. IC",
        text: "The movie ended at ______ walked home together.",
        choices: ["nine. Then we", "nine, then we", "nine then we", "nine, and, then we"],
        answer: 0,
        notes: [
          "A period ends the first IC, and “Then we walked home together” is a new sentence.",
          "“Then” isn't a FANBOYS word, so this is a comma splice.",
          "No punctuation makes a run-on.",
          "There's no comma after “and.”",
        ],
      },
      {
        id: "e1-4", skill: "IC, FANBOYS IC",
        text: "{{NAME_2}} wanted to play ______ started to rain.",
        choices: ["outside, but it", "outside, it", "outside but, it", "outside; but, it"],
        answer: 0,
        notes: [
          "Comma + “but” joins the two ICs and shows the surprise.",
          "Comma splice: two ICs with only a comma.",
          "The comma goes before “but,” not after it.",
          "A FANBOYS word doesn't take a semicolon before it and a comma after it.",
        ],
      },
      {
        id: "e1-5", skill: "DC, IC",
        text: "Because the bus was ______ walked to school.",
        choices: ["late, {{NAME_3}}", "late; {{NAME_3}}", "late. {{NAME_3}}", "late, and {{NAME_3}}"],
        answer: 0,
        notes: [
          "“Because the bus was late” is a DC. A DC that comes first gets a comma before the IC.",
          "A semicolon needs an IC on BOTH sides, and “Because…” is a DC.",
          "The period leaves “Because the bus was late.” alone as a fragment.",
          "“And” can't join a DC to an IC here.",
        ],
      },
      {
        id: "e1-6", skill: "IC DC",
        text: "{{NAME_1}} stayed ______ was raining.",
        choices: ["inside because it", "inside; because it", "inside. Because it", "inside, so because it"],
        answer: 0,
        notes: [
          "IC + DC: when the DC comes second, you usually don't need any punctuation.",
          "A semicolon needs an IC after it, but “because it was raining” is a DC.",
          "The period leaves “Because it was raining.” as a fragment.",
          "“So because” doesn't make sense.",
        ],
      },
      {
        id: "e1-7", skill: "IC; LW, IC",
        text: "The test was ______ {{NAME_2}} finished early.",
        choices: ["hard; however,", "hard, however,", "hard however", "hard, however"],
        answer: 0,
        notes: [
          "“However” isn't a FANBOYS word, so the two ICs need a semicolon before it (and a comma after).",
          "Commas around “however” still leave a comma splice.",
          "With no punctuation, this is a run-on.",
          "A comma before “however” is a comma splice.",
        ],
      },
      {
        id: "e1-8", skill: "Compound predicate (no comma)",
        text: "{{NAME_3}} opened the ______ the new puppy.",
        choices: ["door and greeted", "door, and greeted", "door; and greeted", "door. And greeted"],
        answer: 0,
        notes: [
          "One subject ({{NAME_3}}) doing two things (opened, greeted). No second IC, so no comma.",
          "Comma + “and” is for joining two ICs, but “greeted the new puppy” has no subject.",
          "A semicolon needs an IC on both sides.",
          "The period leaves “And greeted the new puppy.” with no subject, a fragment.",
        ],
      },
    ]),
  });

  // ---------- Chapter 3 (id 2): Subject-Verb Agreement ----------
  SW.curriculum.addChapter({
    id: 2,
    pause: {
      summary: "The verb has to match its subject. One thing → a singular verb (is, was, has, runs). Two or more → a plural verb (are, were, have, run).",
      rules: [
        "Find the subject first: ask “who or what is doing this?”",
        "Watch out: singular verbs often END in -s (runs, plays). Plural verbs often don't (run, play). It's the opposite of nouns.",
        "Cross out the middle. Phrases like “of the books” or “in the box” sit between the subject and the verb, but they're never the subject: “The box [of pens] is full.”",
        "Two subjects joined by “and” are plural: “{{NAME_1}} and {{NAME_2}} are friends.”",
        "Each, every and one are singular: “Each of the players is ready.”",
        "“There is / There are”: the subject comes AFTER the verb. “There are three apples.”",
        "Shortcut: if three answer choices are plural and one is singular (or the other way around), check the odd one out first.",
      ],
      patterns: [
        { f: "The dog barks.", ok: true },
        { f: "The dogs barks.", ok: false },
        { f: "The box [of pens] is", ok: true },
        { f: "The box [of pens] are", ok: false },
      ],
      example: "The list [of {{NAME_1_POSS}} goals] is long. Cross out the brackets: “The list is long.” One list → is.",
    },
    questions: easy([
      {
        id: "e2-1", skill: "Singular subject",
        text: "The cat ______ on the windowsill every afternoon.",
        choices: ["sleeps", "sleep", "are sleeping", "have slept"],
        answer: 0,
        notes: [
          "One cat → singular verb “sleeps.”",
          "“Sleep” is plural. It would match “cats.”",
          "“Are sleeping” is plural.",
          "“Have slept” is plural (singular would be “has slept”).",
        ],
      },
      {
        id: "e2-2", skill: "Plural subject",
        text: "My friends ______ at the park right now.",
        choices: ["are", "is", "was", "has been"],
        answer: 0,
        notes: [
          "“Friends” is plural → “are.”",
          "“Is” is singular.",
          "“Was” is singular (and past).",
          "“Has been” is singular.",
        ],
      },
      {
        id: "e2-3", skill: "Compound subjects",
        text: "{{NAME_1}} and {{NAME_2}} ______ in the school band.",
        choices: ["play", "plays", "is playing", "has played"],
        answer: 0,
        notes: [
          "Two people joined by “and” → plural verb “play.”",
          "“Plays” is singular, but there are two people.",
          "“Is playing” is singular.",
          "“Has played” is singular.",
        ],
      },
      {
        id: "e2-4", skill: "Prepositional traps",
        text: "The box of pencils ______ on the desk.",
        choices: ["is", "are", "were", "have been"],
        answer: 0,
        notes: [
          "Cross out “of pencils.” The subject is “box,” which is singular → “is.”",
          "“Are” matches “pencils,” but that's the trap. Pencils isn't the subject.",
          "“Were” is plural.",
          "“Have been” is plural.",
        ],
      },
      {
        id: "e2-5", skill: "Each / One-of singular",
        text: "Each of the students ______ a laptop.",
        choices: ["has", "have", "are having", "were having"],
        answer: 0,
        notes: [
          "“Each” is singular → “has.” Cross out “of the students.”",
          "“Have” is plural.",
          "“Are having” is plural.",
          "“Were having” is plural.",
        ],
      },
      {
        id: "e2-6", skill: "There is / there are",
        text: "There ______ three cookies left in the jar.",
        choices: ["are", "is", "was", "has been"],
        answer: 0,
        notes: [
          "The subject comes after the verb: “three cookies,” which is plural → “are.”",
          "“Is” is singular.",
          "“Was” is singular.",
          "“Has been” is singular.",
        ],
      },
      {
        id: "e2-7", skill: "Prepositional traps",
        text: "The books on the top shelf ______ very old.",
        choices: ["are", "is", "was", "has been"],
        answer: 0,
        notes: [
          "Cross out “on the top shelf.” “Books” is plural → “are.”",
          "“Is” matches “shelf,” the trap word.",
          "“Was” is singular.",
          "“Has been” is singular.",
        ],
      },
      {
        id: "e2-8", skill: "Prepositional traps",
        text: "The leader of the hiking groups ______ the map.",
        choices: ["carries", "carry", "are carrying", "have carried"],
        answer: 0,
        notes: [
          "Cross out “of the hiking groups.” One leader → “carries.”",
          "“Carry” is plural. It matches “groups,” the trap.",
          "“Are carrying” is plural.",
          "“Have carried” is plural.",
        ],
      },
    ]),
  });

  // ---------- Chapter 4 (id 3): Verb or Not a Verb? ----------
  SW.curriculum.addChapter({
    id: 3,
    pause: {
      summary: "Some blanks need a real verb (the main action). Others need a describing word that is NOT a verb, like an -ing word, an -ed word or a “to” word. The question to ask: does this sentence already have its main verb?",
      rules: [
        "Every IC needs a subject and a main verb. Find the subject, then look for its verb.",
        "No main verb yet? The blank must be a real verb: “The players ______ hard.” → practice.",
        "Already has a main verb? Then the blank is extra description, so use an -ing word, an -ed word or a “to” word: “{{NAME_1}}, hoping to win, practiced daily.” (The main verb is “practiced.”)",
        "-ing words (hoping) and “to” words (to win) can never be the main verb on their own.",
        "Long subjects hide the verb: “The scientist who studies sharks ______ in Florida.” The subject is “scientist,” and it still needs a verb: lives.",
      ],
      patterns: [
        { f: "{{NAME_1}} hopes to win.", ok: true },
        { f: "{{NAME_1}} hoping to win.", ok: false },
        { f: "Hoping to win, {{NAME_1}} practiced.", ok: true },
        { f: "Hoped to win, {{NAME_1}} practiced.", ok: false },
      ],
      example: "“{{NAME_2}}, ______ the bus, ran faster.” The main verb is already there (ran), so the blank is a describer: “seeing the bus.”",
    },
    questions: easy([
      {
        id: "e3-1", skill: "Main verb needed",
        text: "{{NAME_1}} ______ soccer every Saturday.",
        choices: ["plays", "playing", "to play", "having played"],
        answer: 0,
        notes: [
          "The sentence has no verb yet, so it needs a real verb: “plays.”",
          "“Playing” can't be the main verb by itself.",
          "“To play” can't be the main verb.",
          "“Having played” isn't a full verb.",
        ],
      },
      {
        id: "e3-2", skill: "Participle (non-verb) opener",
        text: "______ the bell, the students hurried to class.",
        choices: ["Hearing", "Heard", "They heard", "Hears"],
        answer: 0,
        notes: [
          "The main verb is “hurried,” so the opener is a describer: “Hearing the bell.”",
          "“Heard the bell” doesn't work as an opener for the students here.",
          "“They heard the bell, the students hurried” is two ICs with a comma, a comma splice.",
          "“Hears” is a verb with no subject of its own.",
        ],
      },
      {
        id: "e3-3", skill: "Participle (non-verb) in the middle",
        text: "{{NAME_2}}, ______ to finish the project, stayed up late.",
        choices: ["hoping", "hoped", "hopes", "was hoping"],
        answer: 0,
        notes: [
          "The main verb is “stayed.” The part between the commas is extra description, so use “hoping.”",
          "“Hoped” makes the middle part read like a second main verb.",
          "“Hopes” is a main verb, but the sentence already has one (stayed).",
          "“Was hoping” is also a main verb. Two main verbs without “and” don't work.",
        ],
      },
      {
        id: "e3-4", skill: "Participle (non-verb) describer",
        text: "The bike ______ in the garage belongs to {{NAME_3}}.",
        choices: ["parked", "is parked", "was parked", "parks"],
        answer: 0,
        notes: [
          "The main verb is “belongs.” “Parked in the garage” just describes the bike.",
          "“Is parked” would be a second main verb.",
          "“Was parked” would be a second main verb.",
          "“Parks” is a main verb, and bikes don't park themselves.",
        ],
      },
      {
        id: "e3-5", skill: "Main verb needed",
        text: "The coach ______ the team a short speech before the game.",
        choices: ["gave", "giving", "to give", "having given"],
        answer: 0,
        notes: [
          "No main verb yet, so it needs one: “The coach gave…”",
          "“Giving” isn't a real verb on its own.",
          "“To give” can't be the main verb.",
          "“Having given” isn't a full verb.",
        ],
      },
      {
        id: "e3-6", skill: "Infinitive (to + verb)",
        text: "{{NAME_1}} went to the library ______ for the test.",
        choices: ["to study", "studies", "studied", "is studying"],
        answer: 0,
        notes: [
          "The main verb is “went.” “To study” explains why.",
          "“Studies” would be a second main verb with nothing joining it.",
          "“Studied” would be a second main verb.",
          "“Is studying” would be a second main verb.",
        ],
      },
      {
        id: "e3-7", skill: "Main verb after a long subject",
        text: "The scientist who studies sharks ______ in a small town by the sea.",
        choices: ["lives", "living", "to live", "who lives"],
        answer: 0,
        notes: [
          "Skip “who studies sharks.” “The scientist lives in a small town” needs the real verb “lives.”",
          "“Living” isn't a main verb.",
          "“To live” isn't a main verb.",
          "“Who lives” is another describing part. The scientist still has no verb.",
        ],
      },
      {
        id: "e3-8", skill: "Participle (non-verb) opener",
        text: "______ by the long hike, {{NAME_2}} fell asleep early.",
        choices: ["Tired", "Tires", "Was tired", "Is tiring"],
        answer: 0,
        notes: [
          "The main verb is “fell.” “Tired by the long hike” describes {{NAME_2}}.",
          "“Tires” is a verb with no subject.",
          "“Was tired” has no subject and creates a second main verb.",
          "“Is tiring” has no subject and doesn't fit.",
        ],
      },
    ]),
  });

  // ---------- Chapter 5 (id 4): Verb Tenses ----------
  SW.curriculum.addChapter({
    id: 4,
    pause: {
      summary: "Tense tells you WHEN something happens. Look for a time clue in the sentence, then pick the verb that matches it.",
      rules: [
        "Past (finished): yesterday, last year, in 2010, ago → walked, was, went.",
        "Present (now, or always true): every day, usually, now → walks, is, goes.",
        "Future (later): tomorrow, next week, soon → will walk.",
        "Present perfect (has/have + verb) = started in the past and still true now: since 2020, for three years, so far. “{{NAME_1}} has lived here since 2020.”",
        "Past perfect (had + verb) = happened BEFORE another past event: “The movie had started when {{NAME_1}} arrived.”",
        "No time clue? Match the tense of the other verbs around the blank.",
      ],
      patterns: [
        { f: "Yesterday, {{NAME_1}} walked", ok: true },
        { f: "Yesterday, {{NAME_1}} walks", ok: false },
        { f: "Since 2020, {{NAME_1}} has lived", ok: true },
        { f: "Tomorrow, {{NAME_1}} went", ok: false },
      ],
      example: "“Last summer, {{NAME_2}} ______ to the beach.” The clue “last summer” means finished past → went.",
    },
    questions: easy([
      {
        id: "e4-1", skill: "Past time clue",
        text: "Yesterday, {{NAME_1}} ______ a new bike.",
        choices: ["bought", "buys", "will buy", "is buying"],
        answer: 0,
        notes: [
          "“Yesterday” is finished past → “bought.”",
          "“Buys” is present, but yesterday is over.",
          "“Will buy” is future.",
          "“Is buying” is happening now.",
        ],
      },
      {
        id: "e4-2", skill: "Future time clue",
        text: "Tomorrow, the class ______ a trip to the museum.",
        choices: ["will take", "took", "has taken", "had taken"],
        answer: 0,
        notes: [
          "“Tomorrow” is the future → “will take.”",
          "“Took” is past.",
          "“Has taken” means it already happened.",
          "“Had taken” is past perfect, for events before another past event.",
        ],
      },
      {
        id: "e4-3", skill: "Present for habits and facts",
        text: "Every morning, {{NAME_2}} ______ a glass of orange juice.",
        choices: ["drinks", "drank", "will have drunk", "had drunk"],
        answer: 0,
        notes: [
          "“Every morning” is a habit → present “drinks.”",
          "“Drank” is a single finished past event.",
          "“Will have drunk” is a future deadline tense.",
          "“Had drunk” is past perfect.",
        ],
      },
      {
        id: "e4-4", skill: "Present perfect (until now)",
        text: "{{NAME_3}} ______ in this town since 2018.",
        choices: ["has lived", "lives", "will live", "is living"],
        answer: 0,
        notes: [
          "“Since 2018” means it started in the past and is still true → “has lived.”",
          "“Lives” doesn't work with “since.”",
          "“Will live” is future.",
          "“Is living since” isn't correct English.",
        ],
      },
      {
        id: "e4-5", skill: "Past perfect (earlier past)",
        text: "By the time we arrived, the movie ______ already started.",
        choices: ["had", "has", "will have", "is"],
        answer: 0,
        notes: [
          "The movie started BEFORE we arrived (another past event) → past perfect “had started.”",
          "“Has started” is for things still connected to now, but this story is in the past.",
          "“Will have” is future.",
          "“Is started” isn't the right form.",
        ],
      },
      {
        id: "e4-6", skill: "Past time clue",
        text: "Last year, {{NAME_1}} ______ the school science fair.",
        choices: ["won", "wins", "will win", "has won"],
        answer: 0,
        notes: [
          "“Last year” is finished past → “won.”",
          "“Wins” is present.",
          "“Will win” is future.",
          "“Has won” can't be used with a finished time like “last year.”",
        ],
      },
      {
        id: "e4-7", skill: "Present for habits and facts",
        text: "Water ______ at 100 degrees Celsius.",
        choices: ["boils", "boiled", "will have boiled", "had boiled"],
        answer: 0,
        notes: [
          "A fact that's always true uses the present → “boils.”",
          "“Boiled” makes it sound like it happened once.",
          "“Will have boiled” is a future deadline.",
          "“Had boiled” is past perfect.",
        ],
      },
      {
        id: "e4-8", skill: "Tense consistency",
        text: "{{NAME_2}} opened the door and ______ inside.",
        choices: ["walked", "walks", "will walk", "has walked"],
        answer: 0,
        notes: [
          "“Opened” is past, so the second action matches: “walked.”",
          "“Walks” switches to present.",
          "“Will walk” switches to future.",
          "“Has walked” doesn't match “opened.”",
        ],
      },
    ]),
  });

  // ---------- Chapter 6 (id 5): Transitions ----------
  SW.curriculum.addChapter({
    id: 5,
    pause: {
      summary: "A transition word shows how two ideas connect. Read the sentence before the blank and the one after, then decide: are they opposite, adding on, cause and result, or an example?",
      rules: [
        "Opposite or surprise → However, But, Yet, On the other hand, Nevertheless.",
        "Adding more of the same → Also, In addition, Moreover, Furthermore.",
        "Cause → result → So, Therefore, As a result, Thus, Consequently.",
        "Giving an example → For example, For instance.",
        "Time order → First, Then, Next, Finally, Later.",
        "Trick: say the connection in your own words first (“but…”, “and also…”, “so…”), then pick the choice that means the same thing.",
      ],
      patterns: [
        { f: "It rained. However, we played.", ok: true },
        { f: "It rained. Therefore, we played.", ok: false },
        { f: "It rained. As a result, the game was canceled.", ok: true },
      ],
      example: "“{{NAME_1}} studied all week. ______, {{NAME_1}} aced the test.” Studying CAUSED the good score → As a result.",
    },
    questions: easy([
      {
        id: "e5-1", skill: "Cause/Result", kind: "transition",
        text: "{{NAME_1}} studied every night for a month. ______, {{NAME_1}} got a perfect score.",
        choices: ["As a result", "However", "For example", "Instead"],
        answer: 0,
        notes: [
          "Studying caused the perfect score: cause → result.",
          "“However” signals an opposite, but these ideas agree.",
          "The perfect score isn't an example of studying.",
          "“Instead” means one thing replaced another. Nothing was replaced.",
        ],
      },
      {
        id: "e5-2", skill: "Contrast", kind: "transition",
        text: "The weather report said it would be sunny. ______, it rained all day.",
        choices: ["However", "Therefore", "For instance", "Similarly"],
        answer: 0,
        notes: [
          "Sunny was expected, but it rained: a surprise/opposite → However.",
          "“Therefore” means result. The forecast didn't cause the rain.",
          "The rain isn't an example of the forecast.",
          "“Similarly” means the ideas are alike. They're opposite.",
        ],
      },
      {
        id: "e5-3", skill: "Example", kind: "transition",
        text: "{{NAME_2}} loves outdoor sports. ______, {{NAME_2}} goes hiking and biking every weekend.",
        choices: ["For example", "However", "Nevertheless", "In contrast"],
        answer: 0,
        notes: [
          "Hiking and biking are examples of outdoor sports.",
          "“However” signals an opposite, but the ideas agree.",
          "“Nevertheless” means “in spite of that.” There's nothing to overcome.",
          "“In contrast” signals a difference. The second sentence supports the first.",
        ],
      },
      {
        id: "e5-4", skill: "Sequence", kind: "transition",
        text: "First, mix the flour and sugar. ______, add the eggs.",
        choices: ["Next", "However", "For example", "As a result"],
        answer: 0,
        notes: [
          "These are steps in order: First… Next…",
          "Adding eggs isn't the opposite of mixing flour.",
          "Adding eggs isn't an example of mixing flour.",
          "Mixing flour doesn't cause you to add eggs.",
        ],
      },
      {
        id: "e5-5", skill: "Addition", kind: "transition",
        text: "The museum is free on Sundays. ______, it offers free tours for students.",
        choices: ["In addition", "However", "Instead", "Therefore"],
        answer: 0,
        notes: [
          "Free tours are one more good thing about the museum → In addition.",
          "“However” signals an opposite, but both ideas are good things.",
          "“Instead” means a replacement. The tours don't replace free Sundays.",
          "Being free on Sundays doesn't cause the free tours.",
        ],
      },
      {
        id: "e5-6", skill: "Cause/Result", kind: "transition",
        text: "The road was covered in ice. ______, the school buses stayed home.",
        choices: ["Therefore", "However", "For example", "Similarly"],
        answer: 0,
        notes: [
          "The ice caused the buses to stay home → Therefore.",
          "There's no surprise or opposite here.",
          "The buses staying home isn't an example of ice.",
          "The two ideas aren't alike. One causes the other.",
        ],
      },
      {
        id: "e5-7", skill: "Contrast", kind: "transition",
        text: "{{NAME_3}} expected the movie to be boring. ______, it turned out to be exciting.",
        choices: ["Surprisingly", "Moreover", "For instance", "Therefore"],
        answer: 0,
        notes: [
          "Boring was expected, but it was exciting: a surprise → Surprisingly.",
          "“Moreover” adds a similar idea. These ideas are opposite.",
          "The second sentence isn't an example of the first.",
          "Expecting boredom didn't cause the movie to be exciting.",
        ],
      },
      {
        id: "e5-8", skill: "Example", kind: "transition",
        text: "Some animals sleep through the whole winter. Bears, ______, can sleep for months without eating.",
        choices: ["for example", "however", "in contrast", "nevertheless"],
        answer: 0,
        notes: [
          "Bears are one example of animals that sleep all winter.",
          "“However” signals an opposite, but bears fit the first idea.",
          "“In contrast” signals a difference. Bears are the same, not different.",
          "“Nevertheless” means “in spite of that.” Nothing is being overcome.",
        ],
      },
    ]),
  });

  // ---------- Chapter 7 (id 6): Semicolons, Colons & Dashes ----------
  SW.curriculum.addChapter({
    id: 6,
    pause: {
      summary: "Three punctuation marks the SAT loves: the semicolon (;), the colon (:) and the dash (—). Each one has one simple job.",
      rules: [
        "Semicolon (;) = a period. Use it only between two ICs: “It rained; we stayed in.”",
        "Colon (:) = “here it is.” It goes after a complete sentence and introduces a list, an example or an explanation: “{{NAME_1}} packed three things: water, snacks, and a map.”",
        "The part BEFORE a colon must be a complete sentence. ✗ “The recipe needs: eggs and milk.” (“The recipe needs” isn't complete.)",
        "A pair of dashes works like a pair of commas around extra information: “My cousin—who lives in Canada—is visiting.”",
        "Don't mix: if a dash opens the extra part, a dash must close it, not a comma.",
      ],
      patterns: [
        { f: "IC; IC", ok: true },
        { f: "IC: list", ok: true },
        { f: "needs: eggs, milk", ok: false },
        { f: "—extra info—", ok: true },
        { f: "—extra info,", ok: false },
      ],
      example: "{{NAME_2}} brought one thing to the game: a lucky hat. (“{{NAME_2}} brought one thing to the game” is complete, so the colon works.)",
    },
    questions: easy([
      {
        id: "e6-1", skill: "Semicolon between ICs",
        text: "The store was ______ went home.",
        choices: ["closed; we", "closed, we", "closed we", "closed: and we"],
        answer: 0,
        notes: [
          "“The store was closed” and “we went home” are both ICs. A semicolon joins them.",
          "Comma splice: two ICs with only a comma.",
          "Run-on: two ICs with no punctuation.",
          "A colon doesn't go before “and” like this.",
        ],
      },
      {
        id: "e6-2", skill: "Colon before a list",
        text: "{{NAME_1}} packed three things for the ______ snacks, and a map.",
        choices: ["trip: water,", "trip; water,", "trip, water,", "trip and water,"],
        answer: 0,
        notes: [
          "“{{NAME_1}} packed three things for the trip” is complete, so a colon introduces the list.",
          "A semicolon needs an IC after it, but “water, snacks, and a map” is just a list.",
          "A comma makes “trip, water, snacks” look like one long list.",
          "“Trip and water” makes the trip one of the three things.",
        ],
      },
      {
        id: "e6-3", skill: "No colon after a verb",
        text: "The recipe ______ flour, and milk.",
        choices: ["needs eggs,", "needs: eggs,", "needs; eggs,", "needs—eggs,"],
        answer: 0,
        notes: [
          "“The recipe needs” isn't a complete sentence, so no colon. The list follows the verb directly.",
          "A colon can't come right after a verb like “needs.”",
          "A semicolon needs an IC on both sides.",
          "A single dash after “needs” breaks the sentence for no reason.",
        ],
      },
      {
        id: "e6-4", skill: "Dash pair",
        text: "My cousin—who lives in ______ visiting next week.",
        choices: ["Canada—is", "Canada, is", "Canada; is", "Canada is"],
        answer: 0,
        notes: [
          "A dash opened the extra part, so a dash closes it.",
          "A comma can't close a part that a dash opened.",
          "A semicolon splits the subject from its verb.",
          "With nothing closing the extra part, the sentence is confusing.",
        ],
      },
      {
        id: "e6-5", skill: "Colon for an explanation",
        text: "{{NAME_3}} had one goal for the ______ finish first.",
        choices: ["race: to", "race; to", "race, and to", "race. To"],
        answer: 0,
        notes: [
          "The first part is complete, and the colon says “here's the goal.”",
          "A semicolon needs an IC after it, but “to finish first” isn't one.",
          "“And to finish first” doesn't connect to anything.",
          "“To finish first.” alone is a fragment.",
        ],
      },
      {
        id: "e6-6", skill: "FANBOYS, not semicolon",
        text: "The game was ______ the fans stayed until the end.",
        choices: ["long, but", "long; but,", "long but;", "long: but,"],
        answer: 0,
        notes: [
          "Two ICs joined by a comma + “but” (a FANBOYS word).",
          "A FANBOYS word doesn't take a comma after it here.",
          "A semicolon after “but” makes no sense.",
          "A colon doesn't introduce “but.”",
        ],
      },
      {
        id: "e6-7", skill: "Colon before a list",
        text: "The museum has two famous ______ dinosaur skeleton and a giant whale model.",
        choices: ["exhibits: a", "exhibits; a", "exhibits, and a", "exhibits. A"],
        answer: 0,
        notes: [
          "The first part is complete, and the colon introduces the two exhibits.",
          "A semicolon needs an IC after it, but the rest is just a list.",
          "“And” makes it sound like a third item, not the two exhibits.",
          "“A dinosaur skeleton and a giant whale model.” alone has no verb, a fragment.",
        ],
      },
      {
        id: "e6-8", skill: "Dash pair",
        text: "The final question—the hardest one on the ______ {{NAME_2}} ten minutes.",
        choices: ["test—took", "test, took", "test; took", "test: took"],
        answer: 0,
        notes: [
          "A dash opened the extra part, so a dash closes it before the verb “took.”",
          "A comma can't close a part that a dash opened.",
          "A semicolon would separate the subject from its verb.",
          "A colon would separate the subject from its verb.",
        ],
      },
    ]),
  });

  // ---------- Chapter 8 (id 7): Extra Information (Appositives) ----------
  SW.curriculum.addChapter({
    id: 7,
    pause: {
      summary: "Some parts of a sentence are just extra information. If you can take a part out and the sentence still makes sense, put commas (or dashes) around it. If you need that part to know WHO or WHICH, don't use commas.",
      rules: [
        "Cover-up test: cover the part. Still a complete, clear sentence? Then it's extra, so put two commas (or two dashes) around it.",
        "“My dog, a golden retriever, loves swimming.” → “My dog loves swimming.” still works, so the commas are right.",
        "Needed information gets NO commas: “The students who finished early may leave.” (Which students? The ones who finished early.)",
        "Titles before names get no commas: “author {{NAME_2}},” “coach {{NAME_3}}.”",
        "“A” or “an” before a description is a clue that it's extra: “{{NAME_1}}, an artist from the city, painted the mural.”",
        "Commas come in pairs: if one comma opens the extra part, another one must close it.",
      ],
      patterns: [
        { f: "My dog, a golden retriever, loves", ok: true },
        { f: "My dog, a golden retriever loves", ok: false },
        { f: "Coach {{NAME_2}} said", ok: true },
        { f: "Coach, {{NAME_2}}, said", ok: false },
      ],
      example: "{{NAME_1}}, a student at {{LOCATION}}, won the prize. Cover the middle: “{{NAME_1}} won the prize.” ✓ So the commas are right.",
    },
    questions: easy([
      {
        id: "e7-1", skill: "Non-essential appositive (comma pair)",
        text: "My dog, a golden ______ to swim.",
        choices: ["retriever, loves", "retriever loves", "retriever; loves", "retriever: loves"],
        answer: 0,
        notes: [
          "“A golden retriever” is extra. One comma opened it, so another comma closes it.",
          "Without the closing comma, the extra part runs into the verb.",
          "A semicolon would cut the subject off from its verb.",
          "A colon would cut the subject off from its verb.",
        ],
      },
      {
        id: "e7-2", skill: "Non-essential appositive (a/an cue)",
        text: "{{NAME_1}}, an artist from the ______ the mural.",
        choices: ["city, painted", "city painted", "city; painted", "city—painted"],
        answer: 0,
        notes: [
          "“An artist from the city” is extra (notice the “an”). Close it with a comma.",
          "The extra part needs a closing comma.",
          "A semicolon splits the subject from its verb.",
          "A comma opened the extra part, so a dash can't close it.",
        ],
      },
      {
        id: "e7-3", skill: "Essential title (no commas)",
        text: "______ told the team to rest before the game.",
        choices: ["Coach {{NAME_2}}", "Coach, {{NAME_2}},", "Coach, {{NAME_2}}", "Coach {{NAME_2}},"],
        answer: 0,
        notes: [
          "A title right before a name takes no commas: “Coach {{NAME_2}} told…”",
          "Commas around the name treat it as extra, but the title and name go together.",
          "One comma after “Coach” wrongly separates the title from the name.",
          "A comma between the subject and the verb “told” is wrong.",
        ],
      },
      {
        id: "e7-4", skill: "Non-essential appositive (comma pair)",
        text: "Mount Everest, the tallest mountain in the ______ in Asia.",
        choices: ["world, is", "world is", "world—is", "world; is"],
        answer: 0,
        notes: [
          "“The tallest mountain in the world” is extra. A comma opened it, so a comma closes it.",
          "Without a closing comma, the extra part runs into the verb.",
          "A comma opened the extra part, so a dash can't close it.",
          "A semicolon splits the subject from its verb.",
        ],
      },
      {
        id: "e7-5", skill: "Essential clause (no commas)",
        text: "The ______ finished early may leave.",
        choices: ["students who", "students, who", "students who,", "students; who"],
        answer: 0,
        notes: [
          "“Who finished early” tells us WHICH students, so it's needed: no commas.",
          "Commas would mean ALL the students finished early, which changes the meaning.",
          "A comma after “who” splits the clause apart.",
          "A semicolon needs an IC on both sides.",
        ],
      },
      {
        id: "e7-6", skill: "Non-essential who clause",
        text: "{{NAME_3}}, who loves ______ the chess club.",
        choices: ["puzzles, joined", "puzzles joined", "puzzles; joined", "puzzles: joined"],
        answer: 0,
        notes: [
          "“Who loves puzzles” is extra. A comma opened it, so a comma closes it.",
          "The extra part needs a closing comma.",
          "A semicolon splits the subject from its verb.",
          "A colon splits the subject from its verb.",
        ],
      },
      {
        id: "e7-7", skill: "Dash pair",
        text: "Our teacher—a former ______ us stories about flying.",
        choices: ["pilot—told", "pilot, told", "pilot told", "pilot; told"],
        answer: 0,
        notes: [
          "A dash opened the extra part, so a dash closes it.",
          "A comma can't close a part that a dash opened.",
          "The extra part needs to be closed.",
          "A semicolon splits the subject from its verb.",
        ],
      },
      {
        id: "e7-8", skill: "Non-essential appositive at the end",
        text: "Last summer, {{NAME_1}} visited ______ capital of France.",
        choices: ["Paris, the", "Paris the", "Paris; the", "Paris. The"],
        answer: 0,
        notes: [
          "“The capital of France” is extra information about Paris, so a comma sets it off.",
          "Without a comma, the extra part crashes into the name.",
          "A semicolon needs an IC after it.",
          "“The capital of France.” alone is a fragment.",
        ],
      },
    ]),
  });

  // ---------- Chapter 9 (id 8): Modifiers, Parallelism & Pronouns ----------
  SW.curriculum.addChapter({
    id: 8,
    pause: {
      summary: "Three final rules: a describing phrase must sit right next to the thing it describes, items in a list must match, and pronouns must match the noun they replace.",
      rules: [
        "Modifiers: an opening phrase like “Running to class,” describes the very next noun. ✓ “Running to class, {{NAME_1}} dropped a book.” ✗ “Running to class, the book fell.” (Books don't run!)",
        "Parallelism: items in a list use the same form. ✓ “swimming, biking, and running” ✗ “swimming, biking, and to run.”",
        "Pronouns: a singular noun gets a singular pronoun (it, its); a plural noun gets a plural one (they, their). “The team won its game.”",
        "Its vs. it's: its = belongs to it; it's = it is. Their / there / they're: their = belongs to them, there = a place, they're = they are.",
        "Apostrophes show ownership: one student's book, two students' books.",
      ],
      patterns: [
        { f: "Walking home, {{NAME_1}} saw a fox.", ok: true },
        { f: "Walking home, a fox was seen.", ok: false },
        { f: "to read, to write, and to draw", ok: true },
        { f: "reading, writing, and to draw", ok: false },
      ],
      example: "“The company lost ______ biggest client.” One company → its.",
    },
    questions: easy([
      {
        id: "e8-1", skill: "Dangling modifier",
        text: "Running to catch the bus, ______",
        choices: ["{{NAME_1}} dropped a glove.", "a glove fell from {{NAME_1_POSS}} pocket.", "the bus left without {{NAME_1_OBJ}}.", "{{NAME_1_POSS}} glove dropped."],
        answer: 0,
        notes: [
          "{{NAME_1}} is the one running, so {{NAME_1}} must come right after the comma.",
          "This says the glove was running to catch the bus.",
          "This says the bus was running to catch itself.",
          "This says the glove was running.",
        ],
      },
      {
        id: "e8-2", skill: "Parallel list",
        text: "{{NAME_2}} likes swimming, biking, and ______",
        choices: ["hiking.", "to hike.", "hikes.", "hiked."],
        answer: 0,
        notes: [
          "The list uses -ing words (swimming, biking), so the last item matches: hiking.",
          "“To hike” doesn't match the -ing pattern.",
          "“Hikes” doesn't match the pattern.",
          "“Hiked” doesn't match the pattern.",
        ],
      },
      {
        id: "e8-3", skill: "Pronoun agreement",
        text: "The team celebrated ______ big win.",
        choices: ["its", "it's", "its'", "it is"],
        answer: 0,
        notes: [
          "One team → “its” (belongs to it).",
          "“It's” means “it is.” “The team celebrated it is big win” makes no sense.",
          "“Its'” isn't a word.",
          "“It is big win” makes no sense.",
        ],
      },
      {
        id: "e8-4", skill: "Their / there / they're",
        text: "The students forgot ______ books at home.",
        choices: ["their", "there", "they're", "its"],
        answer: 0,
        notes: [
          "The books belong to the students → “their.”",
          "“There” is a place.",
          "“They're” means “they are.”",
          "“Its” is singular, but “students” is plural.",
        ],
      },
      {
        id: "e8-5", skill: "Its vs. it's",
        text: "The dog stayed in ______ warm house during the storm.",
        choices: ["its", "it's", "its'", "it is"],
        answer: 0,
        notes: [
          "The house belongs to the dog → “its.”",
          "“It's” means “it is.”",
          "“Its'” isn't a word.",
          "“It is warm house” makes no sense here.",
        ],
      },
      {
        id: "e8-6", skill: "Parallel list",
        text: "{{NAME_3}} wants to travel, to learn new languages, and ______ new friends.",
        choices: ["to make", "making", "makes", "made"],
        answer: 0,
        notes: [
          "The list uses “to” words (to travel, to learn), so the last item matches: to make.",
          "“Making” breaks the pattern.",
          "“Makes” breaks the pattern.",
          "“Made” breaks the pattern.",
        ],
      },
      {
        id: "e8-7", skill: "Plural possessive",
        text: "Both ______ jackets were left in the gym.",
        choices: ["players'", "player's", "players", "players's"],
        answer: 0,
        notes: [
          "“Both” means more than one player, and the jackets belong to them → players'.",
          "“Player's” is for one player.",
          "“Players” with no apostrophe doesn't show ownership.",
          "“Players's” isn't the right form.",
        ],
      },
      {
        id: "e8-8", skill: "Dangling modifier",
        text: "Covered in mud, ______",
        choices: ["the dog needed a bath.", "{{NAME_1}} gave the dog a bath.", "a bath was what the dog needed.", "the bath was given to the dog."],
        answer: 0,
        notes: [
          "The dog is the one covered in mud, so “the dog” comes right after the comma.",
          "This says {{NAME_1}} was covered in mud.",
          "This says the bath was covered in mud.",
          "This also says the bath was covered in mud.",
        ],
      },
    ]),
  });
})();
