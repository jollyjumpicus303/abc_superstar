
import { openDB } from 'idb';

const DB_NAME = 'buchstabenspiel-audio';
const DB_VERSION = 1;
const SET_STORE = 'audio-sets';
const CLIP_STORE = 'audio-clips';

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(SET_STORE)) {
        db.createObjectStore(SET_STORE, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(CLIP_STORE)) {
        db.createObjectStore(CLIP_STORE);
      }
    },
  });
}

export async function getAudioSet(setId) {
  const db = await getDB();
  return db.get(SET_STORE, setId);
}

export async function saveAudioSet(set) {
  const db = await getDB();
  return db.put(SET_STORE, set);
}

export async function addAudioClip(setId, letter, difficulty, blob) {
  const db = await getDB();
  const clipId = `${setId}-${letter}-${Date.now()}`;
  await db.put(CLIP_STORE, blob, clipId);

  const set = await getAudioSet(setId) || { id: setId, clips: [] };
  set.clips.push({
    id: clipId,
    letter,
    difficulty,
    created: new Date(),
  });

  return saveAudioSet(set);
}

export async function pickAudioClip(setId, letter, difficulty) {
  const set = await getAudioSet(setId);
  if (!set || !set.clips) {
    return null;
  }

  const difficulties = ['PROFI', 'SCHWER', 'MITTEL', 'LEICHT'];
  const requestedDifficultyIndex = difficulties.indexOf(difficulty);

  for (let i = requestedDifficultyIndex; i < difficulties.length; i++) {
    const currentDifficulty = difficulties[i];
    const clips = set.clips.filter(c => c.letter === letter && c.difficulty === currentDifficulty);
    if (clips.length > 0) {
      const randomClip = clips[Math.floor(Math.random() * clips.length)];
      const db = await getDB();
      const blob = await db.get(CLIP_STORE, randomClip.id);
      return { clip: randomClip, blob };
    }
  }

  return null;
}
