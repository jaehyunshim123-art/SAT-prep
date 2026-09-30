// SatWizz casts that get swapped into every question.
// Tokens in questions: {A} {B} {C} (names), {A_his} / {A_him} (pronouns),
// {PLACE}, {CRAFT}, {EVENT} (theme flavor, always used mid-sentence).
// `price` is in Sparks; 0 means free. Paid packs are sold in the Wizz Shop.
window.SatWizz = window.SatWizz || {};

window.SatWizz.defaultThemeId = "everyday";

window.SatWizz.themes = [
  {
    id: "everyday",
    icon: "🎒",
    price: 0,
    label: "Everyday",
    tagline: "Classmates you might actually know",
    people: [
      { name: "Maya", pro: "she" },
      { name: "Jordan", pro: "he" },
      { name: "Priya", pro: "she" },
    ],
    place: "the library",
    craft: "public speaking",
    event: "the state finals",
  },
  {
    id: "wizard",
    icon: "🪄",
    price: 0,
    label: "Harry Potter",
    tagline: "Hogwarts, but make it grammar",
    people: [
      { name: "Harry", pro: "he" },
      { name: "Hermione", pro: "she" },
      { name: "Ron", pro: "he" },
    ],
    place: "the Great Hall",
    craft: "potion-making",
    event: "the Quidditch final",
  },
  {
    id: "football",
    icon: "⚽",
    price: 0,
    label: "Football stars",
    tagline: "Ronaldo, Messi and Aitana",
    people: [
      { name: "Ronaldo", pro: "he" },
      { name: "Messi", pro: "he" },
      { name: "Aitana", pro: "she" },
    ],
    place: "the training ground",
    craft: "free kicks",
    event: "the Champions League final",
  },
  {
    id: "hoops",
    icon: "🏀",
    price: 0,
    label: "Basketball",
    tagline: "LeBron, Steph and Caitlin",
    people: [
      { name: "LeBron", pro: "he" },
      { name: "Steph", pro: "he" },
      { name: "Caitlin", pro: "she" },
    ],
    place: "the practice gym",
    craft: "fadeaway jumpers",
    event: "Game 7",
  },
  {
    id: "anime",
    icon: "🍥",
    price: 100,
    label: "Anime Pack",
    tagline: "Naruto, Mikasa and Goku",
    people: [
      { name: "Naruto", pro: "he" },
      { name: "Mikasa", pro: "she" },
      { name: "Goku", pro: "he" },
    ],
    place: "the training dojo",
    craft: "energy blasts",
    event: "the tournament final",
  },
  {
    id: "heroes", // was the free "Superheroes" cast; anyone already using it keeps it
    icon: "🦸",
    price: 200,
    label: "Marvel Pack",
    tagline: "Peter, Wanda and Tony",
    people: [
      { name: "Peter", pro: "he" },
      { name: "Wanda", pro: "she" },
      { name: "Tony", pro: "he" },
    ],
    place: "Avengers Tower",
    craft: "web-slinging",
    event: "the final battle",
  },
  {
    id: "pop",
    icon: "🎤",
    price: 0,
    label: "Pop icons",
    tagline: "Taylor, Beyoncé and Olivia",
    people: [
      { name: "Taylor", pro: "she" },
      { name: "Beyoncé", pro: "she" },
      { name: "Olivia", pro: "she" },
    ],
    place: "the recording studio",
    craft: "songwriting",
    event: "the Grammys",
  },
];

// Custom casts may pick any of these. Question templates only use the
// possessive and object forms so verbs never have to change with "they".
window.SatWizz.pronouns = {
  he: { his: "his", him: "him" },
  she: { his: "her", him: "her" },
  they: { his: "their", him: "them" },
};

// Profile pictures. `price` is in Sparks; 0 means free.
window.SatWizz.defaultAvatarId = "fox";
window.SatWizz.avatars = [
  { id: "fox", emoji: "🦊", label: "Fox", price: 0 },
  { id: "panda", emoji: "🐼", label: "Panda", price: 0 },
  { id: "frog", emoji: "🐸", label: "Frog", price: 0 },
  { id: "owl", emoji: "🦉", label: "Owl", price: 0 },
  { id: "tiger", emoji: "🐯", label: "Tiger", price: 0 },
  { id: "octopus", emoji: "🐙", label: "Octopus", price: 0 },
  { id: "penguin", emoji: "🐧", label: "Penguin", price: 0 },
  { id: "koala", emoji: "🐨", label: "Koala", price: 0 },
  { id: "lion", emoji: "🦁", label: "Lion", price: 0 },
  { id: "turtle", emoji: "🐢", label: "Turtle", price: 0 },
  { id: "bee", emoji: "🐝", label: "Bee", price: 0 },
  { id: "unicorn", emoji: "🦄", label: "Unicorn", price: 0 },
  { id: "rocket", emoji: "🚀", label: "Rocket", price: 100 },
  { id: "brain", emoji: "🧠", label: "Big Brain", price: 120 },
  { id: "dragon", emoji: "🐲", label: "Dragon", price: 150 },
  { id: "wizard", emoji: "🧙", label: "Wizard", price: 150 },
  { id: "crown", emoji: "👑", label: "Crown", price: 250 },
  { id: "galaxy", emoji: "🌌", label: "Galaxy", price: 300 },
];
