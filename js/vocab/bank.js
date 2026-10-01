// SatWizz Vocab Vault word bank loader. Each js/vocab/bank-*.js file calls
//   window.SatWizzBank("core" | "advanced", `word|pos|definition|synonyms|antonyms|root|sentence`)
// with one word per line:
//   • pos: n, v, adj or adv
//   • synonyms / antonyms: comma-separated
//   • sentence: the word's slot is ______ (base form, never right after
//     "a"/"an"), and it may use cast slots like {{NAME_1}}
// js/vocab.js turns every line into a full Vault word (flashcard, sprint
// question, Fishing cast, Derby question). Load these before js/vocab.js.
(function () {
  "use strict";
  const SW = (window.SatWizz = window.SatWizz || {});
  SW.VOCAB_BANK = SW.VOCAB_BANK || [];
  window.SatWizzBank = function (level, text) {
    for (const raw of String(text).split("\n")) {
      const line = raw.trim();
      if (line && !line.startsWith("#")) SW.VOCAB_BANK.push([level, line]);
    }
  };
})();
