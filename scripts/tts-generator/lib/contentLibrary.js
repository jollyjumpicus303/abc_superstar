const LETTERS = Array.from('ABCDEFGHIJKLMNOPQRSTUVWXYZ');

const EASY_WORDS = {
  A: 'Apfel',
  B: 'Ball',
  C: 'Clown',
  D: 'Dino',
  E: 'Elefant',
  F: 'Frosch',
  G: 'Gitarre',
  H: 'Hase',
  I: 'Igel',
  J: 'Jet',
  K: 'Koala',
  L: 'Lampe',
  M: 'Mond',
  N: 'Ninja',
  O: 'Oktopus',
  P: 'Pirat',
  Q: 'Quark',
  R: 'Rakete',
  S: 'Sonne',
  T: 'Tiger',
  U: 'Uhr',
  V: 'Vogel',
  W: 'Wal',
  X: 'Xylofon',
  Y: 'Yacht',
  Z: 'Zebra',
};

const ADVANCED_WORDS = {
  A: 'Ahoi',
  B: 'Bumerang',
  C: 'Campingplatz',
  D: 'Drachenboot',
  E: 'Expedition',
  F: 'Feuerwehrwagen',
  G: 'Glockenspiel',
  H: 'Hafenrundfahrt',
  I: 'Iglu-Abenteuer',
  J: 'Jonglier-Show',
  K: 'Kompasskurs',
  L: 'Luna oder Louis',
  M: 'Magnetismus',
  N: 'Navigator',
  O: 'Ozeanreise',
  P: 'Piratenschatz',
  Q: 'Quizrunde',
  R: 'Raketenstart',
  S: 'Seifenblasen',
  T: 'Trompetensolo',
  U: 'U-Boot-Reise',
  V: 'Vulkanausbruch',
  W: 'Wolkenflug',
  X: 'Xylophonkonzert',
  Y: 'Yo-Yo-Trick',
  Z: 'Zeitreise',
};

const AFFIG_SUBJECTS = {
  A: 'Ameise',
  B: 'Bananenbär',
  C: 'Comic-Held',
  D: 'Dreirad',
  E: 'Erdbeere',
  F: 'Flauschefuchs',
  G: 'Grandioser Gecko',
  H: 'Hatschi-Hase',
  I: 'Iglu-Bauer',
  J: 'Jongleur',
  K: 'Keksdrache',
  L: 'Lach-Lama',
  M: 'Mini-Mammut',
  N: 'Neon-Nudel',
  O: 'Obst-Oktopus',
  P: 'Pudding-Pirat',
  Q: 'Quatsch-Qualle',
  R: 'Rätsel-Robo',
  S: 'Supersocke',
  T: 'Tanz-T-Rex',
  U: 'Uhu mit Ukulele',
  V: 'Verrückte Vulkanfee',
  W: 'Witz-Walross',
  X: 'Xylo-Xaver',
  Y: 'Yeti-Buddy',
  Z: 'Zauber-Zebra',
};

const LETTER_ONLY_TEMPLATES = [
  'Das ist das {{LETTER}}.',
  '{{LETTER}}.',
  '{{LETTER}} — sprich es laut!',
  'Hörst du das {{LETTER}}?',
];

const LEICHT_TEMPLATES = [
  '{{LETTER}}, wie {{WORD}}.',
  '{{LETTER}} klingt wie {{WORD}}.',
  '{{LETTER}}, wie {{WORD}} — merk dir das!',
];

const SCHWER_TEMPLATES = [
  '{{WORD}} startet mit {{LETTER}}.',
  'Denke an {{WORD}}, das beginnt mit {{LETTER}}.',
  '{{LETTER}} wie in {{WORD}} – schon etwas kniffliger.',
];

const AFFIG_TEMPLATES = [
  'Affige Frage zum {{LETTER}}: Warum lacht der {{WORD}} immer zuerst? Weil {{LETTER}} ihn zum kichern bringt!',
  'Rätselzeit: Welches Wesen mit {{LETTER}} im Namen klaut heimlich Keckse? Natürlich der {{WORD}}!',
  'Witzig: Der {{WORD}} übt das {{LETTER}} so laut, dass selbst die Wolken zuhören.',
];

module.exports = {
  LETTERS,
  EASY_WORDS,
  ADVANCED_WORDS,
  AFFIG_SUBJECTS,
  LETTER_ONLY_TEMPLATES,
  LEICHT_TEMPLATES,
  SCHWER_TEMPLATES,
  AFFIG_TEMPLATES,
};
