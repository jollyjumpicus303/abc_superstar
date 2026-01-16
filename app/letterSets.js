const LETTERS_UPPER = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LETTERS_LOWER = Array.from("abcdefghijklmnopqrstuvwxyz");
const RECORDING_LETTERS = LETTERS_UPPER;
const LERNWEG_PRIMARY_SET = 'ANLAUT';
const LERNWEG_SECONDARY_SET = 'OHNE_ANLAUT';
const LERNWEG_MIXED_SET = 'MIXED';
const FREE_MODE_LETTER_CASES = ['UPPER', 'LOWER', 'MIXED'];

function normalizeRecordingLetter(letter) {
  if (typeof letter !== 'string') return letter;
  const trimmed = letter.trim();
  return trimmed ? trimmed.toUpperCase() : letter;
}

function isValidMixedLetterSet(list) {
  if (!Array.isArray(list) || list.length !== LETTERS_UPPER.length) return false;
  const seen = new Set();
  for (const letter of list) {
    if (typeof letter !== 'string' || letter.length !== 1) return false;
    const normalized = letter.toUpperCase();
    if (!LETTERS_UPPER.includes(normalized)) return false;
    if (seen.has(normalized)) return false;
    seen.add(normalized);
  }
  return seen.size === LETTERS_UPPER.length;
}

function buildMixedLetterSet(rng = Math.random) {
  const letters = LETTERS_UPPER.map(letter => (rng() < 0.5 ? letter.toLowerCase() : letter));
  for (let i = letters.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = letters[i];
    letters[i] = letters[j];
    letters[j] = tmp;
  }
  return letters;
}

function getLernwegSetId(progress) {
  const raw = progress && typeof progress.audioSet === 'string'
    ? progress.audioSet.trim().toUpperCase()
    : LERNWEG_PRIMARY_SET;
  if (raw === LERNWEG_SECONDARY_SET) return LERNWEG_SECONDARY_SET;
  if (raw === LERNWEG_MIXED_SET) return LERNWEG_MIXED_SET;
  return LERNWEG_PRIMARY_SET;
}

function getLernwegMixedLetters(progress) {
  const list = progress && Array.isArray(progress.lernwegMixedLetters)
    ? progress.lernwegMixedLetters
    : null;
  return isValidMixedLetterSet(list) ? list : LETTERS_UPPER;
}

function getLernwegLetterSet(progress) {
  const setId = getLernwegSetId(progress);
  if (setId === LERNWEG_SECONDARY_SET) return LETTERS_LOWER;
  if (setId === LERNWEG_MIXED_SET) return getLernwegMixedLetters(progress);
  return LETTERS_UPPER;
}

function getLernwegSetLabel(progress) {
  const setId = getLernwegSetId(progress);
  if (setId === LERNWEG_SECONDARY_SET) return 'Kleinbuchstaben';
  if (setId === LERNWEG_MIXED_SET) return 'Gemischte Buchstaben';
  return 'Grossbuchstaben';
}

function getFreeModeLetterCase(progress) {
  const raw = progress && typeof progress.freeLetterCase === 'string'
    ? progress.freeLetterCase.trim().toUpperCase()
    : 'UPPER';
  if (raw === 'LOWER') return 'LOWER';
  if (raw === 'MIXED') return 'MIXED';
  return 'UPPER';
}

function getFreeModeMixedLetters(progress) {
  const list = progress && Array.isArray(progress.freeMixedLetters)
    ? progress.freeMixedLetters
    : null;
  return isValidMixedLetterSet(list) ? list : LETTERS_UPPER;
}

function getFreeModeLetterSet(progress) {
  const letterCase = getFreeModeLetterCase(progress);
  if (letterCase === 'LOWER') return LETTERS_LOWER;
  if (letterCase === 'MIXED') return getFreeModeMixedLetters(progress);
  return LETTERS_UPPER;
}

function getFreeModeLetterCaseLabel(progress) {
  const letterCase = getFreeModeLetterCase(progress);
  if (letterCase === 'LOWER') return 'Kleinbuchstaben';
  if (letterCase === 'MIXED') return 'Gemischt';
  return 'Grossbuchstaben';
}

function getLernwegUnlockedLetters(progress) {
  const unlocked = progress && Number.isFinite(progress.unlocked) ? progress.unlocked : 4;
  return getLernwegLetterSet(progress).slice(0, unlocked);
}

function getFreeModeLetters(progress) {
  const letterCase = getFreeModeLetterCase(progress);
  const desiredCount = letterCase === 'MIXED'
    ? (progress && Number.isFinite(progress.freeMixedUnlocked) ? progress.freeMixedUnlocked : 4)
    : (progress && Number.isFinite(progress.freeLetterCount) ? progress.freeLetterCount : 4);
  return getFreeModeLetterSet(progress).slice(0, desiredCount);
}

function getLetterGridLetters(progress) {
  const mode = progress && progress.mode ? progress.mode : 'FREI';
  if (mode === 'LERNWEG') {
    return getLernwegLetterSet(progress);
  }
  if (mode === 'FREI') {
    return getFreeModeLetterSet(progress);
  }
  return RECORDING_LETTERS;
}

function hasRecording(recordedSet, letter) {
  return recordedSet.has(normalizeRecordingLetter(letter));
}

export {
  LETTERS_UPPER,
  LETTERS_LOWER,
  RECORDING_LETTERS,
  LERNWEG_PRIMARY_SET,
  LERNWEG_SECONDARY_SET,
  LERNWEG_MIXED_SET,
  FREE_MODE_LETTER_CASES,
  normalizeRecordingLetter,
  isValidMixedLetterSet,
  buildMixedLetterSet,
  getLernwegSetId,
  getLernwegMixedLetters,
  getLernwegLetterSet,
  getLernwegSetLabel,
  getFreeModeLetterCase,
  getFreeModeMixedLetters,
  getFreeModeLetterSet,
  getFreeModeLetterCaseLabel,
  getLernwegUnlockedLetters,
  getFreeModeLetters,
  getLetterGridLetters,
  hasRecording,
};
