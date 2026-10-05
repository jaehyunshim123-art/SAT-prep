// Content checks for SatWizz. Run from the repo root:
//   node scripts/validate-content.js
// Curriculum: every question has exactly one target (a ______ blank or an
// [[underlined]] segment), 4 distinct choices, a valid answer, a note per
// choice and only known placeholders; 3:1 / 2:1 shortcut questions really
// have the odd one out as the answer.
// Vocab Vault: the same checks, plus a definition, root, context clue, synonyms/antonyms,
// and the right target for each format (blank vs. underlined word).
// Vocab Fishing: every cast has 4 distinct definitions and one right fish.
// Vocab Derby: every generated question (context / definition / synonym /
// antonym) has 4 distinct choices, the right answer, and no distractor drawn
// from a word too close in meaning.
const repo = require("path").resolve(__dirname, "..");
global.window = {};
require(`${repo}/js/themes.js`);
require(`${repo}/js/questions.js`);
require(`${repo}/js/curriculum/basics.js`);
require(`${repo}/clause-derby/src/bank.js`);
for (let i = 1; i <= 7; i++) require(`${repo}/clause-derby/src/ch${i}.js`);
require(`${repo}/js/curriculum/clause.js`);
for (let i = 1; i <= 9; i++) require(`${repo}/js/curriculum/ch${i}.js`);
require(`${repo}/js/curriculum/sentences.js`);
require(`${repo}/js/curriculum/hard.js`);
require(`${repo}/js/curriculum/gen/core.js`);
for (let i = 1; i <= 7; i++) require(`${repo}/js/curriculum/gen/ch${i}.js`);
require(`${repo}/js/curriculum/rules.js`);
require(`${repo}/js/focus.js`);
require(`${repo}/js/derby.js`);
require(`${repo}/js/fishing.js`);
require(`${repo}/js/vocab/bank.js`);
for (const f of require("fs").readdirSync(`${repo}/js/vocab`).filter((x) => /^bank-.+\.js$/.test(x)).sort()) require(`${repo}/js/vocab/${f}`);
require(`${repo}/js/vocab.js`);
const SW = window.SatWizz;
SW.curriculum.build();

const TOKEN = /\{\{(NAME_[123](_POSS|_OBJ)?|LOCATION|EVENT|SKILL)\}\}/g;
const UNDER = /\[\[([^\]]+)\]\]/g;
const bad = [];
const ids = new Set();
const fill = (t, cast) => t.replace(TOKEN, (m, k) => {
  const n = k.match(/^NAME_(\d)(_POSS|_OBJ)?$/);
  if (n) { const p = cast.people[n[1] - 1]; return n[2] ? SW.pronouns[p.pro][n[2] === "_POSS" ? "his" : "him"] : p.name; }
  return { LOCATION: cast.place, EVENT: cast.event, SKILL: cast.craft }[k];
});
const theyCast = { people: [{ name: "Alex", pro: "they" }, { name: "Sky", pro: "they" }, { name: "Jo", pro: "they" }], place: "the gym", craft: "chess", event: "the final" };
const targets = (text) => (text.match(/______/g) || []).length + (text.match(UNDER) || []).length;

function checkCommon(tag, q, texts) {
  if (ids.has(q.id)) bad.push(`${tag}: duplicate id`);
  ids.add(q.id);
  if (targets(q.text) !== 1) bad.push(`${tag}: needs exactly one blank or [[underline]]`);
  if (q.choices.length !== 4 || new Set(q.choices).size !== 4) bad.push(`${tag}: needs 4 distinct choices`);
  if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) bad.push(`${tag}: answer out of range`);
  if (!Array.isArray(q.notes) || q.notes.length !== 4 || q.notes.some((n) => !n || n.length < 8)) bad.push(`${tag}: needs 4 notes`);
  const all = [q.text, ...q.choices, ...(q.notes || []), ...texts].join(" ");
  if (all.replace(TOKEN, "").match(/\{\{|\}\}/)) bad.push(`${tag}: unknown placeholder`);
  if (fill(all, theyCast).includes("{{")) bad.push(`${tag}: unfilled with they-cast`);
  if (/^\{\{(LOCATION|EVENT|SKILL)\}\}/.test(q.text)) bad.push(`${tag}: flavor token at sentence start`);
  if (q.stem && !SW.STEMS[q.stem]) bad.push(`${tag}: unknown stem "${q.stem}"`);
}

