# SatWizz

A mobile-first, gamified Digital SAT grammar and vocabulary website. You work through a 7-chapter grammar curriculum in a snap-scrolling feed of Digital SAT-style questions. The Vocab Vault has 3D flashcards, sprints and Vocab Fishing. You race your unit's grammar questions in the Derby and spend Sparks in the Shop. Daily and friend streaks and live leaderboards keep you coming back.

- **Header (every screen):** ⚡ **Spark balance** (new players start with **2,500**), 🔥 **Lock In Streak**, and the 🧠 **Focus Meter** (0–100%).
- **Bottom nav, five tabs:**
  - ✏️ **Practice:** chapter lessons and questions.
  - 📚 **Vault:** flashcards, sprints and 🎣 Vocab Fishing.
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

Seven chapters, in this order, plus two bonus chapters. Each core chapter starts with **25 pop-culture questions** (Ronaldo, Voldemort, Stephen Curry, Batman, Taylor Swift and more; shared with Clause Derby in `clause-derby/src/chN.js`). Then come **20 extra-practice questions** that use your cast's names (`js/curriculum/chN.js`). That makes **345 questions** in all.

Each chapter opens with an **Explanation Pause** lesson card: the chapter's explicit rules, ✓/✗ pattern chips and a worked example. After each answer a **slide-up drawer** shows the rule being tested, why the right answer works and why every other choice fails. A wrong answer comes back two cards later marked "↺ Try again".

- **Unlocking:** getting **60%** of a chapter right (27 of 45) unlocks the next one.
- **Complete:** a chapter is complete once every question has been answered correctly. The first completion earns **+50 ⚡**.

| # | Chapter | What it covers |
|---|---|---|
| 1 | Independent Clause Connectors & Sentence Boundaries | Comma + FANBOYS, semicolons, periods; comma splices and run-ons. Includes the Ronaldo/Pessi example (`posts. With`) |
| 2 | Subject-Verb Agreement | Singular vs. plural; tracking the subject past prepositional and parenthetical phrases; the **3:1 / 2:1 shortcuts**. Includes the "Dark Lord's name ___ pronounced" example (`is`) |
| 3 | Verb vs. Non-Verb Identification (Appositives) | Does the blank need a conjugated main verb or a participle modifier? Includes the Stephen Curry example (`Curry, intending` vs. `Curry intends`) |
| 4 | Verb Tenses & Aspect | Explicit time frames: past (happened), future (will happen), past perfect (had happened), present perfect (until now), present (general truths) |
| 5 | Logical Transitions | Contrast (However), addition, cause/effect, example, sequence. Includes the Batman example |
| 6 | Punctuation Fundamentals (Semicolon, Dash, Colon) | Paired dashes around non-essential appositives; semicolons between ICs; a colon after an IC for a list, noun or explanation |
| 7 | Appositives & Non-Essential Clauses | "a/an" cues → non-essential (paired commas or dashes); essential vs. non-essential names |
| Bonus | Modifiers & Parallelism | 20 questions; unlocks at 60% of Chapter 7 |
| Bonus | Pronouns & Possessives | 10 questions |

**Saves from the old 9-chapter course** migrate automatically: chapters 2–10 become 1–9, and the old "Complete Sentences" chapter was retired. Accounts that synced the old chapter numbers may see one extra chapter unlocked.

**Ratio shortcuts** (taught in Chapters 3 and 4, where the answer choices are verbs):
- **3:1:** if three choices are plural verbs and one is singular (or the reverse), the odd one out is the answer.
- **2:1:** in a verb spot, cross out the choice that isn't a verb. Of the three left, two match in number and the odd one is the answer.

Every question where a shortcut applies is tagged, and `scripts/validate-content.js` checks the shortcut really leads to the right answer. The drawer shows a shortcut chip on those questions.

**Chapter drawer.** Tap the chapter bar above the feed to see every chapter's status (✓ done, ▶ current, 🔒 locked with how many you need to unlock it) and progress. You can jump to any unlocked chapter. Mixed review (missed questions first) opens once you finish a chapter.

## Focus Meter (0–100%)

One meter, shown in the header and shared by Practice and the Derby (`js/focus.js`). It stays where you leave it between sessions.
- **Losing Focus:**
  - a wrong answer costs **25%**;
  - **rushing** costs **10%**: answering in under 3s in Practice, or under 1.5s in the Derby.
