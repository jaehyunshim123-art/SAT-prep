// The hardest questions (level 4) for the three chapters where strong students
// still lose the most points: Verb or Not a Verb? (id 3), Semicolons, Colons &
// Dashes (id 6) and Extra Information (id 7). Long passages, close answer
// choices and the traps real high-difficulty questions use. They come last in
// each chapter, appear on every chapter test and fill the Challenge set.
// Every question has a rule line and a note for each choice.
// Load after the other chapter files.
(function () {
  "use strict";
  const SW = window.SatWizz;
  const hard = (questions) => questions.map((q) => ({ ...q, level: 4 }));

  // ---------- Chapter 4 (id 3): Verb or Not a Verb? ----------
  SW.curriculum.addChapter({
    id: 3,
    questions: hard([
      {
        id: "h3-1", skill: "Main verb after a long subject",
        text: "The archive of handwritten letters that {{NAME_1}} discovered in an abandoned farmhouse, many of them written during a single harsh winter, ______ historians a rare look at daily life in the region.",
        choices: ["offers", "offering", "which offers", "having offered"],
        answer: 0,
        rule: "A long subject still needs its own main verb. Skip the describing parts to find the subject (“The archive”) and give it a verb.",
        notes: [
          "Skip “of handwritten letters… winter” and you get “The archive offers historians a rare look.” The subject finally gets its main verb.",
          "“Offering” is an -ing describer. The archive never gets a main verb, so the sentence is a fragment.",
          "“Which offers” starts another describing clause. The archive is described again but still does nothing.",
          "“Having offered” is a describer too, so the sentence still has no main verb.",
        ],
      },
      {
        id: "h3-2", skill: "Appositive with a describer",
        text: "Marine biologist {{NAME_2}} studies octopuses, animals ______ of changing both the color and the texture of their skin in less than a second.",
        choices: ["capable", "are capable", "they are capable", "that are being capable"],
        answer: 0,
        rule: "After a complete sentence, a comma can add a noun phrase that renames something (“animals capable of…”). That phrase has no main verb of its own.",
        notes: [
          "“Animals capable of changing…” renames “octopuses.” The sentence already has its main verb (studies), so the add-on is just a describer.",
          "“Animals are capable…” is a second IC joined by only a comma: a comma splice.",
          "“They are capable…” is also a complete sentence after a comma, so it's a comma splice.",
          "“That are being capable” is wordy and ungrammatical; “capable” doesn't take “being” here.",
        ],
      },
      {
        id: "h3-3", skill: "Participle (non-verb) opener",
        text: "______ in 1902 to measure tiny changes in air pressure, the instrument now sits in a glass case at the town museum, where {{NAME_1}} first saw it as a child.",
        choices: ["Designed", "Designing", "It was designed", "The instrument was designed"],
        answer: 0,
        rule: "When the main clause comes after the comma, the opener is a describer. Use the -ed form when the subject had the action done to it.",
        notes: [
          "The instrument WAS designed (someone designed it), so the -ed describer “Designed in 1902…” fits, and the main verb comes later: sits.",
          "“Designing” would mean the instrument did the designing itself.",
          "“It was designed…” is a full IC, so with only a comma before “the instrument now sits” this is a comma splice.",
          "This is also a full IC followed by a comma and another IC: a comma splice.",
        ],
      },
      {
        id: "h3-4", skill: "Title + name + main verb",
        text: "In a recent interview, conservationist ______ that restoring wetlands could reduce flooding in nearby towns by nearly a third.",
        choices: ["{{NAME_3}} argued", "{{NAME_3}}, arguing", "{{NAME_3}}, who argued", "{{NAME_3}} arguing"],
        answer: 0,
        rule: "A title right before a name takes no comma, and the person still needs a main verb.",
        notes: [
          "“Conservationist {{NAME_3}} argued that…” gives the subject a real verb, with no comma between the title and the name.",
          "“Arguing” is only a describer, and the comma splits the title from the name.",
          "“Who argued” describes {{NAME_3}} but leaves the sentence without a main verb.",
          "“Arguing” can't be the main verb, so this is a fragment.",
        ],
      },
      {
        id: "h3-5", skill: "Main verb after a long subject",
        text: "The research team, led by engineer {{NAME_1}} and funded by a small regional grant, ______ a battery that can be recharged using only seawater.",
        choices: ["developed", "developing", "having developed", "to develop"],
        answer: 0,
        rule: "Two describers between commas (“led by…,” “funded by…”) don't count as the main verb. The subject (“The research team”) still needs one.",
        notes: [
          "Skip the middle: “The research team developed a battery.” That's the main verb the sentence needs.",
          "“Developing” is a describer, so the team never gets a main verb.",
          "“Having developed” is a describer too.",
          "“To develop” can't be the main verb of a sentence.",
        ],
      },
      {
        id: "h3-6", skill: "Main verb needed",
        text: "To reduce the glare on its solar panels, the company ______ a thin coating inspired by the tiny bumps on a moth's eye.",
        choices: ["applied", "applying", "to apply", "having applied"],
        answer: 0,
        rule: "An opening “to” phrase explains why; it isn't the main verb. The subject after the comma still needs its own verb.",
        notes: [
          "“The company applied a thin coating” is the IC. “To reduce the glare…” just explains why.",
          "“Applying” leaves the company without a main verb.",
          "“To apply” repeats the “to” form; there's still no main verb.",
          "“Having applied” is a describer, not a main verb.",
        ],
      },
      {
        id: "h3-7", skill: "Participle (non-verb) in the middle",
        text: "The first prototype failed after only three trials; the second, ______ with a stronger aluminum frame, survived more than two hundred.",
        choices: ["built", "was built", "it was built", "which built"],
        answer: 0,
        rule: "The part between commas is extra description. If the clause already has its main verb (“survived”), the middle needs a describer, not a verb.",
        notes: [
          "“The second, built with a stronger frame, survived…” The main verb is “survived”; “built…” just describes the second prototype.",
          "“Was built” adds a second main verb with nothing joining it to “survived.”",
          "“It was built…” drops a full IC into the middle of another one.",
          "“Which built” says the prototype did the building, which makes no sense.",
        ],
      },
      {
        id: "h3-8", skill: "Main verb after a long subject",
        text: "Whether the ancient walls were built for defense or simply to mark a boundary ______ a question that {{NAME_2}} has spent a decade trying to answer.",
        choices: ["remains", "remaining", "that remains", "to remain"],
        answer: 0,
        rule: "A whole clause can be the subject (“Whether the walls were built…”). It still needs a main verb after it.",
        notes: [
          "The subject is the whole “Whether…” clause, and “remains” is its main verb: “Whether X or Y remains a question.”",
          "“Remaining” is a describer, so the sentence has no main verb.",
          "“That remains” turns the rest into a describing clause; the subject still has no verb.",
          "“To remain” can't be the main verb.",
        ],
      },
      {
        id: "h3-9", skill: "Participle (non-verb) describer",
        text: "Each autumn, thousands of monarch butterflies travel south, ______ distances of up to three thousand miles to reach the forests where they spend the winter.",
        choices: ["covering", "they cover", "covered by", "which cover"],
        answer: 0,
        rule: "After a complete sentence and a comma, an -ing phrase can add detail about the subject. A full IC there would be a comma splice.",
        notes: [
          "The IC is “thousands of monarch butterflies travel south.” “Covering distances…” adds detail about the butterflies.",
          "“They cover…” is a complete sentence after a comma: a comma splice.",
          "“Covered by distances” makes no sense; the butterflies cover the distances.",
          "“Which” after “south” seems to describe the direction, and “south… cover distances” makes no sense.",
        ],
      },
      {
        id: "h3-10", skill: "Main verb after a long subject",
        text: "The novel, which {{NAME_3}} wrote over the course of six summers and revised more than a dozen times, ______ finally published last spring to wide praise.",
        choices: ["was", "being", "having been", "which was"],
        answer: 0,
        rule: "Skip the “which…” clause between the commas; the subject (“The novel”) still needs its main verb.",
        notes: [
          "“The novel… was finally published” gives the subject its main verb.",
          "“Being” is an -ing form, so the novel never gets a main verb.",
          "“Having been” is a describer, not a main verb.",
          "“Which was” starts a second describing clause; the novel still has no main verb.",
        ],
      },
    ]),
  });

  // ---------- Chapter 7 (id 6): Semicolons, Colons & Dashes ----------
  SW.curriculum.addChapter({
    id: 6,
    questions: hard([
      {
        id: "h6-1", skill: "Colon after a complete clause",
        text: "The expedition's success depended on one piece of equipment that {{NAME_1}} had nearly left ______ hand-cranked radio that still worked after the batteries froze.",
        choices: ["behind: a", "behind; a", "behind, and a", "behind. A"],
        answer: 0,
        rule: "A colon goes after a complete sentence and introduces the thing it promised (“one piece of equipment… : a radio”).",
        notes: [
          "The first part is a complete sentence that promises “one piece of equipment.” The colon delivers it: a radio.",
          "A semicolon needs an IC after it, but “a hand-cranked radio that…” has no main verb.",
          "“And a radio” makes it sound like a second, separate thing instead of the piece of equipment.",
          "“A hand-cranked radio that still worked…” alone has no main verb, so it's a fragment.",
        ],
      },
      {
        id: "h6-2", skill: "No colon after a verb",
        text: "The museum's new exhibit ______ ancient maps, handmade compasses, and the journals of early navigators.",
        choices: ["features rare", "features: rare", "features; rare", "features—rare"],
        answer: 0,
        rule: "No colon (or semicolon, or dash) between a verb and its object. “The exhibit features” isn't a complete sentence yet.",
        notes: [
          "The verb “features” leads straight into its list, with no punctuation needed.",
          "A colon can't split a verb from its object; “The exhibit features” isn't complete.",
          "A semicolon needs ICs on both sides.",
          "A dash here cuts the verb off from what it features.",
        ],
      },
      {
        id: "h6-3", skill: "Semicolons in a list",
        text: "The festival's lineup included a jazz trio from the coast; a choir led by {{NAME_1}}, a retired music ______ student string quartet.",
        choices: ["teacher; and a", "teacher, and a", "teacher and a", "teacher: and a"],
        answer: 0,
        rule: "When list items already contain commas, separate the items with semicolons, and keep it consistent all the way through.",
        notes: [
          "The list already uses a semicolon after “coast,” and the choir item contains a comma, so the last item needs a semicolon too.",
          "A comma makes it look like “a retired music teacher and a student string quartet” are both describing {{NAME_1}}.",
          "With no punctuation, the last item blurs into the description of {{NAME_1}}.",
          "A colon doesn't separate list items.",
        ],
      },
      {
        id: "h6-4", skill: "Dash pair",
        text: "{{NAME_2}}—an engineer who had never before worked on a structure longer than fifty ______ chosen to design the bridge because of {{NAME_2_POSS}} unusual approach to wind resistance.",
        choices: ["meters—was", "meters, was", "meters; was", "meters was"],
        answer: 0,
        rule: "Extra information opened with a dash must be closed with a dash before the sentence continues.",
        notes: [
          "A dash opened the extra part after “{{NAME_2}},” so a dash closes it before the main verb “was.”",
          "A comma can't close a part that a dash opened.",
          "A semicolon separates the subject from its verb.",
          "With nothing closing it, the extra information runs straight into the main verb.",
        ],
      },
      {
        id: "h6-5", skill: "Single dash before an explanation",
        text: "After years of failed attempts, the team finally understood why the seeds would not ______ soil had been too acidic all along.",
        choices: ["sprout—the", "sprout, the", "sprout the", "sprout, and, the"],
        answer: 0,
        rule: "A single dash (like a colon) can join a complete sentence to the explanation that follows it.",
        notes: [
          "The dash says “here's why”: the soil had been too acidic. Both sides are complete, and the dash links the explanation.",
          "Two ICs joined by only a comma: a comma splice.",
          "No punctuation between two ICs: a run-on.",
          "There's no comma after “and.”",
        ],
      },
      {
        id: "h6-6", skill: "Semicolon + transition",
        text: "The early results looked ______ the scientists insisted on repeating the experiment three more times.",
        choices: ["promising; nevertheless,", "promising, nevertheless,", "promising nevertheless", "promising, nevertheless"],
        answer: 0,
        rule: "Transition words like nevertheless aren't FANBOYS. Between two ICs, put a semicolon before them and a comma after.",
        notes: [
          "IC; nevertheless, IC. The semicolon joins the clauses, and “nevertheless” shows the contrast.",
          "Commas around “nevertheless” leave two ICs joined by commas: a comma splice.",
          "No punctuation at all: a run-on.",
          "A comma before “nevertheless” is still a comma splice.",
        ],
      },
      {
        id: "h6-7", skill: "No colon after such as",
        text: "The recipe calls for warm ______ cinnamon, nutmeg, and a pinch of black pepper.",
        choices: ["spices such as", "spices such as:", "spices, such as:", "spices; such as"],
        answer: 0,
        rule: "Never put a colon right after “such as,” “including” or a preposition; the list follows directly.",
        notes: [
          "“Spices such as cinnamon…” leads straight into the examples with no extra punctuation.",
          "A colon after “such as” is never correct.",
          "Still a colon after “such as.”",
          "A semicolon needs ICs on both sides.",
        ],
      },
      {
        id: "h6-8", skill: "FANBOYS between ICs",
        text: "{{NAME_3}} had rehearsed the speech dozens of ______ the microphone failed, {{NAME_3}} delivered it from memory without missing a word.",
        choices: ["times, so when", "times; so, when", "times so when", "times, so, when"],
        answer: 0,
        rule: "To join two ICs with a FANBOYS word, put a comma before it, and no comma right after it.",
        notes: [
          "IC, so IC. The second IC just starts with a DC (“when the microphone failed”).",
          "A semicolon before “so” and a comma after it is the wrong pattern for FANBOYS.",
          "The two ICs need a comma before “so.”",
          "No comma after “so” when it joins two clauses.",
        ],
      },
      {
        id: "h6-9", skill: "Matching comma pair",
        text: "The village's oldest building, a stone mill constructed around ______ grinds grain using water from the river.",
        choices: ["1750, still", "1750—still", "1750; still", "1750 still"],
        answer: 0,
        rule: "Punctuation around extra information must match: comma with comma, dash with dash.",
        notes: [
          "A comma opened the extra part after “building,” so a comma closes it.",
          "A comma opened it, so a dash can't close it.",
          "A semicolon would separate the subject from its verb “grinds.”",
          "Without a closing comma, the extra information runs into the verb.",
        ],
      },
      {
        id: "h6-10", skill: "Colon before an explanation",
        text: "{{NAME_1}} noticed something unusual about the old photographs in the ______ shadows pointed in two different directions.",
        choices: ["collection: the", "collection, the", "collection the", "collection, and, the"],
        answer: 0,
        rule: "A colon after a complete sentence can introduce an explanation of what came before.",
        notes: [
          "“Something unusual” is explained after the colon: the shadows pointed two ways.",
          "Two ICs joined by only a comma: a comma splice.",
          "Two ICs with no punctuation: a run-on.",
          "There's no comma after “and.”",
        ],
      },
      {
        id: "h6-11", skill: "No comma between subject and verb", ruleName: "No Comma Between Subject and Verb",
        text: "The thick layer of volcanic ash that buried the ancient ______ remarkably well preserved for nearly two thousand years.",
        choices: ["town kept it", "town, kept it", "town; kept it", "town—kept it"],
        answer: 0,
        rule: "Never put a single punctuation mark between a subject and its verb, even when the subject is long.",
        notes: [
          "The subject is “The thick layer of volcanic ash that buried the ancient town,” and its verb is “kept.” Nothing should separate them.",
          "A single comma splits the long subject from its verb “kept.”",
          "A semicolon needs an IC on both sides; it can't split a subject from its verb.",
          "A single dash also cuts the subject off from its verb.",
        ],
      },
      {
        id: "h6-12", skill: "No comma between subject and verb", ruleName: "No Comma Between Subject and Verb",
        text: "Researchers who tracked the migration of gray whales along the Pacific ______ that the animals now leave their feeding grounds nearly a week earlier than they did in the 1990s.",
        choices: ["coast found", "coast, found", "coast: found", "coast; found"],
        answer: 0,
        rule: "A long subject (“Researchers who tracked…”) is still one subject. Don't separate it from its verb.",
        notes: [
          "“Researchers who tracked the migration… along the Pacific coast” is the subject, and “found” is its verb. No punctuation goes between them.",
          "The “who” clause tells us which researchers, so it's needed (no commas), and a single comma can't split the subject from its verb.",
          "A colon must follow a complete sentence, and the subject has no verb yet.",
          "A semicolon needs an IC on both sides.",
        ],
      },
      {
        id: "h6-13", skill: "No comma between subject and verb", ruleName: "No Comma Between Subject and Verb",
        text: "What surprised {{NAME_1}} most about the ______ how quickly the bacteria adapted to the new temperature.",
        choices: ["results was", "results, was", "results: was", "results—was"],
        answer: 0,
        rule: "A whole clause can be the subject (“What surprised… the results”). Don't put punctuation between it and its verb.",
        notes: [
          "The subject is the clause “What surprised {{NAME_1}} most about the results,” and its verb is “was.” No punctuation between them.",
          "A comma splits the subject clause from its verb.",
          "A colon must follow a complete sentence, but the subject hasn't gotten its verb yet.",
          "A single dash splits the subject from its verb.",
        ],
      },
    ]),
  });

  // ---------- Chapter 8 (id 7): Extra Information ----------
  SW.curriculum.addChapter({
    id: 7,
    questions: hard([
      {
        id: "h7-1", skill: "Essential title (no commas)",
        text: "According to ______ the town's first library was paid for entirely with small donations from local farmers.",
        choices: ["historian {{NAME_1}},", "historian, {{NAME_1}},", "historian, {{NAME_1}}", "historian {{NAME_1}}"],
        answer: 0,
        rule: "No comma between a title and a name, but an opening phrase like “According to…” ends with a comma.",
        notes: [
          "“Historian {{NAME_1}}” stays together, and the comma after the name ends the opening phrase.",
          "The commas around the name treat it as extra, but the title and name belong together.",
          "One comma splits the title from the name, and the opener has no closing comma.",
          "The opening phrase needs a comma before the main clause starts.",
        ],
      },
      {
        id: "h7-2", skill: "Non-essential appositive (a/an cue)",
        text: "{{NAME_2}}, a botanist who spent three years documenting rare ______ the findings in a free online guide.",
        choices: ["orchids, published", "orchids published", "orchids; published", "orchids—published"],
        answer: 0,
        rule: "“A…” after a name signals extra information. Close it with the same mark that opened it.",
        notes: [
          "A comma opened the extra part after {{NAME_2}}, so a comma closes it before the verb “published.”",
          "Without the closing comma, the extra part runs into the verb.",
          "A semicolon separates the subject from its verb.",
          "A comma opened it, so a dash can't close it.",
        ],
      },
      {
        id: "h7-3", skill: "Essential clause (which vs that)",
        text: "The only ______ connects the two villages was closed for repairs last winter.",
        choices: ["bridge that", "bridge, that", "bridge, which", "bridge which,"],
        answer: 0,
        rule: "Information that tells you WHICH one is essential: use “that” and no commas.",
        notes: [
          "“That connects the two villages” identifies the bridge, so it's essential: no commas.",
          "“That” clauses never take a comma before them.",
          "“Which” with a comma marks extra information, but here the clause is needed, and there's no closing comma.",
          "A comma after “which” splits the clause apart.",
        ],
      },
      {
        id: "h7-4", skill: "One of a kind (non-essential)",
        text: "The country's tallest ______ rises more than four thousand meters above sea level, attracts climbers from around the world.",
        choices: ["mountain, which", "mountain which", "mountain that", "mountain; which"],
        answer: 0,
        rule: "If there's only one of something (“the tallest mountain”), describing it adds extra information: use “which” and a comma pair.",
        notes: [
          "There's only one tallest mountain, so the description is extra. A comma opens it, and the comma after “level” closes it.",
          "The closing comma after “level” needs an opening comma to match.",
          "“That” marks needed information, but then the comma after “level” wouldn't match anything.",
          "A semicolon separates the subject from its verb “attracts.”",
        ],
      },
      {
        id: "h7-5", skill: "Non-essential which clause",
        text: "The experiment, which {{NAME_3}} designed with help from two classmates and a retired ______ nearly a year to complete.",
        choices: ["engineer, took", "engineer took", "engineer; took", "engineer—took"],
        answer: 0,
        rule: "A “which” clause between commas is extra. Close it before the main verb.",
        notes: [
          "A comma opened the “which…” clause, so a comma closes it before the main verb “took.”",
          "Without a closing comma, the extra clause runs into the verb.",
          "A semicolon separates the subject from its verb.",
          "A comma opened it, so a dash can't close it.",
        ],
      },
      {
        id: "h7-6", skill: "Dash pair around a list",
        text: "The three ingredients in the ______ water, and salt—have not changed in two hundred years.",
        choices: ["bread—flour,", "bread, flour,", "bread: flour,", "bread flour,"],
        answer: 0,
        rule: "When extra information already contains commas, set it off with a pair of dashes so the reader can tell where it starts and ends.",
        notes: [
          "The list “flour, water, and salt” has commas inside it, and the closing dash after “salt” needs an opening dash to match.",
          "A comma can't open a part that a dash closes, and extra commas make the list confusing.",
          "A colon can't be closed by a dash before the sentence continues.",
          "“Bread flour” changes the meaning, and nothing opens the dash pair.",
        ],
      },
      {
        id: "h7-7", skill: "Essential clause (which vs that)",
        text: "The ______ were damaged in the flood have been carefully restored, while the rest remain in storage.",
        choices: ["paintings that", "paintings, which", "paintings, that", "paintings which,"],
        answer: 0,
        rule: "If the clause tells you WHICH ones (only the damaged paintings), it's essential: “that,” no commas.",
        notes: [
          "Only the damaged paintings were restored, so “that were damaged in the flood” is needed information: no commas.",
          "Commas would mean ALL the paintings were damaged, which contradicts “the rest remain in storage.”",
          "“That” never follows a comma.",
          "The comma after “which” splits the clause from its verb.",
        ],
      },
      {
        id: "h7-8", skill: "Dash pair",
        text: "{{NAME_1}}—an architect known for designing homes that use almost no ______ to students about the future of building.",
        choices: ["energy—spoke", "energy, spoke", "energy; spoke", "energy spoke"],
        answer: 0,
        rule: "A dash that opens extra information needs a dash to close it.",
        notes: [
          "A dash opened “an architect known for…,” so a dash closes it before the main verb “spoke.”",
          "A comma can't close a part that a dash opened.",
          "A semicolon separates the subject from its verb.",
          "Without a closing dash, it reads as though the energy spoke.",
        ],
      },
      {
        id: "h7-9", skill: "Non-essential appositive (a/an cue)",
        text: "For nearly a decade, scientists studied the ______ rare species found only on a single island, to learn how it survives long droughts.",
        choices: ["lizard, a", "lizard a", "lizard; a", "lizard: a"],
        answer: 0,
        rule: "“A…” after a noun signals extra information. A comma opens it, and the comma after “island” closes it.",
        notes: [
          "“A rare species found only on a single island” renames the lizard. It's extra, so a comma pair surrounds it.",
          "Without the opening comma, the closing comma after “island” has nothing to match.",
          "A semicolon needs an IC after it.",
          "A colon could introduce it, but then the comma after “island” wouldn't match anything.",
        ],
      },
      {
        id: "h7-10", skill: "Essential clause (no commas)",
        text: "______ complete the summer reading list will receive extra credit in the fall.",
        choices: ["Students who", "Students, who", "Students who,", "Students; who"],
        answer: 0,
        rule: "A “who” clause that tells you WHICH people is essential: no commas.",
        notes: [
          "Only the students who finish the list get credit, so “who complete…” is needed information: no commas.",
          "A comma would make the clause extra, as if ALL students complete it, and it has no closing comma.",
          "A comma after “who” splits the clause apart.",
          "A semicolon needs an IC on both sides.",
        ],
      },
    ]),
  });

  // ---------- Chapter 9 (id 8): Modifiers, Parallelism & Pronouns ----------
  SW.curriculum.addChapter({
    id: 8,
    questions: hard([
      {
        id: "h8-1", skill: "Pronoun agreement (collective noun)",
        text: "After months of debate, the city council finally approved ______ budget for the new public library, which is scheduled to open next spring.",
        choices: ["its", "their", "it's", "they're"],
        answer: 0,
        rule: "A group noun like council, team, company or committee is singular on the SAT, so it takes “its.”",
        notes: [
          "One council → “its budget.”",
          "“Their” is plural, but “the council” is one group.",
          "“It's” means “it is”: “approved it is budget” makes no sense.",
          "“They're” means “they are,” and it's plural.",
        ],
      },
      {
        id: "h8-2", skill: "Pronoun agreement (plural antecedent)",
        text: "The museum's two ancient clay tablets, discovered by a farmer in 1921, are remarkably well preserved; ______ surfaces still show the marks of a writing tool.",
        choices: ["their", "its", "it's", "there"],
        answer: 0,
        rule: "Find the noun the pronoun replaces. Plural (two tablets) → their; singular → its.",
        notes: [
          "The surfaces belong to the two tablets, which are plural → “their.”",
          "“Its” is singular, but there are two tablets.",
          "“It's” means “it is.”",
          "“There” is a place, not ownership.",
        ],
      },
      {
        id: "h8-3", skill: "Irregular plural possessive",
        text: "The ______ paintings, judged by a panel of local artists, will hang in the library lobby for a month.",
        choices: ["children's", "childrens'", "childrens", "children"],
        answer: 0,
        rule: "For a plural that doesn't end in -s (children, people, women), show ownership with 's.",
        notes: [
          "“Children” is already plural, so the possessive is “children's.”",
          "“Childrens” isn't a word, so “childrens'” isn't either.",
          "“Childrens” isn't a word, and there's no apostrophe to show ownership.",
          "“Children paintings” doesn't show that the paintings belong to the children.",
        ],
      },
      {
        id: "h8-4", skill: "Plural vs. possessive",
        text: "Over the summer, the ______ to repaint the community center and finished the job in just two weeks.",
        choices: ["students volunteered", "student's volunteered", "students' volunteered", "students's volunteered"],
        answer: 0,
        rule: "Only use an apostrophe when something belongs to someone. A plain plural (students) has no apostrophe.",
        notes: [
          "The students aren't owning anything here; they're just the subject → plain plural “students.”",
          "“Student's” means something belongs to one student.",
          "“Students'” means something belongs to the students, but nothing they own follows.",
          "“Students's” isn't a correct form.",
        ],
      },
      {
        id: "h8-5", skill: "Its vs. it's",
        text: "The company's newest satellite is small enough to fit in a backpack, yet ______ cameras can photograph objects on the ground as small as a coin.",
        choices: ["its", "it's", "their", "its'"],
        answer: 0,
        rule: "Its = belonging to it. It's = it is. Test it: if “it is” doesn't fit, use “its.”",
        notes: [
          "The cameras belong to the satellite → “its cameras.”",
          "“It is cameras” makes no sense.",
          "“Their” is plural, but the satellite is singular.",
          "“Its'” isn't a word.",
        ],
      },
      {
        id: "h8-6", skill: "Parallel list",
        text: "Volunteers at the wildlife center are responsible for feeding the animals, cleaning their enclosures, and ______ any signs of illness to the staff veterinarian.",
        choices: ["reporting", "to report", "they report", "report"],
        answer: 0,
        rule: "Every item in a list must have the same form. Find the pattern (feeding, cleaning…) and match it.",
        notes: [
          "“Feeding… cleaning… reporting” all match the -ing pattern after “responsible for.”",
          "“To report” breaks the -ing pattern.",
          "“They report” turns the last item into a whole clause.",
          "“Report” breaks the pattern.",
        ],
      },
      {
        id: "h8-7", skill: "Dangling modifier",
        text: "Having studied the ruins for more than a decade, ______",
        choices: ["{{NAME_1}} was finally able to map the entire city.", "the entire city was finally mapped by {{NAME_1}}.", "{{NAME_1}}'s map of the entire city was finally complete.", "it was finally possible for {{NAME_1}} to map the entire city."],
        answer: 0,
        rule: "An opening describer must be followed immediately by the person or thing it describes.",
        notes: [
          "{{NAME_1}} did the studying, so {{NAME_1}} must come right after the comma.",
          "This says the city studied the ruins.",
          "This says the map studied the ruins.",
          "“It” can't have studied the ruins.",
        ],
      },
    ]),
  });
})();
