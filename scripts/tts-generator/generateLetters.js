#!/usr/bin/env node
'use strict';

require('dotenv').config();

const path = require('path');
const fs = require('fs');
const { randomUUID } = require('crypto');
const { Command } = require('commander');
const JSZip = require('jszip');
const { loadGeneratorConfig } = require('./lib/loadConfig');
const { generateUtterance, LETTERS, KNOWN_DIFFICULTIES } = require('./lib/textTemplates');
const { synthesizeSpeech } = require('./lib/tts');
const { splitVariantZips } = require('./lib/splitVariants');

const program = new Command();

program
  .description('Erzeugt Buchstaben-Audiosets als ZIP für die ABC-Abenteuer-App.')
  .option('--config <path>', 'Pfad zur generator.config.json', 'generator.config.json')
  .option('--letters <list>', 'Kommagetrennte Buchstabenliste, z. B. A,B,C', '')
  .option('--difficulties <list>', 'Kommagetrennte Schwierigkeitsgrade (LEICHT,MITTEL,SCHWER,AFFIG)', '')
  .option('--variants <list>', 'Varianten aus der Config verwenden (Kommagetrennt)')
  .option('--provider <name>', 'Provider für eine Ad-hoc-Variante (openai | elevenlabs)')
  .option('--voice <voiceId>', 'Voice/Model für die Ad-hoc-Variante')
  .option('--model <modelId>', 'Optionales Modell für die Ad-hoc-Variante')
  .option('--variant-name <name>', 'Name für eine Ad-hoc-Variante')
  .option('--format <fmt>', 'Audioformat (mp3|wav|ogg)', 'mp3')
  .option('--speed <n>', 'Geschwindigkeitsfaktor für Ad-hoc-Variante', (value) => Number(value))
  .option('--use-ssml', 'SSML-Ausgabe für Ad-hoc-Variante aktivieren', false)
  .option('--style <text>', 'Optionaler Stilhinweis für Ad-hoc-Variante')
  .option('--set-name <name>', 'Name des Sets', '')
  .option('--emoji <emoji>', 'Emoji des Sets', '')
  .option('--set-id <id>', 'Optional feste Set-ID (UUID)')
  .option('--out <path>', 'Zielpfad der ZIP-Datei', path.join('dist', 'generated-letters.zip'))
  .option('--dry-run', 'Nur Texte erzeugen, keine Audio-Calls', false)
  .option('--group-by-variant', 'Je Variante ein eigenes Set schreiben', false)
  .option('--split-variants-out <path>', 'Optional zusätzlich pro Variante eigene ZIPs erstellen (Zielordner)')
  .option('--split-variants-base-name <text>', 'Basisname der Split-Sets', 'ABC Stimme')
  .option('--split-variants-emoji <emoji>', 'Emoji der Split-Sets', '🎙️')
  .option('--split-variants-overwrite', 'Überschreibt vorhandene Dateien im Split-Ordner', false)
  .option('--concurrency <n>', 'Anzahl paralleler TTS-Calls', (value) => Number(value), 2)
  .option('--log-text', 'Generierte Texte zusätzlich ausgeben', false)
  .option('--max <n>', 'Optional Begrenzung der Clips (Debug)', (value) => Number(value))
  .parse(process.argv);

const options = program.opts();