// ---------- curriculum ----------
for (const ch of SW.chapters) {
  if (!ch.questions.length) { console.log(`note: chapter ${ch.id} has no questions yet (Phase 2)`); continue; }
  const pauseText = [ch.pause.summary, ch.pause.example, ...ch.pause.rules, ...ch.pause.patterns.map((p) => p.f)].join(" ");
  if (pauseText.replace(TOKEN, "").includes("{{")) bad.push(`ch${ch.id} pause: unknown placeholder`);
  // Every chapter starts gentle: 8+ easy starters (level 1) come first, and
  // the questions never get easier as you go (level 1 → 2 → 3).
  const starters = ch.questions.filter((q) => q.level === 1);
  if (starters.length < 8) bad.push(`ch${ch.id}: needs at least 8 easy starter questions (has ${starters.length})`);
  if (ch.questions.some((q, i) => i && q.level < ch.questions[i - 1].level)) bad.push(`ch${ch.id}: questions aren't ordered easy → hard`);
  // Chapters with a pop-culture set: 25 SAT-style passages + 20 extra practice,
  // plus a benchmark question in some, and exactly one benchmark.
  const pop = ch.questions.filter((q) => q.rule && q.level === 3);
  if (pop.length) {
    const bmExtra = ch.questions.filter((q) => q.benchmark && /-bm$/.test(q.id)).length;
    const hardest = ch.questions.filter((q) => q.level === 4).length;
    if (ch.questions.length !== starters.length + 45 + bmExtra + hardest) bad.push(`ch${ch.id}: ${ch.questions.length} questions (want starters + 45 + benchmark + hard)`);
    if (ch.questions.filter((q) => q.benchmark).length !== 1) bad.push(`ch${ch.id}: needs exactly one benchmark`);
  }
  // Hard questions (level 4) need a rule line like the SAT-style passages.
  if (ch.questions.some((q) => q.level === 4 && !q.rule)) bad.push(`ch${ch.id}: hard questions need a rule line`);
  if (ch.questions.length - starters.length < 20) bad.push(`ch${ch.id}: needs at least 20 practice questions after the starters`);
  // The lesson defines a term before the chapter (or an earlier one) uses it.
  const taught = SW.chapters.slice(0, SW.chapters.indexOf(ch) + 1).map((c) => [c.pause.summary, ...c.pause.rules].join(" ")).join(" ");
  for (const [term, re] of [["IC", /\bIC\b/], ["DC", /\bDC\b/], ["FANBOYS", /FANBOYS/]]) {
    const lesson = [ch.pause.summary, ...ch.pause.rules, ch.pause.example].join(" ");
    if (re.test(lesson) && !new RegExp(`\\*\\*[^*]*\\(${term}\\)\\*\\*|\\*\\*${term}\\*\\* =`).test(taught)) bad.push(`ch${ch.id}: lesson uses ${term} before it's defined`);
  }
  if (!ch.pause.patterns.length || !ch.pause.example) bad.push(`ch${ch.id}: lesson needs patterns and an example`);
  for (const q of ch.questions) {
    checkCommon(q.id, q, []);
    if (q.shortcut) {
      const f = q.forms || [];
      if (f.length !== 4) { bad.push(`${q.id}: forms missing`); continue; }
      let pool = [0, 1, 2, 3];
      if (q.shortcut === "2:1") {
        if (pool.filter((i) => f[i] === "x").length !== 1) bad.push(`${q.id}: 2:1 needs exactly one non-verb`);
        pool = pool.filter((i) => f[i] !== "x");
      } else if (f.includes("x")) bad.push(`${q.id}: 3:1 can't have a non-verb`);
      const s = pool.filter((i) => f[i] === "s"), p = pool.filter((i) => f[i] === "p");
      const odd = s.length === 1 && p.length === pool.length - 1 ? s[0] : p.length === 1 && s.length === pool.length - 1 ? p[0] : -1;
      if (odd !== q.answer) bad.push(`${q.id}: ${q.shortcut} odd-one-out (${odd}) is not the answer (${q.answer})`);
    }
  }
}

