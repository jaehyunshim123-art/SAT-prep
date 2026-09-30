# SatWizz

A Duolingo-style SAT grammar trainer. You scroll through a feed of questions, keep a daily streak like Snapchat, and the names in every question change to characters you pick.

## Features

- **Scrolling question feed.** Full-screen cards snap one at a time, like short videos. Each card is an SAT-style "Standard English Conventions" question with four choices, instant feedback, and an explanation. The feed never runs out: questions reshuffle, and any you miss come back a few cards later.
- **Filter by skill.** Tap *Boundaries*, *Form & Sense*, *Transitions*, or *Missed* to drill one area. These are the College Board's own domain names for the digital SAT.
- **Daily streak 🔥 (Snapchat-style).** Hit your daily goal (5, 10, or 20 questions) to extend your streak. If you haven't hit it yet today, an ⌛ shows that the streak ends at midnight.
- **Streak freezes 🧊.** You earn one every 7 streak days (you can hold 2). A freeze covers a missed day automatically.
- **Combo streak ⚡.** Counts correct answers in a row. At 3 or more in a row, each answer earns bonus XP, and milestones set off a celebration.
- **Personalization 🎭.** Pick a cast: Everyday, Harry Potter, Football stars (Ronaldo, Messi, Aitana), Basketball (LeBron, Steph, Caitlin), Superheroes, or Pop icons. You can also build a **Custom** cast with any three names, pronouns (he / she / they), a place, a skill, and a big event. Every question, answer choice, and explanation updates right away.
- **Skill check.** Shows your accuracy for each grammar skill, weakest first.
- **Accounts & cloud sync ☁︎.** Sign up with Google or email and password to sync your streak, XP, streak freezes, cast and daily goal across devices. You can also keep playing as a guest. The sign-up screen appears when you tap **Save** or the first time you get 3 in a row.
- Keyboard shortcuts: `A`–`D` or `1`–`4` to answer, `↓`/`Enter` for the next card.

Progress is always saved in the browser's `localStorage`. When you're signed in, it's also synced to Supabase. Per-day history, per-skill stats and missed questions stay on the device.

## Run it

It's a static site with no build step and no dependencies.

```sh
# any static server works, e.g.
python3 -m http.server 8000
# then open http://localhost:8000
```

You can also open `index.html` directly in a browser. That works for guest mode, but Google sign-in needs http(s).

## Set up accounts (Supabase)

Without this step, SatWizz runs in guest-only mode.

1. Create a project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). It creates the `profiles` and `user_settings` tables and row-level security policies, so each user can only read and write their own rows.
3. Copy the **Project URL** and **anon public key** from **Project Settings → API** into [`js/config.js`](js/config.js). The anon key is meant to be public.
4. In **Authentication → URL Configuration**, add your site's URL (for example `http://localhost:8000/` or your GitHub Pages URL) to **Redirect URLs**.
5. For Google sign-in, enable **Authentication → Providers → Google** and paste in an OAuth client ID and secret from Google Cloud.

When you sign in on a device that already has progress, SatWizz combines the two:

- XP and best streak keep the higher value.
- The current streak comes from whichever side met its daily goal more recently.
- Saved settings (cast, daily goal) replace the device's.

To put it online, enable **GitHub Pages** for this repo (Settings → Pages → deploy from the branch root).

## Project layout

```
index.html          page shell, fonts, script order
css/styles.css      all styles (light + dark theme)
js/config.js        Supabase URL and anon key (empty = guest-only)
js/themes.js        the casts you can pick (names, pronouns, flavor words)
js/questions.js     the question bank
js/auth.js          Supabase auth methods, session listener, cloud sync and merge
js/onboarding.js    sign-up / log-in modal
js/app.js           feed, streaks, XP, personalization, local storage
supabase/schema.sql tables and row-level security policies
```

All modules share one global namespace, `window.SatWizz` (`SatWizz.questions`, `SatWizz.themes`, `SatWizz.auth`, `SatWizz.onboarding`, ...).

## Adding questions

Add an object to `SW.questions` in `js/questions.js`:

```js
{
  id: "f26", domain: F, skill: "Subject–verb agreement",
  text: "The list of {A_his} goals ______ taped to the mirror.",
  choices: ["is", "are", "were", "have been"],
  answer: 0,                       // index of the correct choice
  why: "The subject is \"list\" (singular), so use \"is.\"",
}
```

- `______` marks the blank. Each choice replaces exactly that blank.
- Name tokens: `{A}`, `{B}`, `{C}`. Pronoun tokens: `{A_his}` (his / her / their) and `{A_him}` (him / her / them). Flavor tokens: `{PLACE}`, `{CRAFT}`, `{EVENT}`. Use flavor tokens mid-sentence only, because they may start with a lowercase "the."
- Don't make a subject pronoun agree with a verb (for example "{A} ... she is"), because custom casts can use *they*.

---

SatWizz is an independent practice tool and is not affiliated with or endorsed by the College Board.
