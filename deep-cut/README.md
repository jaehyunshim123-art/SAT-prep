# Deep Cut

A daily word game, inspired by Krillion. Seven prompts a day ("Name a fruit", "Name a Greek god"), 25 seconds each, one answer per prompt. Any correct answer counts, but rarer answers send you deeper:

| Tier | Depth | Example (fruit) |
| --- | --- | --- |
| Obvious | ~120 m | apple |
| Common | ~340 m | mango |
| Uncommon | ~620 m | pomegranate |
| Rare | ~900 m | rambutan |

Open `deep-cut/index.html` in a browser. No build step.

- **Daily dive:** everyone gets the same 7 prompts each day (seeded by the date). One try per day; refreshing mid-game counts the prompt on screen as a miss. Streak and best depth are saved in `localStorage` (`deepcut.v1`).
- **Practice round:** a random 7, any time.
- **Matching** (`judge()` in `src/game.js`) ignores case, accents, punctuation, "the/a/an" and plurals, and forgives a typo or two in longer words. An answer that isn't on the list doesn't use up your turn.
- **Sharing:** the results screen copies a spoiler-free result, e.g. `Deep Cut #6 · 5,292 m` and a row of 🟦🔷🟪🟩❌.

## Files

| File | What it holds |
| --- | --- |
| `src/prompts.js` | The 24 prompts and their answers, sorted into 4 tiers |
| `src/game.js` | Matching, scoring, daily seeding, screens |
| `src/styles.css` | Styling |

## Next steps

- **Real rarity:** save every answer (e.g. in Supabase) and score by how many players actually gave it, which is how Krillion works. The tiers in `prompts.js` would then only be the starting guess.
- More prompts (24 repeat quickly at 7 a day), plus themed packs.
- Live rooms where friends answer the same prompt at once.