// ---------- vocab ----------
for (const w of SW.vocab.WORDS) {
  const tag = `vocab:${w.id}`;
  checkCommon(tag, w, [w.clue]);
  for (const k of ["word", "pos", "definition", "root", "clue"]) if (!w[k]) bad.push(`${tag}: missing ${k}`);
  for (const k of ["synonyms", "antonyms"]) {
    if (!Array.isArray(w[k]) || w[k].length < (w.bank && k === "antonyms" ? 1 : 2)) bad.push(`${tag}: needs at least ${w.bank && k === "antonyms" ? 1 : 2} ${k} for the flashcard back`);
    else if (w[k].some((x) => x.toLowerCase() === w.word.toLowerCase())) bad.push(`${tag}: ${k} include the word itself`);
  }
  if (w.synonyms && w.antonyms && w.synonyms.some((x) => w.antonyms.includes(x))) bad.push(`${tag}: a word is both a synonym and an antonym`);
  if (w.bank) {
    if (/\b(a|an)\s+(______|\[\[)/i.test(w.text)) bad.push(`${tag}: "a/an" right before the word (the choices start with different sounds)`);
    if ((w.text.match(/______/g) || []).length > 1) bad.push(`${tag}: more than one blank`);
    if (w.choices.length !== 4 || new Set(w.choices.map((c) => c.toLowerCase())).size !== 4) bad.push(`${tag}: needs 4 distinct choices (${w.choices.join(" | ")})`);
    if (!["noun", "verb", "adjective", "adverb"].includes(w.pos)) bad.push(`${tag}: unknown part of speech ${w.pos}`);
    if (w.definition.length < 8 || w.root.length < 3) bad.push(`${tag}: definition or root too short`);
    if ([...w.synonyms, ...w.antonyms].some((x) => /^[—–-]+$/.test(x))) bad.push(`${tag}: placeholder dash in synonyms/antonyms`);
  }
  if (w.format === "blank") {
    if (!w.text.includes("______")) bad.push(`${tag}: blank format needs ______`);
    if (w.choices[w.answer] !== w.word) bad.push(`${tag}: correct choice should be the word itself`);
  } else if (w.format === "meaning") {
    const m = /\[\[([^\]]+)\]\]/.exec(w.text);
    if (!m) bad.push(`${tag}: meaning format needs [[word]]`);
    else if (!m[1].toLowerCase().startsWith(w.word.slice(0, Math.min(5, w.word.length)).toLowerCase())) bad.push(`${tag}: underlined "${m[1]}" isn't a form of "${w.word}"`);
  } else bad.push(`${tag}: format must be blank or meaning`);
}

// Bank lines that were skipped as duplicates of an existing word.
{
  const seen = new Map();
  for (const [, line] of SW.VOCAB_BANK) {
    const word = line.split("|")[0].trim().toLowerCase();
    seen.set(word, (seen.get(word) || 0) + 1);
  }
  const dupes = [...seen].filter(([, n]) => n > 1).map(([w]) => w);
  if (dupes.length) bad.push(`vocab bank: duplicate words ${dupes.join(", ")}`);
  const original = new Set(SW.vocab.WORDS.filter((w) => !w.bank).map((w) => w.word.toLowerCase()));
  const clash = [...seen.keys()].filter((w) => original.has(w));
  if (clash.length) bad.push(`vocab bank: already in the Vault ${clash.join(", ")}`);
}

// ---------- derby questions ----------
{
  let seed = 42;
  const rand = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);
  const words = SW.vocab.WORDS;
  const owner = (text, field) => words.filter((x) => (Array.isArray(x[field]) ? x[field].includes(text) : x[field] === text));
  let made = 0;
  for (const w of words) for (const kind of ["context", "definition", "synonym", "antonym"]) for (let i = 0; i < (w.bank ? 4 : 50); i++) {
    const q = SW.derby.makeQuestion(w, kind, rand);
    const tag = `derby:${w.id}:${kind}`;
    made++;
    if (q.choices.length !== 4 || new Set(q.choices.map((c) => c.toLowerCase())).size !== 4) { bad.push(`${tag}: needs 4 distinct choices (${q.choices.join(" | ")})`); break; }
    const right = q.choices[q.answer];
    const wrong = q.choices.filter((_, k) => k !== q.answer);
    if (kind === "context" && right !== w.choices[w.answer]) bad.push(`${tag}: wrong answer key`);
    if (kind === "definition") {
      if (right !== w.definition) bad.push(`${tag}: answer isn't the definition`);
      for (const d of wrong) if (owner(d, "definition").some((x) => SW.derby.related(w, x))) bad.push(`${tag}: distractor from a related word: ${d}`);
    }
    if (kind === "synonym" || kind === "antonym") {
      const list = kind === "synonym" ? w.synonyms : w.antonyms;
      if (!list.includes(right)) bad.push(`${tag}: answer "${right}" isn't a listed ${kind}`);
      for (const d of wrong) {
        if (list.includes(d)) bad.push(`${tag}: two correct answers (${d})`);
        if (kind === "antonym" && w.synonyms.includes(d)) continue; // the synonym trap
        if (owner(d, "synonyms").some((x) => SW.derby.related(w, x))) bad.push(`${tag}: distractor "${d}" comes from a related word`);
      }
    }
    if (bad.length > 20) break;
  }
  console.log("derby questions generated", made);
}

