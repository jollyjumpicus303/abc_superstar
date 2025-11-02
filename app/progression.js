const MAX_UNLOCKED = 26;
const STEP = 4;
const DEFAULT_AUDIO_SET = 'ANLAUT';
const SECONDARY_AUDIO_SET = 'OHNE_ANLAUT';

function clampUnlocked(value) {
  const numeric = Number.isFinite(value) ? Math.floor(value) : STEP;
  if (numeric <= 0) return STEP;
  if (numeric >= MAX_UNLOCKED) return MAX_UNLOCKED;
  const remainder = numeric % STEP;
  const base = numeric - remainder;
  return remainder === 0 ? base : base + STEP;
}

function normaliseState(state) {
  const base = state && typeof state === 'object' ? state : {};
  const unlocked = clampUnlocked(base.unlocked);
  const flawless = Number.isFinite(base.flawlessStreak) ? Math.max(0, Math.floor(base.flawlessStreak)) : 0;
  const audioSet = typeof base.audioSet === 'string' && base.audioSet.trim()
    ? base.audioSet.trim().toUpperCase()
    : DEFAULT_AUDIO_SET;

  return {
    ...base,
    unlocked,
    flawlessStreak: flawless,
    audioSet,
  };
}

function isSuccess(result) {
  if (!result || typeof result !== 'object') {
    throw new Error('advanceAfterRun requires a result object');
  }
  if ('success' in result) {
    return Boolean(result.success);
  }
  if ('mistakes' in result) {
    return Number(result.mistakes) === 0;
  }
  if ('errors' in result) {
    return Number(result.errors) === 0;
  }
  throw new Error('advanceAfterRun result must include success|mistakes|errors');
}

function advanceAfterRun({ result, state }) {
  const success = isSuccess(result);
  const current = normaliseState(state);

  let unlocked = current.unlocked;
  let flawless = current.flawlessStreak;
  let audioSet = current.audioSet;

  if (success) {
    flawless += 1;

    const atMax = unlocked >= MAX_UNLOCKED;
    const inPrimarySet = audioSet === DEFAULT_AUDIO_SET;

    if (atMax && inPrimarySet && flawless >= 2) {
      audioSet = SECONDARY_AUDIO_SET;
      unlocked = STEP;
      flawless = 0;
    } else if (flawless >= 2) {
      unlocked = Math.min(MAX_UNLOCKED, unlocked + STEP);
      flawless = 0;
    }
  } else {
    flawless = 0;
  }

  const next = {
    ...current,
    unlocked,
    flawlessStreak: flawless,
    audioSet,
  };

  return next;
}

export {
  advanceAfterRun,
  clampUnlocked,
  normaliseState,
};

export default {
  advanceAfterRun,
};
