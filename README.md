# SatWizz

A mobile-first, gamified SAT grammar and vocabulary course. You work through a 9-chapter curriculum in a snap-scrolling feed of Digital SAT-style questions, drill vocabulary in the Vocab Vault, earn Sparks, keep daily and friend streaks, and climb live leaderboards. The names in every question change to a cast you pick.

The bottom nav has five tabs: **Practice · Vocab · Leaderboard · Shop · Profile**. Your daily streak and achievements live at the top of Profile, and tapping the 🔥 pill in the header opens it.

## Question format

Every card follows the Digital SAT (Bluebook) layout:
- a numbered header;
- a short passage (1–3 sentences) with either a blank `______` or an underlined segment;
- the official College Board question stem;
- four choices with circled letters **A–D**. Screen readers announce each as "(A) …".

The stems live in `SatWizz.STEMS` in `js/questions.js`. `SatWizz.stemFor(q)` picks one: a question's own `stem` if it has one, then the transition stem for `kind: "transition"`, then the Standard English stem for a blank or an underline.

## Curriculum

Each chapter opens with an **Explanation Pause** lesson card: the rules in plain language, ✓/✗ pattern chips and a worked example with your cast's names. Then come **20 practice questions** (180 in total).

After each answer a **slide-up drawer** explains why the right answer works and why every other choice fails. A wrong answer comes back two cards later marked "↺ Try again". A chapter is complete once every question has been answered correctly. The first completion earns **+50 ⚡** and unlocks the next chapter.

| # | Chapter | What it covers |
|---|---|---|
| 1 | Identifying Independent Clauses | Subject + verb + complete thought vs. fragments; "hanging" words (Although, Because, While, Which…) |
| 2 | Connecting Independent Clauses | Legal: `IC, conj IC` · `IC; IC` · `DC, IC` · `IC DC` · `IC, DC`. Illegal: `IC, IC` · `IC; DC` · `IC, conj DC` · `DC, DC`. Flexpos / linking-word (LW) rules: no `IC, LW, IC`, no `IC; LW, DC` |
| 3 | Subject-Verb Agreement | Prepositional-phrase traps, along with, either/or, each/every, there is/are, flipped sentences, plus the **3:1 and 2:1 shortcuts** |
| 4 | Verb vs. Non-Verb | Main verbs vs. -ing / "to" / "having" forms; 2:1 shortcut for verb spots |
| 5 | Verb Tenses | Time clues, consistency, perfect tenses, past participles |
| 6 | Transitions | Contrast, cause/effect, addition, example, sequence, summary; illegal connector setups like `IC; though, IC` |
| 7 | Semicolons, Colons, Dashes | `IC; IC`, `A; B; and C` lists, colon/dash need an IC on the left, no dash before FANBOYS, `, which` |
| 8 | Appositives & Non-Essential Clauses | Symmetrical `, … ,` / `— … —`; essential appositives ("The researcher {{NAME_1}}") take no commas |
| 9 | Modifiers & Parallelism | The target rule for opening modifiers; A/B, list and comparison parallelism |
| Bonus | Pronouns & Possessives | 10 questions; unlocks after Chapter 9 |

**Ratio shortcuts** (taught in Chapters 3 and 4, where the answer choices are verbs):
- **3:1:** if three choices are plural verbs and one is singular (or the reverse), the odd one out is the answer.
- **2:1:** in a verb spot, cross out the choice that isn't a verb. Of the three left, two match in number and the odd one is the answer.

Every question where a shortcut applies is tagged, and `scripts/validate-content.js` checks the shortcut really leads to the right answer. The drawer shows a shortcut chip on those questions.

**Chapter drawer.** Tap the chapter bar above the feed to see every chapter's status (✓ done, ▶ current, 🔒 locked) and progress. You can jump to any unlocked chapter. Mixed review (missed questions first) opens once you finish a chapter.

## Vocab Vault

The **Vocab** tab (`js/vocab.js`) teaches 55 SAT words in three modes: 30 core high-frequency words and 25 advanced ones (*equanimity, fastidious, obdurate, recalcitrant, surreptitious, …*). New users see core words first; the Derby leads with advanced ones.

