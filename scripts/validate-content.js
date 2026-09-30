// Content checks for SatWizz. Run from the repo root:
//   node scripts/validate-content.js
// Curriculum: every question has exactly one target (a ______ blank or an
// [[underlined]] segment), 4 distinct choices, a valid answer, a note per
// choice and only known placeholders; 3:1 / 2:1 shortcut questions really
// have the odd one out as the answer.
// Vocab Vault: the same checks, plus a definition, root, context clue, synonyms/antonyms,
// and the right target for each format (blank vs. underlined word).
const repo = require("path").resolve(__dirname, "..");
global.window = {};
require(`${repo}/js/themes.js`);
require(`${repo}/js/questions.js`);
for (let i = 1; i <= 10; i++) require(`${repo}/js/curriculum/ch${i}.js`);
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
  if (!ch.bonus && ch.questions.length !== 20) bad.push(`ch${ch.id}: ${ch.questions.length} questions (want 20)`);
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
    if (!Array.isArray(w[k]) || w[k].length < 2) bad.push(`${tag}: needs at least 2 ${k} for the flashcard back`);
    else if (w[k].some((x) => x.toLowerCase() === w.word.toLowerCase())) bad.push(`${tag}: ${k} include the word itself`);
  }
  if (w.synonyms && w.antonyms && w.synonyms.some((x) => w.antonyms.includes(x))) bad.push(`${tag}: a word is both a synonym and an antonym`);
  if (w.format === "blank") {
    if (!w.text.includes("______")) bad.push(`${tag}: blank format needs ______`);
    if (w.choices[w.answer] !== w.word) bad.push(`${tag}: correct choice should be the word itself`);
  } else if (w.format === "meaning") {
    const m = /\[\[([^\]]+)\]\]/.exec(w.text);
    if (!m) bad.push(`${tag}: meaning format needs [[word]]`);
    else if (!m[1].toLowerCase().startsWith(w.word.slice(0, Math.min(5, w.word.length)).toLowerCase())) bad.push(`${tag}: underlined "${m[1]}" isn't a form of "${w.word}"`);
  } else bad.push(`${tag}: format must be blank or meaning`);
}

console.log("chapters", SW.chapters.map((c) => `${c.id}:${c.questions.length}`).join(" "), "| questions", SW.questions.length,
  "| vocab words", SW.vocab.WORDS.length, `(${SW.vocab.WORDS.filter((w) => w.format === "blank").length} blank, ${SW.vocab.WORDS.filter((w) => w.format === "meaning").length} meaning)`);
console.log(bad.length ? "PROBLEMS:\n" + bad.join("\n") : "all content checks passed");
process.exit(bad.length ? 1 : 0);
