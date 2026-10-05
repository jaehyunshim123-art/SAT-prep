# SatWizz

A mobile-first, gamified Digital SAT grammar and vocabulary website. You work through a 9-chapter grammar curriculum, built so a student scoring around 1000 can start from the basics, from a Dashboard: learn each chapter in a snap-scrolling feed of Digital SAT-style questions, then pass its 10-question **Review for Understanding** (7/10, opens after you get more than half of the chapter right) to unlock the next. The Vocab Vault has 3D flashcards, sprints and Vocab Fishing. You race your unit's grammar questions in the Derby and spend Sparks in the Shop. Daily and friend streaks and live leaderboards keep you coming back.

- **Header (every screen):** ⚡ **Spark balance** (new players start with **50**), a **❓ Help** button next to it, 🔥 **Lock In Streak**, and the 🧠 **Focus Meter** (0–100%). On phones the wordmark shrinks to a "W" badge so everything fits; at 340px and below the cloud/Save button moves to Profile (tap the avatar).
- **Bottom nav, five tabs:**
  - 🏠 **Dashboard** ("Home" on phones): chapter select 1–9. Each chapter card opens **Learn & practice** (the lesson and question feed), a **Practice set** (10) or the **Review for Understanding** test (10). After every set the **Diagnostic** screen opens.
  - 📚 **Vocab Vault:** flashcards, sprints and 🎣 Vocab Fishing.
  - 🐎 **Derby:** a grammar horse race on your unit.
  - 🛍️ **Shop.**
  - 🎭 **Profile:** three sub-tabs, **Edit Profile** · **Settings** · **Leaderboard**.

  Views fade in as you switch.

The whole app is also built as **one self-contained `dist/index.html`** (see below).

## Question format

Every card follows the Digital SAT (Bluebook) layout:
- a numbered header;
- a short passage (1–3 sentences) with either a blank `______` or an underlined segment;
- the official College Board question stem;
- four choices with circled letters **A–D**. Screen readers announce each as "(A) …".

The stems live in `SatWizz.STEMS` in `js/questions.js`. `SatWizz.stemFor(q)` picks one: a question's own `stem` if it has one, then the transition stem for `kind: "transition"`, then the Standard English stem for a blank or an underline.

## Curriculum

**Nine chapters, in this order, built for a gentle start.** Chapter 1 teaches the basics (subject, verb, complete sentence) and defines every term the later chapters use: **independent clause (IC)**, **dependent clause (DC)**, **fragment** and **FANBOYS**. `scripts/validate-content.js` fails if a lesson uses IC, DC or FANBOYS before a lesson has defined it.

Every chapter runs **easy → hard**:
1. **Easy starters** (`js/curriculum/basics.js`, level 1): 8–12 short, everyday sentences with plain-English explanations, in teaching order. This file also holds the plain-English lesson each chapter shows.
2. **Extra practice** (`js/curriculum/chN.js` and `js/curriculum/sentences.js`, level 2), shuffled.
3. **SAT-style passages** (`clause-derby/src/chN.js`, shared with Clause Derby, level 3), shuffled, including each chapter's benchmark.

After the core set, the feed keeps going with generated questions (chapters 2–8).

**Names come from your cast.** Every person in a question is a cast slot:
- `{{NAME_1}}`–`{{NAME_3}}` for names;
- `{{NAME_n_POSS}}` / `{{NAME_n_OBJ}}` for his/her/their and him/her/them.

**Every cast has 8 people**, and each question uses 3 of them in its slots. The pick is seeded per player and per question, so a given question always shows the same people, but different questions bring in different characters. Without a purchased pack, questions use the free generic **Everyday** cast (John, Jane, Sam, Maya, Leo, Priya, Diego, Alex). Unlocking a **Character Cast** in the Shop swaps in that pack's names. For example, Football Stars puts Kofi, Inés and Rafael into the questions.

**Every cast is original.** The six Character Casts (Wizard Academy, Football Stars, Hoops Stars, Anime Heroes, Superhero Squad, Pop Stars) use made-up characters, never real people or characters from books, films, shows, anime or games. `scripts/validate-content.js` fails on known real or franchise names. Cast ids never change, so a pack bought under an old name stays unlocked.

Facts tied to real historical people (radium, penicillin) were reworded to stay accurate with any name. Novel and album titles are invented.

Each chapter opens with an **Explanation Pause** lesson card in plain English (key terms in bold): the chapter's rules, ✓/✗ pattern chips and a worked example. After each answer a **slide-up drawer** shows the rule being tested, why the right answer works and why every other choice fails. A wrong answer comes back two cards later marked "↺ Try again".

- **The test opens after a majority:** a chapter's **Review for Understanding** test stays locked until you've answered **more than half** of the chapter's questions correctly (17 of 32 in Chapter 1). The Dashboard card says how many more you need. Practice sets are always open.
- **Unlocking:** score **7/10 (70%)** or better on the test to unlock the next chapter. Practice alone doesn't unlock chapters; chapters you had already unlocked stay open.
- **Complete:** a chapter is complete once every question has been answered correctly. The first completion earns **+50 ⚡**.

| # | Chapter | What it covers | Questions |
|---|---|---|---|
| 1 | Complete Sentences: Subjects, Verbs & Fragments | Subject + verb + complete thought; -ing and "to" words aren't verbs; skipping describing parts; dependent words. Defines IC, DC, fragment and FANBOYS | 12 starters + 20 |
| 2 | Joining Sentences: Periods, Semicolons & FANBOYS | Period, semicolon, or comma + FANBOYS between two ICs; comma splices and run-ons; however/therefore; DC, IC | 8 + 45 + benchmark |
| 3 | Subject-Verb Agreement | Singular vs. plural; crossing out the middle; and / each / there is; the **3:1 / 2:1 shortcuts** | 8 + 45 |
| 4 | Verb or Not a Verb? | Does the sentence already have its main verb? Main verbs vs. -ing / -ed / "to" describers | 8 + 45 + benchmark |
| 5 | Verb Tenses: Matching the Time | Time clues: past, present, future, present perfect (since…), past perfect (before another past event) | 8 + 45 |
| 6 | Transitions: How Ideas Connect | Opposite, adding on, cause → result, example, time order | 8 + 45 + benchmark |
| 7 | Semicolons, Colons & Dashes | Semicolon = period; colon after a complete sentence; dash pairs | 8 + 45 + benchmark |
| 8 | Extra Information: Appositives & Commas | The cover-up test; comma and dash pairs; no commas for needed info or titles | 8 + 45 |
| 9 | Modifiers, Parallelism & Pronouns | Dangling modifiers, matching lists, its/it's, their/there/they're, possessives | 8 + 30 |