// ---------- Generated pools (js/curriculum/gen/) ----------
// Same checks as hand-written questions, plus: a rule line, no duplicate text,
// and every choice/note free of leftover template markers.
let generated = 0;
for (const ch of SW.chapters) {
  const texts = new Set();
  for (const q of ch.pool || []) {
    generated++;
    checkCommon(q.id, q, [q.rule]);
    if (!q.rule || q.rule.length < 10) bad.push(`${q.id}: needs a rule line`);
    if (!q.notes[q.answer].startsWith("Correct")) bad.push(`${q.id}: the answer's note should start with "Correct"`);
    const key = q.text + "|" + q.choices.join("|");
    if (texts.has(key)) bad.push(`${q.id}: duplicate`);
    texts.add(key);
    if (/undefined|NaN|\$\{/.test([q.text, ...q.choices, ...q.notes, q.rule].join(" "))) bad.push(`${q.id}: template leftover`);
    if (/\s{2,}|\s[,.;:]/.test(q.text.replace("______", "BLANK"))) bad.push(`${q.id}: spacing "${q.text}"`);
  }
}
console.log("generated questions", generated);

// Every word needs its own definition, or a quiz could show two identical answers.
const defSeen = new Map();
for (const w of SW.vocab.WORDS) {
  const d = w.definition.trim().toLowerCase();
  if (defSeen.has(d)) bad.push(`vocab ${w.word}: same definition as ${defSeen.get(d)}`);
  else defSeen.set(d, w.word);
}

// ---------- Vocab Fishing ----------
// Every cast: 4 fish with distinct definitions, exactly one right, no near-synonym distractors.
let casts = 0;
for (const w of SW.vocab.WORDS) {
  for (let k = 0; k < (w.bank ? 4 : 40); k++) {
    const c = SW.fishing.makeCast(w);
    casts++;
    const defs = c.fish.map((f) => f.def);
    if (c.fish.length !== 4 || new Set(defs).size !== 4) bad.push(`fishing ${w.word}: needs 4 distinct definitions`);
    if (c.fish.filter((f) => f.right).length !== 1 || c.fish[c.answer].wordId !== w.id) bad.push(`fishing ${w.word}: exactly one right fish`);
    if (c.fish.some((f) => !f.right && SW.derby.related(w, SW.vocab.WORDS.find((x) => x.id === f.wordId)))) bad.push(`fishing ${w.word}: related distractor`);
  }
}
for (const spot of SW.fishing.SPOTS) if (SW.fishing.poolFor(spot.id, { words: {} }).length < SW.fishing.RULES.casts) bad.push(`fishing spot ${spot.id}: fewer words than casts`);
console.log("fishing casts generated", casts);

// ---------- Rule names (js/curriculum/rules.js, the Diagnostic screen) ----------
const fallback = {};
for (const q of SW.questions) {
  const ch = SW.chapterById(q.chapterId);
  const name = SW.ruleName(q);
  if (!name) bad.push(`${q.id}: no rule name`);
  else if (!ch.bonus && name === ch.title) fallback[q.skill] = (fallback[q.skill] || 0) + 1;
  if (!SW.ruleExplain(q) || SW.ruleExplain(q).length < 20) bad.push(`${q.id}: no explanation`);
}
for (const [skill, n] of Object.entries(fallback)) bad.push(`skill "${skill}" (${n}×) has no rule name in js/curriculum/rules.js`);

console.log("chapters", SW.chapters.map((c) => `${c.id}:${c.questions.length}`).join(" "), "| questions", SW.questions.length,
  "| vocab words", SW.vocab.WORDS.length, `(${SW.vocab.WORDS.filter((w) => w.format === "blank").length} blank, ${SW.vocab.WORDS.filter((w) => w.format === "meaning").length} meaning)`);
// Casts are original: no real athletes, singers or celebrities, and no
// characters or places from books, films, shows, anime or games.
const REAL_NAMES = /\b(Harry|Hermione|Ron|Draco|Hogwarts|Ronaldo|Messi|Mbapp[eé]|Haaland|Neymar|LeBron|Steph|Kobe|Giannis|Caitlin|Naruto|Goku|Mikasa|Luffy|Tanjiro|Nezuko|Vegeta|Wanda|Tony|Bruce|Clark|Natasha|Peter|Diana|Taylor|Beyonc[eé]|Rihanna|Ariana|Billie|Dua|Bruno|Olivia)\b|web-sling|Great Hall|broomstick/i;
for (const t of SW.themes) {
  const text = [t.label, t.tagline, t.place, t.craft, t.event, ...t.people.map((p) => p.name)].join(" | ");
  const hit = text.match(REAL_NAMES);
  if (hit) bad.push(`cast ${t.id}: real person or franchise character "${hit[0]}"`);
  if (t.people.length !== 8) bad.push(`cast ${t.id}: needs 8 people`);
}

console.log(bad.length ? "PROBLEMS:\n" + bad.join("\n") : "all content checks passed");
process.exit(bad.length ? 1 : 0);