**🃏 Flashcards.** A deck of 10 cards that flip in 3D.
- **Front:** the word, its part of speech and its context sentence, filled in with your cast and highlighted.
- **Back:** the definition, synonyms, antonyms and root breakdown.
- **Controls:** tap to flip. Swipe right or tap **Got It**, swipe left or tap **Review Later**. On a keyboard, Space flips and →/← choose.
- **Got It** earns +5 ⚡, once per word per day.
- **Review Later** brings the card back once at the end of the deck and flags the word 🔁.
- Flagged words lead the next deck and the next sprint. A sprint miss also flags a word, and a correct sprint answer or Got It clears the flag.
- Flashcards don't change tiers: only sprints do.

**⚡ Daily 5-Word Sprint.** Words-in-Context questions in two formats:
- 35 words are "fill the blank" (the most logical and precise word);
- 20 are "As used in the text, what does *X* most nearly mean?", with the word underlined.

- **Daily Sprint:** 5 cards. It serves flagged words first, then words due for review (lowest tier first), then new words, then mastered ones for review.
- **Spaced repetition:** 3 tiers, **Novice 🌱 → Practitioner ⚡ → Master 👑**. A correct answer moves a word up one tier, at most once per day, so reaching Master takes practice on separate days. A wrong answer drops the word back to Novice and slides up a breakdown with the definition, root word, context clue and a note on every choice.
- **Rewards:**
  - +5 ⚡ per correct sprint card (and per flashcard Got It, once per word per day);
  - +25 ⚡ the first time a word reaches Master;
  - +20 ⚡ for finishing a sprint (once per day).

  Vocab answers also count toward your daily goal and give +5 XP each. They don't use Focus Shields or combos.
- Progress syncs to `profiles.vocab_progress`. If both devices practiced a word, the newer answer wins.

**🏇 SAT Vocabulary Derby** (`js/derby.js`). A wager-based horse race on the Vault's advanced words.
- **Flow:** an intro screen (ASCII title banner, rules, the field, your Focus) → **START** → place a bet → race → results.
- **Betting:** bet real ⚡ Sparks (50, 100, 250 or 500) or take a Fun run.
  - The bet is taken at the gate, and a win pays it back **×1.5**.
  - Up to **3 betting races a day**; Fun runs are unlimited.
  - Leaving mid-race forfeits the bet, after a confirm tap.
- **Field:** eight horses on a 5-step track. You are Galloping Lexicon. The seven rivals are **CPU players on their own clocks**: each reads a question (10–14s, like you), then answers in its own time range at its own accuracy.

  | Rival | Style | Answer time | Accuracy |
  |---|---|---|---|
  | Verbal Velocity | Fast & unsteady | 1–3s | 60% |
  | Grammar Galloper | Slow & precise | 5–8s | 85% |
  | Syntax Sprinter | Quick & solid | 2–4s | 66% |
  | Thesaurus Rex | Erratic | 1–7s | 68% |
  | Diction Dash | Balanced | 3–5s | 70% |
  | Rhetoric Rocket | Reckless | 1–2s | 54% |
  | Prose Pony | Careful | 6–9s | 95% |

- **Turns:** each turn is one advanced question (Words in Context, definition, synonym or antonym) on a live ⏱ clock. The clock pauses if you leave the tab.
  - The seconds you take, plus any Focus penalties, are the window in which the CPUs keep answering their own questions. Each right CPU answer moves that horse +1.
  - A commentary log lists every CPU answer in order (e.g. "Verbal Velocity rushed an answer in 2s and missed ✗").
  - A rival that crosses the line while you're still thinking wins.
  - **Right:** you gallop +1. **Wrong:** you're held back, and the word is flagged 🔁.
- **🧠 Focus** (max 3) carries between races.
  - Each miss costs 1 Focus and adds a **4s stumble**.
  - Every missing Focus bar adds **3s of hesitation** to every answer, so at 0 Focus each answer costs an extra 9s.
  - Two right answers in a row restore 1 Focus.
  - A **Focus Booster** (500 ⚡) refills Focus instantly, in the race or in the Stable.
- **Balance:** CPU reading time is tuned by simulation (`CPU.read` in `js/derby.js`). With the literal clocks and no reading time, a human could never win.

  | Your pace | Races won | At ×1.5 |
  |---|---|---|
  | 8s/question at 90% | ~92% | |
  | 10s at 85% | ~70% | break-even |
  | 12s at 80% | ~38% | |
  | 15s at 75% | ~12% | |

