const fs = require('fs/promises');
const path = require('path');
const { randomUUID } = require('crypto');
const JSZip = require('jszip');

const KNOWN_DIFFICULTIES = ['LEICHT', 'MITTEL', 'SCHWER', 'AFFIG'];
const VARIANT_REGEX = /^[A-Z]-([^-]+)-(LEICHT|MITTEL|SCHWER|AFFIG)-/;

async function splitVariantZips({ inputZips, outDir, baseName = 'ABC Stimme', emoji = '🎙️', overwrite = false, logger = console }){
  if(!Array.isArray(inputZips) || inputZips.length === 0){
    throw new Error('inputZips darf nicht leer sein.');
  }
  if(!outDir){
    throw new Error('outDir ist erforderlich.');
  }
  const resolvedInputs = inputZips.map((entry) => path.resolve(entry));
  const resolvedOutDir = path.resolve(outDir);
  const variantSets = new Map();

  for(const zipPath of resolvedInputs){
    await ingestZip(zipPath, variantSets, { baseName, emoji, logger });
  }

  if(!variantSets.size){
    if(logger && typeof logger.warn === 'function'){
      logger.warn('Keine Varianten gefunden – nichts zu tun.');
    }
    return { created: 0, variants: [], outDir: resolvedOutDir };
  }

  await fs.mkdir(resolvedOutDir, { recursive: true });
  let created = 0;

  for(const [variant, payload] of variantSets.entries()){
    if(!payload.files.length){
      if(logger && typeof logger.warn === 'function'){
        logger.warn(`⚠️  Variante ${variant} enthält keine Audios – übersprungen.`);
      }
      continue;
    }
    const written = await writeVariantZip({ variant, payload, outDir: resolvedOutDir, overwrite, logger });
    if(written){
      created++;
    }
  }

  return { created, variants: Array.from(variantSets.keys()), outDir: resolvedOutDir };
}

async function ingestZip(zipPath, variantSets, meta){
  const { baseName, emoji, logger } = meta;
  let buffer;
  try{
    buffer = await fs.readFile(zipPath);
  }catch(err){
    logger?.warn?.(`⚠️  Kann ZIP ${zipPath} nicht lesen: ${err.message}`);
    return;
  }
  let zip;
  try{
    zip = await JSZip.loadAsync(buffer);
  }catch(err){
    logger?.warn?.(`⚠️  ${zipPath} ist keine gültige ZIP: ${err.message}`);
    return;
  }

  const setsEntry = zip.file('sets.json');
  if(!setsEntry){
    logger?.warn?.(`⚠️  ${zipPath} enthält keine sets.json – übersprungen.`);
    return;
  }
  let setsMeta;
  try{
    setsMeta = JSON.parse(await setsEntry.async('string'));
  }catch(err){
    logger?.warn?.(`⚠️  sets.json in ${zipPath} ist ungültig: ${err.message}`);
    return;
  }
  if(!Array.isArray(setsMeta)){
    logger?.warn?.(`⚠️  sets.json in ${zipPath} enthält kein Array – übersprungen.`);
    return;
  }

  for(const set of setsMeta){
    if(!set || !Array.isArray(set.clips)){
      continue;
    }
    for(const clip of set.clips){
      const variant = inferVariantFromFile(clip.file);
      if(!variant){
        logger?.warn?.(`⚠️  Variante konnte aus Dateinamen ${clip.file} nicht bestimmt werden – Clip übersprungen.`);
        continue;
      }
      const folderKey = `${set.id}/${clip.file}`;
      const zipFile = zip.file(folderKey);
      if(!zipFile){
        logger?.warn?.(`⚠️  Datei ${folderKey} fehlt in ${zipPath} – Clip übersprungen.`);
        continue;
      }
      const audioBuffer = await zipFile.async('nodebuffer');
      const entry = ensureVariantEntry(variantSets, variant, baseName, emoji);
      entry.files.push({
        fileName: clip.file,
        buffer: audioBuffer,
      });
      if(!KNOWN_DIFFICULTIES.includes((clip.difficulty || '').toUpperCase())){
        clip.difficulty = 'LEICHT';
      }
      entry.set.clips.push({
        id: clip.id || randomUUID(),
        letter: clip.letter || 'A',
        difficulty: clip.difficulty,
        created: clip.created || Date.now(),
        file: clip.file,
      });
    }
  }
}

function ensureVariantEntry(map, variant, baseName, emoji){
  if(!map.has(variant)){
    map.set(variant, {
      set: {
        id: randomUUID(),
        name: `${baseName} – ${variant}`,
        emoji,
        created: Date.now(),
        clips: [],
      },
      files: [],
    });
  }
  return map.get(variant);
}

function inferVariantFromFile(fileName = ''){
  const base = path.basename(fileName);
  const match = base.match(VARIANT_REGEX);
  if(match){
    return match[1];
  }
  return null;
}

async function writeVariantZip({ variant, payload, outDir, overwrite, logger }){
  const zip = new JSZip();
  const folder = zip.folder(payload.set.id);
  payload.files.forEach((file) => {
    folder.file(file.fileName, file.buffer, { binary: true });
  });
  zip.file('sets.json', JSON.stringify([stripClipBuffers(payload.set)], null, 2));
  const buffer = await zip.generateAsync({ type: 'nodebuffer' });
  const targetName = `${slugify(variant)}.zip`;
  const targetPath = path.join(outDir, targetName);
  try{
    if(!overwrite){
      await fs.access(targetPath);
      logger?.warn?.(`⚠️  ${targetName} existiert bereits – verwende Overwrite, um zu ersetzen.`);
      return null;
    }
  }catch(_){
    // Datei existiert nicht – alles gut.
  }
  await fs.writeFile(targetPath, buffer);
  logger?.log?.(`→ ${targetName} geschrieben (${payload.set.clips.length} Clips).`);
  return targetPath;
}

function stripClipBuffers(set){
  return {
    id: set.id,
    name: set.name,
    emoji: set.emoji,
    created: set.created,
    clips: set.clips.map((clip) => ({
      id: clip.id,
      letter: clip.letter,
      difficulty: clip.difficulty,
      created: clip.created,
      file: clip.file,
    })),
  };
}

function slugify(value){
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'voice';
}

module.exports = {
  splitVariantZips,
  inferVariantFromFile,
};
