// SatWizz casts that get swapped into every question.
// Placeholders map to cast fields: {{NAME_1..3}} -> people, {{LOCATION}} -> place,
// {{SKILL}} -> craft, {{EVENT}} -> event. Flavor is always used mid-sentence.
// `price` is in Sparks; 0 means free. Paid packs are Character Casts in the Shop (500 ⚡).
//
// Content rule: names are fine, but no franchise titles, brand names or coined
// proprietary terms (no "Hogwarts", "Quidditch", "Avengers", league or award
// trademarks), and nothing that implies endorsement.
window.SatWizz = window.SatWizz || {};

window.SatWizz.defaultThemeId = "everyday";

// Packs that were free before version 2 of the save format; older saves keep them.
window.SatWizz.legacyFreeThemes = ["wizard", "football", "hoops", "pop"];

window.SatWizz.themes = [
  {
    id: "everyday",
    icon: "🎒",
    price: 0,
    label: "Everyday",
    tagline: "John, Jane and Sam",
    people: [
      { name: "John", pro: "he" },
      { name: "Jane", pro: "she" },
      { name: "Sam", pro: "they" },
    ],
    place: "the library",
    craft: "public speaking",
    event: "the state finals",
  },
  {
    id: "wizard",
    icon: "🪄",
    price: 500, // Character Cast (Shop)
    label: "Wizard School",
    tagline: "Harry, Hermione and Ron",
    people: [
      { name: "Harry", pro: "he" },
      { name: "Hermione", pro: "she" },
      { name: "Ron", pro: "he" },
    ],
    place: "the Great Hall",
    craft: "potion-making",
    event: "the broomstick final",
  },
  {
    id: "football",
    icon: "⚽",
    price: 500, // Character Cast (Shop)
    label: "Football Legends",
    tagline: "Ronaldo, Messi and Aitana",
    people: [
      { name: "Ronaldo", pro: "he" },
      { name: "Messi", pro: "he" },
      { name: "Aitana", pro: "she" },
    ],
    place: "the training ground",
    craft: "free kicks",
    event: "the European final",
  },
  {
    id: "hoops",
    icon: "🏀",
    price: 500, // Character Cast (Shop)
    label: "Hoops Legends",
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
    price: 500, // Character Cast (Shop)
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
    id: "heroes",
    icon: "🦸",
    price: 500, // Character Cast (Shop)
    label: "Superhero Pack",
    tagline: "Peter, Wanda and Tony",
    people: [
      { name: "Peter", pro: "he" },
      { name: "Wanda", pro: "she" },
      { name: "Tony", pro: "he" },
    ],
    place: "the hero tower",
    craft: "web-slinging",
    event: "the final battle",
  },
  {
    id: "pop",
    icon: "🎤",
    price: 500, // Character Cast (Shop)
    label: "Pop Icons",
    tagline: "Taylor, Beyoncé and Olivia",
    people: [
      { name: "Taylor", pro: "she" },
      { name: "Beyoncé", pro: "she" },
      { name: "Olivia", pro: "she" },
    ],
    place: "the recording studio",
    craft: "songwriting",
    event: "the awards show",
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
  { id: "rocket", emoji: "🚀", label: "Rocket", price: 500 },
  { id: "brain", emoji: "🧠", label: "Big Brain", price: 500 },
  { id: "dragon", emoji: "🐲", label: "Dragon", price: 500 },
  { id: "wizard", emoji: "🧙", label: "Wizard", price: 500 },
  { id: "crown", emoji: "👑", label: "Crown", price: 500 },
  { id: "galaxy", emoji: "🌌", label: "Galaxy", price: 500 },
];
