// SatWizz accomplishments: 50 badges in six categories for the Trophy Case
// (Profile → Trophy Case). Each one is computed from saved progress, so a
// locked badge can show how close you are ("7 / 10 flawless runs").
// The first three keep their original ids, so badges earned before carry over.
//
// SatWizz.BADGE_LIST = [{ id, cat, title, icon, desc, progress(s) → { value, of, label }, check(s, ctx) }]
// SatWizz.BADGE_CATS = [[id, label], …]
// Load after js/vocab.js (word count) and before js/rewards.js.
(function () {
  "use strict";
  const SW = (window.SatWizz = window.SatWizz || {});

  const CATS = [
    ["curriculum", "Curriculum"],
    ["volume", "Volume"],
    ["streaks", "Streaks"],
    ["vocab", "Vocab"],
    ["derby", "Derby"],
    ["shop", "Shop"],
  ];

  // ---------- Progress readers (all tolerate missing fields) ----------
  const obj = (x) => (x && typeof x === "object" ? x : {});
  const tests = (s) => Object.values(obj(s.tests));
  const coreIds = () => (SW.chapters || []).filter((c) => !c.bonus).map((c) => c.id);
  const bonusIds = () => (SW.chapters || []).filter((c) => c.bonus).map((c) => c.id);
  const testsPassed = (s) => coreIds().filter((id) => obj(s.tests)[id]?.passed).length;
  const coreComplete = (s) => coreIds().filter((id) => (s.completedChapters || []).includes(id)).length;
  const bonusComplete = (s) => bonusIds().filter((id) => (s.completedChapters || []).includes(id)).length;
  const practiceSets = (s) => Object.values(obj(s.practiceSets)).reduce((n, p) => n + (p.attempts || 0), 0);
  const comebacks = (s) => tests(s).filter((t) => t.passed && (t.attempts || 0) > 1).length;
  const goalDays = (s) => Object.values(obj(s.days)).filter((d) => d && d.done).length;
  const answered = (s) => Object.values(obj(s.days)).reduce((n, d) => n + ((d && d.n) || 0), 0);
  const words = (s) => Object.values(obj(s.vocab && s.vocab.words));
  const wordsSeen = (s) => words(s).filter((w) => w && (w.seen || w.cards)).length;
  const wordsMaster = (s) => words(s).filter((w) => w && w.tier === 3).length;
  const wordsMarked = (s) => words(s).filter((w) => w && w.mastered).length;
  const totalWords = () => (SW.vocab && SW.vocab.WORDS ? SW.vocab.WORDS.length : 55);
  const derby = (s) => obj(s.vocab && s.vocab.derby);
  const fish = (s) => obj(s.vocab && s.vocab.fishing);
  const casts = (s) => (s.unlockedThemes || []).length;
  const avatars = (s) => (s.unlockedAvatars || []).length;
  const stableGear = (s) => (derby(s).silks || []).length + (derby(s).mounts || []).length;
  const fishGear = (s) => (fish(s).rods || []).length + (fish(s).spots || []).length;

  // A counting badge: unlocked once value(s) reaches goal.
  const count = (id, cat, icon, title, desc, value, goal, unit) => ({
    id, cat, icon, title, desc,
    progress: (s) => {
      const v = Math.min(goal, Math.max(0, Math.floor(value(s) || 0)));
      return { value: v, of: goal, label: `${v.toLocaleString("en-US")} / ${goal.toLocaleString("en-US")} ${unit}` };
    },
    check: (s) => (value(s) || 0) >= goal,
  });

  const LIST = [
    // ---------- Curriculum (10) ----------
    count("gatekeeper", "curriculum", "🚪", "Gatekeeper", "Pass your first Review for Understanding (8/10 or better).", testsPassed, 1, "tests passed"),
    count("halfway-there", "curriculum", "🧭", "Halfway There", "Pass 4 chapter tests.", testsPassed, 4, "tests passed"),
    count("grammar-graduate", "curriculum", "🎓", "Grammar Graduate", "Pass all 7 chapter tests.", testsPassed, 7, "tests passed"),
    count("flawless", "curriculum", "💎", "Flawless", "Score 10/10 on a test or practice set.", (s) => s.flawless, 1, "flawless runs"),
    count("flawless-ten", "curriculum", "👑", "Flawless ×10", "Score 10/10 on ten tests or practice sets.", (s) => s.flawless, 10, "flawless runs"),
    count("chapter-champion", "curriculum", "⭐", "Chapter Champion", "Answer every core question in a chapter correctly.", coreComplete, 1, "chapters complete"),
    count("completionist", "curriculum", "🌟", "Completionist", "Complete all 7 core chapters.", coreComplete, 7, "chapters complete"),
    count("bonus-hunter", "curriculum", "🎁", "Bonus Hunter", "Complete a bonus chapter.", bonusComplete, 1, "bonus chapters"),
    count("drill-sergeant", "curriculum", "📋", "Drill Sergeant", "Finish 10 practice sets.", practiceSets, 10, "practice sets"),
    count("comeback", "curriculum", "🔁", "Comeback Kid", "Pass a chapter test after failing it.", comebacks, 1, "comebacks"),

    // ---------- Volume (10) ----------
    count("first-steps", "volume", "👣", "First Steps", "Answer 10 questions correctly.", (s) => s.totalCorrect, 10, "correct"),
    count("syntax-warlock", "volume", "🧙", "Syntax Warlock", "Answer 50 questions correctly.", (s) => s.totalCorrect, 50, "correct"),
    count("century", "volume", "💯", "Century", "Answer 100 questions correctly.", (s) => s.totalCorrect, 100, "correct"),
    count("quarter-thousand", "volume", "📚", "Bookworm", "Answer 250 questions correctly.", (s) => s.totalCorrect, 250, "correct"),
    count("five-hundred", "volume", "🏛️", "Grammar Scholar", "Answer 500 questions correctly.", (s) => s.totalCorrect, 500, "correct"),
    count("thousand", "volume", "🏆", "Thousand Club", "Answer 1,000 questions correctly.", (s) => s.totalCorrect, 1000, "correct"),
    count("marathoner", "volume", "🏃", "Marathoner", "Answer 2,000 questions (right or wrong).", answered, 2000, "answered"),
    count("combo-ten", "volume", "⚡", "Combo ×10", "Get 10 right in a row.", (s) => s.bestCombo, 10, "in a row"),
    count("combo-twentyfive", "volume", "🔥", "Unstoppable", "Get 25 right in a row.", (s) => s.bestCombo, 25, "in a row"),
    {
      id: "lightning-fast",
      cat: "volume",
      title: "Lightning Fast",
      icon: "🌩️",
      desc: "Get 5 right in a row in under 60 seconds.",
      progress: (s) => ({ value: (s.badges || []).includes("lightning-fast") ? 1 : 0, of: 1, label: "5 in a row, under a minute" }),
      check: (s, ctx) => Boolean(ctx && ctx.fastRun),
    },

    // ---------- Streaks (7) ----------
    count("spark-starter", "streaks", "✨", "Spark Starter", "Reach a 3-day streak.", (s) => s.bestStreak, 3, "days"),
    count("week-warrior", "streaks", "📅", "Week Warrior", "Reach a 7-day streak.", (s) => s.bestStreak, 7, "days"),
    count("fortnight", "streaks", "🗓️", "Fortnight Focus", "Reach a 14-day streak.", (s) => s.bestStreak, 14, "days"),
    count("month-strong", "streaks", "🌙", "Month Strong", "Reach a 30-day streak.", (s) => s.bestStreak, 30, "days"),
    count("centurion", "streaks", "🛡️", "Centurion", "Reach a 100-day streak.", (s) => s.bestStreak, 100, "days"),
    count("goal-getter", "streaks", "🎯", "Goal Getter", "Meet your daily goal on 10 days.", goalDays, 10, "goal days"),
    count("habit-formed", "streaks", "🧱", "Habit Formed", "Meet your daily goal on 50 days.", goalDays, 50, "goal days"),

    // ---------- Vocab (10) ----------
    count("word-explorer", "vocab", "🔎", "Word Explorer", "Study 10 Vocab Vault words.", wordsSeen, 10, "words"),
    count("vault-explorer", "vocab", "🗝️", "Vault Explorer", "Study every Vocab Vault word.", wordsSeen, totalWords(), "words"),
    count("first-master", "vocab", "🌱", "First Master", "Raise a word to 👑 Master.", wordsMaster, 1, "Master words"),
    count("lexicon", "vocab", "📖", "Lexicon", "Raise 10 words to 👑 Master.", wordsMaster, 10, "Master words"),
    count("wordsmith", "vocab", "🖋️", "Wordsmith", "Raise 25 words to 👑 Master.", wordsMaster, 25, "Master words"),
    count("card-shark", "vocab", "🃏", "Card Shark", "Mark 20 flashcards ✓ Mastered.", wordsMarked, 20, "cards"),
    count("sprinter", "vocab", "🏁", "Sprinter", "Finish a daily vocab sprint.", (s) => s.vocab && s.vocab.sprints, 1, "sprints"),
    count("sprint-regular", "vocab", "⏱️", "Sprint Regular", "Finish 10 daily vocab sprints.", (s) => s.vocab && s.vocab.sprints, 10, "sprints"),
    count("angler", "vocab", "🎣", "Angler", "Catch 50 fish in Vocab Fishing.", (s) => fish(s).catches, 50, "catches"),
    count("perfect-catch", "vocab", "🐟", "Perfect Catch", "Land every fish in a fishing round.", (s) => fish(s).perfect, 1, "perfect rounds"),

    // ---------- Derby (7) ----------
    count("out-of-the-gate", "derby", "🐎", "Out of the Gate", "Run your first Derby race.", (s) => derby(s).races, 1, "races"),
    count("regular-rider", "derby", "🏇", "Regular Rider", "Run 10 Derby races.", (s) => derby(s).races, 10, "races"),
    count("iron-horse", "derby", "🐴", "Iron Horse", "Run 50 Derby races.", (s) => derby(s).races, 50, "races"),
    count("photo-finish", "derby", "📸", "Photo Finish", "Win a Derby race.", (s) => derby(s).wins, 1, "wins"),
    count("derby-ace", "derby", "🥇", "Derby Ace", "Win 10 Derby races.", (s) => derby(s).wins, 10, "wins"),
    count("triple-crown", "derby", "🏆", "Triple Crown", "Win 25 Derby races.", (s) => derby(s).wins, 25, "wins"),
    count("high-roller", "derby", "💰", "High Roller", "Win 500 ⚡ or more in a single race.", (s) => derby(s).bestWin, 500, "⚡ best win"),

    // ---------- Shop (6) ----------
    count("new-cast", "shop", "🎭", "Casting Call", "Unlock a Character Cast.", casts, 1, "casts"),
    count("ensemble", "shop", "🎬", "Ensemble", "Unlock 3 Character Casts.", casts, 3, "casts"),
    count("new-look", "shop", "🙂", "New Look", "Unlock an avatar.", avatars, 1, "avatars"),
    count("stable-hand", "shop", "🧢", "Stable Hand", "Buy a jockey skin or Derby mount.", stableGear, 1, "Stable items"),
    count("tackle-box", "shop", "🪝", "Tackle Box", "Buy a fishing rod or spot.", fishGear, 1, "fishing items"),
    count("collector", "shop", "🛍️", "Collector", "Own 10 Shop items.", (s) => casts(s) + avatars(s) + stableGear(s) + fishGear(s), 10, "items"),
  ];

  SW.BADGE_LIST = LIST;
  SW.BADGE_CATS = CATS;
})();
