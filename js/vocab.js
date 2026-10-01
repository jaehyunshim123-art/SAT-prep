// SatWizz Vocab Vault: high-frequency Digital SAT words in two modes:
//   • Flashcards: a flippable, swipeable deck. Front: word, part of speech and
//     the word in a context sentence with your cast. Back: definition,
//     synonyms/antonyms and root. "Got It" (+5 ⚡, once per word per day) or
//     "Review Later" (the card comes back at the end of the deck, and the word
//     is flagged so your next sprint serves it first).
//   • Daily 5-word sprint: "Words in Context" questions that drive 3
//     spaced-repetition tiers.
//
//   Tier 1 Novice 🌱 → Tier 2 Practitioner ⚡ → Tier 3 Master 👑
//   • A correct answer moves a word up one tier, at most once per day
//     (that's the spacing: mastering a word takes at least two days).
//   • A wrong answer drops it back to Tier 1 and opens a breakdown card
//     (root word, definition, context clue, why each choice fails).
//   • Sparks: +5 per correct card, +25 the first time a word reaches Master,
//     +20 for your first completed sprint of the day.
//   • Tiers only move in sprints. A sprint miss also flags the word for review,
//     so flagged words lead both the deck and the next sprint.
//
//   • Vocab Derby (js/derby.js): a wager-based horse race on these words.
//
// Exposes SatWizz.vocab = { WORDS, TIERS, RULES, emptyProgress, drawSprint,
// drawDeck, grade, reviewCard, flag, finishSprint, summary, mergeProgress, mount }.
//
// Word formats (both are real Digital SAT formats):
//   format "blank":   passage with "______"; choices are words
//                     → stem: "most logical and precise word or phrase"
//   format "meaning": passage with the [[word]] underlined; choices are meanings
//                     → stem: "As used in the text, what does the word … most nearly mean?"
// Passages use the same cast placeholders as the curriculum ({{NAME_1}},
// {{LOCATION}}, {{EVENT}}, …), always mid-sentence for flavor tokens.
(function () {
  "use strict";

  const SW = (window.SatWizz = window.SatWizz || {});

  const TIERS = {
    1: { name: "Novice", icon: "🌱" },
    2: { name: "Practitioner", icon: "⚡" },
    3: { name: "Master", icon: "👑" },
  };

  const RULES = Object.freeze({
    sprintSize: 5,
    sparksPerCorrect: 5,
    masterySparks: 25,
    sprintSparks: 20,
    deckSize: 10,
    flashcardSparks: 5,
  });

  // `answer` is the index of the correct choice; choices are shuffled on screen.
  // `notes` explains every choice, in the same order as `choices`.
  const WORDS = [
    {
      id: "undermine", word: "undermine", pos: "verb", format: "blank",
      definition: "to weaken or damage, often gradually or from below",
      synonyms: ["weaken", "sabotage", "erode"], antonyms: ["bolster", "reinforce", "strengthen"],
      root: "under (beneath) + mine (to dig): digging beneath something until it collapses.",
      clue: "“Revealed errors” that “threatened” the conclusion point to weakening it.",
      text: "{{NAME_1}}'s early data seemed to support the new theory. However, a second round of measurements taken at {{LOCATION}} revealed errors that threatened to ______ the entire conclusion.",
      choices: ["undermine", "bolster", "exemplify", "anticipate"],
      answer: 0,
      notes: [
        "Errors that threaten a conclusion weaken it. That's “undermine.”",
        "“Bolster” means to strengthen, the opposite of what errors do.",
        "“Exemplify” means to be a typical example of something. It doesn't fit errors.",
        "“Anticipate” means to expect. Errors don't expect a conclusion.",
      ],
    },
    {
      id: "ambiguous", word: "ambiguous", pos: "adjective", format: "blank",
      definition: "open to more than one interpretation; unclear",
      synonyms: ["unclear", "vague", "equivocal"], antonyms: ["clear", "explicit", "unambiguous"],
      root: "Latin ambi- (both ways) + agere (to drive): driven in two directions at once.",
      clue: "Half read the instructions one way and half another, so they allowed two meanings.",
      text: "The instructions for {{EVENT}} were so ______ that half of the competitors interpreted them one way and half another.",
      choices: ["ambiguous", "concise", "meticulous", "redundant"],
      answer: 0,
      notes: [
        "Two different readings means the instructions were “ambiguous.”",
        "“Concise” means brief and clear. Clear instructions wouldn't split the group.",
        "“Meticulous” describes careful work, not confusing instructions.",
        "“Redundant” means repetitive. Repetition doesn't cause two interpretations.",
      ],
    },
    {
      id: "corroborate", word: "corroborate", pos: "verb", format: "blank",
      definition: "to confirm or support with additional evidence",
      synonyms: ["confirm", "verify", "back up"], antonyms: ["contradict", "refute", "disprove"],
      root: "Latin com- (together) + robur (strength): to add strength to something.",
      clue: "{{NAME_2}} was “cautious” and looked for “additional records” before publishing, which means seeking confirmation.",
      text: "{{NAME_2}} was cautious about relying on a single eyewitness account, so {{NAME_2}} searched for additional records that could ______ it before publishing the story.",
      choices: ["corroborate", "contradict", "embellish", "dismiss"],
      answer: 0,
      notes: [
        "Extra records that back up an account “corroborate” it.",
        "A cautious reporter wants support before publishing, not a contradiction.",
        "“Embellish” means to add decorative or invented detail, the opposite of careful checking.",
        "“Dismiss” means to reject. You don't search for records just to reject an account.",
      ],
    },
    {
      id: "meticulous", word: "meticulous", pos: "adjective", format: "blank",
      definition: "showing great attention to detail; very careful and precise",
      synonyms: ["thorough", "painstaking", "precise"], antonyms: ["careless", "sloppy", "negligent"],
      root: "Latin metus (fear): originally “fearful,” so careful never to make a mistake.",
      clue: "Every entry is “dated, labeled, and cross-referenced,” which is extreme care.",
      text: "{{NAME_3}}'s notes on {{SKILL}} are famously ______: every entry is dated, labeled, and cross-referenced.",
      choices: ["meticulous", "haphazard", "brief", "sentimental"],
      answer: 0,
      notes: [
        "Dated, labeled and cross-referenced notes are “meticulous.”",
        "“Haphazard” means careless and disorganized, the opposite.",
        "Nothing suggests the notes are short. The clue is about care, not length.",
        "“Sentimental” means emotional, which has nothing to do with organization.",
      ],
    },
    {
      id: "pragmatic", word: "pragmatic", pos: "adjective", format: "blank",
      definition: "dealing with things in a practical, realistic way",
      synonyms: ["practical", "realistic", "sensible"], antonyms: ["idealistic", "impractical", "theoretical"],
      root: "Greek pragma (deed, action): focused on what can actually be done.",
      clue: "Instead of waiting for perfect equipment, {{NAME_1}} used what was available. That's practical.",
      text: "Rather than waiting for perfect equipment, {{NAME_1}} took a ______ approach, using whatever tools were already available at {{LOCATION}}.",
      choices: ["pragmatic", "idealistic", "reckless", "theoretical"],
      answer: 0,
      notes: [
        "Making do with the tools at hand is “pragmatic.”",
        "“Idealistic” would mean waiting for the perfect setup, the opposite of the text.",
        "Nothing suggests danger or carelessness.",
        "“Theoretical” means based on ideas rather than practice, but {{NAME_1}} acts practically.",
      ],
    },
    {
      id: "substantiate", word: "substantiate", pos: "verb", format: "blank",
      definition: "to provide evidence that proves something is true",
      synonyms: ["prove", "verify", "support"], antonyms: ["disprove", "refute", "undercut"],
      root: "Latin substantia (substance): to give a claim real substance.",
      clue: "“Without more evidence” it was impossible to do this, so the word is about proving with evidence.",
      text: "Critics agreed that {{NAME_2}}'s claim was intriguing but argued that, without more evidence, it was impossible to ______.",
      choices: ["substantiate", "publicize", "abandon", "simplify"],
      answer: 0,
      notes: [
        "Evidence is what you need to “substantiate” (prove) a claim.",
        "Publicizing a claim doesn't require evidence.",
        "You don't need evidence to abandon a claim.",
        "Simplifying a claim isn't blocked by missing evidence.",
      ],
    },
    {
      id: "mitigate", word: "mitigate", pos: "verb", format: "blank",
      definition: "to make something bad less severe",
      synonyms: ["lessen", "ease", "alleviate"], antonyms: ["worsen", "aggravate", "intensify"],
      root: "Latin mitis (soft, mild) + agere (to make): to make milder.",
      clue: "Shade and free water reduce the harm of heat.",
      text: "To ______ the effects of the heat during {{EVENT}}, organizers set up shaded rest areas and handed out free water.",
      choices: ["mitigate", "intensify", "overlook", "predict"],
      answer: 0,
      notes: [
        "Shade and water make heat less severe. That's “mitigate.”",
        "“Intensify” means to make stronger, the opposite.",
        "The organizers are clearly paying attention to the heat, not overlooking it.",
        "Setting up shade responds to the heat. It doesn't forecast it.",
      ],
    },
    {
      id: "novel", word: "novel", pos: "adjective", format: "meaning",
      definition: "new and original; not like anything seen before",
      synonyms: ["new", "original", "fresh"], antonyms: ["familiar", "conventional", "routine"],
      root: "Latin novus (new), the same root as “innovate” and “renovate.”",
      clue: "“That no one at {{LOCATION}} had tried before” defines the word right in the sentence.",
      text: "Most researchers approached the problem the same way, but {{NAME_3}} proposed a [[novel]] method that no one at {{LOCATION}} had tried before.",
      choices: ["new and original", "long and fictional", "extremely difficult", "widely popular"],
      answer: 0,
      notes: [
        "A method no one had tried before is new and original.",
        "Trap: a novel is a long fictional book, but here the word describes a method.",
        "Nothing in the text says the method was hard.",
        "No one had tried it, so it couldn't be popular.",
      ],
    },
    {
      id: "ubiquitous", word: "ubiquitous", pos: "adjective", format: "blank",
      definition: "found everywhere",
      synonyms: ["everywhere", "pervasive", "widespread"], antonyms: ["rare", "scarce", "uncommon"],
      root: "Latin ubique (everywhere).",
      clue: "It is now “difficult to find a student … without one,” so they're everywhere.",
      text: "Once rare, smartphones have become so ______ that it is now difficult to find a student at {{LOCATION}} without one.",
      choices: ["ubiquitous", "scarce", "obsolete", "fragile"],
      answer: 0,
      notes: [
        "If nearly everyone has one, smartphones are “ubiquitous.”",
        "“Scarce” means rare, which contradicts “once rare … now.”",
        "“Obsolete” means out of date. Obsolete devices would be hard to find.",
        "Fragility has nothing to do with how common they are.",
      ],
    },
    {
      id: "tentative", word: "tentative", pos: "adjective", format: "meaning",
      definition: "not certain or fixed; provisional",
      synonyms: ["provisional", "uncertain", "preliminary"], antonyms: ["definite", "final", "settled"],
      root: "Latin tentare (to try, test): something still being tried out.",
      clue: "Everyone understood it “could still change.”",
      text: "The team reached a [[tentative]] agreement about the schedule for {{EVENT}}, but everyone understood that it could still change.",
      choices: ["not yet final", "hostile", "unanimous", "hesitant to speak"],
      answer: 0,
      notes: [
        "An agreement that could still change is not yet final.",
        "Nothing suggests anger or conflict.",
        "“Unanimous” is about everyone agreeing, not about whether the plan might change.",
        "Trap: “tentative” can describe a shy person, but here it describes an agreement.",
      ],
    },
    {
      id: "advocate", word: "advocate", pos: "verb", format: "meaning",
      definition: "to publicly support or argue for",
      synonyms: ["champion", "support", "promote"], antonyms: ["oppose", "criticize", "resist"],
      root: "Latin ad- (to) + vocare (to call): to call out in favor of something.",
      clue: "Writing letters and speaking at meetings are ways of publicly pushing for something.",
      text: "For years, {{NAME_1}} has [[advocated]] for longer library hours, writing letters and speaking at every school meeting.",
      choices: ["publicly supported", "secretly opposed", "legally represented", "carefully measured"],
      answer: 0,
      notes: [
        "Letters and speeches in favor of longer hours are public support.",
        "The actions are public and in favor, so not secret opposition.",
        "Trap: a lawyer can be an advocate, but no one here is in court.",
        "Nothing is being measured.",
      ],
    },
    {
      id: "scrutinize", word: "scrutinize", pos: "verb", format: "blank",
      definition: "to examine very closely",
      synonyms: ["examine", "inspect", "analyze"], antonyms: ["overlook", "skim", "ignore"],
      root: "Latin scrutari (to search carefully), originally sorting through rags piece by piece.",
      clue: "“Reading each line twice to make sure nothing was missed” is close examination.",
      text: "Before signing up for {{EVENT}}, {{NAME_2}} took time to ______ every rule, reading each line twice to make sure nothing was missed.",
      choices: ["scrutinize", "skim", "ignore", "celebrate"],
      answer: 0,
      notes: [
        "Reading every line twice is scrutinizing.",
        "“Skim” means to read quickly and lightly, the opposite.",
        "{{NAME_2}} clearly pays attention to the rules.",
        "Nothing suggests celebrating the rules.",
      ],
    },
    {
      id: "resilient", word: "resilient", pos: "adjective", format: "blank",
      definition: "able to recover quickly from difficulties",
      synonyms: ["tough", "adaptable", "hardy"], antonyms: ["fragile", "vulnerable", "brittle"],
      root: "Latin re- (back) + salire (to jump): to spring back.",
      clue: "Losing three games then winning ten in a row is bouncing back.",
      text: "Although the team lost its first three games, it proved remarkably ______, winning the next ten in a row.",
      choices: ["resilient", "fragile", "complacent", "indifferent"],
      answer: 0,
      notes: [
        "Recovering from losses to win ten straight is being “resilient.”",
        "“Fragile” means easily broken, the opposite.",
        "“Complacent” means too satisfied to try hard, which doesn't fit a comeback.",
        "“Indifferent” means not caring, and a ten-game streak shows effort.",
      ],
    },
    {
      id: "obsolete", word: "obsolete", pos: "adjective", format: "blank",
      definition: "no longer used; out of date",
      synonyms: ["outdated", "defunct", "antiquated"], antonyms: ["current", "modern", "cutting-edge"],
      root: "Latin obsolescere (to grow old, fall out of use).",
      clue: "“Newer programs have replaced it.”",
      text: "The software that {{NAME_3}} first learned on is now ______; newer programs have replaced it at nearly every school.",
      choices: ["obsolete", "innovative", "essential", "expensive"],
      answer: 0,
      notes: [
        "Replaced and out of use means “obsolete.”",
        "“Innovative” means new and creative, the opposite.",
        "If it's been replaced, it isn't essential.",
        "Price isn't mentioned. The clue is about replacement.",
      ],
    },
    {
      id: "discern", word: "discern", pos: "verb", format: "meaning",
      definition: "to perceive or recognize, especially with difficulty",
      synonyms: ["detect", "perceive", "distinguish"], antonyms: ["overlook", "miss", "confuse"],
      root: "Latin dis- (apart) + cernere (to sift, separate): to pick something out from the rest.",
      clue: "Picking out one voice “even in the noisy crowd.”",
      text: "Even in the noisy crowd at {{EVENT}}, {{NAME_1}} could [[discern]] a familiar voice calling from the stands.",
      choices: ["make out", "ignore", "imitate", "argue with"],
      answer: 0,
      notes: [
        "Recognizing one voice through noise is making it out.",
        "“Even in the noisy crowd” stresses noticing, not ignoring.",
        "Nothing suggests copying the voice.",
        "Nothing suggests an argument.",
      ],
    },
    {
      id: "empirical", word: "empirical", pos: "adjective", format: "blank",
      definition: "based on observation or experiment rather than theory",
      synonyms: ["observed", "experimental", "evidence-based"], antonyms: ["theoretical", "speculative", "hypothetical"],
      root: "Greek empeiria (experience).",
      clue: "“Based on hundreds of observations … rather than on guesswork.”",
      text: "{{NAME_2}}'s conclusions were ______, based on hundreds of observations recorded at {{LOCATION}} rather than on guesswork.",
      choices: ["empirical", "speculative", "fictional", "emotional"],
      answer: 0,
      notes: [
        "Conclusions drawn from observations are “empirical.”",
        "“Speculative” means based on guesses, which the text rules out.",
        "The conclusions come from real observations.",
        "Observations aren't feelings.",
      ],
    },
    {
      id: "prolific", word: "prolific", pos: "adjective", format: "blank",
      definition: "producing a large amount of something",
      synonyms: ["productive", "fruitful", "abundant"], antonyms: ["unproductive", "sparse", "scarce"],
      root: "Latin proles (offspring) + facere (to make): making many.",
      clue: "More than forty stories before turning twenty.",
      text: "A ______ writer, {{NAME_3}} published more than forty short stories before turning twenty.",
      choices: ["prolific", "reluctant", "anonymous", "careless"],
      answer: 0,
      notes: [
        "Forty stories is a huge output, so “prolific.”",
        "A reluctant writer wouldn't publish forty stories.",
        "Nothing says the writer hid their name.",
        "Nothing is said about the quality of the work.",
      ],
    },
    {
      id: "skeptical", word: "skeptical", pos: "adjective", format: "blank",
      definition: "doubtful; not easily convinced",
      synonyms: ["doubtful", "dubious", "questioning"], antonyms: ["convinced", "trusting", "credulous"],
      root: "Greek skeptesthai (to look carefully, examine).",
      clue: "They wanted the experiment repeated because the sample was small.",
      text: "Researchers were ______ of the early results because the sample size was so small; they wanted to see the experiment repeated.",
      choices: ["skeptical", "convinced", "proud", "unaware"],
      answer: 0,
      notes: [
        "Wanting a repeat before believing the results is being “skeptical.”",
        "If they were convinced, they wouldn't need a repeat.",
        "Nothing suggests pride.",
        "They clearly know about the results.",
      ],
    },
    {
      id: "conventional", word: "conventional", pos: "adjective", format: "blank",
      definition: "following what is usually done; traditional",
      synonyms: ["traditional", "standard", "customary"], antonyms: ["unconventional", "novel", "radical"],
      root: "Latin convenire (to come together): what people have agreed on as usual.",
      clue: "It contrasts with “an unusual routine” that “most teams” don't use.",
      text: "Instead of the ______ warm-up that most teams use, {{NAME_1}} designed an unusual routine built around balance drills.",
      choices: ["conventional", "eccentric", "innovative", "spontaneous"],
      answer: 0,
      notes: [
        "What “most teams use,” in contrast to “unusual,” is “conventional.”",
        "“Eccentric” means unusual, which describes {{NAME_1}}'s routine, not the one most teams use.",
        "“Innovative” also describes the new routine, not the standard one.",
        "“Spontaneous” means unplanned, but a warm-up most teams use is planned.",
      ],
    },
    {
      id: "ameliorate", word: "ameliorate", pos: "verb", format: "blank",
      definition: "to make something bad better",
      synonyms: ["improve", "remedy", "alleviate"], antonyms: ["worsen", "exacerbate", "aggravate"],
      root: "Latin melior (better).",
      clue: "New lights and wider sidewalks improve dangerous conditions.",
      text: "New streetlights and wider sidewalks helped ______ the dangerous conditions students faced when walking to {{LOCATION}} after dark.",
      choices: ["ameliorate", "aggravate", "disguise", "document"],
      answer: 0,
      notes: [
        "Safety upgrades make dangerous conditions better. That's “ameliorate.”",
        "“Aggravate” means to make worse.",
        "Lights reveal things rather than hiding them.",
        "Building sidewalks changes conditions. It doesn't just record them.",
      ],
    },
    {
      id: "candid", word: "candid", pos: "adjective", format: "meaning",
      definition: "honest and direct",
      synonyms: ["frank", "honest", "forthright"], antonyms: ["evasive", "guarded", "deceptive"],
      root: "Latin candidus (white, pure): nothing hidden.",
      clue: "{{NAME_2}} “admitted” the team hadn't prepared well, which is an honest confession.",
      text: "In a [[candid]] interview after {{EVENT}}, {{NAME_2}} admitted that the team had not prepared well.",
      choices: ["honest and direct", "secretly recorded", "very brief", "carefully rehearsed"],
      answer: 0,
      notes: [
        "Admitting a failure openly is honest and direct.",
        "Trap: a “candid photo” is taken without warning, but here the word describes an honest interview.",
        "Length isn't mentioned.",
        "A rehearsed interview usually avoids admissions like this.",
      ],
    },
    {
      id: "diminish", word: "diminish", pos: "verb", format: "meaning",
      definition: "to make or become smaller or less",
      synonyms: ["reduce", "decrease", "lessen"], antonyms: ["increase", "amplify", "enlarge"],
      root: "Latin minuere (to make smaller), related to “minus” and “minimum.”",
      clue: "The coach “worried,” so the delay would hurt the team's energy.",
      text: "The coach worried that the long delay before {{EVENT}} would [[diminish]] the team's energy.",
      choices: ["reduce", "reveal", "measure", "restore"],
      answer: 0,
      notes: [
        "A worrying delay would reduce energy.",
        "A delay doesn't reveal energy.",
        "A delay doesn't measure anything.",
        "“Restore” means to bring back, the opposite of the coach's worry.",
      ],
    },
    {
      id: "innovative", word: "innovative", pos: "adjective", format: "blank",
      definition: "introducing new ideas; original and creative",
      synonyms: ["inventive", "original", "groundbreaking"], antonyms: ["conventional", "derivative", "traditional"],
      root: "Latin in- (into) + novus (new): bringing something new in.",
      clue: "“Nothing like it had appeared … before.”",
      text: "The judges praised {{NAME_3}}'s ______ design, noting that nothing like it had appeared at {{EVENT}} before.",
      choices: ["innovative", "derivative", "conventional", "outdated"],
      answer: 0,
      notes: [
        "Something never seen before is “innovative.”",
        "“Derivative” means copied from other work, the opposite.",
        "“Conventional” means ordinary and expected.",
        "“Outdated” doesn't fit a design nobody had seen.",
      ],
    },
    {
      id: "reconcile", word: "reconcile", pos: "verb", format: "meaning",
      definition: "to make two things consistent or compatible",
      synonyms: ["harmonize", "square", "resolve"], antonyms: ["separate", "divide", "set against"],
      root: "Latin re- (again) + conciliare (to bring together).",
      clue: "Two diaries that describe the same day “in completely different ways” need to be made consistent.",
      text: "Historians have struggled to [[reconcile]] the two diaries, which describe the same day at {{LOCATION}} in completely different ways.",
      choices: ["make consistent with each other", "become friends again", "copy by hand", "throw away"],
      answer: 0,
      notes: [
        "Conflicting accounts need to be made consistent.",
        "Trap: people “reconcile” after a fight, but diaries can't become friends.",
        "Nothing suggests copying.",
        "Historians study the diaries. They don't throw them away.",
      ],
    },
    {
      id: "arbitrary", word: "arbitrary", pos: "adjective", format: "blank",
      definition: "based on random choice rather than reason",
      synonyms: ["random", "unjustified", "capricious"], antonyms: ["reasoned", "principled", "methodical"],
      root: "Latin arbiter (judge): decided by someone's whim rather than by a rule.",
      clue: "“No one could figure out any reason.”",
      text: "Players complained that the new seating chart was ______: no one could figure out any reason for who sat where.",
      choices: ["arbitrary", "logical", "deliberate", "permanent"],
      answer: 0,
      notes: [
        "A chart with no reason behind it is “arbitrary.”",
        "“Logical” means there was a clear reason, the opposite.",
        "“Deliberate” implies a purpose, which contradicts “no reason.”",
        "Nothing is said about how long it will last.",
      ],
    },
    {
      id: "concede", word: "concede", pos: "verb", format: "meaning",
      definition: "to admit that something is true, often reluctantly",
      synonyms: ["admit", "acknowledge", "grant"], antonyms: ["deny", "dispute", "reject"],
      root: "Latin con- (completely) + cedere (to yield, give way).",
      clue: "After the replay, {{NAME_1}} accepted the call was right.",
      text: "After reviewing the replay, {{NAME_1}} [[conceded]] that the referee's call had been correct.",
      choices: ["admitted", "denied", "celebrated", "forgot"],
      answer: 0,
      notes: [
        "Accepting the call after seeing proof is admitting it.",
        "“Denied” is the opposite of accepting.",
        "Nothing suggests celebrating.",
        "{{NAME_1}} just watched the replay and clearly remembers.",
      ],
    },
    {
      id: "elucidate", word: "elucidate", pos: "verb", format: "blank",
      definition: "to make clear; to explain",
      synonyms: ["clarify", "explain", "illuminate"], antonyms: ["obscure", "confuse", "complicate"],
      root: "Latin e- (out) + lucidus (light, clear): to bring into the light.",
      clue: "After the diagram, “the whole class understood it.”",
      text: "{{NAME_2}} drew a simple diagram to ______ the rule, and suddenly the whole class understood it.",
      choices: ["elucidate", "obscure", "memorize", "criticize"],
      answer: 0,
      notes: [
        "A diagram that makes everyone understand elucidates the rule.",
        "“Obscure” means to make unclear, the opposite.",
        "Drawing a diagram explains a rule. It isn't memorizing it.",
        "Nothing suggests criticism.",
      ],
    },
    {
      id: "inherent", word: "inherent", pos: "adjective", format: "blank",
      definition: "existing as a natural, permanent part of something",
      synonyms: ["intrinsic", "built-in", "innate"], antonyms: ["external", "acquired", "extrinsic"],
      root: "Latin in- (in) + haerere (to stick): stuck inside.",
      clue: "Errors can “never be fully eliminated,” so the risk is built in.",
      text: "Some risk is ______ in any experiment; no matter how careful {{NAME_3}} is, small errors can never be fully eliminated.",
      choices: ["inherent", "absent", "optional", "accidental"],
      answer: 0,
      notes: [
        "Risk that can never be removed is built in, or “inherent.”",
        "“Absent” contradicts “some risk.”",
        "It can't be optional if it can never be eliminated.",
        "“Accidental” suggests chance, but the text says the risk is always there.",
      ],
    },
    {
      id: "profound", word: "profound", pos: "adjective", format: "meaning",
      definition: "very great or intense; deep in meaning",
      synonyms: ["deep", "intense", "far-reaching"], antonyms: ["superficial", "shallow", "trivial"],
      root: "Latin pro- (forward) + fundus (bottom): reaching far down.",
      clue: "It “changed how {{NAME_2}} thought,” a deep, lasting effect.",
      text: "Winning {{EVENT}} had a [[profound]] effect on {{NAME_2}}, changing how {{NAME_2}} thought about practice and hard work.",
      choices: ["deep and significant", "loud and noisy", "brief and temporary", "located far below the surface"],
      answer: 0,
      notes: [
        "An effect that changes how you think is deep and significant.",
        "Nothing is about sound.",
        "It changed {{NAME_2}}'s thinking, so it wasn't brief.",
        "Trap: that's the literal, physical sense of “deep,” but an effect has no location.",
      ],
    },
    {
      id: "compelling", word: "compelling", pos: "adjective", format: "meaning",
      definition: "convincing; powerfully persuasive",
      synonyms: ["convincing", "persuasive", "forceful"], antonyms: ["unconvincing", "weak", "flimsy"],
      root: "Latin com- (together) + pellere (to drive): driving you to agree.",
      clue: "“Even the doubters changed their minds.”",
      text: "{{NAME_1}} presented such [[compelling]] evidence at {{LOCATION}} that even the doubters changed their minds.",
      choices: ["convincing", "mandatory", "confusing", "unexpected"],
      answer: 0,
      notes: [
        "Evidence that changes doubters' minds is convincing.",
        "Trap: to compel can mean to force, but evidence isn't mandatory.",
        "Confusing evidence wouldn't change minds.",
        "Surprise alone doesn't explain why the doubters were persuaded.",
      ],
    },
    // ---------- Advanced (level: "advanced"): harder Digital SAT words. They
    // lead the Vocab Derby and join flashcards/sprints after the core words. ----------
    {
      id: "equanimity", word: "equanimity", pos: "noun", format: "blank", level: "advanced",
      definition: "mental calmness and composure, especially in a difficult situation",
      synonyms: ["composure", "calm", "poise"], antonyms: ["agitation", "anxiety", "panic"],
      root: "Latin aequus (even, level) + animus (mind): an even mind.",
      clue: "“Calmly adjusting the plan while teammates scrambled” shows composure under pressure.",
      text: "Even when the judges at {{EVENT}} announced a sudden rule change, {{NAME_1}} responded with remarkable ______, calmly adjusting the plan while teammates scrambled.",
      choices: ["equanimity", "trepidation", "indignation", "ambivalence"],
      answer: 0,
      notes: [
        "Calmly adjusting while others panic is composure: “equanimity.”",
        "“Trepidation” is fear or anxiety, which contradicts “calmly.”",
        "“Indignation” is anger at unfairness. A calm response isn't anger.",
        "“Ambivalence” means mixed feelings. It doesn't explain the calm, decisive action.",
      ],
    },
    {
      id: "fastidious", word: "fastidious", pos: "adjective", format: "blank", level: "advanced",
      definition: "very attentive to accuracy and detail; hard to please",
      synonyms: ["exacting", "particular", "punctilious"], antonyms: ["careless", "slapdash", "lax"],
      root: "Latin fastidium (distaste): so particular that every flaw feels distasteful.",
      clue: "Rechecking every citation twice and rejecting weak sources shows extreme attention to detail.",
      text: "Known for being ______, {{NAME_2}} rechecked every citation in the 40-page report twice and rejected any source that lacked a verifiable publication date.",
      choices: ["fastidious", "cavalier", "gregarious", "dilatory"],
      answer: 0,
      notes: [
        "Double-checking every citation is exactly what a “fastidious” person does.",
        "“Cavalier” means carelessly dismissive, the opposite of rechecking everything.",
        "“Gregarious” means sociable. The sentence is about precision, not friendliness.",
        "“Dilatory” means slow or delaying. Careful rechecking isn't procrastinating.",
      ],
    },
    {
      id: "obdurate", word: "obdurate", pos: "adjective", format: "meaning", level: "advanced",
      definition: "stubbornly refusing to change one's opinion or course of action",
      synonyms: ["unyielding", "inflexible", "adamant"], antonyms: ["flexible", "amenable", "compliant"],
      root: "Latin obdurare (to harden): ob- (against) + durus (hard), as in “durable.”",
      clue: "Refusing “even to schedule a review” despite three contrary studies signals stubbornness.",
      text: "Despite three independent studies contradicting the claim, the committee chair at {{LOCATION}} remained [[obdurate]], refusing even to schedule a review of the evidence.",
      choices: ["stubbornly unwilling to change", "openly hostile", "deeply confused", "quietly uncertain"],
      answer: 0,
      notes: [
        "Ignoring strong evidence and refusing a review is stubborn refusal to change.",
        "The chair refuses to act but shows no aggression, so “hostile” overreaches.",
        "Nothing suggests confusion. The chair understands and still refuses.",
        "Refusing a review shows certainty, the opposite of being uncertain.",
      ],
    },
    {
      id: "recalcitrant", word: "recalcitrant", pos: "adjective", format: "blank", level: "advanced",
      definition: "stubbornly uncooperative toward authority or control",
      synonyms: ["defiant", "unruly", "intractable"], antonyms: ["docile", "obedient", "cooperative"],
      root: "Latin re- (back) + calcitrare (to kick): kicking back, like a stubborn mule.",
      clue: "A system that rejects every patch and crashes on update resists all control.",
      text: "The engineers had expected the old software to be ______, but even they were surprised when the system rejected every patch and crashed the moment {{NAME_3}} tried to update it.",
      choices: ["recalcitrant", "pliable", "innocuous", "ostentatious"],
      answer: 0,
      notes: [
        "Rejecting every fix is stubborn resistance to control: “recalcitrant.”",
        "“Pliable” means easily bent or adjusted, the opposite of rejecting every patch.",
        "“Innocuous” means harmless. A system that crashes isn't harmless.",
        "“Ostentatious” means showy, which has nothing to do with failing updates.",
      ],
    },
    {
      id: "surreptitious", word: "surreptitious", pos: "adjective", format: "blank", level: "advanced",
      definition: "kept secret because it would not be approved of; stealthy",
      synonyms: ["stealthy", "covert", "furtive"], antonyms: ["open", "overt", "blatant"],
      root: "Latin surripere (to snatch secretly): sub- (under) + rapere (to seize).",
      clue: "Avoiding “tipping off” rivals and looking down only when “no one was watching” point to secrecy.",
      text: "To avoid tipping off the rival team before {{EVENT}}, {{NAME_1}} took ______ notes on the team's strategy, glancing down only when no one was watching.",
      choices: ["surreptitious", "conspicuous", "flamboyant", "gratuitous"],
      answer: 0,
      notes: [
        "Hidden, watch-your-back note-taking is “surreptitious.”",
        "“Conspicuous” means easy to notice, the opposite of hiding the notes.",
        "“Flamboyant” means showy and attention-seeking.",
        "“Gratuitous” means unnecessary or unjustified. It says nothing about secrecy.",
      ],
    },
    {
      id: "perfunctory", word: "perfunctory", pos: "adjective", format: "meaning", level: "advanced",
      definition: "carried out with minimal effort or reflection; routine and superficial",
      synonyms: ["cursory", "superficial", "halfhearted"], antonyms: ["thorough", "diligent", "conscientious"],
      root: "Latin perfungi (to get through with): just getting it over with.",
      clue: "A review that lasted “barely a minute” and addressed “none of the key arguments” took minimal effort.",
      text: "After weeks of careful preparation for {{EVENT}}, {{NAME_2}} was disappointed by the judge's [[perfunctory]] review, which lasted barely a minute and addressed none of the key arguments.",
      choices: ["done quickly and without real care", "extremely harsh and critical", "carefully balanced", "widely praised"],
      answer: 0,
      notes: [
        "Barely a minute and no key arguments: done quickly, without care.",
        "Nothing in the review is described as harsh. It was empty, not critical.",
        "Addressing none of the arguments can't be “carefully balanced.”",
        "The text never mentions praise for the review.",
      ],
    },
    {
      id: "laconic", word: "laconic", pos: "adjective", format: "blank", level: "advanced",
      definition: "using very few words; concise to the point of seeming curt",
      synonyms: ["terse", "succinct", "pithy"], antonyms: ["verbose", "wordy", "talkative"],
      root: "From Laconia, home of ancient Sparta, whose people were famous for blunt, brief speech.",
      clue: "“Three crisp sentences” contrasted with “long-winded speakers” signals brevity.",
      text: "Unlike the long-winded speakers before {{NAME_3}}, the final presenter at {{EVENT}} was famously ______, summarizing two years of research in three crisp sentences.",
      choices: ["laconic", "verbose", "effusive", "pedantic"],
      answer: 0,
      notes: [
        "Two years of research in three sentences is “laconic.”",
        "“Verbose” means wordy, which describes the earlier speakers, not this one.",
        "“Effusive” means gushing with emotion. Crisp summaries aren't gushing.",
        "“Pedantic” means fussy about minor details. Nothing suggests nitpicking.",
      ],
    },
    {
      id: "magnanimous", word: "magnanimous", pos: "adjective", format: "blank", level: "advanced",
      definition: "generous or forgiving, especially toward a rival or someone less powerful",
      synonyms: ["gracious", "big-hearted", "charitable"], antonyms: ["petty", "spiteful", "vindictive"],
      root: "Latin magnus (great) + animus (spirit): great-spirited.",
      clue: "Praising the opponents and inviting them to collaborate is generosity toward a rival.",
      text: "After winning the debate final at {{EVENT}}, {{NAME_1}} was ______ in victory, praising the opposing team's research and inviting its members to co-author the follow-up paper.",
      choices: ["magnanimous", "vindictive", "sanctimonious", "complacent"],
      answer: 0,
      notes: [
        "Honoring a defeated rival is the classic “magnanimous” winner.",
        "“Vindictive” means seeking revenge, the opposite of praising opponents.",
        "“Sanctimonious” means acting morally superior. Praising others isn't self-righteous.",
        "“Complacent” means smugly satisfied. Inviting new collaboration isn't complacency.",
      ],
    },
    {
      id: "obsequious", word: "obsequious", pos: "adjective", format: "meaning", level: "advanced",
      definition: "excessively eager to please or obey; fawning",
      synonyms: ["fawning", "servile", "sycophantic"], antonyms: ["assertive", "independent", "domineering"],
      root: "Latin obsequi (to comply): ob- (toward) + sequi (to follow), as in “sequence.”",
      clue: "Agreeing “instantly with every suggestion” and “showering” compliments is over-the-top eagerness to please.",
      text: "The new assistant's [[obsequious]] manner, agreeing instantly with every suggestion and showering the director with compliments, made {{NAME_2}} doubt the sincerity of any feedback at {{LOCATION}}.",
      choices: ["excessively eager to please", "quietly confident", "openly rebellious", "carefully neutral"],
      answer: 0,
      notes: [
        "Instant agreement plus constant flattery is excessive eagerness to please.",
        "Agreeing with everything shows a need for approval, not confidence.",
        "“Rebellious” is the opposite of agreeing with every suggestion.",
        "Showering someone with compliments isn't neutral.",
      ],
    },
    {
      id: "pernicious", word: "pernicious", pos: "adjective", format: "blank", level: "advanced",
      definition: "having a harmful effect, especially in a gradual or subtle way",
      synonyms: ["insidious", "destructive", "injurious"], antonyms: ["harmless", "benign", "beneficial"],
      root: "Latin pernicies (destruction), from nex (death).",
      clue: "Effects “nearly invisible at first” that “steadily eroded trust” are subtle, gradual harm.",
      text: "Public-health researchers at {{LOCATION}} warned that the rumor was especially ______: its effects were nearly invisible at first but steadily eroded trust in vaccines over many years.",
      choices: ["pernicious", "benign", "salutary", "transparent"],
      answer: 0,
      notes: [
        "Slow, hidden damage is the hallmark of something “pernicious.”",
        "“Benign” means harmless, but the rumor eroded trust.",
        "“Salutary” means beneficial, the opposite of eroding trust.",
        "“Transparent” means obvious or clear, but the effects were nearly invisible.",
      ],
    },
    {
      id: "quixotic", word: "quixotic", pos: "adjective", format: "meaning", level: "advanced",
      definition: "exceedingly idealistic; unrealistic and impractical",
      synonyms: ["idealistic", "unrealistic", "visionary"], antonyms: ["realistic", "sensible", "down-to-earth"],
      root: "From Don Quixote, the hero of Cervantes's novel who charges at windmills while chasing noble but hopeless dreams.",
      clue: "“Admirable but” plus ignoring “budgets, laws, and basic engineering” means noble yet unrealistic.",
      text: "{{NAME_3}}'s plan to eliminate all traffic at {{LOCATION}} within a single summer was admirable but [[quixotic]]; even supporters admitted it ignored budgets, laws, and basic engineering.",
      choices: ["idealistic but impractical", "secretive and dishonest", "cautious and modest", "popular but temporary"],
      answer: 0,
      notes: [
        "Admirable goals that ignore every real-world limit are idealistic but impractical.",
        "Nothing about the plan is hidden or dishonest.",
        "Eliminating all traffic in one summer is the opposite of cautious.",
        "The text is about practicality, not about popularity or how long the plan lasts.",
      ],
    },
    {
      id: "sanguine", word: "sanguine", pos: "adjective", format: "blank", level: "advanced",
      definition: "optimistic or positive, especially in a difficult situation",
      synonyms: ["optimistic", "hopeful", "upbeat"], antonyms: ["pessimistic", "gloomy", "despondent"],
      root: "Latin sanguis (blood): old medicine linked a “blood” temperament to cheerful confidence.",
      clue: "“Although” results were mixed, the scientist still predicted success: optimism despite difficulty.",
      text: "Although early test results were mixed, the lead scientist remained ______ about the project, predicting at {{EVENT}} that the final trial would confirm the hypothesis.",
      choices: ["sanguine", "despondent", "indifferent", "sardonic"],
      answer: 0,
      notes: [
        "Predicting success despite mixed results is being “sanguine.”",
        "“Despondent” means hopeless, which contradicts predicting success.",
        "“Indifferent” means not caring, but making a confident prediction shows investment.",
        "“Sardonic” means mocking or cynical. Nothing in the prediction is mocking.",
      ],
    },
    {
      id: "ephemeral", word: "ephemeral", pos: "adjective", format: "meaning", level: "advanced",
      definition: "lasting for a very short time",
      synonyms: ["fleeting", "transient", "short-lived"], antonyms: ["permanent", "enduring", "lasting"],
      root: "Greek ephemeros: epi- (on) + hemera (day): lasting only a day.",
      clue: "Works “designed to vanish within days” are short-lived.",
      text: "The exhibit at {{LOCATION}} celebrated [[ephemeral]] art: sand sculptures, chalk murals, and ice carvings designed to vanish within days.",
      choices: ["lasting a very short time", "extremely expensive", "created by amateurs", "widely misunderstood"],
      answer: 0,
      notes: [
        "Art designed to vanish within days lasts a very short time.",
        "Sand, chalk and ice suggest cheap materials, not expensive ones.",
        "Nothing says who made the art.",
        "The text never mentions how the art is understood.",
      ],
    },
    {
      id: "esoteric", word: "esoteric", pos: "adjective", format: "blank", level: "advanced",
      definition: "intended for or understood by only a small group with specialized knowledge",
      synonyms: ["obscure", "arcane", "specialized"], antonyms: ["accessible", "mainstream", "popular"],
      root: "Greek esoterikos (belonging to an inner circle), from eso (within).",
      clue: "Only “the handful of specialists” could follow, so the content was for an inner circle.",
      text: "The lecture at {{EVENT}} was so ______ that only the handful of specialists in medieval manuscript dating could follow it; most of the audience left at intermission.",
      choices: ["esoteric", "accessible", "banal", "lucid"],
      answer: 0,
      notes: [
        "Content only specialists can follow is “esoteric.”",
        "“Accessible” means easy to understand, but most of the audience left.",
        "“Banal” means dull and ordinary. The problem was difficulty, not dullness.",
        "“Lucid” means clear. A clear lecture wouldn't lose most of its audience.",
      ],
    },
    {
      id: "mercurial", word: "mercurial", pos: "adjective", format: "meaning", level: "advanced",
      definition: "subject to sudden, unpredictable changes of mood or mind",
      synonyms: ["volatile", "fickle", "changeable"], antonyms: ["stable", "steady", "consistent"],
      root: "From Mercury, the swift Roman messenger god, and the restless liquid metal named after him.",
      clue: "Praising a passage “one minute” and demanding a rewrite “the next” is sudden change.",
      text: "The orchestra at {{LOCATION}} struggled to rehearse under its [[mercurial]] conductor, who praised a passage as flawless one minute and demanded that it be rewritten the next.",
      choices: ["unpredictably changeable", "extremely talented", "strict but fair", "quietly reserved"],
      answer: 0,
      notes: [
        "Flipping from praise to a rewrite in a minute is unpredictable change.",
        "The text describes mood swings, not skill.",
        "Flip-flopping isn't consistent, so it can't be “fair.”",
        "Loud swings between praise and demands aren't quiet or reserved.",
      ],
    },
    {
      id: "prescient", word: "prescient", pos: "adjective", format: "blank", level: "advanced",
      definition: "having or showing knowledge of events before they happen",
      synonyms: ["farsighted", "prophetic", "foresighted"], antonyms: ["shortsighted", "myopic", "unaware"],
      root: "Latin prae- (before) + scire (to know): knowing beforehand, as in “science.”",
      clue: "The essay “predicted” problems that “would emerge years later”: foreknowledge.",
      text: "{{NAME_2}}'s 2015 essay now seems remarkably ______: it predicted, almost detail for detail, the supply-chain problems that would emerge years later.",
      choices: ["prescient", "anachronistic", "myopic", "derivative"],
      answer: 0,
      notes: [
        "Predicting future events in detail is being “prescient.”",
        "“Anachronistic” means out of place in time. The essay isn't misplaced; it was early.",
        "“Myopic” means shortsighted, the opposite of accurate prediction.",
        "“Derivative” means unoriginal. Nothing suggests the essay was copied.",
      ],
    },
    {
      id: "temerity", word: "temerity", pos: "noun", format: "meaning", level: "advanced",
      definition: "excessive confidence or boldness; audacity",
      synonyms: ["audacity", "nerve", "gall"], antonyms: ["timidity", "caution", "shyness"],
      root: "Latin temere (rashly, blindly).",
      clue: "A first-year intern interrupting the CEO is a strikingly bold act.",
      text: "As a first-year intern, {{NAME_1}} had the [[temerity]] to interrupt the CEO's presentation at {{EVENT}} and point out an error in the revenue projections.",
      choices: ["bold, even reckless, nerve", "careful politeness", "deep embarrassment", "quiet patience"],
      answer: 0,
      notes: [
        "Interrupting the CEO as an intern takes bold, even reckless, nerve.",
        "Interrupting a presentation is not careful politeness.",
        "The text shows boldness, not embarrassment.",
        "Interrupting is the opposite of waiting patiently.",
      ],
    },
    {
      id: "alacrity", word: "alacrity", pos: "noun", format: "blank", level: "advanced",
      definition: "brisk and cheerful readiness",
      synonyms: ["eagerness", "readiness", "promptness"], antonyms: ["reluctance", "hesitation", "apathy"],
      root: "Latin alacer (lively, brisk).",
      clue: "“Eager to begin” and every slot filled “within ten minutes” is quick, willing response.",
      text: "Eager to begin, the volunteers responded to {{NAME_3}}'s call for help at {{LOCATION}} with such ______ that every sign-up slot was filled within ten minutes.",
      choices: ["alacrity", "reluctance", "lethargy", "trepidation"],
      answer: 0,
      notes: [
        "Eager, fast sign-ups show “alacrity.”",
        "“Reluctance” is unwillingness, which contradicts “eager to begin.”",
        "“Lethargy” is sluggishness. The slots filled in ten minutes.",
        "“Trepidation” is fear, which doesn't fit eager volunteers.",
      ],
    },
    {
      id: "acrimony", word: "acrimony", pos: "noun", format: "meaning", level: "advanced",
      definition: "bitterness or ill feeling, often expressed in harsh words",
      synonyms: ["bitterness", "rancor", "animosity"], antonyms: ["goodwill", "harmony", "friendliness"],
      root: "Latin acrimonia (sharpness), from acer (sharp): sharpness of temper.",
      clue: "“Trading insults” and refusing to sign even agreed points signal bitterness.",
      text: "The negotiations at {{LOCATION}} ended in [[acrimony]], with both delegations trading insults and refusing to sign even the points they had already agreed on.",
      choices: ["bitter, angry hostility", "reluctant compromise", "polite disagreement", "confused silence"],
      answer: 0,
      notes: [
        "Trading insults is bitter, angry hostility.",
        "Refusing to sign anything is the opposite of compromise.",
        "Insults aren't polite.",
        "Trading insults is loud, not silent.",
      ],
    },
    {
      id: "paucity", word: "paucity", pos: "noun", format: "blank", level: "advanced",
      definition: "the presence of something only in small or insufficient amounts; scarcity",
      synonyms: ["scarcity", "shortage", "dearth"], antonyms: ["abundance", "plethora", "surplus"],
      root: "Latin paucus (few, little).",
      clue: "“Only a few damaged tablets survive,” so the records are scarce.",
      text: "Historians on {{NAME_1}}'s team face a ______ of written records about the ancient city: only a few damaged tablets survive, so most conclusions rest on archaeological evidence.",
      choices: ["paucity", "plethora", "chronology", "veracity"],
      answer: 0,
      notes: [
        "A few damaged tablets is a “paucity,” a scarcity, of records.",
        "“Plethora” means an excess, the opposite of a few tablets.",
        "“Chronology” is an order of events. It doesn't explain relying on archaeology.",
        "“Veracity” means truthfulness. “A veracity of records” doesn't make sense.",
      ],
    },
    {
      id: "vacillate", word: "vacillate", pos: "verb", format: "blank", level: "advanced",
      definition: "to waver between different opinions or actions; to be indecisive",
      synonyms: ["waver", "dither", "fluctuate"], antonyms: ["decide", "commit", "settle"],
      root: "Latin vacillare (to sway, totter).",
      clue: "Choosing one offer “in the morning” and switching “by dinner” is wavering.",
      text: "For weeks, {{NAME_2}} continued to ______ between the two college offers, choosing one in the morning and switching to the other by dinner.",
      choices: ["vacillate", "persevere", "capitulate", "extrapolate"],
      answer: 0,
      notes: [
        "Switching back and forth daily is to “vacillate.”",
        "“Persevere” means to persist steadily, the opposite of switching.",
        "“Capitulate” means to surrender under pressure. No one is pressuring.",
        "“Extrapolate” means to infer beyond data. It doesn't fit choosing between offers.",
      ],
    },
    {
      id: "enervate", word: "enervate", pos: "verb", format: "meaning", level: "advanced",
      definition: "to drain someone of energy or strength; to weaken",
      synonyms: ["exhaust", "sap", "fatigue"], antonyms: ["energize", "invigorate", "refresh"],
      root: "Latin enervare: e- (out) + nervus (sinew): to cut the sinews. It sounds like “energize” but means the opposite.",
      clue: "Runners “slowed to a walk one by one,” so the heat drained their strength.",
      text: "The final miles at {{EVENT}} were run in 95-degree heat that seemed to [[enervate]] even the most experienced runners, who slowed to a walk one by one.",
      choices: ["drain of energy", "energize", "irritate", "confuse"],
      answer: 0,
      notes: [
        "Runners slowing to a walk were drained of energy.",
        "Trap! “Enervate” sounds like “energize” but means the opposite.",
        "Slowing to a walk points to exhaustion, not annoyance.",
        "Nothing suggests the runners were confused.",
      ],
    },
    {
      id: "exacerbate", word: "exacerbate", pos: "verb", format: "blank", level: "advanced",
      definition: "to make a problem, bad situation or feeling worse",
      synonyms: ["worsen", "aggravate", "compound"], antonyms: ["alleviate", "relieve", "soothe"],
      root: "Latin ex- (thoroughly) + acerbus (harsh, bitter): to make harsher.",
      clue: "Crowding students into fewer rooms makes an existing shortage worse.",
      text: "Cutting the library's evening hours would only ______ the shortage of quiet study space at {{LOCATION}}, since students would be crowded into fewer rooms.",
      choices: ["exacerbate", "alleviate", "delineate", "corroborate"],
      answer: 0,
      notes: [
        "Crowding students makes the shortage worse: “exacerbate.”",
        "“Alleviate” means to ease, the opposite of what crowding does.",
        "“Delineate” means to describe precisely. Cutting hours doesn't describe anything.",
        "“Corroborate” means to confirm with evidence. A shortage isn't a claim to confirm.",
      ],
    },
    {
      id: "obfuscate", word: "obfuscate", pos: "verb", format: "meaning", level: "advanced",
      definition: "to make something unclear or hard to understand, often deliberately",
      synonyms: ["obscure", "muddle", "cloud"], antonyms: ["clarify", "illuminate", "explain"],
      root: "Latin ob- (over) + fuscare (to darken): to darken over.",
      clue: "Jargon that made it “nearly impossible” to see the losses hid them on purpose.",
      text: "{{NAME_1}} and other critics argued that the company's 80-page report used jargon to [[obfuscate]] its losses, making it nearly impossible for investors to see how much money had disappeared.",
      choices: ["deliberately make unclear", "accurately calculate", "publicly apologize for", "quickly recover"],
      answer: 0,
      notes: [
        "Using jargon so no one can see the losses deliberately makes them unclear.",
        "The report hid the numbers, the opposite of calculating them clearly.",
        "Nothing suggests an apology.",
        "Hiding losses isn't recovering them.",
      ],
    },
    {
      id: "assuage", word: "assuage", pos: "verb", format: "blank", level: "advanced",
      definition: "to make an unpleasant feeling less intense; to soothe",
      synonyms: ["allay", "calm", "pacify"], antonyms: ["aggravate", "inflame", "stoke"],
      root: "Latin ad- (to) + suavis (sweet, pleasant): to sweeten.",
      clue: "A tour of the safety equipment is meant to calm “parents' fears.”",
      text: "To ______ parents' fears about the new science lab, {{NAME_3}} invited families to {{LOCATION}} for a tour of the safety equipment and emergency procedures.",
      choices: ["assuage", "stoke", "ignore", "quantify"],
      answer: 0,
      notes: [
        "Showing families the safety gear is meant to “assuage,” or soothe, their fears.",
        "“Stoke” means to fuel or increase, the opposite of a reassuring tour.",
        "Inviting families on a tour addresses their fears; it doesn't ignore them.",
        "“Quantify” means to measure. A tour doesn't measure fears.",
      ],
    },
  ];

  const BY_ID = Object.fromEntries(WORDS.map((w) => [w.id, w]));

  // ---------- Progress (pure) ----------
  // progress = { words: { [id]: { tier, seen, correct, wrong, lastAt, lastDay,
  //              advancedDay, mastered, review, cards, cardDay } }, sprintDay, sprints }
  //   seen/correct/wrong/lastDay count sprint answers; cards/cardDay count flashcard
  //   reviews; lastAt is the last activity of either kind (used for merging).
  const emptyProgress = () => ({ words: {}, sprintDay: null, sprints: 0, derby: SW.derby.emptyStats() });

  function wordState(p, id) {
    return { tier: 1, seen: 0, correct: 0, wrong: 0, lastAt: 0, lastDay: null, advancedDay: null, mastered: false, review: false, cards: 0, cardDay: null, ...p.words[id] };
  }

  const shuffle = (arr, rand) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  // Picks the day's words: words still being learned come first (lowest tier,
  // least recently seen), then new words, then anything else.
  function drawSprint(p, today, rand = Math.random) {
    const n = RULES.sprintSize;
    const states = WORDS.map((w) => ({ id: w.id, s: wordState(p, w.id) }));
    const byAge = (a, b) => a.s.tier - b.s.tier || a.s.lastAt - b.s.lastAt;
    const flagged = states.filter((x) => x.s.review && x.s.lastDay !== today).sort(byAge);
    const learning = states.filter((x) => x.s.seen && x.s.tier < 3 && x.s.lastDay !== today).sort(byAge);
    const adv = (x) => (BY_ID[x.id].level === "advanced" ? 1 : 0);
    const fresh = shuffle(states.filter((x) => !x.s.seen), rand).sort((a, b) => adv(a) - adv(b)); // core words first
    const seenToday = states.filter((x) => x.s.seen && x.s.tier < 3 && x.s.lastDay === today).sort(byAge);
    const mastered = states.filter((x) => x.s.tier === 3).sort(byAge);
    const pick = [];
    const take = (list, max) => { for (const x of list) { if (pick.length >= n || max <= 0) break; if (!pick.includes(x.id)) { pick.push(x.id); max--; } } };
    take(flagged, 3); // words you asked to review
    take(learning, 3); // reviews
    take(fresh, n); // new words
    take(learning, n);
    take(seenToday, n);
    take(mastered, n);
    return shuffle(pick, rand);
  }

  // Flashcard deck: flagged words first, then words still being learned
  // (lowest tier first), then new words, then mastered words.
  function drawDeck(p, rand = Math.random) {
    const states = shuffle(WORDS, rand).map((w) => ({ id: w.id, s: wordState(p, w.id) }));
    const rank = (s) => (s.review ? 0 : s.seen && s.tier < 3 ? 1 : !s.seen ? 2 : 3);
    return states
      .sort((a, b) => rank(a.s) - rank(b.s) || (rank(a.s) === 1 ? a.s.tier - b.s.tier : 0)
        || (BY_ID[a.id].level === "advanced") - (BY_ID[b.id].level === "advanced"))
      .slice(0, RULES.deckSize)
      .map((x) => x.id);
  }

  // Records a flashcard review. "Got It" pays once per word per day and
  // clears the review flag; "Review Later" sets it. Tiers don't change.
  function reviewCard(p, id, gotIt, today, now = Date.now()) {
    const s = wordState(p, id);
    s.cards += 1;
    s.lastAt = now;
    let sparks = 0;
    if (gotIt) {
      s.review = false;
      if (s.cardDay !== today) {
        s.cardDay = today;
        sparks = RULES.flashcardSparks;
      }
    } else {
      s.review = true;
    }
    p.words[id] = s;
    return { sparks };
  }

  // Flags a word for review after a miss outside the sprint (e.g. the Derby).
  function flag(p, id, now = Date.now()) {
    if (!BY_ID[id]) return;
    const s = wordState(p, id);
    s.review = true;
    s.lastAt = now;
    p.words[id] = s;
  }

  // Records an answer. Returns what changed and the Sparks earned.
  function grade(p, id, correct, today, now = Date.now()) {
    const s = wordState(p, id);
    const tierBefore = s.tier;
    let sparks = 0;
    let masteredNow = false;
    s.seen += 1;
    s.lastAt = now;
    s.lastDay = today;
    if (correct) {
      s.correct += 1;
      s.review = false;
      sparks += RULES.sparksPerCorrect;
      if (s.tier < 3 && s.advancedDay !== today) {
        s.tier += 1;
        s.advancedDay = today;
        if (s.tier === 3 && !s.mastered) {
          s.mastered = true; // the +25 bonus is paid once per word
          masteredNow = true;
          sparks += RULES.masterySparks;
        }
      }
    } else {
      s.wrong += 1;
      s.tier = 1;
      s.review = true;
    }
    p.words[id] = s;
    return { tierBefore, tierAfter: s.tier, masteredNow, sparks, spacedOut: correct && tierBefore < 3 && s.tier === tierBefore };
  }

  // Call when a sprint ends. First sprint of the day earns the bonus.
  function finishSprint(p, today) {
    p.sprints = (p.sprints || 0) + 1;
    if (p.sprintDay === today) return 0;
    p.sprintDay = today;
    return RULES.sprintSparks;
  }

  function summary(p) {
    const out = { 1: 0, 2: 0, 3: 0, seen: 0, total: WORDS.length };
    for (const w of WORDS) {
      const s = p.words[w.id];
      if (!s || !(s.seen || s.cards)) continue;
      out.seen++;
      out[s.tier || 1]++;
    }
    return out;
  }

  // Cloud merge: per word, the most recently answered side wins.
  function mergeProgress(local, cloud) {
    const a = local && local.words ? local : emptyProgress();
    const b = cloud && cloud.words ? cloud : emptyProgress();
    const words = {};
    for (const id of new Set([...Object.keys(a.words), ...Object.keys(b.words)])) {
      if (!BY_ID[id]) continue;
      const x = a.words[id];
      const y = b.words[id];
      const pick = !x ? y : !y ? x : (y.lastAt || 0) > (x.lastAt || 0) ? y : x;
      words[id] = {
        ...pick,
        tier: Math.min(3, Math.max(1, Number(pick.tier) || 1)),
        mastered: Boolean((x && x.mastered) || (y && y.mastered)),
        // A flashcard Sparks payout on either device counts for that day.
        cardDay: [x && x.cardDay, y && y.cardDay].filter(Boolean).sort().pop() || null,
      };
    }
    return {
      words,
      sprintDay: [a.sprintDay, b.sprintDay].filter(Boolean).sort().pop() || null,
      sprints: Math.max(a.sprints || 0, b.sprints || 0),
      derby: SW.derby.mergeStats(a.derby, b.derby),
    };
  }

  // ---------- View ----------
  // ctx: { container, getState, save, esc, fill, todayKey, sfx, toast,
  //        celebrate, earn(sparks), recordAnswer(correct), renderHud(bump) }
  function mount(ctx) {
    const { container, esc } = ctx;
    let sprint = null; // { ids, i, results: [], earned, picked }
    let deck = null; // { ids, i, flipped, got, later, earned, requeued: Set, busy }
    let drawer = null;
    const reducedMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
    const derby = SW.derby.mount({ ...ctx, onExit: () => render() });

    const P = () => {
      const S = ctx.getState();
      if (!S.vocab || !S.vocab.words) S.vocab = emptyProgress();
      return S.vocab;
    };
    const stemFor = (w) => (w.format === "meaning"
      ? SW.STEMS.meaning.replace("{word}", SW.UNDERLINE_RE.exec(w.text)[1])
      : SW.STEMS.wordChoice);
    const tierBadge = (t) => `<span class="tier t${t}">${TIERS[t].icon} ${TIERS[t].name}</span>`;

    function render() {
      if (sprint) return renderCard();
      if (deck) return renderDeck();
      if (derby.active()) return derby.render();
      const p = P();
      const sum = summary(p);
      const today = ctx.todayKey();
      const bonusLeft = p.sprintDay !== today;
      const cardBonusLeft = WORDS.some((w) => wordState(p, w.id).cardDay !== today);
      const seenWords = WORDS.filter((w) => p.words[w.id] && (p.words[w.id].seen || p.words[w.id].cards))
        .sort((a, b) => wordState(p, b.id).tier - wordState(p, a.id).tier || a.word.localeCompare(b.word));
      container.innerHTML = `
        <div class="stack vault">
          <section class="panel vault-hero">
            <span class="label-sm">Vocab Vault</span>
            <h2>Words in Context</h2>
            <p class="muted">High-frequency Digital SAT words. Learn them on flashcards, then prove them in real test format. Get a word right in a sprint on two different days to master it.</p>
            <div class="tier-tiles">
              ${[1, 2, 3].map((t) => `<div class="tier-tile t${t}"><b>${sum[t]}</b><span>${TIERS[t].icon} ${TIERS[t].name}</span></div>`).join("")}
            </div>
            <p class="muted small">${sum.seen} of ${sum.total} words discovered</p>
            <div class="mode-grid">
              <button class="mode-btn" type="button" id="deck-start">
                <span class="mode-ico" aria-hidden="true">🃏</span>
                <b>Flashcards</b>
                <small>Flip &amp; swipe · ${cardBonusLeft ? `+${RULES.flashcardSparks} ⚡ per Got It` : "today's card Sparks earned"}</small>
              </button>
              <button class="mode-btn primary" type="button" id="sprint-start">
                <span class="mode-ico" aria-hidden="true">⚡</span>
                <b>${bonusLeft ? "Daily 5-Word Sprint" : "Another sprint"}</b>
                <small>${bonusLeft ? `+${RULES.sprintSparks} ⚡ bonus` : "today's bonus is done"}</small>
              </button>
            </div>
            <button class="mode-btn derby-btn" type="button" id="derby-start">
              <span class="mode-ico" aria-hidden="true">🏇</span>
              <span><b>SAT Vocabulary Derby</b><small>Advanced words, 7 rivals, real bets. Wins pay ×1.5.</small></span>
            </button>
            <p class="muted small">+${RULES.sparksPerCorrect} ⚡ per correct sprint word · +${RULES.masterySparks} ⚡ when a word reaches 👑 Master</p>
          </section>
          <section class="panel">
            <h2>Your words</h2>
            ${seenWords.length ? `<ul class="word-list">${seenWords.map((w) => `
              <li><details>
                <summary>${tierBadge(wordState(p, w.id).tier)} <b>${esc(w.word)}</b> <small>${esc(w.pos)}</small>${wordState(p, w.id).review ? ' <span class="fc-flag">🔁 Review</span>' : ""}</summary>
                <p>${esc(w.definition)}</p>
                <p class="muted small">≈ ${w.synonyms.map(esc).join(", ")} · ≠ ${w.antonyms.map(esc).join(", ")}</p>
                <p class="muted small">🌱 Root: ${esc(w.root)}</p>
              </details></li>`).join("")}</ul>`
              : '<p class="muted">Words you practice show up here with their tier. Open the flashcards or start a sprint to discover your first words.</p>'}
          </section>
        </div>`;
      container.querySelector("#sprint-start").addEventListener("click", startSprint);
      container.querySelector("#deck-start").addEventListener("click", startDeck);
      container.querySelector("#derby-start").addEventListener("click", () => { sprint = null; deck = null; derby.open(); });
    }

    // ---------- Flashcards ----------
    function startDeck() {
      ctx.sfx.play("tap");
      closeDrawer();
      sprint = null;
      deck = { ids: drawDeck(P()), i: 0, flipped: false, got: 0, later: 0, earned: 0, requeued: new Set(), busy: false };
      render();
      container.scrollTop = 0;
      container.querySelector("#fc")?.focus({ preventScroll: true });
    }

    // The word in its passage with your cast, highlighted where it belongs.
    function contextSentence(w) {
      return ctx.fill(w.text)
        .replace("______", `<b class="fc-hl">${esc(w.word)}</b>`)
        .replace(/\[\[([^\]]+)\]\]/, '<b class="fc-hl">$1</b>');
    }

    function renderDeck() {
      if (deck.i >= deck.ids.length) return finishDeck();
      const w = BY_ID[deck.ids[deck.i]];
      const st = wordState(P(), w.id);
      const pays = st.cardDay !== ctx.todayKey();
      const list = (xs) => xs.map(esc).join(" · ");
      container.innerHTML = `
        <div class="stack vault deck">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="deck-quit">✕ End review</button>
            <span class="muted small" aria-live="polite">Card ${deck.i + 1} of ${deck.ids.length}</span>
          </div>
          <div class="fc-stage">
            <div class="fc-drag">
              <span class="fc-stamp got" aria-hidden="true">Got It ✓</span>
              <span class="fc-stamp later" aria-hidden="true">↺ Later</span>
              <button type="button" class="fc${deck.flipped ? " flipped" : ""}" id="fc"
                aria-label="${esc(w.word)}. ${deck.flipped ? "Showing the definition. Tap to show the word." : "Tap to flip for the definition."}">
                <span class="fc-inner">
                  <span class="fc-face fc-front"${deck.flipped ? ' aria-hidden="true"' : ""}>
                    <span class="fc-top">${tierBadge(st.tier)}${st.review ? '<span class="fc-flag">🔁 Review</span>' : ""}</span>
                    <span class="fc-word">${esc(w.word)}</span>
                    <span class="fc-pos">${esc(w.pos)}</span>
                    <span class="fc-context">${contextSentence(w)}</span>
                    <span class="fc-hint" aria-hidden="true">Tap to flip ↻</span>
                  </span>
                  <span class="fc-face fc-back"${deck.flipped ? "" : ' aria-hidden="true"'}>
                    <span class="fc-top"><span class="fc-word sm">${esc(w.word)}</span><span class="fc-pos">${esc(w.pos)}</span></span>
                    <span class="fc-def">${esc(w.definition)}</span>
                    <span class="fc-row"><span class="label-sm">Synonyms</span><span>${list(w.synonyms)}</span></span>
                    <span class="fc-row"><span class="label-sm">Antonyms</span><span>${list(w.antonyms)}</span></span>
                    <span class="fc-row"><span class="label-sm">🌱 Root</span><span>${esc(w.root)}</span></span>
                  </span>
                </span>
              </button>
            </div>
          </div>
          <div class="fc-actions">
            <button class="btn ghost" type="button" id="fc-later">↺ Review Later</button>
            <button class="btn" type="button" id="fc-got">✓ Got It${pays ? ` <small>+${RULES.flashcardSparks} ⚡</small>` : ""}</button>
          </div>
          <p class="muted small fc-help">Swipe → Got It · ← Review Later<span class="kbd-hint"> · Space flips</span></p>
        </div>`;
      container.querySelector("#deck-quit").addEventListener("click", () => { deck = null; render(); });
      container.querySelector("#fc-got").addEventListener("click", () => decide(true));
      container.querySelector("#fc-later").addEventListener("click", () => decide(false));
      wireSwipe();
    }

    function flip() {
      if (!deck || deck.busy) return;
      deck.flipped = !deck.flipped;
      const fc = container.querySelector("#fc");
      if (!fc) return;
      const w = BY_ID[deck.ids[deck.i]];
      fc.classList.toggle("flipped", deck.flipped);
      fc.querySelector(".fc-front").toggleAttribute("aria-hidden", deck.flipped);
      fc.querySelector(".fc-back").toggleAttribute("aria-hidden", !deck.flipped);
      fc.setAttribute("aria-label", `${w.word}. ${deck.flipped ? "Showing the definition. Tap to show the word." : "Tap to flip for the definition."}`);
      ctx.sfx.play("tap");
    }

    // Drag the card sideways; past the threshold it flies off and counts as a
    // choice. A short tap flips it instead. Vertical scrolling is left alone.
    function wireSwipe() {
      const drag = container.querySelector(".fc-drag");
      const fc = container.querySelector("#fc");
      const THRESHOLD = 90;
      let startX = 0;
      let startY = 0;
      let dx = 0;
      let active = false;
      let moved = false;
      const paint = () => {
        drag.style.transform = dx ? `translateX(${dx}px) rotate(${dx / 18}deg)` : "";
        drag.style.setProperty("--got", String(Math.max(0, Math.min(1, dx / THRESHOLD))));
        drag.style.setProperty("--later", String(Math.max(0, Math.min(1, -dx / THRESHOLD))));
      };
      fc.addEventListener("click", () => {
        if (moved) { moved = false; return; }
        flip();
      });
      drag.addEventListener("pointerdown", (e) => {
        if (deck.busy || (e.pointerType === "mouse" && e.button !== 0)) return;
        active = true;
        moved = false;
        startX = e.clientX;
        startY = e.clientY;
        dx = 0;
        drag.classList.add("dragging");
      });
      drag.addEventListener("pointermove", (e) => {
        if (!active) return;
        const mx = e.clientX - startX;
        const my = e.clientY - startY;
        if (!moved && Math.abs(mx) < 8) return;
        if (!moved && Math.abs(my) > Math.abs(mx)) { active = false; drag.classList.remove("dragging"); return; } // a scroll
        if (!moved) drag.setPointerCapture?.(e.pointerId);
        moved = true;
        dx = mx;
        paint();
      });
      const end = () => {
        if (!active) return;
        active = false;
        drag.classList.remove("dragging");
        if (Math.abs(dx) >= THRESHOLD) decide(dx > 0);
        else { dx = 0; paint(); }
      };
      drag.addEventListener("pointerup", end);
      drag.addEventListener("pointercancel", end);
    }

    function decide(gotIt) {
      if (!deck || deck.busy) return;
      deck.busy = true;
      const id = deck.ids[deck.i];
      const res = reviewCard(P(), id, gotIt, ctx.todayKey());
      if (gotIt) deck.got += 1;
      else {
        deck.later += 1;
        // Comes back once at the end of this deck.
        if (!deck.requeued.has(id)) { deck.requeued.add(id); deck.ids.push(id); }
      }
      if (res.sparks) { ctx.earn(res.sparks); deck.earned += res.sparks; }
      ctx.sfx.play(gotIt ? "correct" : "tap");
      if (gotIt) ctx.sfx.buzz(50);
      ctx.save();
      ctx.renderHud(res.sparks ? ["sparks"] : []);
      const advance = () => {
        if (!deck) return;
        deck.i += 1;
        deck.flipped = false;
        deck.busy = false;
        renderDeck();
        container.querySelector("#fc")?.focus({ preventScroll: true });
      };
      const drag = container.querySelector(".fc-drag");
      if (drag && !reducedMotion()) {
        drag.style.transform = "";
        drag.classList.add(gotIt ? "fly-right" : "fly-left");
        setTimeout(advance, 240);
      } else advance();
    }

    function finishDeck() {
      const flagged = WORDS.filter((w) => wordState(P(), w.id).review).length;
      if (deck.earned) ctx.sfx.play("complete");
      container.innerHTML = `
        <div class="stack vault">
          <section class="panel sprint-summary">
            <span class="complete-star" aria-hidden="true">🃏</span>
            <h2>Deck done!</h2>
            <p class="muted">${deck.got} got it · ${deck.later} to review · +${deck.earned} ⚡ Sparks</p>
            ${flagged ? `<p class="muted small">${flagged} word${flagged === 1 ? " is" : "s are"} flagged 🔁. Your next sprint serves them first.</p>` : ""}
            <div class="stack">
              <button class="btn wide" type="button" id="deck-sprint">Test yourself: Daily Sprint</button>
              <button class="btn ghost wide" type="button" id="deck-again">New deck</button>
              <button class="btn ghost wide" type="button" id="deck-home">Back to the Vault</button>
            </div>
          </section>
        </div>`;
      deck = null;
      container.querySelector("#deck-sprint").addEventListener("click", startSprint);
      container.querySelector("#deck-again").addEventListener("click", startDeck);
      container.querySelector("#deck-home").addEventListener("click", render);
      container.scrollTop = 0;
    }

    // Arrow keys and Space drive the deck while the Vocab tab is showing.
    document.addEventListener("keydown", (e) => {
      if (!deck || drawer || container.hidden || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.target.closest("input, select, textarea") || document.querySelector('[aria-modal="true"]')) return;
      if (e.key === "ArrowRight") { e.preventDefault(); decide(true); }
      else if (e.key === "ArrowLeft") { e.preventDefault(); decide(false); }
      else if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); flip(); }
    });

    function startSprint() {
      ctx.sfx.play("tap");
      deck = null;
      sprint = { ids: drawSprint(P(), ctx.todayKey()), i: 0, results: [], earned: 0, picked: null, order: null };
      render();
      container.scrollTop = 0;
    }

    function renderCard() {
      const id = sprint.ids[sprint.i];
      const w = BY_ID[id];
      const st = wordState(P(), id);
      if (!sprint.order) sprint.order = shuffle([0, 1, 2, 3], Math.random);
      const answered = sprint.picked !== null;
      const passage = ctx.fill(w.text)
        .replace("______", answered ? `<mark class="fill-in">${esc(w.choices[w.answer])}</mark>` : '<span class="blank" role="img" aria-label="blank"></span>')
        .replace(/\[\[([^\]]+)\]\]/, '<u class="target">$1</u>');
      container.innerHTML = `
        <div class="stack vault">
          <div class="sprint-top">
            <button class="linkbtn" type="button" id="sprint-quit">✕ End sprint</button>
            <div class="sprint-dots" aria-label="Word ${sprint.i + 1} of ${sprint.ids.length}">
              ${sprint.ids.map((_, k) => `<i class="${k < sprint.i ? (sprint.results[k].correct ? "ok" : "no") : k === sprint.i ? "now" : ""}"></i>`).join("")}
            </div>
          </div>
          <section class="card-inner bb vocab-card">
            <div class="bb-top">
              <span class="bb-num">${sprint.i + 1}</span>
              <span class="bb-meta">Words in Context</span>
              ${tierBadge(st.tier)}
            </div>
            <div class="bb-passage"><p class="passage">${passage}</p></div>
            <p class="bb-stem">${esc(stemFor(w))}</p>
            <ol class="choices">
              ${sprint.order.map((ci, pos) => {
                let cls = "";
                if (answered) cls = ci === w.answer ? "right" : ci === sprint.picked ? "wrong" : "dim";
                return `<li><button class="choice ${cls}" type="button" data-ci="${ci}" ${answered ? "disabled" : ""}
                  aria-label="(${"ABCD"[pos]}) ${esc(w.choices[ci])}">
                  <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span><span class="txt">${esc(w.choices[ci])}</span>
                </button></li>`;
              }).join("")}
            </ol>
            <div class="fb-slot">${answered ? inlineFeedback(w) : ""}</div>
          </section>
        </div>`;
      container.querySelector("#sprint-quit").addEventListener("click", () => { closeDrawer(); sprint = null; render(); });
      container.querySelectorAll(".choice:not(:disabled)").forEach((b) => {
        b.addEventListener("pointerdown", () => ctx.sfx.play("tap"));
        b.addEventListener("click", () => answer(Number(b.dataset.ci)));
      });
      container.querySelector("#vocab-next")?.addEventListener("click", next);
      container.querySelector("#vocab-why")?.addEventListener("click", () => openDrawer(w, sprint.results[sprint.i]));
    }

    function inlineFeedback(w) {
      const r = sprint.results[sprint.i];
      const move = r.tierBefore !== r.tierAfter ? ` · ${TIERS[r.tierBefore].icon}→${TIERS[r.tierAfter].icon}` : "";
      return `
        <div class="feedback ${r.correct ? "ok" : "no"}">
          <h3>${r.correct ? "Correct!" : "Not quite"}<small>${r.correct ? `+${r.sparks} ⚡${move}` : `Back to ${TIERS[1].icon} Novice`}</small></h3>
          ${r.correct && r.spacedOut ? `<p class="muted small">Already moved up today. Come back tomorrow to advance “${esc(w.word)}.”</p>` : ""}
          <button class="linkbtn why-btn" type="button" id="vocab-why">🔎 Word breakdown</button>
        </div>
        <button class="btn wide next-row" type="button" id="vocab-next">${sprint.i + 1 < sprint.ids.length ? "Next word →" : "Finish sprint"}</button>`;
    }

    function answer(ci) {
      if (sprint.picked !== null) return;
      const id = sprint.ids[sprint.i];
      const w = BY_ID[id];
      const correct = ci === w.answer;
      const res = grade(P(), id, correct, ctx.todayKey());
      sprint.picked = ci;
      sprint.results[sprint.i] = { id, correct, ...res };
      sprint.earned += res.sparks;
      if (res.sparks) ctx.earn(res.sparks);
      ctx.sfx.play(correct ? "correct" : "wrong");
      if (correct) ctx.sfx.buzz(50);
      ctx.recordAnswer(correct);
      ctx.save();
      ctx.renderHud(res.sparks ? ["sparks"] : []);
      renderCard();
      if (res.masteredNow) {
        ctx.sfx.play("combo");
        ctx.celebrate("👑", `“${w.word}” mastered!`, `+${RULES.masterySparks} ⚡ Sparks`);
      }
      if (!correct) openDrawer(w, sprint.results[sprint.i]);
      else container.querySelector("#vocab-next")?.focus({ preventScroll: true });
    }

    function next() {
      closeDrawer();
      if (sprint.i + 1 < sprint.ids.length) {
        sprint.i += 1;
        sprint.picked = null;
        sprint.order = null;
        renderCard();
        container.scrollTop = 0;
        return;
      }
      finish();
    }

    function finish() {
      const bonus = finishSprint(P(), ctx.todayKey());
      if (bonus) ctx.earn(bonus);
      sprint.earned += bonus;
      ctx.save();
      ctx.renderHud(bonus ? ["sparks"] : []);
      const right = sprint.results.filter((r) => r.correct).length;
      if (bonus) {
        ctx.sfx.play("complete");
        ctx.celebrate("📚", "Sprint complete!", `+${bonus} ⚡ daily sprint bonus`);
      }
      const rows = sprint.results.map((r) => {
        const w = BY_ID[r.id];
        return `<li class="sum-row ${r.correct ? "ok" : "no"}">
          <span aria-hidden="true">${r.correct ? "✓" : "✗"}</span>
          <b>${esc(w.word)}</b>
          <span class="muted small">${TIERS[r.tierBefore].icon} → ${TIERS[r.tierAfter].icon} ${TIERS[r.tierAfter].name}</span>
        </li>`;
      }).join("");
      container.innerHTML = `
        <div class="stack vault">
          <section class="panel sprint-summary">
            <span class="complete-star" aria-hidden="true">${right === sprint.ids.length ? "🏆" : "📚"}</span>
            <h2>${right} of ${sprint.ids.length} correct</h2>
            <p class="muted">+${sprint.earned} ⚡ Sparks this sprint${bonus ? ` (including the +${bonus} daily bonus)` : ""}</p>
            <ul class="sum-list">${rows}</ul>
            <div class="stack">
              <button class="btn wide" type="button" id="sprint-again">Another sprint</button>
              <button class="btn ghost wide" type="button" id="sprint-home">Back to the Vault</button>
            </div>
          </section>
        </div>`;
      sprint = null;
      container.querySelector("#sprint-again").addEventListener("click", startSprint);
      container.querySelector("#sprint-home").addEventListener("click", render);
      container.scrollTop = 0;
    }

    // Slide-up breakdown: root, definition, context clue, every choice explained.
    function openDrawer(w, result) {
      closeDrawer();
      const correct = result && result.correct;
      drawer = document.createElement("div");
      drawer.className = "sheet-backdrop explain-backdrop";
      drawer.innerHTML = `
        <div class="sheet explain vocab-explain ${correct ? "ok" : "no"}" role="dialog" aria-modal="true" aria-labelledby="vx-title">
          <div class="grabber" aria-hidden="true"></div>
          <div class="explain-head">
            <span class="verdict-icon" aria-hidden="true">${correct ? "✓" : "✗"}</span>
            <div><h2 id="vx-title">${esc(w.word)}</h2><small>${esc(w.pos)}${correct ? "" : ` · back to ${TIERS[1].icon} Novice`}</small></div>
            <button class="linkbtn" type="button" data-close>Close</button>
          </div>
          <p class="vx-def">${esc(w.definition)}</p>
          <div class="vx-grid">
            <div class="vx-box"><span class="label-sm">🌱 Root</span><p>${esc(w.root)}</p></div>
            <div class="vx-box"><span class="label-sm">🔎 Context clue</span><p>${ctx.fill(w.clue, undefined, false)}</p></div>
          </div>
          <ol class="why-list">
            ${sprint && sprint.order ? sprint.order.map((ci, pos) => ({ ci, pos, rank: ci === w.answer ? 0 : ci === sprint.picked ? 1 : 2 }))
              .sort((a, b) => a.rank - b.rank || a.pos - b.pos)
              .map(({ ci, pos }) => `
                <li class="why-row ${ci === w.answer ? "right" : ci === sprint.picked ? "wrong" : "other"}">
                  <span class="letter" aria-hidden="true">${"ABCD"[pos]}</span>
                  <div class="why-body"><b>${esc(w.choices[ci])}</b>
                    ${ci === w.answer ? '<span class="why-tag">Correct answer</span>' : ci === sprint.picked ? '<span class="why-tag">Your answer</span>' : ""}
                    <p>${ctx.fill(w.notes[ci], undefined, false)}</p></div>
                </li>`).join("") : ""}
          </ol>
          <button class="btn wide" type="button" data-next>${sprint && sprint.i + 1 < sprint.ids.length ? "Next word →" : "Finish sprint"}</button>
        </div>`;
      document.body.append(drawer);
      drawer.addEventListener("mousedown", (e) => { if (e.target === drawer) closeDrawer(); });
      drawer.querySelector("[data-close]").addEventListener("click", closeDrawer);
      drawer.querySelector("[data-next]").addEventListener("click", next);
      document.addEventListener("keydown", drawerKeys, true);
      drawer.querySelector("[data-next]").focus({ preventScroll: true });
    }

    function closeDrawer() {
      if (!drawer) return;
      document.removeEventListener("keydown", drawerKeys, true);
      drawer.remove();
      drawer = null;
    }

    function drawerKeys(e) {
      if (!drawer) return;
      if (e.key === "Escape") { e.preventDefault(); closeDrawer(); }
      else if (e.key === "Tab") {
        const items = [...drawer.querySelectorAll("button")];
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
        else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
      }
      e.stopPropagation();
    }

    // busy: a sprint or deck is in progress, so background re-renders should wait.
    return {
      render,
      openDerbyStable: () => { sprint = null; deck = null; derby.openStable(); },
      isOpen: () => Boolean(drawer),
      busy: () => Boolean(sprint || deck || derby.racing()),
    };
  }

  SW.vocab = { WORDS, TIERS, RULES, emptyProgress, drawSprint, drawDeck, grade, reviewCard, flag, finishSprint, summary, mergeProgress, mount };
})();