- **Restoring Focus:** only **2 right answers in a row** (+25%) or a **🧪 Focus Elixir** (500 ⚡, back to 100%).
- **Effects:**
  - under 50%, open questions blur slightly;
  - under 25%, they blur more and the screen **shakes** on each miss.

  Answered questions and explanations never blur. With reduced motion turned on, a desaturated tint replaces the blur and shake.
- **At 0% in Practice,** a **Focus Break** opens: the chapter's rules, then review questions until you get 2 right in a row. The Elixir skips it.
- **In the Derby,** missing Focus locks each question for up to 9s while the rivals keep running, plus 4s after a miss.

## Vocab Vault

The **Vault** tab (`js/vocab.js`) teaches 55 SAT words in three modes: 30 core high-frequency words and 25 advanced ones (*equanimity, fastidious, obdurate, recalcitrant, surreptitious, …*). New users see core words first; the Derby leads with advanced ones.

**🃏 Flashcards.** A deck of 10 cards that flip in 3D.
- **Front:** the word, its part of speech and its context sentence, filled in with your cast and highlighted.
- **Back:** the definition, synonyms, antonyms and root breakdown.
- **Controls:** tap to flip. Swipe right or tap **✓ Mastered**, swipe left or tap **↺ Needs Review**. On a keyboard, Space flips and →/← choose.
- **Toggles:** the two buttons show the word's current status, and so does the chip on the card and in your word list.
- **Mastered** earns +5 ⚡, once per word per day.
- **Needs Review** brings the card back once at the end of the deck and flags the word.
- Flagged words lead the next deck and the next sprint. A sprint miss also flags a word, and a correct sprint answer or Mastered clears the flag.
- Flashcards don't change tiers: only sprints do.

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
  | 🪸 Coral Reef | 500 ⚡ | all 55 words |
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
- **Counts as practice:** a right answer counts toward the chapter, including its 60% unlock. A miss goes on your missed list.
- **Flow:** an intro screen (the `=== 🐎 SATWIZZ GRAMMAR DERBY 🐎 ===` banner, rules, your unit, the field, your Focus) → **Start Derby** → place a bet → race → results with a grammar review (the sentence filled in, plus the rule).
- **The engine is generic:** a question source plugs in (`ctx.source`), and the standalone `derby/index.html` still races on vocabulary.
- **Betting:** bet real ⚡ Sparks (50, 100, 250 or 500) or take a Fun run.
  - The bet is taken at the gate, and a win pays it back **×1.5**.
  - Up to **3 betting races a day**; Fun runs are unlimited.
  - Leaving mid-race forfeits the bet, after a confirm tap.
- **Field:** eight horses on a 5-step track. You are Galloping Lexicon. The seven rivals are **independent CPU players**.
  - **The race clock never pauses**: not while you read feedback, not if you switch tabs.
  - Each rival reads a question (20–26s for grammar passages), answers in its own time range at its own accuracy, and moves **live whether or not you answer**.
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
- **Balance:** CPU reading time (20–26s for grammar, set by the source) is tuned by simulating the real-time race, including locks and about 2s spent reading feedback:

  | Your pace | Races won | At ×1.5 |
  |---|---|---|
  | 13s/question at 85% | ~88% | |
  | 15s at 85% | ~83% | |
  | ~17s at 82% | | break-even |
  | 18s at 80% | ~50% | |
  | 25s at 75% | ~10% | |

