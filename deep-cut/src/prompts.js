// Deep Cut: the prompt bank.
//
// Each prompt lists accepted answers in four tiers, from the answers almost
// everyone gives to the ones almost nobody thinks of:
//   [obvious, common, uncommon, rare]
// "a|b|c" are aliases for one answer; the first spelling is the one shown.
// Rarity is hand-ranked for now. With a backend it would come from what
// players actually answer.
(function () {
  "use strict";
  const DC = (window.DeepCut = window.DeepCut || {});

  const T = (s) => s.split(",").map((x) => x.trim()).filter(Boolean);

  DC.PROMPTS = [
    { id: "fruit", cat: "Food", q: "Name a fruit", tiers: [
      T("apple, banana, orange, strawberry, grape"),
      T("mango, pineapple, watermelon, peach, pear, cherry, blueberry, lemon, kiwi"),
      T("plum, raspberry, apricot, pomegranate, papaya, lime, grapefruit, coconut, cantaloupe, blackberry, fig, nectarine, avocado, cranberry, honeydew, tangerine, clementine"),
      T("lychee|litchi, dragon fruit|dragonfruit|pitaya, persimmon, guava, passion fruit|passionfruit, kumquat, durian, jackfruit, quince, starfruit|carambola, rambutan, mangosteen, gooseberry, elderberry, loquat, tamarind, yuzu, feijoa, soursop, ackee, mulberry, boysenberry, date, olive, tomato, plantain, currant, huckleberry, cherimoya, longan, physalis"),
    ] },
    { id: "europe", cat: "Geography", q: "Name a country in Europe", tiers: [
      T("France, Germany, Italy, Spain, United Kingdom|uk|england|britain|great britain"),
      T("Portugal, Greece, Ireland, Sweden, Norway, Netherlands|holland, Poland, Switzerland, Russia, Belgium, Austria, Denmark, Finland, Ukraine"),
      T("Iceland, Croatia, Hungary, Czechia|czech republic, Romania, Scotland, Wales, Serbia, Bulgaria, Slovakia, Slovenia, Turkey|turkiye, Luxembourg, Estonia, Latvia, Lithuania, Belarus"),
      T("Monaco, Liechtenstein, Andorra, San Marino, Vatican City|vatican|holy see, Malta, Moldova, Montenegro, North Macedonia|macedonia, Albania, Bosnia and Herzegovina|bosnia, Kosovo, Cyprus, Georgia, Armenia, Azerbaijan, Kazakhstan"),
    ] },
    { id: "space", cat: "Space", q: "Name a planet or moon in our solar system", tiers: [
      T("Earth, Mars, Jupiter, Saturn, the Moon|moon|luna"),
      T("Venus, Mercury, Neptune, Uranus, Pluto"),
      T("Titan, Europa, Io, Ganymede, Callisto, Phobos, Deimos, Enceladus, Triton"),
      T("Charon, Miranda, Titania, Oberon, Ariel, Umbriel, Mimas, Rhea, Iapetus, Dione, Tethys, Hyperion, Phoebe, Nereid, Proteus, Amalthea, Ceres, Eris, Makemake, Haumea"),
    ] },
    { id: "states", cat: "Geography", q: "Name a US state", tiers: [
      T("California, Texas, New York, Florida"),
      T("Ohio, Washington, Hawaii, Alaska, Georgia, Illinois, Arizona, Nevada, Colorado, Michigan, Pennsylvania, New Jersey, Massachusetts, Virginia"),
      T("Oregon, Utah, Tennessee, Louisiana, North Carolina, South Carolina, Kentucky, Alabama, Minnesota, Wisconsin, Indiana, Missouri, Maryland, Connecticut, Oklahoma, Kansas, Iowa, Maine, Mississippi, New Mexico"),
      T("Wyoming, Montana, Idaho, North Dakota, South Dakota, Nebraska, Vermont, New Hampshire, Rhode Island, Delaware, West Virginia, Arkansas"),
    ] },
    { id: "ocean", cat: "Animals", q: "Name an animal that lives in the ocean", tiers: [
      T("shark, whale, dolphin, fish, octopus"),
      T("jellyfish, crab, starfish|sea star, seal, sea turtle|turtle, squid, lobster, clownfish, orca|killer whale, stingray"),
      T("seahorse, eel, manta ray, sea lion, walrus, shrimp, krill, coral, sea urchin, narwhal, swordfish, tuna, salmon, clam, oyster, sea otter|otter, pufferfish, barracuda, beluga"),
      T("anglerfish, nudibranch, sea cucumber, mantis shrimp, cuttlefish, nautilus, manatee, dugong, blobfish, ocean sunfish|sunfish|mola mola|mola, barreleye, sea pig, lionfish, moray eel, wrasse, grouper, halibut, sea anemone|anemone, sea sponge|sponge, giant isopod|isopod, vampire squid, frilled shark, oarfish, coelacanth, sardine, anchovy, plankton, siphonophore, gulper eel, marlin, mahi mahi, triggerfish, hagfish, lamprey"),
    ] },
    { id: "instrument", cat: "Music", q: "Name a musical instrument", tiers: [
      T("piano, guitar, drums|drum, violin"),
      T("flute, trumpet, saxophone|sax, cello, bass, clarinet, ukulele, harp"),
      T("trombone, tuba, oboe, viola, harmonica, banjo, accordion, xylophone, french horn|horn, keyboard, organ, bagpipes, recorder, tambourine, triangle"),
      T("bassoon, piccolo, mandolin, sitar, didgeridoo, theremin, harpsichord, glockenspiel, marimba, cymbals, kazoo, lute, zither, bongos, cowbell, ocarina, koto, oud, erhu, tabla, steel drum|steelpan, euphonium, celesta, castanets, bodhran, dulcimer, shamisen, kalimba, timpani, contrabassoon, sousaphone, flugelhorn, cornet, lyre, balalaika, washboard, vibraphone"),
    ] },
    { id: "rhyme-cat", cat: "Words", q: "Name a word that rhymes with “cat”", tiers: [
      T("hat, bat, rat, mat, sat"),
      T("fat, pat, that, flat, chat, splat"),
      T("brat, spat, gnat, vat, scat, slat, at, tat, drat, combat, format, habitat"),
      T("acrobat, diplomat, aristocrat, thermostat, laundromat, democrat, bureaucrat, autocrat, copycat, wombat, cravat, doormat, tomcat, nonfat, begat, chitchat, polecat, sprat, frat, stat, hazmat, dingbat, ziggurat, rheostat, technocrat"),
    ] },
    { id: "color", cat: "Art", q: "Name a color", tiers: [
      T("red, blue, green, yellow, purple"),
      T("orange, pink, black, white, brown, gray|grey"),
      T("teal, turquoise, magenta, violet, indigo, maroon, navy, beige, cyan, lavender, gold, silver, tan"),
      T("chartreuse, vermilion, cerulean, mauve, ochre|ocher, periwinkle, puce, taupe, sienna, umber, fuchsia, aquamarine, burgundy, crimson, scarlet, coral, salmon, mint, olive, khaki, amber, ivory, lilac, plum, ecru, saffron, celadon, sepia, cobalt, azure, mahogany, emerald, jade, ruby, sapphire, cream"),
    ] },
    { id: "dog", cat: "Animals", q: "Name a dog breed", tiers: [
      T("golden retriever, labrador|lab|labrador retriever, poodle, german shepherd"),
      T("bulldog, chihuahua, husky|siberian husky, beagle, pug, dachshund, corgi, rottweiler, pit bull|pitbull"),
      T("border collie, boxer, great dane, shih tzu, yorkshire terrier|yorkie, doberman, maltese, dalmatian, pomeranian, french bulldog|frenchie, australian shepherd, bernese mountain dog, saint bernard|st bernard, cocker spaniel, greyhound, schnauzer, samoyed, shiba inu, akita"),
      T("basenji, vizsla, weimaraner, whippet, xoloitzcuintli|xolo, borzoi, saluki, komondor, puli, newfoundland, bichon frise|bichon, cavalier king charles spaniel|cavalier, havanese, papillon, pekingese, lhasa apso, chow chow, shar pei, rhodesian ridgeback, bloodhound, basset hound, bull terrier, irish wolfhound, mastiff, alaskan malamute|malamute, keeshond, leonberger, affenpinscher, coton de tulear, schipperke"),
    ] },
    { id: "sport", cat: "Sports", q: "Name a sport", tiers: [
      T("soccer|football, basketball, baseball, tennis"),
      T("volleyball, hockey|ice hockey, golf, swimming, american football, running, boxing, cricket, rugby"),
      T("badminton, table tennis|ping pong, lacrosse, wrestling, softball, skiing, surfing, gymnastics, cycling, skateboarding, snowboarding, track and field|track, bowling, archery, fencing, rowing, karate"),
      T("curling, water polo, polo, handball, squash, jai alai, sepak takraw, hurling, kabaddi, bobsled, luge, skeleton, biathlon, pickleball, ultimate frisbee|ultimate, bocce|lawn bowls, croquet, dodgeball, korfball, shinty, bandy, netball, racquetball, triathlon, judo, taekwondo, sumo, rock climbing|climbing, sailing, canoeing, kayaking, dressage, pentathlon, disc golf, roller derby, darts, snooker, billiards"),
    ] },
    { id: "kitchen", cat: "Home", q: "Name something you find in a kitchen", tiers: [
      T("fridge|refrigerator, stove, oven, microwave, sink"),
      T("knife, fork, spoon, plate, pan, pot, toaster, cup, bowl, table"),
      T("blender, kettle, dishwasher, spatula, cutting board, whisk, cabinet, mug, sponge, apron, oven mitt, ladle, colander, peeler"),
      T("mandoline, zester, garlic press, salad spinner, rolling pin, tongs, pestle, mortar, trivet, sieve, grater, wok, ramekin, baster, kitchen timer|timer, thermometer, corkscrew, can opener, juicer, dutch oven, skillet, tupperware, breadbox, pizza cutter, measuring cup, food processor, stand mixer|mixer, kitchen scale|scale, funnel, butter dish, napkin, tea towel|dish towel, spice rack, pantry, lazy susan"),
    ] },
    { id: "scientist", cat: "Science", q: "Name a famous scientist", tiers: [
      T("Albert Einstein|einstein, Isaac Newton|newton"),
      T("Charles Darwin|darwin, Marie Curie|curie, Galileo, Nikola Tesla|tesla, Stephen Hawking|hawking, Thomas Edison|edison"),
      T("Niels Bohr|bohr, Richard Feynman|feynman, Louis Pasteur|pasteur, Copernicus, Johannes Kepler|kepler, Gregor Mendel|mendel, Michael Faraday|faraday, Robert Oppenheimer|oppenheimer, Werner Heisenberg|heisenberg, Erwin Schrodinger|schrodinger, Carl Sagan|sagan, Rosalind Franklin|franklin, Archimedes, Pythagoras, Aristotle, Ada Lovelace|lovelace, Alan Turing|turing, Jane Goodall|goodall"),
      T("Lise Meitner|meitner, Emmy Noether|noether, James Clerk Maxwell|maxwell, Paul Dirac|dirac, Enrico Fermi|fermi, Ludwig Boltzmann|boltzmann, Max Planck|planck, Ernest Rutherford|rutherford, Antoine Lavoisier|lavoisier, Carl Linnaeus|linnaeus, Edwin Hubble|hubble, Tycho Brahe|brahe, Dmitri Mendeleev|mendeleev, Barbara McClintock|mcclintock, Chien-Shiung Wu, Katherine Johnson, Vera Rubin, Srinivasa Ramanujan|ramanujan, Carl Friedrich Gauss|gauss, Leonhard Euler|euler, Antonie van Leeuwenhoek|leeuwenhoek, Robert Hooke|hooke, Robert Boyle|boyle, Amedeo Avogadro|avogadro, Hypatia, Ibn al-Haytham|alhazen, Francis Crick|crick, James Watson|watson, Jonas Salk|salk, Alexander Fleming|fleming, Edward Jenner|jenner, Alfred Wegener|wegener, Alexander von Humboldt|humboldt, Heinrich Hertz|hertz, Alessandro Volta|volta, Lord Kelvin|kelvin, Linus Pauling|pauling, Peter Higgs|higgs, Neil deGrasse Tyson|tyson, Mae Jemison, Grace Hopper|hopper, John von Neumann|von neumann, Kurt Godel|godel"),
    ] },
    { id: "breakfast", cat: "Food", q: "Name a breakfast food", tiers: [
      T("eggs|egg, pancakes, cereal, bacon, toast"),
      T("waffles, oatmeal, french toast, yogurt|yoghurt, bagel, muffin, sausage, hash browns, omelette|omelet"),
      T("croissant, granola, smoothie, breakfast burrito|burrito, grits, biscuits, donut|doughnut, fruit, porridge, crepes, avocado toast, eggs benedict, cinnamon roll"),
      T("shakshuka, congee, huevos rancheros, chilaquiles, kippers, black pudding, scone, muesli, frittata, quiche, dosa, idli, poha, paratha, miso soup, natto, tamagoyaki, arepa, baked beans, pop tarts, danish, kedgeree, menemen, ful medames, lox, biscuits and gravy, corned beef hash, dutch baby, beignet, churros, chia pudding, acai bowl, english muffin"),
    ] },
    { id: "greek", cat: "Myths", q: "Name a Greek god or goddess", tiers: [
      T("Zeus, Poseidon, Hades"),
      T("Athena, Aphrodite, Apollo, Ares, Hermes, Hera"),
      T("Artemis, Dionysus, Hephaestus, Demeter, Persephone, Hestia, Eros, Nike"),
      T("Hecate, Nemesis, Helios, Selene, Eos, Pan, Gaia, Uranus, Kronos|cronus, Rhea, Hypnos, Thanatos, Iris, Hebe, Tyche, Nyx, Erebus, Chaos, Morpheus, Asclepius, Aeolus, Triton, Themis, Mnemosyne, Eris, Phobos, Deimos, Prometheus, Atlas, Hyperion, Oceanus, Tethys, Metis, Leto, Dione, Harmonia, Eileithyia, Nereus, Proteus, Boreas, Zephyrus, Plutus, Ananke, Chronos, Tartarus"),
    ] },
    { id: "shape", cat: "Math", q: "Name a shape", tiers: [
      T("circle, square, triangle"),
      T("rectangle, star, heart, oval, diamond, hexagon, pentagon"),
      T("octagon, rhombus, trapezoid, cube, sphere, cylinder, cone, pyramid, crescent, parallelogram, cross, arrow"),
      T("dodecahedron, icosahedron, tetrahedron, octahedron, heptagon, nonagon, decagon, dodecagon, ellipse, torus, prism, kite, trapezium, annulus, lune, deltoid, cardioid, hexagram, pentagram, trefoil, reuleaux triangle, frustum, ellipsoid, paraboloid, helix, spiral, chevron, lemniscate, semicircle, sector, quatrefoil, astroid"),
    ] },
    { id: "disney", cat: "Movies", q: "Name a Disney or Pixar movie", tiers: [
      T("Frozen, The Lion King, Toy Story, Moana"),
      T("Finding Nemo, Aladdin, Cinderella, Encanto, The Little Mermaid, Beauty and the Beast, Tangled, Up, Cars, Inside Out, Coco, Zootopia, Monsters Inc|monsters"),
      T("Mulan, Ratatouille, WALL-E|walle|wall e, The Incredibles, Snow White, Pocahontas, Hercules, Bambi, Dumbo, Peter Pan, Sleeping Beauty, Lilo and Stitch, Brave, Big Hero 6, Wreck-It Ralph, The Jungle Book, Soul, Luca, Turning Red, Elemental, Wish, Raya and the Last Dragon|raya"),
      T("The Emperor's New Groove|emperors new groove, Treasure Planet, Atlantis|atlantis the lost empire, Brother Bear, Bolt, Meet the Robinsons, Home on the Range, Chicken Little, The Princess and the Frog, The Hunchback of Notre Dame|hunchback, The Black Cauldron, Oliver and Company, The Great Mouse Detective, The Rescuers, Robin Hood, The Aristocats, 101 Dalmatians|one hundred and one dalmatians, Fantasia, Pinocchio, The Fox and the Hound, A Bug's Life|a bugs life|bugs life, Onward, Lightyear, Strange World, The Good Dinosaur, Alice in Wonderland, The Sword in the Stone, Tarzan, Dinosaur, Elio, Monsters University"),
    ] },
    { id: "vegetable", cat: "Food", q: "Name a vegetable", tiers: [
      T("carrot, broccoli, potato, lettuce, corn"),
      T("spinach, onion, cucumber, celery, bell pepper|pepper, peas|pea, cabbage, cauliflower, green beans|green bean, zucchini|courgette, tomato"),
      T("asparagus, kale, eggplant|aubergine, beet|beetroot, radish, mushroom, sweet potato, squash, pumpkin, garlic, brussels sprouts|brussel sprouts|brussels sprout, artichoke, leek, turnip, yam"),
      T("kohlrabi, rutabaga|swede, parsnip, okra, fennel, bok choy|pak choi, swiss chard|chard, endive, radicchio, arugula|rocket, celeriac, jicama, daikon, watercress, collard greens|collards, salsify, sunchoke|jerusalem artichoke, romanesco, taro, cassava|yuca, bamboo shoots, lotus root, shallot, scallion|green onion|spring onion, chayote, edamame, mustard greens, bitter melon, fiddlehead, samphire, escarole, broccolini, rapini|broccoli rabe, tomatillo, burdock"),
    ] },
    { id: "yellow", cat: "Anything", q: "Name something that is yellow", tiers: [
      T("banana, the sun|sun, lemon"),
      T("school bus|bus, corn, cheese, sunflower, rubber duck|duck, taxi|cab, pineapple, egg yolk|yolk, butter"),
      T("mustard, canary, gold, pencil, bee, minion, pikachu, spongebob, smiley face|emoji, highlighter, daffodil, dandelion, tennis ball, sticky note|post-it|post it, traffic light"),
      T("saffron, turmeric, yield sign, caution tape, legal pad, sulfur, citrine, forsythia, goldfinch, banana slug, yellowjacket|yellow jacket, buttercup, tweety, big bird, the simpsons|simpsons|homer simpson|bart simpson, hard hat, raincoat, custard, lemonade, mango, canola, marigold, yellow pages, lightning bolt, polenta, honey, scrambled eggs"),
    ] },
    { id: "body", cat: "Science", q: "Name a part of the human body", tiers: [
      T("head, arm, leg, hand, eye"),
      T("nose, mouth, foot, ear, finger, heart, brain, knee, toe, hair"),
      T("elbow, shoulder, neck, stomach, lung, liver, kidney, chin, wrist, ankle, hip, back, tongue, tooth|teeth, lip, skin, chest, thumb"),
      T("spleen, pancreas, gallbladder, appendix, femur, tibia, fibula, clavicle|collarbone, scapula|shoulder blade, patella|kneecap, sternum, uvula, philtrum, cornea, retina, iris, pupil, eyebrow, eyelash, earlobe, nostril, armpit, belly button|navel, knuckle, shin, calf, thigh, cuticle, septum, larynx, esophagus, diaphragm, thyroid, tonsil, tailbone|coccyx, achilles tendon, pinky, cerebellum, aorta, trachea, vertebra, bladder, colon, intestine, epiglottis, temple, nape, sole, heel, palm, forearm, biceps|bicep, triceps|tricep, quadriceps|quad, hamstring, glutes"),
    ] },
    { id: "asia", cat: "Geography", q: "Name a city in Asia", tiers: [
      T("Tokyo, Beijing, Seoul, Shanghai"),
      T("Hong Kong, Bangkok, Singapore, Mumbai, Delhi|new delhi, Dubai"),
      T("Osaka, Kyoto, Taipei, Manila, Jakarta, Hanoi, Kuala Lumpur, Ho Chi Minh City|saigon, Busan, Bangalore|bengaluru, Karachi, Istanbul, Tehran, Doha, Kathmandu, Shenzhen, Guangzhou"),
      T("Ulaanbaatar|ulan bator, Almaty, Tashkent, Samarkand, Bishkek, Dushanbe, Ashgabat, Thimphu, Vientiane, Phnom Penh, Yangon, Colombo, Dhaka, Lahore, Islamabad, Kabul, Muscat, Riyadh, Jeddah, Baku, Tbilisi, Yerevan, Chengdu, Chongqing, Xi'an|xian, Harbin, Wuhan, Nagoya, Sapporo, Fukuoka, Incheon, Daegu, Cebu, Chiang Mai, Kolkata, Chennai, Hyderabad, Jaipur, Macau, Male, Bandar Seri Begawan, Dili, Pyongyang, Kaohsiung, Surabaya, Bandung, Penang, Hue, Da Nang, Kuwait City, Manama, Amman, Beirut, Jerusalem, Tel Aviv, Damascus, Baghdad"),
    ] },
    { id: "flower", cat: "Nature", q: "Name a flower", tiers: [
      T("rose, sunflower, tulip, daisy"),
      T("lily, orchid, daffodil, lavender, dandelion, poppy, carnation"),
      T("hibiscus, lotus, peony, iris, marigold, violet, magnolia, jasmine, cherry blossom, hydrangea, chrysanthemum|mum, lilac, gardenia, petunia, begonia"),
      T("snapdragon, foxglove, larkspur, delphinium, zinnia, cosmos, dahlia, gerbera, freesia, gladiolus, amaryllis, anemone, ranunculus, protea, bird of paradise, camellia, azalea, rhododendron, wisteria, bluebell, forget-me-not|forget me not, edelweiss, hellebore, columbine, morning glory, sweet pea, honeysuckle, primrose, cyclamen, crocus, hyacinth, heather, aster, calendula, nasturtium, plumeria|frangipani, bougainvillea, lupine|lupin, oleander, verbena, yarrow, buttercup, clover, thistle, rafflesia, corpse flower, trillium, alstroemeria"),
    ] },
    { id: "q-word", cat: "Words", q: "Name a word that starts with Q", tiers: [
      T("queen, quiet, quick, question"),
      T("quit, quiz, quilt, quack, quarter, quite, quote"),
      T("quest, quail, quarrel, quality, quantity, queue, quake, quartz, quirky|quirk, quench, quiche, quarry"),
      T("quixotic, quagmire, quandary, quintessential, quorum, quasar, quaff, quaint, qualm, quibble, quiver, quokka, quinoa, quetzal, quahog, quarantine, quadrant, quadruple, quark, quell, query, quip, quota, quadratic, quotient, quaver, quince, quintet, quire, quisling, quotidian, quarterback"),
    ] },
    { id: "beach", cat: "Anything", q: "Name something you'd find at the beach", tiers: [
      T("sand, ocean|water|sea, seashell|shell|shells, waves|wave"),
      T("beach towel|towel, umbrella, sunscreen, crab, sandcastle, seagull, lifeguard, surfboard, bucket, beach ball, sunglasses"),
      T("shovel|spade, cooler, flip flops|flip-flops, swimsuit|bathing suit, seaweed, driftwood, kite, boardwalk, pier, starfish, sun hat|hat, beach chair|chair, rocks, tide pool"),
      T("sea glass, sand dollar, jellyfish, kelp, dune, sandpiper, plover, pelican, lighthouse, jetty, buoy, metal detector, boogie board|bodyboard, snorkel, frisbee, volleyball net, ice cream truck, footprints, message in a bottle, sunburn, shark, dolphin, sea turtle, pail, flag, hermit crab, bonfire, tan lines, flotsam, coral, wetsuit"),
    ] },
    { id: "wild-mammal", cat: "Animals", q: "Name a wild mammal", tiers: [
      T("elephant, lion, tiger, bear, monkey"),
      T("giraffe, zebra, whale, dolphin, kangaroo, wolf, gorilla, deer, fox"),
      T("hippo|hippopotamus, rhino|rhinoceros, cheetah, leopard, panda, koala, bat, chimpanzee|chimp, moose, otter, squirrel, raccoon, sloth, camel, polar bear, jaguar, bison|buffalo, beaver, hedgehog"),
      T("aardvark, okapi, pangolin, tapir, platypus, echidna, wombat, quokka, capybara, narwhal, manatee, dugong, wolverine, binturong, fossa, saiga, gerenuk, dik-dik|dik dik, kinkajou, coati, ocelot, serval, caracal, lemur, aye-aye|aye aye, tarsier, loris, mandrill, gibbon, orangutan, bonobo, armadillo, anteater, meerkat, mongoose, hyena, warthog, wildebeest|gnu, gazelle, impala, ibex, yak, llama, alpaca, vicuna, porcupine, chinchilla, marmot, pika, lynx, bobcat, cougar|puma|mountain lion, snow leopard, red panda, walrus, seal, sea lion, elk, caribou|reindeer, musk ox|muskox, mole, shrew, vole, opossum|possum, skunk, badger, weasel, ferret, mink, stoat|ermine, tasmanian devil, numbat, bilby, sugar glider, colugo, solenodon, hyrax"),
    ] },
  ];
})();
