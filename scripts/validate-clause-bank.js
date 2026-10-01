// Checks the SAT Wizz: Clause Derby question bank (clause-derby/src/ch1-7.js).
//   node scripts/validate-clause-bank.js
"use strict";
const path = require("path");
const repo = path.resolve(__dirname, "..");
global.window = {};
require(`${repo}/clause-derby/src/bank.js`);
for (let i = 1; i <= 7; i++) require(`${repo}/clause-derby/src/ch${i}.js`);
const B = window.ClauseBank;
const bad = [];

// Franchise and brand titles stay out (people and character names are fine).
const BANNED = /\b(Justice League|Avengers|Marvel|DC Comics|Dragon Ball|Scouter|Hogwarts|Quidditch|Harry Potter|Star Wars|Pok[eé]mon|Grammys?|Champions League|NBA|NFL|FIFA|Olympics?|Olympic|Super Bowl|USC|Thornton)\b/;

// The user's five example questions, with the answer they stated.
const EXAMPLES = [
  ["c1-01", "posts. With"],
  ["c2-01", "is"],
  ["c3-01", "{{NAME_1}}, intending"], // names are cast placeholders (generic until a pack is bought),
  ["c4-01", "measures"],
  ["c5-01", "However,"],
  ["c7-01", "Starlight Letters (Deluxe Edition),"],
];

if (B.chapters.length !== 7) bad.push(`expected 7 chapters, got ${B.chapters.length}`);
const ids = new Set();
for (const ch of B.chapters) {
  if (!ch.title || !ch.short || !ch.focus || !Array.isArray(ch.rules) || ch.rules.length < 3) bad.push(`ch${ch.id}: needs title, short, focus and rules`);
  if (ch.questions.length !== 25) bad.push(`ch${ch.id}: ${ch.questions.length} questions (want 25)`);
  for (const q of ch.questions) {
    const tag = q.id;
    if (ids.has(q.id)) bad.push(`${tag}: duplicate id`);
    ids.add(q.id);
    if (!q.id.startsWith(`c${ch.id}-`)) bad.push(`${tag}: id should start with c${ch.id}-`);
    if ((q.text.match(/______/g) || []).length !== 1) bad.push(`${tag}: needs exactly one ______ blank`);
    if (!Array.isArray(q.choices) || q.choices.length !== 4 || new Set(q.choices).size !== 4) bad.push(`${tag}: needs 4 distinct choices`);
    if (!(Number.isInteger(q.answer) && q.answer >= 0 && q.answer < 4)) bad.push(`${tag}: answer out of range`);
    if (!q.rule || q.rule.length < 15) bad.push(`${tag}: needs a rule line`);
    if (!q.skill) bad.push(`${tag}: needs a skill`);
    if (!Array.isArray(q.notes) || q.notes.length !== 4 || q.notes.some((n) => !n || n.length < 8)) bad.push(`${tag}: needs 4 notes`);
    else if (!/^Correct\b/.test(q.notes[q.answer])) bad.push(`${tag}: the answer's note should start with "Correct"`);
    else if (q.notes.some((n, i) => i !== q.answer && /^Correct\b/.test(n))) bad.push(`${tag}: a wrong choice's note starts with "Correct"`);
    if (!B.STEMS[q.kind]) bad.push(`${tag}: unknown kind ${q.kind}`);
    if ((ch.id === 5) !== (q.kind === "transition")) bad.push(`${tag}: chapter 5 (and only chapter 5) uses the transition stem`);
    const all = [q.text, ...q.choices, q.rule, ...q.notes].join(" ");
    const hit = all.match(BANNED);
    if (hit) bad.push(`${tag}: banned title "${hit[0]}"`);
    if (/\s{2,}/.test(q.text.replace(/______/, "X"))) bad.push(`${tag}: double space in passage`);
  }
}
for (const [id, text] of EXAMPLES) {
  const q = B.chapters.flatMap((c) => c.questions).find((x) => x.id === id);
  if (!q) bad.push(`example ${id} missing`);
  else if (q.choices[q.answer] !== text) bad.push(`example ${id}: answer is "${q.choices[q.answer]}", want "${text}"`);
}

console.log(`chapters ${B.chapters.map((c) => `${c.id}:${c.questions.length}`).join(" ")} | ${ids.size} questions`);
console.log(bad.length ? "PROBLEMS:\n" + bad.join("\n") : "all clause-bank checks passed");
process.exit(bad.length ? 1 : 0);