- **Results:** winner, payout, balance, Focus, final standings, and a **vocabulary review table** (word, meaning, synonyms, ✓/✗).
- **🛍️ The Stable:** reached from the intro, the results, or the Shop tab. Prices are in real Sparks, using a higher baseline than the main Shop:
  - Jockey silks: **1,000 ⚡** (Scholar's Gold, Midnight Ink, Crimson Cadence, Emerald Essay);
  - Mounts: **1,500 ⚡** (🦄 🦓 🐉 🦌, which race in your lane);
  - Focus Booster and Starting Burst (start 1 step ahead): **500 ⚡** each.

  Purchases need two taps. The main Shop's prices are unchanged.
- **Practice and sync:** answers count toward the daily goal (+5 XP each). Stats, Focus, owned gear and Bursts sync in `vocab_progress.derby`.
- **Question checks:** `scripts/validate-content.js` builds 11,000 generated questions and checks each has 4 distinct choices and one defensible answer. Words close in meaning, or near-opposites, are never used as each other's distractors.

## Gamification

- **Sparks ⚡.** You earn +10 per correct answer, +5 on every 3rd answer in a row, +50 per chapter (first time) and +50 for your daily goal.
- **Focus Shields 🛡️🛡️🛡️.** You get 3 per session. Each wrong answer costs one. At zero, a **Focus Break** drawer shows the chapter's rule summary, then a 2-question review recharges all three. A Focus Refill skips the review.
- **Daily streak 🔥.** It grows each day you hit your goal (5, 10 or 20). **Aura Shields 💠** cover a missed day.
- **Wizz Shop.** Theme packs (100 ⚡), Aura Shields (50 ⚡, or 3 for 120), Focus Refill, Combo Saver, the Double-Spark Wager and rare avatars.
- **Achievements.** Wearable titles: Spark Starter, Syntax Warlock and Lightning Fast.
- **Sound & haptics.** Web Audio effects: a crisp tap, a correct chime, a wrong thud, a combo sparkle and a chapter fanfare. There's no audio file to load. `navigator.vibrate(50)` fires on correct answers and combo milestones. Both can be turned off under Profile → Settings.
- **Demo Mode.** Tap the SatWizz logo 5 times to unlock every chapter and max out Sparks for testing or demos. Your real progress is saved first and restored when you tap 5 times again. Nothing syncs or reaches the leaderboards while Demo Mode is on.

## Social

- **Leaderboard tab.** **Global Top 50** and **Friends League**, ranked by XP or Sparks. Each row shows rank, avatar, display name, @username and streak. A sticky **Your Rank** bar sits at the bottom. Outside the top 50, your global rank comes from a count of players ahead of you.
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
js/questions.js             curriculum framework: chapter plan, official stems, addChapter/build API
js/curriculum/ch1-ch10.js   one file per chapter: lesson + 20 questions with per-choice notes
js/vocab.js                 Vocab Vault: words, flashcards, spaced-repetition tiers, sprint UI
js/derby.js                 SAT Vocabulary Derby: CPU rival engine, Focus, Stable, question generator, views
js/rewards.js               Sparks, shop, Focus, Aura Shields, wager, badges (no DOM)
js/sfx.js                   Web Audio sound effects + vibration
js/auth.js                  Supabase auth, cloud sync, friends, leaderboards, Lock In, push
js/onboarding.js            sign-up / log-in modal
js/social-view.js           Leaderboard tab: leaderboards, friend streaks, requests, invites
js/app.js                   chapter feed, drawers, streaks, shop, profile, demo mode
scripts/validate-content.js content checks for the curriculum and vocab
supabase/schema.sql         tables, row-level security, social functions
supabase/functions/lock-in  Edge Function that sends Lock In pushes
```

## Adding questions

`js/questions.js` holds the framework: the chapter plan (`SatWizz.CURRICULUM_PLAN`), the stems and the registration API. Each chapter file calls `SatWizz.curriculum.addChapter({ id, short, title, pause, questions })`, and `app.js` calls `SatWizz.curriculum.build()` once at startup. A chapter in the plan with no file yet shows up empty, so Phase 2 content can land one chapter file at a time. Load new chapter files after `js/questions.js` in `index.html`.

Add to a chapter's `questions` array in `js/curriculum/chN.js`, then run `node scripts/validate-content.js`:

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
