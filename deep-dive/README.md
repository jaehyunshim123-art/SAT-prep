# Deep Dive

A focus timer where every study session is a submarine dive. Pick a destination, start the dive, and stay focused: the longer the session, the deeper you go. On the way down you spot real sea creatures and collect them in your **Logbook**.

Open `deep-dive/index.html` in a browser (or serve the folder). No build step.

## How it works

- **Destinations** (`src/ocean.js`): Coral Reef 15 min / 40 m, Open Blue 25 min / 200 m, Twilight Zone 45 min / 1,000 m, Midnight Zone 60 min / 4,000 m, Abyss 90 min / 6,000 m, Mariana Trench 120 min / 10,935 m. The sub descends at a steady rate to the destination depth.
- **Creatures**: 22 real animals at real depths, rated common / uncommon / rare. When a dive starts, each creature above the destination depth gets a chance to appear (85% / 50% / 25%). It shows up as the sub passes its depth, with a fun fact. Deep creatures need long dives.
- **Water color**: the page background is the water, darkening with depth (log scale). Light rays fade out and the sub's headlight turns on.
- **Drift**: switching tabs or closing the page mid-dive counts as drift. That time is subtracted from your focused time, and you get a nudge when you come back.
- **Saving**: progress lives in `localStorage` (`deepdive.v1`). A dive in progress resumes after a refresh.

## Files

| File | What it holds |
| --- | --- |
| `src/ocean.js` | Zones, destinations, creatures (data only) |
| `src/store.js` | Saved progress and stats |
| `src/app.js` | Dive engine and screens: home, dive, results, logbook |
| `src/styles.css` | All styling |

## Testing

Add `?speed=60` to the URL to run dives 60× faster.

## Ideas for next steps

- Real creature illustrations instead of emoji
- Sounds: sonar ping on sightings, ambient underwater audio
- Daily dive streak, and upgrades for the sub (lights, hull, colors)
- Accounts and friends' dives (Supabase, as in SatWizz)
- Break timer between dives ("resurface and breathe")