- **Results:** winner, payout, balance, Focus, race time, your average think time, final standings, and a **grammar review table** (each sentence with the right answer filled in, the rule, and ✓/✗, or — for a question you didn't answer before a rival won).
- **🛍️ Gear:** jockey silks, mounts, Focus Elixirs and Starting Bursts are sold in the Shop (and on the Derby's own Stable screen). Your silks color your lane and the field list, and your mount runs in your lane.
- **Practice and sync:** answers count toward the daily goal (+5 XP each). Stats, Focus, owned gear and Bursts sync in `vocab_progress.derby`.
- **Question checks:** `scripts/validate-content.js` builds 11,000 generated questions and checks each has 4 distinct choices and one defensible answer. Words close in meaning, or near-opposites, are never used as each other's distractors.

## SAT Wizz: Clause Derby (`clause-derby/index.html`)

A separate **grammar racing game** in one self-contained, dark-themed HTML file. Double-click it, or host the one file anywhere.

**Flow:** intro (`=== 🐎 SAT WIZZ: VOCAB DERBY 🐎 ===` banner, rules, **Start Game**) → chapter select → chapter rules → bet → live race → results and the **Post-Race Vault** → shop.

**Curriculum:** 7 chapters × 25 questions (175), in a pop-culture, research or narrative passage style. Every question has a rule line and a note for each choice.

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
- **Effects:** under 50% the question blurs; under 25% it blurs more and shakes on misses. Reduced-motion users get a tint instead. Feedback is never blurred.

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
- **Host it:** upload it to any static host.

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
- the same 55 words, engine, tactics, Focus Meter and prices. It keeps its own Focus, separate from the app.

What differs in the standalone file:
- **Its own economy:** you start with **2,500 ⚡**. Wins pay ×1.5, and there are 3 betting races a day.
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
- **Shop.** Every cosmetic costs **500 ⚡**, in separate sections (jump links at the top):

  | Section | Items |
  |---|---|
  | 🏇 Jockey Skins | 4 Derby silks |
  | 🦄 Derby Mounts | 4 mounts |
  | 🎭 Character Casts | 6 casts for the extra-practice questions |
  | 🙂 Avatars | 6 rare profile pictures |
  | 🎣 Fishing Rods | 3 rods with perks |
  | 🌊 Fishing Spots | 3 spots with their own word pools |
  | 🧪 Focus Elixir | 500 ⚡, Focus back to 100% |
  | Power-ups | Starting Burst (500), Aura Shields (50, or 3 for 120), Combo Saver, Double-Spark Wager |

  Purchases need two taps. Anything you already own stays owned. Derby wins pay your bet back ×1.5.
- **Starting balance.** New players start with 2,500 ⚡. Existing saves keep their balance. A fresh device that signs in to an account that has played takes the account's balance, so a new browser can't top up an account.
- **Achievements.** Wearable titles: Spark Starter, Syntax Warlock and Lightning Fast.
- **Sound & haptics.** Web Audio effects: a crisp tap, a correct chime, a wrong thud, a combo sparkle and a chapter fanfare. There's no audio file to load. `navigator.vibrate(50)` fires on correct answers and combo milestones. Both can be turned off under Profile → Settings.
- **Demo Mode.** Tap the SatWizz logo 5 times to unlock every chapter and max out Sparks for testing or demos. Your real progress is saved first and restored when you tap 5 times again. Nothing syncs or reaches the leaderboards while Demo Mode is on.

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

## Set up Supabase (accounts, sync, leaderboards, friends)

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It's safe to re-run. **Existing projects must re-run it** to add the social tables and the `vocab_progress` column.
   - It creates `profiles` and `user_settings` (private sync), `user_public` (leaderboard cards), `friendships` (with the friend streak), `lock_ins` and `push_subscriptions`.
   - It adds row-level security and the functions `send_friend_request`, `respond_friend_request`, `record_practice` and `send_lock_in`.
   - It adds `lock_ins` to Supabase Realtime.
3. Put the **Project URL** and **anon public key** (from **Project Settings → API**) in [`js/config.js`](js/config.js).
4. In **Authentication → URL Configuration**, add your site's URL to **Redirect URLs**.
5. For Google sign-in, enable **Authentication → Providers → Google** with an OAuth client from Google Cloud.

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
js/focus.js                 Focus Meter 0-100%: misses, rushing, 2-in-a-row restore, Elixir, locks, blur/shake
js/vocab.js                 Vocab Vault: words, flashcards, spaced-repetition tiers, sprint UI
js/fishing.js               Vocab Fishing (Vault): casts, rods, spots, view
js/derby.js                 Grammar Derby (Derby tab, pluggable question source): real-time CPU rival engine and tactics, Stable purchases, question generator, views
js/rewards.js               Sparks, shop, Focus Elixir, Aura Shields, wager, badges (no DOM)
js/sfx.js                   Web Audio sound effects + vibration
js/auth.js                  Supabase auth, cloud sync, friends, leaderboards, Lock In, push
js/onboarding.js            sign-up / log-in modal
js/social-view.js           Leaderboard & Friends: leaderboards, friend streaks, requests, invites
js/app.js                   header, 4-tab shell, chapter feed, drawers, Focus Break, streaks, shop, profile, demo mode
scripts/validate-content.js content checks for the curriculum and vocab
scripts/build-single.js     builds the whole app as one file: dist/index.html
scripts/build-clause-derby.js builds SAT Wizz: Clause Derby → clause-derby/index.html
scripts/validate-clause-bank.js checks the Clause Derby question bank
clause-derby/               SAT Wizz: Clause Derby (src/ + generated index.html)
scripts/build-derby.js      builds the standalone derby/index.html
dist/index.html             the whole app in a single file (generated)
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
