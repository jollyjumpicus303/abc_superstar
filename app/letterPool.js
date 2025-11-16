const RECENT_LIMIT = 4;
const RECENCY_PENALTIES = [0.15, 0.4, 0.65, 0.85];
const WRONG_WEIGHT_STEP = 3;
const MASTERED_DAMPING = 0.5;
const COVERAGE_GAP_THRESHOLD = 2;
const MIN_WEIGHT = 0.0001;

function normaliseLetter(letter) {
  if (typeof letter !== 'string') return null;
  const trimmed = letter.trim();
  if (!trimmed) return null;
  return trimmed.toUpperCase();
}

function normaliseList(list) {
  if (!Array.isArray(list)) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    const normalised = normaliseLetter(item);
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(normalised);
  }
  return result;
}

function normaliseRecent(list) {
  if (!Array.isArray(list) || !list.length) return [];
  const seen = new Set();
  const result = [];
  for (const item of list) {
    if (result.length >= RECENT_LIMIT) break;
    const normalised = normaliseLetter(item);
    if (!normalised || seen.has(normalised)) continue;
    seen.add(normalised);
    result.push(normalised);
  }
  return result;
}

function getSafeCount(map, letter) {
  if (!map || typeof map !== 'object') return 0;
  const raw = map[letter];
  const numeric = Number(raw);
  if (!Number.isFinite(numeric) || numeric <= 0) {
    return 0;
  }
  return Math.max(0, Math.floor(numeric));
}

function computeAskedStats(letters, askedCounts) {
  if (!letters.length) {
    return { minAsked: null, maxAsked: null };
  }
  let min = Infinity;
  let max = -Infinity;
  for (const letter of letters) {
    const value = getSafeCount(askedCounts, letter);
    if (value < min) min = value;
    if (value > max) max = value;
  }
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    return { minAsked: null, maxAsked: null };
  }
  return { minAsked: min, maxAsked: max };
}

function computeRecencyPenalty(letter, lastLetter, recencyMap) {
  if (lastLetter && letter === lastLetter) {
    return RECENCY_PENALTIES[0];
  }
  if (!recencyMap || !recencyMap.has(letter)) {
    return 1;
  }
  const index = recencyMap.get(letter);
  const penaltyIndex = Math.min(index + 1, RECENCY_PENALTIES.length - 1);
  return RECENCY_PENALTIES[penaltyIndex] ?? 0.85;
}

function computeWeight(letter, wrongCounts, options = {}) {
  const askedCounts = options && typeof options.askedCounts === 'object' ? options.askedCounts : {};
  const correctStreaks = options && typeof options.correctStreaks === 'object' ? options.correctStreaks : {};
  const recencyMap = options && options.recencyMap instanceof Map ? options.recencyMap : null;
  const minAsked = Number.isFinite(options && options.minAsked) ? options.minAsked : null;
  const lastLetter = normaliseLetter(options && options.lastLetter);

  const wrong = getSafeCount(wrongCounts, letter);
  const asked = getSafeCount(askedCounts, letter);
  const streak = getSafeCount(correctStreaks, letter);

  const wrongBoost = wrong > 0 ? 1 + wrong * WRONG_WEIGHT_STEP : 1;
  const coverageBoost = minAsked === null ? 1 : (1 + Math.max(0, (minAsked + 1) - asked));
  const masteryPenalty = 1 / (1 + streak * MASTERED_DAMPING);
  const recencyPenalty = computeRecencyPenalty(letter, lastLetter, recencyMap);

  const rawWeight = wrongBoost * coverageBoost * masteryPenalty * recencyPenalty;
  return rawWeight > MIN_WEIGHT ? rawWeight : MIN_WEIGHT;
}

function clampRngValue(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return 0;
  if (value <= 0) return 0;
  if (value >= 1) return Math.nextDown ? Math.nextDown(1) : (1 - Number.EPSILON);
  return value;
}

function weightedSelect(entries, rng) {
  if (!entries.length) {
    return null;
  }

  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  if (total <= 0) {
    return entries[0].letter;
  }

  const randomFn = typeof rng === 'function' ? rng : Math.random;
  const pick = clampRngValue(randomFn()) * total;

  let acc = 0;
  for (const entry of entries) {
    acc += entry.weight;
    if (pick < acc) {
      return entry.letter;
    }
  }

  return entries[entries.length - 1].letter;
}

