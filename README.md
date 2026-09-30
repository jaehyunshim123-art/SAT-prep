# SatWizz

A mobile-first SAT grammar trainer. You work through a 9-chapter curriculum in a snap-scrolling feed, keep a daily streak, earn Sparks, and the names in every question change to a cast you pick.

## Curriculum

Each chapter opens with an **Explanation Pause** card (the rules, ✓/✗ pattern chips and a worked example), then practice questions. A wrong answer comes back two cards later marked "↺ Try again". A chapter is complete once every question has been answered correctly. The first completion earns **+50 ⚡** and unlocks the next chapter.

| # | Chapter | What it covers |
|---|---|---|
| 1 | Identifying Independent Clauses | Subject + main verb vs. fragments; which/that/who/whose clauses have no main verb |
| 2 | Connecting Independent Clauses | Valid: `IC, conj IC` · `IC, DC` · `IC; IC` · `IC DC` · `DC, IC`. Invalid: `IC, conj DC` · `DC, DC` · `IC; DC` · `IC, LW, IC` · `IC; LW, DC` |
| 3 | Subject-Verb Agreement | Prepositional-phrase traps, compound subjects, neither/nor, inverted sentences |
| 4 | Verb vs. Non-Verb | Main (conjugated) verb vs. -ing participles and infinitives |
| 5 | Verb Tenses | Time clues, consistency, perfect tenses, past participles |
| 6 | Transitions | Contrast, cause/effect, addition, example; no `, LW` splices, no `; LW` before a DC, no `IC; though, IC` |
| 7 | Semicolons, Colons, Dashes | `IC; IC`, complex lists, colon/dash need an IC on the left, no dash before FANBOYS, `, which` |
| 8 | Appositives & Non-Essential Clauses | Symmetrical `, … ,` / `— … —`; essential appositives take no commas |
| 9 | Modifiers & Parallelism | Dangling/misplaced modifiers, A/B and list parallelism, logical comparisons |
| Bonus | Pronouns & Possessives | Unlocks after Chapter 9 |

**Chapter drawer.** Tap the chapter bar above the feed to open it. It shows each chapter's status (✓ done, ▶ current, 🔒 locked) and progress. You can jump to any unlocked chapter or replay a finished one. After you finish any chapter, **Mixed review** opens: endless questions from finished chapters, with missed ones first.

## Features

- **Daily streak 🔥.** Hit your daily goal (5, 10 or 20 questions) to extend it. Until you do, an ⌛ shows the streak ends at midnight.
- **Sparks ⚡.** Shown in the header. You earn +10 per correct answer, +5 on every 3rd answer in a row, +50 per chapter completed (first time) and +50 for your daily goal.
- **Focus Shields 🛡️🛡️🛡️.** You get 3 per session. Each wrong answer costs one. At zero, a **Focus Break** drawer shows the chapter's rule summary. Then a 2-question review from the same chapter recharges all 3 (or skip it with a Focus Refill).
- **Wizz Shop 🛍️.**

  | Item | Price | What it does |
  |---|---|---|
  | Cast theme packs | 100 ⚡ each | New casts for every question |
  | Aura Shield | 50 ⚡ | Protects your streak on a missed day (hold up to 5) |
  | Aura Shield ×3 | 120 ⚡ | Three at a discount |
  | Focus Refill | 30 ⚡ | Restores all Focus Shields without the review |
  | Combo Saver | 40 ⚡ | The next wrong answer on a combo of 3+ keeps the combo |
  | Double-Spark Wager | 50 ⚡ stake | Keep your streak 5 more days to win 100 ⚡ |
  | Rare avatars | 100–300 ⚡ | Profile pictures |

- **Casts 🎭.** The default is **Everyday** (John, Jane and Sam). The packs are Wizard School, Football Legends, Hoops Legends, Anime Pack, Superhero Pack and Pop Icons. A **Custom** cast takes any three names, pronouns (he / she / they), a location, a skill and an event.
- **Achievements.** Under Streak → Achievements you can unlock and wear titles: Spark Starter (3-day streak), Syntax Warlock (50 correct) and Lightning Fast (5 in a row in under 60 seconds).
- **Profile pictures.** 12 free emoji avatars, plus 6 rare ones you unlock with Sparks.
- **Accounts & cloud sync ☁︎.** Sign up with Google or email and password, or continue as a guest. The sign-up screen appears when you tap **Save** or the first time you get 3 in a row.
- **Keyboard:** `A`–`D` or `1`–`4` to answer, `↓`/`Enter` for the next card.