**Internal ids vs. chapter numbers.** Chapter numbers come from the order in `CURRICULUM_PLAN` (`js/questions.js`). Each chapter's `id` never changes, so saved progress and synced accounts keep working: Complete Sentences is id 10, and Chapters 2–9 are ids 1–8.

**Saves keep their progress** (save version 4): every chapter a player had stays open, the new Chapter 1 opens too, and the old bonus "Pronouns & Possessives" chapter (id 9) merges into Chapter 9 (id 8), including right answers and test scores. Saves from the even older 10-chapter course still migrate first (old chapters 2–10 → ids 1–9).

**Ratio shortcuts** (taught in Chapters 3 and 4, where the answer choices are verbs):
- **3:1:** if three choices are plural verbs and one is singular (or the reverse), the odd one out is the answer.
- **2:1:** in a verb spot, cross out the choice that isn't a verb. Of the three left, two match in number and the odd one is the answer.

Every question where a shortcut applies is tagged, and `scripts/validate-content.js` checks the shortcut really leads to the right answer. The drawer shows a shortcut chip on those questions.

**Chapter drawer.** Tap the chapter bar above the feed to see every chapter's status (✓ done, ▶ current, 🔒 locked until the previous test is passed) and progress. "← Dashboard" next to it goes back. You can jump to any unlocked chapter. Mixed review (missed questions first) opens once you finish a chapter.

## Dashboard, tests and the Diagnostic screen

