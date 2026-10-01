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
    const fresh = shuffle(states.filter((x) => !x.s.seen), rand);
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
      .sort((a, b) => rank(a.s) - rank(b.s) || (rank(a.s) === 1 ? a.s.tier - b.s.tier : 0))
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
              <span><b>Vocab Derby</b><small>Bet Sparks, race 5 rivals to the finish. Wins pay 2×.</small></span>
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
    return { render, isOpen: () => Boolean(drawer), busy: () => Boolean(sprint || deck || derby.racing()) };
  }

  SW.vocab = { WORDS, TIERS, RULES, emptyProgress, drawSprint, drawDeck, grade, reviewCard, flag, finishSprint, summary, mergeProgress, mount };
})();
