const LETTERS_UPPER = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const LETTERS_LOWER = Array.from("abcdefghijklmnopqrstuvwxyz");
const RECORDING_LETTERS = LETTERS_UPPER;
const LERNWEG_PRIMARY_SET = 'ANLAUT';
const LERNWEG_SECONDARY_SET = 'OHNE_ANLAUT';

function normalizeRecordingLetter(letter) {
  if (typeof letter !== 'string') return letter;
  const trimmed = letter.trim();
  return trimmed ? trimmed.toUpperCase() : letter;
}

function getLernwegSetId(progress) {
  const raw = progress && typeof progress.audioSet === 'string'
    ? progress.audioSet.trim().toUpperCase()
    : LERNWEG_PRIMARY_SET;
  return raw === LERNWEG_SECONDARY_SET ? LERNWEG_SECONDARY_SET : LERNWEG_PRIMARY_SET;
}

function getLernwegLetterSet(progress) {
  return getLernwegSetId(progress) === LERNWEG_SECONDARY_SET ? LETTERS_LOWER : LETTERS_UPPER;
}

function getLernwegSetLabel(progress) {
  return getLernwegSetId(progress) === LERNWEG_SECONDARY_SET ? 'Kleinbuchstaben' : 'Grossbuchstaben';
}

function getLernwegUnlockedLetters(progress) {
  const unlocked = progress && Number.isFinite(progress.unlocked) ? progress.unlocked : 4;
  return getLernwegLetterSet(progress).slice(0, unlocked);
}

function getFreeModeLetters(progress) {
  const desiredCount = progress && Number.isFinite(progress.freeLetterCount) ? progress.freeLetterCount : 4;
  return RECORDING_LETTERS.slice(0, desiredCount);
}

function getLetterGridLetters(progress) {
  const mode = progress && progress.mode ? progress.mode : 'FREI';
  return mode === 'LERNWEG' ? getLernwegLetterSet(progress) : RECORDING_LETTERS;
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
  normalizeRecordingLetter,
  getLernwegSetId,
  getLernwegLetterSet,
  getLernwegSetLabel,
  getLernwegUnlockedLetters,
  getFreeModeLetters,
  getLetterGridLetters,
  hasRecording,
};