- **Review for Understanding (10 questions):** the chapter's **benchmark** question first (where it has one), then 5 core questions (missed and not-yet-right first), then 4 fresh generated ones from the no-repeat stream, so every retake is different. One question at a time (A–D, or keys A–D / 1–4, → and ←), number dots to jump around, and **no answers shown until you submit**. It opens once more than half of the chapter is right. **7/10 passes** and unlocks the next chapter (+50 ⚡ the first time).
- **Practice set (10 questions):** this chapter's missed questions first, then fresh ones. Same screens; it never unlocks anything.
- **Answers count:** each answer counts toward the daily goal, stats, the missed list, Sparks (+10 per right answer) and Focus (misses, rushing under 3s, 2 in a row).
- **Diagnostic Feedback screen:** opens automatically on submit. A **PASS / FAIL** banner with the score %, then an item-by-item review: the passage with the right answer filled in, **your answer vs. the correct one**, the **rule's name** (e.g. "Terminal Boundary Rule", "Restrictive Title Rule", "Dash Pair Rule") and a short explanation (the rule line, then why the right answer works; on a miss, why your choice fails). Buttons: Retake (new questions), the next chapter, Dashboard.
- **Saved** in `localStorage` (`satwizz.v1`): `tests[ch]` and `practiceSets[ch]` = `{ best, last, n, passed, attempts, at }`.
- **Rule names** come from `js/curriculum/rules.js` (`SatWizz.ruleName`, a skill → rule table per chapter; a question's own `ruleName` wins). `validate-content.js` checks every question gets a named rule.
- **Benchmarks** (one "challenge" question per chapter, `ClauseBank.B(ruleName, q)` in `clause-derby/src`). Each is an **original passage** modeled on the rule a sample question tested, with no wording copied from published test items and no franchise characters. Every one has cast slots, so it shows generic names until a pack is bought and the pack's names after. `validate-clause-bank.js` enforces both: it rejects known copied or franchise wording and requires a `{{NAME_n}}` slot in every benchmark.

  | Ch | Benchmark (original passage) | Answer |
  |---|---|---|
  | 1 | Art historian {{NAME_1}} on village pottery: borders…; paintings of foxes, herons, and other animals; and copper glazes | `scene; paintings` (a list whose items contain commas takes semicolons) |
  | 2 | How {{NAME_1}} and {{NAME_2}} should say the invented villain "Lord Malgrecourt" | `is` |
  | 3 | Stage actor {{NAME_1}}'s lead in *The Lantern Keeper*, a play that ___ "changed what audiences expected…" | `critic {{NAME_2}} claims` (a title right before a name takes no commas) |
  | 4 | A scanner in {{NAME_1}}'s favorite science-fiction series ___ a fighter's strength | `measures` |
  | 5 | Linguist {{NAME_1}}'s study of words that sound like their meaning | `Granted,` |
  | 6 | The Riverbend Festival of Music and Light, "or Riverfest, as {{NAME_1}} … called it—" | `Light—` (pairs with the closing dash) |
  | 7 | Fans of {{NAME_1}} and an invented re-recorded album | `Starlight Letters (Deluxe Edition),` |

- **Franchise-free questions:** questions that pointed at a franchise (web-shooters, a ninja village leader, a growth mushroom, a frozen-castle scene, a city guardian) were rewritten as everyday scenes; people in them are still cast slots.
- **`index.html#practice`** opens straight into the practice feed instead of the Dashboard.

## Question generator (`js/curriculum/gen/`)

Chapters 2–8 (ids 1–7) each have a generator that builds hundreds of questions in the style of the hand-written set. They are short narrative passages with cast slots for names and the pack's scenery (`{{LOCATION}}`, `{{EVENT}}`, `{{SKILL}}`), and every question has a rule line and a note for each choice.

| Ch | Questions | How they're built |
|---|---|---|
| 1 | ~380 | 32 hand-written clause pairs (contrast, result, addition, reason) × every legal joint (period, semicolon, comma + FANBOYS) × trap sets; mix-and-match practice scenes; DC, IC openers |
| 2 | ~540 | Subjects with prepositional-phrase traps; "along with" parentheticals; Each/One of; either/or and neither/nor; There is/are; compound subjects |
| 3 | ~580 | "Name, -ing…, verb" modifiers; "Title ______" appositive openers (the "player {{NAME_1}}, intending…" pattern); long subjects that need their main verb |
| 4 | ~440 | Time clues (last summer, since…, by the time…, next spring, by next June) × 25 verbs with all their forms |
| 5 | ~410 | 62 sentence pairs tagged contrast / result / example / addition / similarity × every fitting transition, with distractors only from relationships that don't fit |
| 6 | ~430 | Colon + list or explanation; no colon after a verb, "such as" or a preposition; dash pairs; semicolons between clauses and in lists with commas; closing commas |
| 7 | ~790 | "Name, a/an…," appositives; "The role Name" (essential); "Name, who…,"; "The students who…" (essential); one-of-a-kind nouns ("best friend, a…,") |

- **No repeats:**
  - Practice serves the core set first. After that, or whenever you reopen a finished chapter, the feed keeps going with generated questions ("Keep practicing: N fresh questions").
  - The Derby races on missed questions, then core ones you haven't gotten right, then generated ones.
  - Both step through the chapter's pool in your own shuffled order (`S.genCursor`), so nothing repeats until you've seen the whole pool.
- **Progress:** chapter progress counts the core set only.
- **Stable ids:** each id is a hash of the question's content, so missed-question lists survive updates.
- **Checks:** `node scripts/validate-content.js` runs the full checks on every generated question: one blank, 4 distinct choices, notes, the rule line, known placeholders, no duplicates and no template leftovers.

## Focus Meter (0–100%)

One meter, shown in the header and shared by Practice and the Derby (`js/focus.js`). It stays where you leave it between sessions.
- **Losing Focus:**
  - a wrong answer costs **25%**;
  - **rushing** costs **10%**: answering in under 3s in Practice, or under 1.5s in the Derby.
- **Restoring Focus:** **2 right answers in a row** (+25%), a **🧪 Focus Elixir** (500 ⚡, back to 100%), or the clock: **Focus recharges to 100% every hour** on its own (checked at start-up, every minute and when you come back to the tab; a toast says "🧠 Focus recharged"). An Elixir restarts the hour. The header's Focus tooltip shows "full recharge in N min". The standalone Derby has the same hourly recharge.
- **Effects:**
  - under 50%, open questions get an **orange outline**;
  - under 25%, a **red outline**, and the screen **shakes** on each miss.

  Question text is **never blurred or faded**, so it's always easy to read. With reduced motion turned on, there's no shake.
- **At 0% in Practice,** a **Focus Break** opens: the chapter's rules, then review questions until you get 2 right in a row. The Elixir skips it.
- **In the Derby,** missing Focus locks each question for up to 9s while the rivals keep running, plus 4s after a miss.

## Vocab Vault

The **Vocab Vault** tab (`js/vocab.js`) teaches **944 SAT words**: 511 core high-frequency words and 433 advanced ones (*equanimity, obdurate, perspicacious, sycophant, …*). New users see core words first; the Derby leads with advanced ones.

**Where the words come from.**
- **55 hand-built words** live in `js/vocab.js`, each with its own passage, 4 choices and a note for every choice.
- **The rest are in the word bank**, `js/vocab/bank-*.js`: five core files (A–Z) and four advanced ones. Each word is one line:

  ```
  word|pos|definition|synonyms|antonyms|root|sentence with ______ where the word goes
  ```

  `pos` is n, v, adj or adv. Lists are comma-separated. The sentence uses the word's base form and may use cast slots (`{{NAME_1}}`, `{{NAME_1_POSS}}`…), so it shows the applied cast like every other question. Never put "a"/"an" right before the blank.
- **`js/vocab.js` builds a full Vault word from each line, the same way every visit:**
  - 60% get the "blank" format (choose the word) and 40% the "meaning" format ("As used in the text, … most nearly means").
  - Three distractors are words of the same part of speech that aren't close in meaning (no shared synonyms or antonyms, no look-alike spellings). If a part of speech is too rare, the word uses the meaning format with any distractors.
  - Every choice gets a note.
  - Picking distractors takes about 40ms in total.
- **`node scripts/validate-content.js` checks every bank word:**
  - no "a/an" right before the blank, exactly one blank, and 4 distinct choices;
  - at least 2 synonyms and 1 antonym, with no "—" placeholders;
  - a known part of speech;
  - no duplicates within the bank or against the hand-built words.

  It also builds sample Derby questions and Fishing casts for each word.

**📖 Word bank.** The Vault home has a searchable list of every word. Search by word, meaning or synonym, filter All / Core / Advanced, and open any word for its definition, synonyms, antonyms, root and 🔊 pronunciation. "Your words" shows the first 60 words you've studied, with a "Show all" toggle.

**🃏 Flashcards.** A deck of 10 cards that flip in 3D.
- **Front:** the word, its part of speech and its context sentence, filled in with your cast and highlighted.
- **Back:** the definition, synonyms, antonyms and root breakdown.
- **Controls:** tap to flip. Swipe right or tap **✓ Mastered**, swipe left or tap **↺ Needs Review**. On a keyboard, Space flips and →/← choose.
- **Toggles:** the two buttons show the word's current status, and so does the chip on the card and in your word list.
- **Mastered** earns +5 ⚡, once per word per day.
- **Needs Review** brings the card back once at the end of the deck and flags the word.
- Flagged words lead the next deck and the next sprint. A sprint miss also flags a word, and a correct sprint answer or Mastered clears the flag.
- Flashcards don't change tiers: only sprints do.
- **🔊 Pronunciation:** the 🔊 button above the card (front or back) speaks the word with the browser's Web Speech API (en-US, a little slower than normal). It never flips the card; **P** speaks too. Words in your word list and the word on each Fishing cast have the button as well. It's hidden in browsers that can't speak.

**🎣 Vocab Fishing** (`js/fishing.js`). Hook the fish that carries the right definition.
- **A round is 8 casts.** Each cast shows a word (part of speech and context sentence), and 4 fish swim across the water, each carrying a definition. Tap the right fish, or press 1–4, before the 20s line runs out.
- **Rewards:**
  - a catch: **+5 ⚡**, and the word's review flag clears;
  - a wrong fish or no bite: the school scatters, the word is flagged 🔁, and the right fish is shown;
  - a perfect round: **+20 ⚡**.

  Catches count toward your daily goal.
- **Rods:**

  | Rod | Price | Perk |
  |---|---|---|
  | 🎋 Bamboo Rod | free | none |
  | 🎣 Steady Graphite | 500 ⚡ | fish swim 25% slower |
  | 🧵 Second-Chance Reel | 500 ⚡ | your first wrong hook each round doesn't scare the school off |
  | ✨ Golden Lure | 500 ⚡ | +2 ⚡ a catch |

- **Spots** set the scenery and which words bite:

  | Spot | Price | Words |
  |---|---|---|
  | 🪷 Village Pond | free | core words |
  | 🌫️ Misty Lake | 500 ⚡ | advanced words |
  | 🪸 Coral Reef | 500 ⚡ | every word, core and advanced |
  | 🌙 Moonlit Bay | 500 ⚡ | flagged words first |

- **Syncing:** gear and stats sync in `vocab_progress.fishing`.
- **Checks:** `scripts/validate-content.js` checks 2,200 generated casts. Each must have 4 distinct definitions and one right fish, and never a near-synonym as a distractor.

**⚡ Daily 5-Word Sprint.** Words-in-Context questions in two formats:
- 35 words are "fill the blank" (the most logical and precise word);
- 20 are "As used in the text, what does *X* most nearly mean?", with the word underlined.

- **Daily Sprint:** 5 cards. It serves flagged words first, then words due for review (lowest tier first), then new words, then mastered ones for review.
- **Spaced repetition:** 3 tiers, **Novice 🌱 → Practitioner ⚡ → Master 👑**. A correct answer moves a word up one tier, at most once per day, so reaching Master takes practice on separate days. A wrong answer drops the word back to Novice and slides up a breakdown with the definition, root word, context clue and a note on every choice.
- **Rewards:**
  - +5 ⚡ per correct sprint card (and per flashcard Mastered, once per word per day);
  - +25 ⚡ the first time a word reaches Master;
  - +20 ⚡ for finishing a sprint (once per day).

  Vocab answers also count toward your daily goal and give +5 XP each. They don't use Focus or combos.
- Progress syncs to `profiles.vocab_progress`. If both devices practiced a word, the newer answer wins.

## Grammar Derby

The **Derby** tab (`js/derby.js`) is a wager-based horse race on **grammar questions from the unit you're on**.
- **Your unit:** the race uses your current Practice chapter. A "Racing on" picker switches to any unlocked chapter.
- **Question order:** questions you missed come first, then ones you haven't got right yet, then the rest.
- **Counts as practice:** a right answer counts toward the chapter's progress. A miss goes on your missed list.
- **Flow:** an intro screen (the `=== 🐎 SATWIZZ GRAMMAR DERBY 🐎 ===` banner, rules, your unit, the field, your Focus) → **Start Derby** → place a bet → race → results with a grammar review (the sentence filled in, plus the rule).
- **The engine is generic:** a question source plugs in (`ctx.source`), and the standalone `derby/index.html` still races on vocabulary.
- **Betting:** bet real ⚡ Sparks (50, 100, 250 or 500) or take a Fun run.
  - The bet is taken at the gate, and a win pays it back **×1.5**.
  - No daily limit: bet on as many races as you can afford. Fun runs are always free.
  - Leaving mid-race forfeits the bet, after a confirm tap.
- **Field:** eight horses on a 5-step track. You are Galloping Lexicon. The seven rivals are **independent CPU players**.
  - **The race clock never pauses**: not while you read feedback, not if you switch tabs.
  - Each rival reads a question (13–17s), answers in its own time range at its own accuracy, and moves **live whether or not you answer**.
  - If you never answer, a rival wins in about 90 seconds. A rival that crosses the line while you're thinking wins.

  | Rival | Style | Answer time | Accuracy |
  |---|---|---|---|
  | Verbal Velocity | Fast & unsteady | 1–3s | 60% |
  | Grammar Galloper | Slow & precise | 5–8s | 85% |
  | Syntax Sprinter | Quick & solid | 2–4s | 66% |
  | Thesaurus Rex | Erratic | 1–7s | 68% |
  | Diction Dash | Balanced | 3–5s | 70% |
  | Rhetoric Rocket | Reckless | 1–2s | 54% |
  | Prose Pony | Careful | 6–9s | 95% |

- **Rivals race to win.** Each attempt picks a tactic from the race state, shown as a lane badge and in the commentary:
  - 🔥 **pushing the pace** (2+ steps behind the leader): reads ×0.8, answers ×0.7, −8% accuracy;
  - ⚡ **kicking for home** (one step from the line): answers ×0.8;
  - 🛡️ **guarding the lead** (out in front): +6% accuracy.
- **Your turns:** answer advanced questions (Words in Context, definition, synonym or antonym) while a ⏱ think timer runs.
  - **Right:** you gallop +1. **Wrong:** you're held back, and the word is flagged 🔁.
  - A **live commentary feed** (time-stamped, newest first) reports every rival answer as it happens, e.g. "0:17 Verbal Velocity rushed an answer in 2s and missed ✗". Lead changes and "one step from the line" warnings are announced.
- **🧠 Focus** is the header's Focus Meter, and it carries between races and into Practice.
  - A miss costs 25% and **locks your next question for 4s**; a rushed answer (under 1.5s) costs 10%.
  - Missing Focus locks every question for up to **9s** (at 0%) while the rivals keep running.
  - Two right answers in a row restore 25%. A **Focus Elixir** (500 ⚡) refills Focus and lifts the current lock.
- **Balance:** the rivals are tuned so you **break even at about 11.5s per question** (at 85% accuracy). CPU reading time is 13–17s, set by the source, and tuned by simulating the real-time race, including locks and about 2s spent reading feedback:

  | Your pace | Races won | At ×1.5 |
  |---|---|---|
  | 8s/question at 90% | ~95% | |
  | 10s at 85% | ~76% | |
  | 11.5s at 85% | ~63–67% | break-even |
  | 13s at 85% | ~56% | |
  | 15s at 80% | ~27% | |
  | 20s at 80% | ~3% | |

- **Results:** winner, payout, balance, Focus, race time, your average think time, final standings, and a **grammar review table** (each sentence with the right answer filled in, the rule, and ✓/✗, or — for a question you didn't answer before a rival won).
- **🛍️ Gear:** jockey silks, mounts, Focus Elixirs and Starting Bursts are sold in the Shop (and on the Derby's own Stable screen). Your silks color your lane and the field list, and your mount runs in your lane.
- **Practice and sync:** answers count toward the daily goal (+5 XP each). Stats, Focus, owned gear and Bursts sync in `vocab_progress.derby`.
- **Question checks:** `scripts/validate-content.js` builds 11,000 generated questions and checks each has 4 distinct choices and one defensible answer. Words close in meaning, or near-opposites, are never used as each other's distractors.

## SAT Wizz: Clause Derby (`clause-derby/index.html`)

A separate **grammar racing game** in one self-contained, dark-themed HTML file. Double-click it, or host the one file anywhere.

**Flow:** intro (`=== 🐎 SAT WIZZ: VOCAB DERBY 🐎 ===` banner, rules, **Start Game**) → chapter select → chapter rules → bet → live race → results and the **Post-Race Vault** → shop.

**Curriculum:** 7 chapters × 25 questions (175), in a research or narrative passage style. The bank uses cast placeholders, and this standalone game fills them with one generic cast (Alex, Jordan, Sam). Every question has a rule line and a note for each choice.

| Ch | Topic |
|---|---|
| 1 | Independent Clause Connectors & Sentence Boundaries |
| 2 | Subject-Verb Agreement |
| 3 | Verb vs. Non-Verb (appositive structure) |
| 4 | Verb Tenses & Aspect |
| 5 | Logical Transitions |
| 6 | Semicolons, Dashes & Colons |
| 7 | Appositives & Non-Essential Clauses |

- **Unlocking:** chapters unlock in order. Get 15 of 25 right in a chapter to open the next.
- **Naming rule:** people and character names are used freely, but franchise and brand titles are swapped for generic ones ("the league of heroes", "a digital power visor", a fictional conservatory and album).

**Race:** the same live engine as the Grammar Derby.
- Eight horses on a 5-step track. Seven CPU rivals read and answer on their own clocks: Verbal Velocity 1–3s at 60%, Grammar Galloper 5–8s at 85%, and five more profiles.
- The rivals switch tactics to win and can cross the line while you think. Commentary is live.
- Rival reading time is 20–26s for these longer passages, tuned by simulation:

  | Your pace | Races won |
  |---|---|
  | 10s/question at 90% | ~99% |
  | 15s at 85% | ~78% |
  | 20s at 80% | ~33% |
  | 25s at 75% | ~4% |

  Break-even at ×1.5 is about 16s at 84%.

**Focus (0–100%):**
- **Losses:** a miss costs −25%, and a slow answer (over 25s) costs −10%.
- **Restoring:** 2 right in a row give +25%, or a **Focus Elixir** (500 ⚡) refills Focus.
- **Locks:** lost Focus locks each question for up to 9s, plus 4s after a miss, while the rivals keep running.
- **Effects:** under 50% the question gets an orange outline; under 25% a red one, and the screen shakes on misses (not with reduced motion). Text is never blurred.

**Economy:**
- 2,500 ⚡ to start. Bets of 50/100/250/500 pay ×1.5.
- Jockey Skins cost 1,000, Custom Mounts 1,500, Focus Elixirs 500. Purchases need two taps.
- A 250 ⚡ daily stipend is available if you go broke.

**Saving:** balance, Focus, unlocked chapters, per-question results, gear and stats are kept in `localStorage` (`sat-wizz-clause-derby.v1`). With storage blocked, the game still plays; it just doesn't save.

**Source and build:** the source lives in `clause-derby/src/` (bank core, `ch1.js`…`ch7.js`, `app.js`, `styles.css`). The shared engine and sounds come from `js/derby.js` and `js/sfx.js`.

```sh
node scripts/validate-clause-bank.js   # 7×25 questions, answer keys, notes, banned titles, your example answers
node scripts/build-clause-derby.js     # → clause-derby/index.html
```

## Single-file build (`dist/index.html`)

The **whole SatWizz app** is also available as **one self-contained HTML file**: the header, all five tabs, the 345-question curriculum, the Vault (with Vocab Fishing), the Grammar Derby, the Shop and Profile (with Settings and the Leaderboard), with every style, script and icon inline.
- **Run locally:** double-click `dist/index.html`.
- **Host it:** upload it to any static host, together with `dist/privacy.html` and `dist/terms.html` (the build writes those too).

Progress saves in `localStorage` (`satwizz.v1`), as in the regular build: Sparks, Focus, unlocked chapters, purchases, streak and Vault progress. With storage blocked, the app still plays; it just doesn't save.

```sh
node scripts/build-single.js   # rebuild after changing index.html, css/ or js/
```

It reads the real `index.html` and inlines everything that loads locally (33 files, including the shared `clause-derby/src/` question sets). Three things stay outside the file:
- **Fonts:** Google Fonts are optional, and system fonts are used offline.
- **Accounts:** the **Supabase client** loads from its CDN. To enable accounts, cloud sync, leaderboards and friends, fill in `js/config.js` before building, as in the regular setup. Without keys, the app runs in guest mode.
- **Push:** **Lock In push alerts** need `sw.js` uploaded next to `index.html`, because browsers require a service worker to be its own file. In-app Lock In banners work without it. The web app manifest is left out (installing as an app needs separate files).

## Standalone Derby (`derby/index.html`)

The SAT Vocabulary Derby also ships as **one self-contained HTML file**, with all HTML, CSS and JavaScript inline. Use it in either of two ways:
- **Run locally:** double-click `derby/index.html`. No server is needed.
- **Host it:** upload that one file to any static host (GitHub Pages, Netlify, S3…).

It plays exactly like the in-app Derby:
- the intro screen and banner → **Start Derby** → bet → the live race against seven independent CPU rivals → results and review table → the Stable;
- the same 944 words, engine, tactics, Focus Meter and prices. It keeps its own Focus, separate from the app.

What differs in the standalone file:
- **Its own economy:** you start with **2,500 ⚡**. Wins pay ×1.5, with no daily betting limit.
  - If your balance drops below the minimum bet, the intro offers a **250 ⚡ stable stipend** once a day.
- **Saving:** balance, Focus, gear, Bursts and stats are saved in the browser's `localStorage` under `satwizz-derby.v1`. In private mode, or with storage blocked, the game still plays; it just doesn't save.
- **No sign-in, no network:** Google Fonts are optional, and the file falls back to system fonts offline.

The file is **generated** from the app's sources, so the two never drift apart. After changing `css/styles.css`, `js/themes.js`, `js/questions.js`, `js/focus.js`, `js/vocab.js`, `js/derby.js` or `js/sfx.js`, rebuild it:

```sh
node scripts/build-derby.js
```

## Gamification

- **Sparks ⚡.** You earn +10 per correct answer, +5 on every 3rd answer in a row, +50 per chapter (first time) and +50 for your daily goal.
- **Focus Meter 🧠.** 0–100%; see [Focus Meter](#focus-meter-0100) above.
- **Lock In Streak 🔥.** It grows each day you hit your goal (5, 10 or 20). **Aura Shields 💠** cover a missed day.
- **Shop.** **Character Casts cost 1,000 ⚡**; every other cosmetic costs **500 ⚡**. Items are in separate sections (jump links at the top):

  | Section | Items |
  |---|---|
  | 🏇 Jockey Skins | 4 Derby silks |
  | 🦄 Derby Mounts | 4 mounts |
  | 🎭 Character Casts (first) | 6 casts of 8 people each, **1,000 ⚡** each. Questions use generic names until you unlock one |
  | 🙂 Avatars | 6 rare profile pictures |
  | 🎣 Fishing Rods | 3 rods with perks |
  | 🌊 Fishing Spots | 3 spots with their own word pools |
  | 🧪 Focus Elixir | 500 ⚡, Focus back to 100% |
  | Power-ups | Starting Burst (500), Aura Shields (50, or 3 for 120), Combo Saver, Double-Spark Wager |

  Purchases need two taps. Anything you already own stays owned. Derby wins pay your bet back ×1.5.
- **Starting balance.** New players start with **50 ⚡** and earn the rest by practicing (+10 per right answer, +50 for the daily goal, +50 per chapter). Existing saves keep their balance. A fresh device that signs in to an account that has played takes the account's balance, so a new browser can't top up an account.
- **🏆 Trophy Case** (Profile → Trophy Case, `js/badges.js`). **50 accomplishments** in six categories: Curriculum (10), Volume (10), Streaks (7), Vocab (10), Derby (7) and Shop (6).
  - **Filters:** All, Curriculum, Volume, Streaks, Vocab, Derby, Shop, each with an earned/total count.
  - **Locked badges** show a progress bar and count ("7 / 10 flawless runs"); unlocked ones show the date.
  - **Recently unlocked** badges (last 7 days) glow and carry a NEW tag.
  - **Share** copies a short brag to the clipboard; **Wear title** shows it on your streak card.
  - **How they unlock:** every save runs one check of all 50, so progress from tests, the Vocab Vault, the Derby and the Shop all counts. Players with existing progress get what they've already earned on first run, with one toast instead of a celebration per badge. A "flawless run" is 10/10 on a test or practice set.

- **🌙 Light / dark mode.** The site opens in **dark mode** by default. Switch it with the ☀️/🌙 button on the Dashboard banner, or choose **Profile → Settings → Appearance**: 🌙 Dark, ☀️ Light, or 🖥️ Match device (follows the phone or computer, including when it switches). The choice is saved per device in `localStorage` (`satwizz.theme`), and a small script in `index.html` applies it before the first paint, so there's never a white flash. Question text stays sharp in both modes; low Focus shows as an orange or red outline.
- **Settings** (Profile → Settings): sound, vibration, appearance, push alerts, daily goal and reset. At the bottom, the dedication "In memory of Terry".
- **Sound & haptics.** Web Audio effects: a crisp tap, a correct chime, a wrong thud, a combo sparkle and a chapter fanfare. There's no audio file to load. `navigator.vibrate(50)` fires on correct answers and combo milestones. Both can be turned off under Profile → Settings.
- **Demo Mode.** Tap the SatWizz logo 5 times to unlock every chapter and max out Sparks for testing or demos. Your real progress is saved first and restored when you tap 5 times again. Nothing syncs or reaches the leaderboards while Demo Mode is on.

## Keyboard, Help and feedback

- **Keyboard (everywhere):** <kbd>A</kbd>–<kbd>D</kbd> or <kbd>1</kbd>–<kbd>4</kbd> answer the question on screen in practice, tests, Vocab sprints, the Focus Break review and the Derby. <kbd>Space</kbd> or <kbd>Enter</kbd> continues (the explanation drawer, the next question, test Next/Submit, the Derby's Next). <kbd>←</kbd>/<kbd>→</kbd> move through a test. <kbd>Esc</kbd> closes panels. <kbd>?</kbd> opens Help. On a focused button, Space/Enter press that button as usual. Space/Enter never buys anything (the Focus Elixir needs a click).
- **Hotkey hints:** on desktop (a mouse and a window at least 700px wide), each answer choice shows a small A–D keycap on its right. Phones don't show them.
- **❓ Help overlay** (header button or <kbd>?</kbd>): How to Play (Focus, Sparks, chapter unlocks, streaks, Vault, Trophy Case), a Keyboard Controls cheat sheet, and an SAT Grammar Rules cheat sheet (an accordion with each chapter's rules, filled in with your cast). <kbd>Esc</kbd> or ✕ closes it.
- **Suggest a Feature / Report a Bug:** a form in Help (also reachable from Profile → Settings → Help & feedback). Pick 💡 Feature idea or 🐞 Bug report, type, and Submit Feedback. Each entry is saved first to `localStorage` under `satwizz.feedback` (an array of `{ id, at, kind, text, view, sent }`). With Supabase set up, it's then sent to your `feedback` table ("Thanks! Your suggestion was sent to the SatWizz team."); offline, it waits and sends later. On a guest-only copy of the site it stays in the browser ("Thanks! Your suggestion has been saved locally.").

## Privacy Policy, Terms and account deletion

- **The documents:** [`js/legal.js`](js/legal.js) holds the Privacy Policy and Terms of Service (owner **SatWizz**, contact **jshim7892@gmail.com**, Indian law, last updated 1 October 2026). Edit the text there and change `UPDATED` when you do.
  - The Privacy Policy covers guests, account data, what other players see, the services used (Supabase in Tokyo, Google, Netlify, jsDelivr), retention, rights under India's DPDP Act, and the rule for under-18s.
  - The Privacy Policy also names a Grievance Officer (the contact email; complaints acknowledged within 24 hours and resolved within 15 days), the legal basis, the right to nominate, Do Not Track / Global Privacy Control, and how to clear local data.
  - The Terms cover parent permission, rules for what players post (names, character names, Lock In messages, feedback), play money with no cash value, acceptable use, the College Board trademark note, a copyright/trademark takedown address, other services, governing law and the usual legal clauses.
- **Where they open:** both open in an overlay inside the site. Links are in the Dashboard footer, at the bottom of ❓ Help, in Profile → Settings → **Privacy & terms**, and in the sign-in box. `index.html#privacy` and `index.html#terms` open them directly.
- **Standalone pages:** `node scripts/build-single.js` also writes `dist/privacy.html` and `dist/terms.html`. Upload them next to `index.html`; these are the addresses to give Google's sign-in consent screen.
- **Consent at sign-up:** Continue with Google and email Sign Up need a ticked box: "I agree to the Terms of Service and Privacy Policy, and I'm 18 or older or have my parent's or guardian's permission." Log In for an existing account doesn't need it.
  - The choice is remembered per document version in `localStorage` (`satwizz.consent`). Changing `UPDATED` asks everyone again.
- **Delete my account:** Profile → Settings → Privacy & terms, for signed-in players. A second tap confirms.
  - It calls the SQL function `delete_my_account()`, which removes the sign-in record. Every SatWizz table cascades; feedback keeps its text but loses the user id.
  - Progress on the device stays as a guest's.
  - If the function is missing (the schema hasn't been re-run), the player is still signed in and is told to email the contact address.

These are plain-English starting documents for a free student project, not legal advice.

## Social

- **Leaderboard** (Profile → 🏆 Leaderboard). **Global Top 50** and **Friends League**, ranked by XP or Sparks. Each row shows rank, avatar, display name, @username and streak. A sticky **Your Rank** bar sits at the bottom. Outside the top 50, your global rank comes from a count of players ahead of you.
- **Friends.** Search by `@username` or share your invite link (`…/?invite=yourname`). Opening an invite while signed out asks you to sign in, then sends the request automatically. If both people send a request, it's accepted.
- **Friend streaks 🔥.** A friend streak grows once per day when you and a friend both practice within 24 hours. Missing a day restarts it.
- **Lock In 🔒.** Next to a friend who hasn't practiced today, send "*{name} told you to Lock In! Keep your 12-day streak alive.*" It arrives as a **push notification** on their devices and as an **in-app banner**, live if they have the app open. You can send it once per friend every 4 hours.
- Every new account gets a username like `maya_4821`. You can change it and your display name under Profile.

## Run it

It's a static site with no build step.

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

Without Supabase settings it runs in guest mode, and progress stays in `localStorage`.

## Set up Supabase (accounts, sync, leaderboards, friends, feedback)

**Opening screen.** With accounts set up, a visitor who isn't signed in and hasn't chosen to play as a guest opens on the sign-in screen: Continue with Google, email Sign Up / Log In, or **Continue as Guest**. It sits on a solid background and only closes through its buttons. Choosing guest is remembered, signed-in visitors skip it, and a guest-only copy of the site never shows it.

**Without Supabase keys the website runs guest-only.** Everything works and saves in each visitor's browser, but there are no accounts. The header has no Save/sign-up button, Profile has no Leaderboard tab, and feedback stays in the browser that wrote it. Add the keys (steps below) to turn on accounts, cross-device sync, leaderboards, friends and feedback collection.

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It's safe to re-run. **Existing projects must re-run it** to add the newer tables and columns. Until you do, the site still syncs everything else and logs "re-run supabase/schema.sql" in the browser console.
   - It creates `profiles` and `user_settings` (private sync), `user_public` (leaderboard cards), `friendships` (with the friend streak), `lock_ins` and `push_subscriptions`.
   - It adds row-level security and the functions `send_friend_request`, `respond_friend_request`, `record_practice` and `send_lock_in`.
   - It adds `lock_ins` to Supabase Realtime.
   - It adds the columns that sync the Dashboard and Trophy Case between devices: `chapter_tests`, `practice_sets`, `badge_times`, `flawless_runs`, `practice_progress` (right answers, missed questions and the no-repeat question order) and `focus_state`.
   - It creates the write-only **`feedback`** table (see below).
   - It adds `delete_my_account()`, used by Settings → Delete my account.
3. Put the **Project URL** and **anon public key** (from **Project Settings → API**) in [`js/config.js`](js/config.js).
4. In **Authentication → URL Configuration**, add your site's URL to **Redirect URLs**.
5. For Google sign-in, enable **Authentication → Providers → Google** with an OAuth client from Google Cloud. On Google's consent screen, use `https://<your-site>/privacy.html` and `https://<your-site>/terms.html` as the privacy policy and terms links.

**Reading feedback.** Suggestions and bug reports from the Help overlay go to **Table Editor → feedback** (`kind` is `feature` or `bug`, plus the text, the screen it was sent from, the time, and the user id for signed-in visitors). Anyone can add a row, guests included, but nobody can read the table from the website; only you can, in the dashboard. Entries written offline are kept in the browser and sent on the next visit or when the connection returns, never twice.

**Sync rules.** Test and practice-set scores: best score and attempts take the max, and a pass sticks. Trophy Case: badges are united and the earliest unlock date is kept. Right answers and missed questions are united, and the no-repeat question position takes the max, so a second device doesn't repeat questions. Focus: the most recently used device wins. Just opening the site, or unlocking a badge from progress you already had, doesn't count as a newer change.

**What's public:** `user_public` holds only the display name, @username, avatar, XP, Sparks, streak and last-practice time. Every signed-in user can read it, because leaderboards and friend search need it. Everything else is readable only by its owner. Friendships can't be written directly: requests, accepts, streaks and Lock Ins all go through the checked SQL functions.

## Set up Lock In push notifications

Push needs HTTPS, a service worker (`sw.js`), the web app manifest and a small Supabase Edge Function that sends the notifications.

1. Generate a VAPID key pair (once):
   ```sh
   npx web-push generate-vapid-keys
   ```
2. Put the **public** key in `js/config.js` → `vapidPublicKey`. Never put the private key in the repo.
3. Store the keys as Edge Function secrets and deploy the function:
   ```sh
   supabase secrets set VAPID_PUBLIC_KEY=... VAPID_PRIVATE_KEY=... VAPID_SUBJECT=mailto:you@example.com APP_URL=https://your-site/
   supabase functions deploy lock-in
   ```
   The function lives in [`supabase/functions/lock-in/index.ts`](supabase/functions/lock-in/index.ts). It stores the alert through `send_lock_in` (as the signed-in user, so all the checks apply), pushes it to the friend's devices, and removes expired subscriptions.
4. Each user turns alerts on from **Leaderboard → Friends League** or **Profile → Settings**.

**Notes:**
- **iPhone:** web push only works after **Share → Add to Home Screen** (iOS 16.4+). The app explains this when it detects Safari.
- **Without the function:** if the function isn't deployed, Lock Ins still work as in-app banners.

## Project layout

```
index.html                  page shell, fonts, manifest, script order
manifest.webmanifest, sw.js installable app + push notifications
icons/                      app, maskable, Apple touch and badge icons
css/styles.css              all styles (light + dark)
js/config.js                Supabase URL, anon key, VAPID public key
js/themes.js                casts and avatars
js/questions.js             curriculum framework: 7+2 chapter plan, official stems, addChapter (merging)/build API
js/curriculum/clause.js     registers the pop-culture sets (clause-derby/src/ch1-7.js) as chapters 1-7
js/curriculum/ch1-ch9.js    extra practice per chapter: lesson patterns + questions with per-choice notes
js/curriculum/gen/          question generator: core.js + one builder per chapter (~3,600 questions)
js/curriculum/rules.js      rule names and short explanations for the Diagnostic screen
js/focus.js                 Focus Meter 0-100%: misses, rushing, 2-in-a-row restore, Elixir, hourly recharge, locks, low-Focus outline/shake
js/vocab.js                 Vocab Vault: 55 hand-built words + the bank builder, flashcards, tiers, sprint UI, word bank search, 🔊 pronunciation
js/vocab/bank.js            word bank loader; js/vocab/bank-core-1..5.js and bank-adv-1..4.js hold ~890 more words, one line each
js/fishing.js               Vocab Fishing (Vault): casts, rods, spots, view
js/derby.js                 Grammar Derby (Derby tab, pluggable question source): real-time CPU rival engine and tactics, Stable purchases, question generator, views
js/badges.js                the 50 Trophy Case accomplishments: categories, progress, unlock checks
js/rewards.js               Sparks, shop, Focus Elixir, Aura Shields, wager, badge checks (no DOM)
js/sfx.js                   Web Audio sound effects + vibration
js/auth.js                  Supabase auth, cloud sync, friends, leaderboards, Lock In, push
js/onboarding.js            sign-up / log-in modal (with the Terms / Privacy consent box)
js/legal.js                 Privacy Policy + Terms of Service text and their in-site overlay
js/social-view.js           Leaderboard & Friends: leaderboards, friend streaks, requests, invites
js/app.js                   header, 5-tab shell, Dashboard, tests + Diagnostic, chapter feed, drawers, Focus Break, streaks, shop, profile, demo mode
scripts/validate-content.js content checks for the curriculum and vocab
scripts/build-single.js     builds the whole app as one file: dist/index.html
scripts/build-clause-derby.js builds SAT Wizz: Clause Derby → clause-derby/index.html
scripts/validate-clause-bank.js checks the Clause Derby question bank
clause-derby/               SAT Wizz: Clause Derby (src/ + generated index.html)
scripts/build-derby.js      builds the standalone derby/index.html
dist/index.html             the whole app in a single file (generated)
dist/privacy.html, terms.html standalone legal pages (generated from js/legal.js)
derby/index.html            standalone SAT Vocabulary Derby (generated, single file)
supabase/schema.sql         tables, row-level security, social functions
supabase/functions/lock-in  Edge Function that sends Lock In pushes
```

## Adding questions

`js/questions.js` holds the framework: the chapter plan (`SatWizz.CURRICULUM_PLAN`), the stems and the registration API. Each chapter file calls `SatWizz.curriculum.addChapter({ id, short, title, pause, questions })`, and `app.js` calls `SatWizz.curriculum.build()` once at startup. A chapter in the plan with no file yet shows up empty, so Phase 2 content can land one chapter file at a time. Load new chapter files after `js/questions.js` in `index.html`.

Pop-culture questions for chapters 1–7 live in `clause-derby/src/chN.js` (see the Clause Derby section; run `node scripts/validate-clause-bank.js`). For extra practice, add to a chapter's `questions` array in `js/curriculum/chN.js`, then run `node scripts/validate-content.js`:

```js
{
  id: "c3-21", skill: "Prepositional traps", shortcut: "3:1", forms: ["s", "p", "p", "p"],
  text: "The list of {{NAME_1_POSS}} goals for {{EVENT}} ______ taped to the mirror.",
  choices: ["is", "are", "were", "have been"],
  answer: 0,
  notes: [
    "The subject is “list,” which is singular, so use “is.”",   // why the answer works
    "“Are” matches “goals,” the trap.",                          // why each other choice fails
    "“Were” is plural.",
    "“Have been” is plural.",
  ],
}
```

- `______` marks the blank, and each choice replaces exactly that blank. Or wrap a segment in `[[…]]` to underline it; that switches to the underlined-segment stem.
- Placeholders:
  - `{{NAME_1}}`–`{{NAME_3}}`
  - `{{NAME_n_POSS}}` / `{{NAME_n_OBJ}}` (his/her/their, him/her/them)
  - `{{LOCATION}}`, `{{EVENT}}`, `{{SKILL}}` (mid-sentence only)
- Never make a subject pronoun agree with a verb, because custom casts can use *they*.
- `kind: "transition"` switches to the logical-transition prompt.
- `shortcut` + `forms` (s / p / x) mark 3:1 and 2:1 questions.

## Content and brand rules

Cast names may include real people and characters, since names alone aren't copyrighted. Labels and flavor text avoid franchise titles, brand names and coined proprietary terms, and the footer says names imply no endorsement.

The Sparks economy and leaderboards are enforced in the browser. Row-level security limits whose row you can write, not what you write. For competitive stakes, move XP and Sparks changes into server-side functions.

---

SatWizz is an independent practice tool and is not affiliated with or endorsed by the College Board.
