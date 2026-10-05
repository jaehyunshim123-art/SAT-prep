// Deep Dive: ocean data. Zones, dive destinations and the creature logbook.
//
// Depths are real (meters). A dive goes from the surface to its destination's
// depth in a straight line over the session, so a longer focus session is the
// only way down to the deep creatures.
(function () {
  "use strict";
  const DD = (window.DeepDive = window.DeepDive || {});

  // The five ocean layers, top to bottom.
  DD.ZONES = Object.freeze([
    { id: "sunlight", name: "Sunlight Zone", top: 0 },
    { id: "twilight", name: "Twilight Zone", top: 200 },
    { id: "midnight", name: "Midnight Zone", top: 1000 },
    { id: "abyss", name: "The Abyss", top: 4000 },
    { id: "hadal", name: "The Trenches", top: 6000 },
  ]);

  // Where a dive can go. `minutes` is the focus session length.
  DD.DESTINATIONS = Object.freeze([
    { id: "reef", name: "Coral Reef", minutes: 15, depth: 40, blurb: "A quick warm-up dive." },
    { id: "blue", name: "The Open Blue", minutes: 25, depth: 200, blurb: "One classic focus session." },
    { id: "twilight", name: "Twilight Zone", minutes: 45, depth: 1000, blurb: "Where the light runs out." },
    { id: "midnight", name: "Midnight Zone", minutes: 60, depth: 4000, blurb: "Glowing things live here." },
    { id: "abyss", name: "The Abyss", minutes: 90, depth: 6000, blurb: "Cold, dark, strange." },
    { id: "trench", name: "Mariana Trench", minutes: 120, depth: 10935, blurb: "The deepest point on Earth." },
  ]);

  // rarity → chance of spotting it on a dive that passes its depth
  DD.RARITY = Object.freeze({ common: 0.85, uncommon: 0.5, rare: 0.25 });

  // `depth` is where you meet it on the way down.
  DD.CREATURES = Object.freeze([
    { id: "clownfish", name: "Clownfish", emoji: "🐠", depth: 6, rarity: "common", fact: "Every clownfish is born male. The biggest one in a group can turn female." },
    { id: "moon-jelly", name: "Moon Jellyfish", emoji: "🪼", depth: 12, rarity: "common", fact: "Moon jellies have no brain, heart or bones. They are about 95% water." },
    { id: "sea-turtle", name: "Green Sea Turtle", emoji: "🐢", depth: 20, rarity: "common", fact: "Sea turtles can hold their breath for hours while they rest." },
    { id: "reef-octopus", name: "Reef Octopus", emoji: "🐙", depth: 30, rarity: "uncommon", fact: "An octopus has three hearts and blue blood." },
    { id: "dolphin", name: "Bottlenose Dolphin", emoji: "🐬", depth: 60, rarity: "common", fact: "Dolphins give each other signature whistles that work like names." },
    { id: "manta", name: "Manta Ray", emoji: "🛸", depth: 90, rarity: "uncommon", fact: "Mantas have the biggest brain-to-body ratio of any fish." },
    { id: "hammerhead", name: "Hammerhead Shark", emoji: "🦈", depth: 140, rarity: "rare", fact: "Its wide head spreads out sensors that feel the electric pulses of prey." },
    { id: "lanternfish", name: "Lanternfish", emoji: "🐟", depth: 300, rarity: "common", fact: "Lanternfish may be the most common vertebrate on the planet." },
    { id: "hatchetfish", name: "Hatchetfish", emoji: "🐟", depth: 450, rarity: "uncommon", fact: "Glowing patches on its belly match the faint light above, so it has no shadow." },
    { id: "barreleye", name: "Barreleye", emoji: "👀", depth: 650, rarity: "rare", fact: "The barreleye has a see-through head. Its eyes look up through it." },
    { id: "giant-squid", name: "Giant Squid", emoji: "🦑", depth: 850, rarity: "rare", fact: "Giant squid eyes are the size of dinner plates, the largest in the animal kingdom." },
    { id: "frilled-shark", name: "Frilled Shark", emoji: "🐍", depth: 1200, rarity: "uncommon", fact: "A 'living fossil': its body plan has barely changed in 80 million years." },
    { id: "anglerfish", name: "Anglerfish", emoji: "🎣", depth: 1600, rarity: "common", fact: "The glowing lure on its head is full of light-making bacteria." },
    { id: "vampire-squid", name: "Vampire Squid", emoji: "🧛", depth: 1900, rarity: "uncommon", fact: "Despite the name, it eats drifting 'marine snow', not blood." },
    { id: "gulper-eel", name: "Gulper Eel", emoji: "🪱", depth: 2300, rarity: "uncommon", fact: "Its mouth opens wider than its whole body." },
    { id: "dumbo-octopus", name: "Dumbo Octopus", emoji: "🐘", depth: 3200, rarity: "rare", fact: "It flaps ear-like fins to fly through the deep, just like Dumbo." },
    { id: "sea-pig", name: "Sea Pig", emoji: "🐖", depth: 4400, rarity: "common", fact: "Sea pigs are sea cucumbers that walk on tube-feet across the mud." },
    { id: "tripod-fish", name: "Tripod Fish", emoji: "🗼", depth: 4800, rarity: "uncommon", fact: "It stands on three long fins like stilts and waits for food to drift by." },
    { id: "grenadier", name: "Abyssal Grenadier", emoji: "🐟", depth: 5400, rarity: "rare", fact: "Also called a rattail, one of the most common fish of the deep floor." },
    { id: "snailfish", name: "Mariana Snailfish", emoji: "🫧", depth: 7900, rarity: "uncommon", fact: "The deepest fish ever filmed, at over 8,000 meters." },
    { id: "amphipod", name: "Supergiant Amphipod", emoji: "🦐", depth: 9500, rarity: "common", fact: "A shrimp-like scavenger that can grow as long as your hand." },
    { id: "xenophyophore", name: "Xenophyophore", emoji: "🪸", depth: 10600, rarity: "rare", fact: "A single cell that can grow as big as a tennis ball." },
  ]);

  DD.zoneAt = (depth) => {
    let z = DD.ZONES[0];
    for (const zone of DD.ZONES) if (depth >= zone.top) z = zone;
    return z;
  };
})();
