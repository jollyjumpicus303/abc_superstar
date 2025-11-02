const MAX_WEIGHT = 7;

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

function computeWeight(letter, wrongCounts) {
  const raw = wrongCounts && typeof wrongCounts === 'object' ? wrongCounts[letter] : 0;
  const count = typeof raw === 'number' && raw > 0 ? raw : 0;
  return Math.min(MAX_WEIGHT, 1 + 2 * count);
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
    recent = [],
    rng = Math.random,
  } = options;

  const candidates = normaliseList(pool);
  if (!candidates.length) {
    throw new Error('pickNext requires at least one letter in the pool');
  }

  const lastLetter = normaliseLetter(last);
  const recentLetters = normaliseList(recent);
  const counts = wrongCounts && typeof wrongCounts === 'object' ? wrongCounts : {};

  const wrongLetters = candidates.filter((letter) => (counts[letter] || 0) > 0);
  const lastErrorIndex = recentLetters.findIndex((letter) => (counts[letter] || 0) > 0);
  const forceWrongPick = wrongLetters.length > 0 && (lastErrorIndex === -1 || lastErrorIndex >= 2);

  const avoidFull = new Set();
  if (lastLetter) avoidFull.add(lastLetter);
  for (const letter of recentLetters) {
    avoidFull.add(letter);
  }

  let source = forceWrongPick ? wrongLetters.slice() : candidates.slice();
  if (!source.length) {
    source = candidates.slice();
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

  const weightedEntries = filtered.map((letter) => ({
    letter,
    weight: computeWeight(letter, counts),
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
