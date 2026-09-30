// Content checks for the SatWizz curriculum. Run from the repo root:
//   node scripts/validate-content.js
// Checks every question has one blank, 4 distinct choices, a valid answer,
// a note per choice and only known placeholders, and that 3:1 / 2:1 shortcut
// questions really have the odd one out as the answer.
const repo = require("path").resolve(__dirname, "..");
global.window = {};
for (let i = 1; i <= 10; i++) require(`${repo}/js/curriculum/ch${i}.js`);
require(`${repo}/js/questions.js`);
require(`${repo}/js/themes.js`);
const SW = window.SatWizz;
const TOKEN = /\{\{(NAME_[123](_POSS|_OBJ)?|LOCATION|EVENT|SKILL)\}\}/g;
const bad = [];
const ids = new Set();
const fill = (t, cast) => t.replace(TOKEN, (m, k) => {
  const n = k.match(/^NAME_(\d)(_POSS|_OBJ)?$/);
  if (n) { const p = cast.people[n[1] - 1]; return n[2] ? SW.pronouns[p.pro][n[2] === "_POSS" ? "his" : "him"] : p.name; }
  return { LOCATION: cast.place, EVENT: cast.event, SKILL: cast.craft }[k];
});
const theyCast = { people: [{ name: "Alex", pro: "they" }, { name: "Sky", pro: "they" }, { name: "Jo", pro: "they" }], place: "the gym", craft: "chess", event: "the final" };
for (const ch of SW.chapters) {
  const pauseText = [ch.pause.summary, ch.pause.example, ...ch.pause.rules, ...ch.pause.patterns.map((p) => p.f)].join(" ");
  if (pauseText.replace(TOKEN, "").includes("{{")) bad.push(`ch${ch.id} pause: unknown placeholder`);
  if (!ch.bonus && ch.questions.length !== 20) bad.push(`ch${ch.id}: ${ch.questions.length} questions (want 20)`);
  for (const q of ch.questions) {
    const tag = q.id;
    if (ids.has(q.id)) bad.push(`${tag}: duplicate id`); ids.add(q.id);
    if ((q.text.match(/______/g) || []).length !== 1) bad.push(`${tag}: needs exactly one blank`);
    if (q.choices.length !== 4 || new Set(q.choices).size !== 4) bad.push(`${tag}: needs 4 distinct choices`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) bad.push(`${tag}: answer out of range`);
    if (!Array.isArray(q.notes) || q.notes.length !== 4 || q.notes.some((n) => !n || n.length < 8)) bad.push(`${tag}: needs 4 notes`);
    const all = [q.text, ...q.choices, ...(q.notes || [])].join(" ");
    if (all.replace(TOKEN, "").match(/\{\{|\}\}/)) bad.push(`${tag}: unknown placeholder`);
    if (fill(all, theyCast).includes("{{")) bad.push(`${tag}: unfilled with they-cast`);
    if (/\{\{(LOCATION|EVENT|SKILL)\}\}/.test(q.text.split("______")[0].slice(0, 12)) && q.text.startsWith("{{")) bad.push(`${tag}: flavor token at sentence start`);
    if (q.shortcut) {
      const f = q.forms || [];
      if (f.length !== 4) { bad.push(`${tag}: forms missing`); continue; }
      let pool = [0, 1, 2, 3];
      if (q.shortcut === "2:1") {
        const x = pool.filter((i) => f[i] === "x");
        if (x.length !== 1) bad.push(`${tag}: 2:1 needs exactly one non-verb`);
        pool = pool.filter((i) => f[i] !== "x");
      } else if (f.includes("x")) bad.push(`${tag}: 3:1 can't have a non-verb`);
      const s = pool.filter((i) => f[i] === "s"), p = pool.filter((i) => f[i] === "p");
      const odd = s.length === 1 && p.length === pool.length - 1 ? s[0] : p.length === 1 && s.length === pool.length - 1 ? p[0] : -1;
      if (odd !== q.answer) bad.push(`${tag}: ${q.shortcut} odd-one-out (${odd}) is not the answer (${q.answer})`);
    }
  }
}
const ch3 = SW.chapterById(3).questions.filter((q) => q.shortcut).length;
console.log("chapters", SW.chapters.map((c) => `${c.id}:${c.questions.length}`).join(" "), "| total", SW.questions.length, "| ch3 shortcut-tagged", ch3);
console.log("shortcut questions", SW.questions.filter((q) => q.shortcut).map((q) => `${q.id}(${q.shortcut})`).join(" "));
console.log(bad.length ? "PROBLEMS:\n" + bad.join("\n") : "all content checks passed");
process.exit(bad.length ? 1 : 0);
