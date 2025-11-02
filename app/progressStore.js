const STORAGE_KEY = 'abc_abenteuer_progress';
const CURRENT_VERSION = 1;

const DEFAULT_STATE = Object.freeze({
  version: CURRENT_VERSION,
  mode: 'FREI',
  unlocked: 4,
  flawlessStreak: 0,
  wrongCounts: {},
  audioSet: 'ANLAUT',
  difficulty: 'LEICHT',
  correctStreaks: {},
});

let memoryFallback = cloneState(DEFAULT_STATE);

function cloneState(state) {
  return JSON.parse(JSON.stringify(state));
}

function safeStorage() {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage;
    }
  } catch (_) {
    // ignore access errors
  }
  return null;
}

function migrate(raw) {
  if (!raw || typeof raw !== 'object') {
    return cloneState(DEFAULT_STATE);
  }

  let migrated = { ...raw };
  const version = typeof migrated.version === 'number' ? migrated.version : 0;

  if (version < 1) {
    migrated = { ...cloneState(DEFAULT_STATE), ...migrated };
    migrated.version = CURRENT_VERSION;
  }

  if (!migrated.wrongCounts || typeof migrated.wrongCounts !== 'object') {
    migrated.wrongCounts = {};
  }

  if (!migrated.correctStreaks || typeof migrated.correctStreaks !== 'object') {
    migrated.correctStreaks = {};
  }

  migrated.version = CURRENT_VERSION;

  return migrated;
}

function readState() {
  const storage = safeStorage();
  if (!storage) {
    memoryFallback = migrate(memoryFallback);
    return cloneState(memoryFallback);
  }

  const rawJson = storage.getItem(STORAGE_KEY);
  if (!rawJson) {
    return cloneState(DEFAULT_STATE);
  }

  try {
    const parsed = JSON.parse(rawJson);
    return migrate(parsed);
  } catch (_) {
    return cloneState(DEFAULT_STATE);
  }
}

function writeState(state) {
  const storage = safeStorage();
  const next = migrate(state);
  const payload = JSON.stringify(next);

  if (!storage) {
    memoryFallback = cloneState(next);
    return next;
  }

  storage.setItem(STORAGE_KEY, payload);
  return next;
}

function getProgress() {
  return readState();
}

function saveProgress(partial) {
  const current = readState();
  const merged = {
    ...current,
    ...partial,
    wrongCounts: {
      ...current.wrongCounts,
      ...(partial && partial.wrongCounts ? partial.wrongCounts : {}),
    },
    correctStreaks: {
      ...current.correctStreaks,
      ...(partial && partial.correctStreaks ? partial.correctStreaks : {}),
    },
  };
  merged.version = CURRENT_VERSION;
  const saved = writeState(merged);
  return cloneState(saved);
}

function resetProgress() {
  return writeState(cloneState(DEFAULT_STATE));
}

function normaliseLetter(letter) {
  if (typeof letter !== 'string') return null;
  const trimmed = letter.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

function markCorrect(letter) {
  const normalised = normaliseLetter(letter);
  if (!normalised) {
    return getProgress();
  }

  const state = readState();
  const streak = (state.correctStreaks[normalised] || 0) + 1;
  state.correctStreaks[normalised] = streak;

  const currentWrong = state.wrongCounts[normalised] || 0;
  if (currentWrong > 0 && streak >= 2) {
    state.wrongCounts[normalised] = currentWrong - 1;
    state.correctStreaks[normalised] = 0; // Reset streak after decay
  }

  return writeState(state);
}

function markWrong(letters) {
  if (!letters) {
    return getProgress();
  }

  const list = Array.isArray(letters) ? letters : [letters];
  const state = readState();

  for (const letter of list) {
    const normalised = normaliseLetter(letter);
    if (!normalised) continue;

    state.correctStreaks[normalised] = 0;
    const current = state.wrongCounts[normalised] || 0;
    state.wrongCounts[normalised] = Math.min(current + 1, 3);
  }

  return writeState(state);
}

export {
  CURRENT_VERSION,
  DEFAULT_STATE,
  getProgress,
  saveProgress,
  resetProgress,
  markCorrect,
  markWrong,
  migrate,
};

// Optional global for non-module consumers
if (typeof window !== 'undefined') {
  window.progressStore = {
    getProgress,
    saveProgress,
    resetProgress,
    markCorrect,
    markWrong,
  };
}

