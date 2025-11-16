const {
  LETTERS,
  EASY_WORDS,
  ADVANCED_WORDS,
  AFFIG_SUBJECTS,
  LETTER_ONLY_TEMPLATES,
  LEICHT_TEMPLATES,
  SCHWER_TEMPLATES,
  AFFIG_TEMPLATES,
} = require('./contentLibrary');

const KNOWN_DIFFICULTIES = ['LEICHT', 'MITTEL', 'SCHWER', 'AFFIG'];
const DEFAULT_PHONETICS = {
  E: {
    text: 'Äh',
    ssml: '<phoneme alphabet="ipa" ph="eː">E</phoneme>',
  },
  J: {
    text: 'Jott',
    ssml: '<phoneme alphabet="ipa" ph="jɔt">J</phoneme>',
  },
  Q: {
    text: 'Kuh',
    ssml: '<phoneme alphabet="ipa" ph="kuː">Q</phoneme>',
  },
  U: {
    text: 'Uh',
    ssml: '<phoneme alphabet="ipa" ph="uː">U</phoneme>',
  },
  W: {
    text: 'Weh',
    ssml: '<phoneme alphabet="ipa" ph="veː">W</phoneme>',
  },
  Y: {
    text: 'Ypsilon',
    ssml: '<phoneme alphabet="ipa" ph="ʏpsilɔn">Y</phoneme>',
  },
};

function normaliseLetter(letter){
  if(!letter) return null;
  const upper = letter.toString().trim().toUpperCase();
  return LETTERS.includes(upper) ? upper : null;
}

function normaliseDifficulty(value){
  if(!value) return 'LEICHT';
  const upper = value.toString().trim().toUpperCase();
  return KNOWN_DIFFICULTIES.includes(upper) ? upper : 'LEICHT';
}

