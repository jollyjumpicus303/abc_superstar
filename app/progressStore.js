const STORAGE_KEY = 'abc_abenteuer_progress';
const CURRENT_VERSION = 3;

const DEFAULT_STATE = Object.freeze({
  version: CURRENT_VERSION,
  mode: 'FREI',
  unlocked: 4,
  flawlessStreak: 0,
  wrongCounts: {},
  audioSet: 'ANLAUT',
  difficulty: 'LEICHT',
  correctStreaks: {},
  freeLetterCount: 4,
  audioStyle: 'AUTO',
  attemptLog: [],
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

  if (version < 2) {
    if (typeof migrated.freeLetterCount !== 'number') {
      migrated.freeLetterCount = DEFAULT_STATE.freeLetterCount;
    }
  }

  if (version < 3) {
    if (typeof migrated.audioStyle !== 'string') {
      migrated.audioStyle = DEFAULT_STATE.audioStyle;
    }
    if (typeof migrated.difficulty !== 'string') {
      migrated.difficulty = DEFAULT_STATE.difficulty;
    }
  }

  if (!migrated.wrongCounts || typeof migrated.wrongCounts !== 'object') {
    migrated.wrongCounts = {};
  }

  if (!migrated.correctStreaks || typeof migrated.correctStreaks !== 'object') {
    migrated.correctStreaks = {};
  }

  if (typeof migrated.freeLetterCount !== 'number' || migrated.freeLetterCount <= 0) {
    migrated.freeLetterCount = DEFAULT_STATE.freeLetterCount;
  }

  if (typeof migrated.audioStyle !== 'string' || !migrated.audioStyle.trim()) {
    migrated.audioStyle = DEFAULT_STATE.audioStyle;
  } else {
    migrated.audioStyle = migrated.audioStyle.trim().toUpperCase();
    if (!['AUTO', 'MANUAL'].includes(migrated.audioStyle)) {
      migrated.audioStyle = DEFAULT_STATE.audioStyle;
    }
  }

  if (typeof migrated.difficulty !== 'string' || !migrated.difficulty.trim()) {
    migrated.difficulty = DEFAULT_STATE.difficulty;
  } else {
    migrated.difficulty = migrated.difficulty.trim().toUpperCase();
  }

  if (!Array.isArray(migrated.attemptLog)) {
    migrated.attemptLog = [];
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

function logAttempt(state, target, chosen, isCorrect) {
  state.attemptLog.push({
    target: normaliseLetter(target),
    chosen: normaliseLetter(chosen),
    correct: isCorrect,
    timestamp: Date.now(),
  });
  // Keep the log from growing too large
  if (state.attemptLog.length > 500) {
    state.attemptLog = state.attemptLog.slice(state.attemptLog.length - 500);
  }
}

function markCorrect(targetLetter, chosenLetter) {
  const normalisedTarget = normaliseLetter(targetLetter);
  if (!normalisedTarget) {
    return getProgress();
  }

  const state = readState();
  logAttempt(state, targetLetter, chosenLetter, true);

  const streak = (state.correctStreaks[normalisedTarget] || 0) + 1;
  state.correctStreaks[normalisedTarget] = streak;

  const currentWrong = state.wrongCounts[normalisedTarget] || 0;
  if (currentWrong > 0 && streak >= 2) {
    state.wrongCounts[normalisedTarget] = currentWrong - 1;
    state.correctStreaks[normalisedTarget] = 0; // Reset streak after decay
  }

  return writeState(state);
}

function markWrong(targetLetter, chosenLetter) {
  const normalisedTarget = normaliseLetter(targetLetter);
  const normalisedChosen = normaliseLetter(chosenLetter);

  if (!normalisedTarget || !normalisedChosen) {
    return getProgress();
  }

  const state = readState();
  logAttempt(state, targetLetter, chosenLetter, false);

  state.correctStreaks[normalisedTarget] = 0;
  const current = state.wrongCounts[normalisedTarget] || 0;
  state.wrongCounts[normalisedTarget] = Math.min(current + 1, 3);

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
