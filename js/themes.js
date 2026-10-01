// SatWizz casts that get swapped into every question.
// Each cast has 8 people; every question picks 3 of them (stable per question)
// for its {{NAME_1..3}} slots. Placeholders map to cast fields: {{NAME_1..3}} -> people, {{LOCATION}} -> place,
// {{SKILL}} -> craft, {{EVENT}} -> event. Flavor is always used mid-sentence.
// `price` is in Sparks; 0 means free. Paid packs are Character Casts in the Shop (1,000 ⚡).
//
// Content rule: every cast is original. No real people (athletes, singers,
// celebrities), no characters from books, films, shows, anime or games, no
// franchise titles, brand names or coined proprietary terms, and nothing that
// implies endorsement. Cast ids never change, so purchases in old saves keep
// working when a pack is renamed.
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
      { name: "Maya", pro: "she" },
      { name: "Leo", pro: "he" },
      { name: "Priya", pro: "she" },
      { name: "Diego", pro: "he" },
      { name: "Alex", pro: "they" },
    ],
    place: "the library",
    craft: "public speaking",
    event: "the state finals",
  },
  {
    id: "wizard",
    icon: "🪄",
    price: 1000, // Character Cast (Shop)
    label: "Wizard Academy",
    tagline: "Rowan, Isolde and Thaddeus",
    people: [
      { name: "Rowan", pro: "he" },
      { name: "Isolde", pro: "she" },
      { name: "Thaddeus", pro: "he" },
      { name: "Wren", pro: "she" },
      { name: "Barnaby", pro: "he" },
      { name: "Elowen", pro: "she" },
      { name: "Silas", pro: "he" },
      { name: "Marigold", pro: "she" },
    ],
    place: "the castle library",
    craft: "potion-making",
    event: "the spell-casting final",
  },
  {
    id: "football",
    icon: "⚽",
    price: 1000, // Character Cast (Shop)
    label: "Football Stars",
    tagline: "Kofi, Inés and Rafael",
    people: [
      { name: "Kofi", pro: "he" },
      { name: "Inés", pro: "she" },
      { name: "Rafael", pro: "he" },
      { name: "Amara", pro: "she" },
      { name: "Lukas", pro: "he" },
      { name: "Sofía", pro: "she" },
      { name: "Tomás", pro: "he" },
      { name: "Nia", pro: "she" },
    ],
    place: "the training ground",
    craft: "free kicks",
    event: "the cup final",
  },
  {
    id: "hoops",
    icon: "🏀",
    price: 1000, // Character Cast (Shop)
    label: "Hoops Stars",
    tagline: "Darius, Keisha and Malik",
    people: [
      { name: "Darius", pro: "he" },
      { name: "Keisha", pro: "she" },
      { name: "Malik", pro: "he" },
      { name: "Imani", pro: "she" },
      { name: "Andre", pro: "he" },
      { name: "Tamsin", pro: "she" },
      { name: "Tobias", pro: "he" },
      { name: "Zara", pro: "she" },
    ],
    place: "the practice gym",
    craft: "fadeaway jumpers",
    event: "Game 7",
  },
  {
    id: "anime",
    icon: "🍥",
    price: 1000, // Character Cast (Shop)
    label: "Anime Heroes",
    tagline: "Haruto, Aiko and Ren",
    people: [
      { name: "Haruto", pro: "he" },
      { name: "Aiko", pro: "she" },
      { name: "Ren", pro: "he" },
      { name: "Yuki", pro: "she" },
      { name: "Kaito", pro: "he" },
      { name: "Hana", pro: "she" },
      { name: "Sora", pro: "they" },
      { name: "Mei", pro: "she" },
    ],
    place: "the training dojo",
    craft: "energy blasts",
    event: "the tournament final",
  },
  {
    id: "heroes",
    icon: "🦸",
    price: 1000, // Character Cast (Shop)
    label: "Superhero Squad",
    tagline: "Marcus, Elena and Jasper",
    people: [
      { name: "Marcus", pro: "he" },
      { name: "Elena", pro: "she" },
      { name: "Jasper", pro: "he" },
      { name: "Celeste", pro: "she" },
      { name: "Theo", pro: "he" },
      { name: "Iris", pro: "she" },
      { name: "Dante", pro: "he" },
      { name: "Selene", pro: "she" },
    ],
    place: "the hero tower",
    craft: "flying",
    event: "the final battle",
  },
  {
    id: "pop",
    icon: "🎤",
    price: 1000, // Character Cast (Shop)
    label: "Pop Stars",
    tagline: "Lyra, Jade and Marco",
    people: [
      { name: "Lyra", pro: "she" },
      { name: "Jade", pro: "she" },
      { name: "Marco", pro: "he" },
      { name: "Skye", pro: "she" },
      { name: "Nadia", pro: "she" },
      { name: "Remy", pro: "he" },
      { name: "Ivy", pro: "she" },
      { name: "Kai", pro: "he" },
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