## Content and brand rules

Cast names can include real people and characters, since names alone aren't copyrighted. Pack labels and flavor text avoid franchise titles, brand names and coined proprietary terms (for example, no league, award or studio trademarks). The footer says names are used for fun and imply no endorsement. Keep to the same rule when you add casts.

## Run it

It's a static site with no build step.

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

Opening `index.html` directly also works for guest mode, but Google sign-in needs http(s).

## Set up accounts (Supabase)

Without this, SatWizz runs in guest-only mode, and progress stays in `localStorage`.

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It's safe to re-run. **Existing projects must re-run it** to add the chapter columns.
3. Put the **Project URL** and **anon public key** (from **Project Settings → API**) in [`js/config.js`](js/config.js).
4. In **Authentication → URL Configuration**, add your site's URL to **Redirect URLs**.
5. For Google sign-in, enable **Authentication → Providers → Google** with an OAuth client from Google Cloud.

**What syncs:**
- `profiles` table: Sparks, streak, best streak, XP, Aura Shields, unlocked and completed chapters, unlocked themes, badges and avatars, Combo Savers and the wager.
- `user_settings` table: cast, custom names, daily goal and avatar.
- Focus Shields are per session and don't sync. Per-question progress inside a chapter, daily history and accuracy stats stay on the device.

**Signing in on a device that already has progress:**
- Unlocks, completed chapters and badges are combined.
- XP and best streak keep the higher value.
- The streak comes from whichever side met its goal more recently.
- Spendable balances: whichever side changed last wins for the same account. For guest progress, the higher balance is kept.

The Sparks economy is enforced in the browser only. Row-level security limits whose row you can write, not what you write. To harden it, move purchases into Postgres functions that check prices on the server.

## Project layout

```
index.html          page shell, fonts, script order
css/styles.css      all styles (light + dark theme)
js/config.js        Supabase URL and anon key (empty = guest-only)
js/questions.js     the 9-chapter curriculum (+ bonus): lessons and questions
js/themes.js        casts (names, pronouns, flavor, prices) and avatars
js/rewards.js       Sparks, shop items, Focus, Aura Shields, wager, badges (no DOM)
js/auth.js          Supabase auth, session listener, cloud sync and merge
js/onboarding.js    sign-up / log-in modal
js/app.js           chapter feed, drawer, streaks, shop, personalization
supabase/schema.sql tables and row-level security policies
```

All modules share one namespace, `window.SatWizz` (`SatWizz.chapters`, `SatWizz.questions`, `SatWizz.themes`, `SatWizz.auth`, ...).

## Adding questions

Add a question to a chapter's `questions` array in `js/questions.js`:

```js
{
  id: "c3-8", skill: "Prepositional traps",
  text: "The list of {{NAME_1_POSS}} goals for {{EVENT}} ______ taped to the mirror.",
  choices: ["is", "are", "were", "have been"],
  answer: 0,          // index of the correct choice (shuffled on screen)
  why: "The subject is \"list\" (singular), so use \"is.\"",
}
```

- `______` marks the blank. Each choice replaces exactly that blank.
- Placeholders:
  - `{{NAME_1}}`, `{{NAME_2}}`, `{{NAME_3}}`
  - `{{NAME_n_POSS}}` (his / her / their) and `{{NAME_n_OBJ}}` (him / her / them)
  - `{{LOCATION}}`, `{{EVENT}}`, `{{SKILL}}`
- Use the flavor placeholders mid-sentence only, since they may start with a lowercase "the".
- Never make a subject pronoun agree with a verb, because custom casts can use *they*.
- Add `kind: "transition"` for logical-transition questions.

---

SatWizz is an independent practice tool and is not affiliated with or endorsed by the College Board.