async function main(){
  const config = loadGeneratorConfig(options.config);
  const letters = parseLetters(options.letters);
  const difficulties = parseDifficulties(options.difficulties);
  const variants = resolveVariants(options, config);

  const limit = options.max && Number.isFinite(options.max) ? options.max : null;

  const tasks = [];
  for(const letter of letters){
    for(const difficulty of difficulties){
      for(const variant of variants){
        const utterance = generateUtterance(letter, difficulty, {
          variantName: variant.name,
          config,
          provider: variant.provider,
          useSsml: Boolean(variant.useSsml),
        });
        tasks.push({ letter, difficulty, variant, utterance });
      }
    }
  }

  const limitedTasks = limit ? tasks.slice(0, limit) : tasks;

  if(options.logText || options.dryRun){
    console.log('📝 Vorschau:');
    limitedTasks.forEach(task => {
      console.log(`- ${task.letter} [${task.difficulty}] (${task.variant.name}): ${task.utterance}`);
    });
  }

  if(options.dryRun){
    console.log(`Dry-Run beendet (${limitedTasks.length} Clips vorbereitet).`);
    return;
  }

  if(limitedTasks.length === 0){
    console.log('Keine Aufgaben zu erledigen – bitte Parameter prüfen.');
    return;
  }

  const setManager = createSetManager({
    groupByVariant: Boolean(options.groupByVariant),
    baseName: options.setName || config.defaultSetName || 'ABC Abenteuer Stimmen',
    emoji: options.emoji || config.defaultEmoji || '🔤',
    baseId: options.setId || randomUUID(),
  });

  const formatOverride = options.format;
  const audioRecords = [];
  let completed = 0;

  await runWithConcurrency(limitedTasks, options.concurrency || 2, async (task, index) => {
    const styledText = applyVariantStyle(task.utterance, task.variant);
    const finalText = task.variant.useSsml ? ensureSsmlRoot(styledText) : styledText;
    const { buffer, mimeType, extension } = await synthesizeSpeech({
      provider: task.variant.provider,
      voice: task.variant.voice,
      model: task.variant.model,
      format: task.variant.format || formatOverride,
      speed: task.variant.speed,
      stability: task.variant.stability,
      similarity: task.variant.similarity,
      text: finalText,
    });

    const set = setManager.ensure(task.variant);
    const clipId = randomUUID();
    const fileName = `${task.letter}-${task.variant.name}-${task.difficulty}-${clipId}.${extension || formatOverride || 'mp3'}`;
    const clipMeta = {
      id: clipId,
      letter: task.letter,
      difficulty: task.difficulty,
      created: Date.now(),
      file: fileName,
    };
    set.clips.push(clipMeta);
    audioRecords.push({ setId: set.id, fileName, buffer, mimeType });
    completed++;
    console.log(`✅ ${completed}/${limitedTasks.length} → ${task.letter} [${task.difficulty}] (${task.variant.name})`);
  });

  await writeZip(setManager.list(), audioRecords, options.out);
  console.log(`
🎉 Fertig! ${audioRecords.length} Audios gespeichert unter ${options.out}`);

  if(options.splitVariantsOut){
    await runVariantSplit(options);
  }
}

async function runVariantSplit(options){
  try{
    const result = await splitVariantZips({
      inputZips: [options.out],
      outDir: options.splitVariantsOut,
      baseName: options.splitVariantsBaseName || 'ABC Stimme',
      emoji: options.splitVariantsEmoji || '🎙️',
      overwrite: Boolean(options.splitVariantsOverwrite),
      logger: console,
    });
    if(result.created === 0){
      console.warn('Variantensplit wurde ausgeführt, aber es konnten keine Stimmen erkannt werden.');
      return;
    }
    console.log(`🔁 Variantensplit abgeschlossen – ${result.created} ZIP-Datei(en) in ${result.outDir}.`);
  }catch(err){
    console.error('💥 Variantensplit fehlgeschlagen:', err.message);
  }
}

function parseLetters(input){
  if(!input){
    return LETTERS.slice();
  }
  const raw = input.split(/[,\s]+/).map(part => part.trim().toUpperCase()).filter(Boolean);
  const expanded = [];
  for(const token of raw){
    if(/^[A-Z]-[A-Z]$/.test(token)){
      const [startChar, endChar] = token.split('-');
      const startCode = startChar.charCodeAt(0);
      const endCode = endChar.charCodeAt(0);
      const step = startCode <= endCode ? 1 : -1;
      for(let code = startCode; step > 0 ? code <= endCode : code >= endCode; code += step){
        const letter = String.fromCharCode(code);
        if(LETTERS.includes(letter)){
          expanded.push(letter);
        }
      }
      continue;
    }
    if(LETTERS.includes(token)){
      expanded.push(token);
    }else{
      console.warn(`⚠️  Unbekannter Buchstabe ignoriert: ${token}`);
    }
  }
  if(expanded.length === 0){
    throw new Error('Keine gültigen Buchstaben angegeben.');
  }
  return Array.from(new Set(expanded));
}

function parseDifficulties(input){
  if(!input){
    return KNOWN_DIFFICULTIES.slice();
  }
  const raw = input.split(/[,\s]+/).map(part => part.trim().toUpperCase()).filter(Boolean);
  const filtered = raw.filter(diff => KNOWN_DIFFICULTIES.includes(diff));
  if(filtered.length === 0){
    throw new Error('Keine gültigen Schwierigkeitsgrade angegeben.');
  }
  return Array.from(new Set(filtered));
}

