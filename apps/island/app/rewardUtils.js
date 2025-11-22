const MAX_RUN_STARS = 5;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function toSafeNumber(value) {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return 0;
  return numeric;
}

/**
 * Computes how many of the five result stars a player receives for a run.
 * @param {number} correct Amount of correctly gelöste Aufgaben
 * @param {number} total Gesamtzahl der Aufgaben in der Runde
 * @returns {number} Integer zwischen 0 und 5
 */
function computeRunStars(correct, total) {
  const safeTotal = Math.max(0, Math.floor(toSafeNumber(total)));
  const safeCorrect = Math.max(0, Math.floor(toSafeNumber(correct)));
  if (safeTotal <= 0 || safeCorrect <= 0) {
    return 0;
  }
  const ratio = clamp(safeCorrect / safeTotal, 0, 1);
  const scaled = Math.round(ratio * MAX_RUN_STARS);
  return clamp(scaled, 0, MAX_RUN_STARS);
}

export {
  MAX_RUN_STARS,
  computeRunStars,
};