function setPickIndex(letter, difficulty, variantName, modulo){
  const base = (letter.charCodeAt(0) - 64) * 31;
  const diffSum = difficulty.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  const variantSum = (variantName || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (base + diffSum + variantSum) % modulo;
}

function resolveOverrideForWord(config, difficulty, letter, seedFallback){
  if(!config || !config.contentOverrides) return null;
  const byDifficulty = config.contentOverrides[difficulty];
  if(!byDifficulty) return null;
  const raw = byDifficulty[letter];
  if(!raw) return null;
  if(Array.isArray(raw) && raw.length){
    const idx = seedFallback % raw.length;
    return raw[idx];
  }
  if(typeof raw === 'string'){
    return raw;
  }
  return null;
}

function fallbackWord(letter, suffix){
  return `${letter}${suffix}`;
}

function pickWord({letter, difficulty, variantName, config, fallbackMap, fallbackSuffix}){
  const seed = setPickIndex(letter, difficulty, variantName || 'default', 997);
  const override = resolveOverrideForWord(config, difficulty, letter, seed);
  if(override){
    return override;
  }
  if(fallbackMap && fallbackMap[letter]){
    const value = fallbackMap[letter];
    if(Array.isArray(value) && value.length){
      return value[seed % value.length];
    }
    return value;
  }
  return fallbackWord(letter, fallbackSuffix || '-Wort');
}

function normalisePronunciation(raw){
  if(typeof raw === 'string'){
    const text = raw.trim();
    return text ? { text } : null;
  }
  if(!raw || typeof raw !== 'object'){
    return null;
  }
  const entry = {};
  if(typeof raw.text === 'string' && raw.text.trim()){
    entry.text = raw.text.trim();
  }
  if(typeof raw.ssml === 'string' && raw.ssml.trim()){
    entry.ssml = raw.ssml.trim();
  }
  if(typeof raw.default === 'string' && raw.default.trim() && !entry.text){
    entry.text = raw.default.trim();
  }
  if(raw.providers && typeof raw.providers === 'object'){
    const providers = {};
    for(const [name, value] of Object.entries(raw.providers)){
      const norm = normalisePronunciation(value);
      if(norm){
        providers[name] = norm;
      }
    }
    if(Object.keys(providers).length){
      entry.providers = providers;
    }
  }
  if(!entry.text && !entry.ssml && !entry.providers){
    return null;
  }
  return entry;
}

function resolvePronunciationEntry(source, letter, provider){
  if(!source || !Object.prototype.hasOwnProperty.call(source, letter)){
    return null;
  }
  const entry = normalisePronunciation(source[letter]);
  if(!entry){
    return null;
  }
  if(provider && entry.providers && entry.providers[provider]){
    const providerEntry = entry.providers[provider];
    return {
      text: providerEntry.text || entry.text,
      ssml: providerEntry.ssml || entry.ssml,
    };
  }
  return {
    text: entry.text,
    ssml: entry.ssml,
  };
}

function resolveLetterPhonetic(letter, config, provider){
  const configEntry = resolvePronunciationEntry(config && config.letterPronunciations, letter, provider);
  if(configEntry){
    return configEntry;
  }
  const defaultEntry = resolvePronunciationEntry(DEFAULT_PHONETICS, letter, provider);
  if(defaultEntry){
    return defaultEntry;
  }
  return null;
}

function withPhonetics(letter, config, provider, useSsml){
  const phonetic = resolveLetterPhonetic(letter, config, provider);
  if(useSsml && phonetic && phonetic.ssml){
    return phonetic.ssml;
  }
  if(phonetic && phonetic.text){
    return phonetic.text;
  }
  return letter;
}

function fillTemplate(template, letter, word, config, provider, useSsml){
  const letterToken = withPhonetics(letter, config, provider, useSsml);
  return template
    .replace(/{{LETTER_RAW}}/g, letter)
    .replace(/{{LETTER}}/g, letterToken)
    .replace(/{{WORD}}/g, word || '');
}

function buildEasyUtterance(letter, variantName, config, provider, useSsml){
  const word = pickWord({
    letter,
    difficulty: 'LEICHT',
    variantName,
    config,
    fallbackMap: EASY_WORDS,
    fallbackSuffix: '-Freund',
  });
  const idx = setPickIndex(letter, 'LEICHT', variantName, LEICHT_TEMPLATES.length);
  const template = LEICHT_TEMPLATES[idx];
  return fillTemplate(template, letter, word, config, provider, useSsml);
}

function buildMediumUtterance(letter, variantName, config, provider, useSsml){
  const idx = setPickIndex(letter, 'MITTEL', variantName, LETTER_ONLY_TEMPLATES.length);
  const template = LETTER_ONLY_TEMPLATES[idx];
  return fillTemplate(template, letter, letter, config, provider, useSsml);
}

function buildHardUtterance(letter, variantName, config, provider, useSsml){
  const word = pickWord({
    letter,
    difficulty: 'SCHWER',
    variantName,
    config,
    fallbackMap: ADVANCED_WORDS,
    fallbackSuffix: '-Abenteuer',
  });
  const idx = setPickIndex(letter, 'SCHWER', variantName, SCHWER_TEMPLATES.length);
  const template = SCHWER_TEMPLATES[idx];
  return fillTemplate(template, letter, word, config, provider, useSsml);
}

function buildAffigUtterance(letter, variantName, config, provider, useSsml){
  const word = pickWord({
    letter,
    difficulty: 'AFFIG',
    variantName,
    config,
    fallbackMap: AFFIG_SUBJECTS,
    fallbackSuffix: '-Comic',
  });
  const idx = setPickIndex(letter, 'AFFIG', variantName, AFFIG_TEMPLATES.length);
  const template = AFFIG_TEMPLATES[idx];
  return fillTemplate(template, letter, word, config, provider, useSsml);
}

function generateUtterance(letterInput, difficultyInput, options = {}){
  const letter = normaliseLetter(letterInput);
  if(!letter){
    throw new Error(`Ungültiger Buchstabe: ${letterInput}`);
  }
  const difficulty = normaliseDifficulty(difficultyInput);
  const variantName = options.variantName || 'default';
  const provider = options.provider;
  const useSsml = Boolean(options.useSsml);
  switch(difficulty){
    case 'LEICHT':
      return buildEasyUtterance(letter, variantName, options.config, provider, useSsml);
    case 'MITTEL':
      return buildMediumUtterance(letter, variantName, options.config, provider, useSsml);
    case 'SCHWER':
      return buildHardUtterance(letter, variantName, options.config, provider, useSsml);
    case 'AFFIG':
      return buildAffigUtterance(letter, variantName, options.config, provider, useSsml);
    default:
      throw new Error(`Unbekannte Schwierigkeit: ${difficulty}`);
  }
}

module.exports = {
  LETTERS,
  KNOWN_DIFFICULTIES,
  generateUtterance,
};