function pickNext(options) {
  if (!options || !Array.isArray(options.pool)) {
    throw new Error('pickNext requires a pool array');
  }

  const {
    pool,
    last = null,
    wrongCounts = {},
    correctStreaks = {},
    askedCounts = {},
    recent = [],
    recentErrors = [],
    rng = Math.random,
  } = options;

  const candidates = normaliseList(pool);
  if (!candidates.length) {
    throw new Error('pickNext requires at least one letter in the pool');
  }

  const lastLetter = normaliseLetter(last);
  const recentLetters = normaliseRecent(recent);
  const recencyMap = new Map();
  recentLetters.forEach((letter, index) => recencyMap.set(letter, index));
  const counts = wrongCounts && typeof wrongCounts === 'object' ? wrongCounts : {};
  const streaks = correctStreaks && typeof correctStreaks === 'object' ? correctStreaks : {};
  const askedMap = askedCounts && typeof askedCounts === 'object' ? askedCounts : {};
  const errorHistory = Array.isArray(recentErrors)
    ? recentErrors.filter((flag, idx) => idx < 3).map(Boolean)
    : [];

  const wrongLetters = candidates.filter((letter) => getSafeCount(counts, letter) > 0);
  const lastErrorIndex = recentLetters.findIndex((letter) => getSafeCount(counts, letter) > 0);
  const forceWrongPick = wrongLetters.length > 0 && (lastErrorIndex === -1 || lastErrorIndex >= 2);
  const avoidErrorQuota = !forceWrongPick && errorHistory.some((flag, idx) => idx < 2 && flag === true);

  const avoidFull = new Set();
  if (lastLetter) avoidFull.add(lastLetter);
  for (const letter of recentLetters) {
    avoidFull.add(letter);
  }

  let source = forceWrongPick ? wrongLetters.slice() : candidates.slice();
  if (!source.length) {
    source = candidates.slice();
  }

  if (avoidErrorQuota) {
    const nonError = source.filter((letter) => getSafeCount(counts, letter) === 0);
    if (nonError.length) {
      source = nonError;
    }
  }

  let coverageStats = computeAskedStats(source, askedMap);
  if (coverageStats.minAsked === null) {
    coverageStats = computeAskedStats(candidates, askedMap);
  }

  if (
    source.length > 1 &&
    coverageStats.minAsked !== null &&
    coverageStats.maxAsked !== null &&
    (coverageStats.maxAsked - coverageStats.minAsked) >= COVERAGE_GAP_THRESHOLD
  ) {
    const limit = coverageStats.minAsked + 1;
    const catchUp = source.filter((letter) => getSafeCount(askedMap, letter) <= limit);
    if (catchUp.length) {
      source = catchUp;
      coverageStats = computeAskedStats(source, askedMap);
    }
  }

  let filtered = source.filter((letter) => !avoidFull.has(letter));

  if (!filtered.length && source.length) {
    const avoidLastOnly = lastLetter ? new Set([lastLetter]) : null;
    if (avoidLastOnly) {
      filtered = source.filter((letter) => !avoidLastOnly.has(letter));
    }
  }

  if (!filtered.length) {
    filtered = source.slice();
  }

  const effectiveStats = computeAskedStats(filtered, askedMap);
  const minAsked = effectiveStats.minAsked !== null ? effectiveStats.minAsked : coverageStats.minAsked;

  const weightedEntries = filtered.map((letter) => ({
    letter,
    weight: computeWeight(letter, counts, {
      askedCounts: askedMap,
      correctStreaks: streaks,
      recencyMap,
      lastLetter,
      minAsked,
    }),
  }));

  const result = weightedSelect(weightedEntries, rng);
  return result || filtered[0];
}

function shuffle(list, rng) {
  const result = list.slice();
  const randomFn = typeof rng === 'function' ? rng : Math.random;
  for (let i = result.length - 1; i > 0; i -= 1) {
    const r = clampRngValue(randomFn());
    const j = Math.floor(r * (i + 1));
    const swapIndex = j > i ? i : j;
    const tmp = result[i];
    result[i] = result[swapIndex];
    result[swapIndex] = tmp;
  }
  return result;
}

function makeOptions(options) {
  if (!options) {
    throw new Error('makeOptions requires options');
  }

  const {
    correct,
    pool = [],
    size = 4,
    rng = Math.random,
  } = options;

  const correctLetter = normaliseLetter(correct);
  if (!correctLetter) {
    throw new Error('makeOptions requires a valid correct letter');
  }

  const uniquePool = normaliseList(pool);
  if (!uniquePool.includes(correctLetter)) {
    uniquePool.push(correctLetter);
  }

  const others = uniquePool.filter((letter) => letter !== correctLetter);
  const desiredSize = Math.max(1, Number.isFinite(size) ? Math.floor(size) : 1);
  const selections = [correctLetter];

  const randomFn = typeof rng === 'function' ? rng : Math.random;

  while (selections.length < desiredSize && others.length > 0) {
    const r = clampRngValue(randomFn());
    const index = Math.floor(r * others.length);
    const pickIndex = index >= others.length ? others.length - 1 : index;
    selections.push(others.splice(pickIndex, 1)[0]);
  }

  return shuffle(selections, randomFn);
}

export {
  pickNext,
  makeOptions,
  computeWeight,
  normaliseLetter,
  normaliseList,
};

export default {
  pickNext,
  makeOptions,
};