function resolveVariants(opts, config){
  const variantsFromConfig = config.variants || {};
  const defaultSpeed = typeof config.defaultSpeechSpeed === 'number'
    ? config.defaultSpeechSpeed
    : undefined;
  const resolved = [];

  if(opts.variants){
    const names = opts.variants.split(/[,\s]+/).map(v => v.trim()).filter(Boolean);
    for(const name of names){
      const base = variantsFromConfig[name];
      if(!base){
        throw new Error(`Variante "${name}" nicht in ${config.configPath} gefunden.`);
      }
      resolved.push({
        name,
        provider: base.provider || 'openai',
        voice: base.voice,
        model: base.model,
        format: base.format,
        speed: typeof base.speed === 'number' ? base.speed : defaultSpeed,
        stability: base.stability,
        similarity: base.similarity,
        style: base.style,
        promptPrefix: base.promptPrefix,
        label: base.label || base.displayName || name,
        emoji: base.emoji,
        useSsml: Boolean(base.useSsml),
      });
    }
  }

  if(!resolved.length && opts.provider){
    if(!['openai','elevenlabs'].includes(opts.provider)){
      throw new Error('Provider muss openai oder elevenlabs sein.');
    }
    resolved.push({
      name: opts.variantName || `${opts.provider}-inline`,
      provider: opts.provider,
      voice: opts.voice,
      model: opts.model,
      format: opts.format,
      speed: typeof opts.speed === 'number' ? opts.speed : defaultSpeed,
      style: opts.style,
      label: opts.variantName || 'Ad-hoc Variante',
      useSsml: Boolean(opts.useSsml),
    });
  }

  if(!resolved.length){
    const defaultNames = Object.keys(variantsFromConfig);
    if(defaultNames.length === 0){
      throw new Error('Keine Variante definiert. Bitte --provider/--voice oder --variants nutzen.');
    }
    const first = defaultNames[0];
    const base = variantsFromConfig[first];
    resolved.push({
      name: first,
      provider: base.provider || 'openai',
      voice: base.voice,
      model: base.model,
      format: base.format,
      speed: typeof base.speed === 'number' ? base.speed : defaultSpeed,
      stability: base.stability,
      similarity: base.similarity,
      style: base.style,
      promptPrefix: base.promptPrefix,
      label: base.label || base.displayName || first,
      emoji: base.emoji,
      useSsml: Boolean(base.useSsml),
    });
    console.log(`ℹ️  Keine Variante angegeben – verwende ${first} aus ${config.configPath}.`);
  }

  return resolved;
}

function applyVariantStyle(text, variant){
  if(!variant) return text;
  if(variant.promptPrefix){
    return `${variant.promptPrefix.trim()} ${text}`.trim();
  }
  return text;
}

function ensureSsmlRoot(text){
  if(!text) return '<speak></speak>';
  const trimmed = text.trim();
  if(trimmed.startsWith('<speak')){
    return text;
  }
  return `<speak>${text}</speak>`;
}

function createSetManager({ groupByVariant, baseName, emoji, baseId }){
  const sets = new Map();
  const defaultSet = {
    id: baseId,
    name: baseName,
    emoji,
    created: Date.now(),
    clips: [],
  };

  return {
    ensure(variant){
      if(!groupByVariant){
        return defaultSet;
      }
      const key = variant.name;
      if(!sets.has(key)){
        sets.set(key, {
          id: randomUUID(),
          name: `${baseName} – ${variant.label || variant.name}`,
          emoji: variant.emoji || emoji,
          created: Date.now(),
          clips: [],
        });
      }
      return sets.get(key);
    },
    list(){
      if(!groupByVariant){
        return [defaultSet];
      }
      return Array.from(sets.values());
    },
  };
}

async function writeZip(sets, audioRecords, outPath){
  const zip = new JSZip();
  const sanitizedOut = path.resolve(outPath);
  const parentDir = path.dirname(sanitizedOut);
  await fs.promises.mkdir(parentDir, { recursive: true });

  for(const set of sets){
    const folder = zip.folder(set.id);
    if(!folder){
      throw new Error(`Konnte Zip-Ordner für Set ${set.id} nicht erstellen.`);
    }
    const files = audioRecords.filter(entry => entry.setId === set.id);
    for(const file of files){
      folder.file(file.fileName, file.buffer, { binary: true });
    }
  }

  zip.file('sets.json', JSON.stringify(sets.map(stripClipBuffers), null, 2));
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  await fs.promises.writeFile(sanitizedOut, content);
}

function stripClipBuffers(set){
  return {
    id: set.id,
    name: set.name,
    emoji: set.emoji,
    created: set.created,
    clips: set.clips.map(clip => ({
      id: clip.id,
      letter: clip.letter,
      difficulty: clip.difficulty,
      created: clip.created,
      file: clip.file,
    })),
  };
}

async function runWithConcurrency(items, limit, worker){
  if(!Array.isArray(items) || items.length === 0){
    return;
  }
  const concurrency = Math.max(1, Number(limit) || 1);
  const executing = new Set();
  let index = 0;

  async function enqueue(){
    while(index < items.length){
      if(executing.size >= concurrency){
        await Promise.race(executing);
      }
      const currentIndex = index++;
      const item = items[currentIndex];
      const promise = Promise.resolve().then(() => worker(item, currentIndex))
        .catch(err => {
          console.error(`❌ Fehler bei Task ${currentIndex + 1}:`, err.message);
          throw err;
        })
        .finally(() => executing.delete(promise));
      executing.add(promise);
    }
  }

  await enqueue();
  await Promise.all(executing);
}

main().catch(err => {
  console.error('💥 Generator abgebrochen:', err.message);
  process.exitCode = 1;
});
