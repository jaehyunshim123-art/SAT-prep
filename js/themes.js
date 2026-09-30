// SatWizz casts that get swapped into every question.
// Tokens in questions: {A} {B} {C} (names), {A_his} / {A_him} (pronouns),
// {PLACE}, {CRAFT}, {EVENT} (theme flavor, always used mid-sentence).
window.SatWizz = window.SatWizz || {};

window.SatWizz.defaultThemeId = "everyday";

window.SatWizz.themes = [
  {
    id: "everyday",
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
    id: "heroes",
    label: "Superheroes",
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
