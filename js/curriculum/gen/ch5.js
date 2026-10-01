// Generated questions, Chapter 5: Logical Transitions.
// Two sentences with a clear relationship; the right transition matches it,
// the distractors come from relationships that clearly don't fit.
(function () {
  "use strict";
  const G = window.SatWizz.gen;

  const WORDS = {
    contrast: ["However", "Nevertheless", "Even so", "Still"],
    result: ["Therefore", "As a result", "Consequently", "Thus"],
    example: ["For example", "For instance"],
    addition: ["Moreover", "In addition", "Furthermore", "Additionally"],
    similarity: ["Similarly", "Likewise"],
  };
  const WHY = {
    contrast: "Contrast words (However, Nevertheless, Even so) need the second idea to oppose or surprise you after the first.",
    result: "Cause/effect words (Therefore, As a result, Consequently) need the second idea to be caused by the first.",
    example: "Example words (For example, For instance) need the second sentence to be a specific case of the first.",
    addition: "Addition words (Moreover, In addition, Furthermore) need a second point in the same direction.",
    similarity: "Similarity words (Similarly, Likewise) need two things that match.",
  };
  const RIGHT = {
    contrast: "signals that the second idea goes against what the first one leads you to expect.",
    result: "shows that the second idea is caused by the first.",
    example: "introduces a specific case of the first idea.",
    addition: "adds a second point in the same direction.",
    similarity: "shows that the second idea matches the first.",
  };
  const RULE = {
    contrast: "The second sentence goes against what the first leads you to expect: a contrast.",
    result: "The first sentence causes the second: cause and effect.",
    example: "The second sentence is a specific case of the first: an example.",
    addition: "The second sentence adds another point in the same direction: addition.",
    similarity: "The two sentences describe matching things: similarity.",
  };
  // Distractors come from relationships that clearly don't fit.
  const OFF = {
    contrast: ["result", "example", "similarity"],
    result: ["contrast", "example", "similarity"],
    example: ["contrast", "result", "similarity"],
    addition: ["contrast", "example", "result"],
    similarity: ["contrast", "result", "example"],
  };

  const PAIRS = {
    contrast: [
      ["{{NAME_1}} trained at {{LOCATION}} every day for a month.", "{{NAME_1}} still lost the first match of {{EVENT}}."],
      ["The forecast called for sunshine all weekend.", "heavy rain canceled the opening ceremony."],
      ["{{NAME_2}} rarely speaks up in class.", "{{NAME_2}} gave the most memorable speech at {{EVENT}}."],
      ["The new stadium cost millions to build.", "most fans still prefer the old one downtown."],
      ["{{NAME_3}} had never tried {{SKILL}} before this year.", "{{NAME_3}} won the beginners' trophy in the spring."],
      ["The first draft of the script was nearly perfect.", "the director asked for a complete rewrite."],
      ["Tickets for the final sold out in minutes.", "dozens of seats sat empty when the game began."],
      ["{{NAME_1}} insisted on practicing alone.", "{{NAME_1}} spent the whole afternoon asking {{NAME_2}} for tips."],
      ["The recipe looked simple on paper.", "the first three batches came out burned."],
      ["The museum near {{LOCATION}} is small.", "it holds one of the best collections in the state."],
      ["The rookies had very little experience.", "they played like veterans in the second half."],
      ["Most of the team wanted to rest after {{EVENT}}.", "{{NAME_3}} went straight back to {{LOCATION}} to practice."],
      ["The old team bus breaks down almost every month.", "the players refuse to let it be replaced."],
      ["{{NAME_2}} was the smallest player on the court.", "{{NAME_2}} grabbed more rebounds than anyone."],
    ],
    result: [
      ["{{NAME_1}} sprained an ankle during warm-ups.", "the coach kept {{NAME_1_OBJ}} on the bench for the first half."],
      ["The power went out across the whole neighborhood.", "the concert at {{LOCATION}} moved to the next night."],
      ["{{NAME_2}} studied {{SKILL}} for three hours every night.", "the final exam felt easy."],
      ["The bridge on the main road was closed for repairs.", "the team bus took a long detour to {{EVENT}}."],
      ["Thousands of fans signed the petition.", "the city agreed to keep the old arena open."],
      ["{{NAME_3}} forgot to set an alarm.", "{{NAME_3}} missed the first half of practice."],
      ["The museum's coin collection is extremely fragile.", "visitors are not allowed to touch the cases."],
      ["The field at {{LOCATION}} flooded overnight.", "the game was moved indoors."],
      ["{{NAME_1}} saved every paycheck from a summer job.", "{{NAME_1}} could finally afford new cleats."],
      ["The lead singer caught a cold the night before.", "{{NAME_2}} sang the solo instead."],
      ["The team lost its first three games.", "the coach changed the entire lineup."],
      ["The desert receives almost no rain.", "many plants there store water in thick leaves."],
      ["{{NAME_3}} rehearsed the speech in front of a mirror all week.", "{{NAME_3}} delivered it at {{EVENT}} without a single note."],
      ["Tickets were half price this year.", "more families came to {{EVENT}} than ever before."],
    ],
    example: [
      ["Many athletes have strange pre-game rituals.", "{{NAME_1}} always ties the left shoe first and taps the doorframe twice."],
      ["Some animals use tools to find food.", "sea otters crack open shellfish with rocks."],
      ["The school offers several unusual clubs.", "students can join a beekeeping group that meets at {{LOCATION}}."],
      ["{{NAME_2}} brings home an odd souvenir from every trip.", "a jar of black sand from a volcanic beach sits on {{NAME_2_POSS}} desk."],
      ["Many famous songs were written very quickly.", "one hit single was finished in a single afternoon."],
      ["The coach uses creative drills at practice.", "players sometimes dribble while reciting multiplication tables."],
      ["Some plants survive in extreme places.", "certain mosses grow on bare rock near the Arctic."],
      ["Many inventions began as accidents.", "one scientist discovered a new material after spilling a chemical."],
      ["{{NAME_3}} finds ways to practice {{SKILL}} anywhere.", "{{NAME_3}} once rehearsed on a crowded train."],
      ["Many animals communicate without sound.", "honeybees share directions through a waggle dance."],
      ["The festival at {{LOCATION}} features food from around the world.", "visitors can try Ethiopian injera next to Korean bibimbap."],
      ["Several players on the team speak more than one language.", "{{NAME_1}} switches between Spanish and English during huddles."],
    ],
    addition: [
      ["The new library app tracks every book a student borrows.", "it recommends new titles based on past checkouts."],
      ["{{NAME_1}} designed all the costumes for the spring show.", "{{NAME_1}} painted most of the scenery."],
      ["The new subway line cut commute times in half.", "it reduced traffic on the busiest roads."],
      ["The summer camp at {{LOCATION}} teaches {{SKILL}}.", "it offers free meals to every camper."],
      ["{{NAME_2}} captains the swim team.", "{{NAME_2}} tutors younger students twice a week."],
      ["The renovated gym has brighter lights.", "its new floor absorbs shock better."],
      ["The documentary won the audience award.", "it earned a nomination for best editing."],
      ["Volunteers repainted the bleachers before {{EVENT}}.", "they installed new railings along the stairs."],
      ["{{NAME_3}} speaks three languages.", "{{NAME_3}} plays the cello in the city orchestra."],
      ["The museum extended its weekend hours.", "it added free guided tours on Sundays."],
      ["The team bus now has charging outlets.", "it has a small refrigerator for snacks."],
      ["Regular exercise improves sleep.", "it helps students focus in class."],
    ],
    similarity: [
      ["Elephants can recognize themselves in a mirror.", "dolphins have passed similar self-recognition tests."],
      ["{{NAME_1}} warms up with the same playlist before every game.", "{{NAME_2}} listens to one song on repeat before each match."],
      ["Bees communicate through movement.", "some birds signal danger with special wing flaps."],
      ["The first film in the series was shot in only thirty days.", "the sequel was finished on an equally tight schedule."],
      ["{{NAME_3}} keeps a journal of every practice.", "the coach writes down notes after each session."],
      ["Ancient Roman engineers built roads that are still used today.", "Incan engineers built mountain paths that people still walk."],
      ["The north campus banned phones during class.", "the south campus now collects phones at the door."],
      ["Ravens can solve multi-step puzzles.", "crows have been seen using sticks as tools."],
      ["{{NAME_2}} rewrites every essay at least twice.", "{{NAME_1}} revises each speech until it feels natural."],
      ["The city added bike lanes downtown last year.", "the suburbs painted new lanes along their main roads."],
    ],
  };

  G.add(5, () => {
    const out = [];
    for (const [rel, pairs] of Object.entries(PAIRS)) {
      pairs.forEach(([s1, s2], i) => {
        WORDS[rel].forEach((word, w) => {
          for (let v = 0; v < 2; v++) {
            const wrong = OFF[rel].map((r, k) => [r, WORDS[r][(i + w + v + k) % WORDS[r].length]]);
            out.push({
              skill: G.cap(rel),
              kind: "transition",
              text: `${s1} ______ ${s2}`,
              choices: [`${word},`, ...wrong.map(([, x]) => `${x},`)],
              notes: [`Correct. "${word}" ${RIGHT[rel]}`, ...wrong.map(([r]) => WHY[r])],
              rule: RULE[rel],
            });
          }
        });
      });
    }
    return out;
  });
})();
