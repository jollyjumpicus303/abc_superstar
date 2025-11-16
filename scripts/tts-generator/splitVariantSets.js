#!/usr/bin/env node
'use strict';

const path = require('path');
const { Command } = require('commander');
const { splitVariantZips } = require('./lib/splitVariants');

const program = new Command();
program
  .description('Teilt vorhandene Audio-ZIPs nach Varianten (Voices) auf und erzeugt je Voice ein importierbares Set.')
  .requiredOption('--inputs <list>', 'Liste der ZIP-Dateien (Kommagetrennt)')
  .option('--out-dir <path>', 'Zielordner für neue ZIPs', path.join('dist', 'by-variant'))
  .option('--base-name <text>', 'Basisname für neue Sets', 'ABC Stimme')
  .option('--emoji <emoji>', 'Emoji für neue Sets', '🎙️')
  .option('--overwrite', 'Existierende ZIPs überschreiben', false)
  .parse(process.argv);

const options = program.opts();

async function main(){
  const inputPaths = options.inputs
    .split(/[,\s]+/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => path.resolve(p));

  if(!inputPaths.length){
    throw new Error('Keine Eingabedateien angegeben.');
  }

  const result = await splitVariantZips({
    inputZips: inputPaths,
    outDir: options.outDir,
    baseName: options.baseName,
    emoji: options.emoji,
    overwrite: Boolean(options.overwrite),
    logger: console,
  });

  if(result.created === 0){
    console.warn('Keine Varianten gefunden – nichts zu tun.');
    return;
  }

  console.log(`✅ Fertig! ${result.created} ZIP-Datei(en) unter ${result.outDir} erstellt.`);
}

main().catch(err => {
  console.error('💥 Splitter abgebrochen:', err.message);
  process.exitCode = 1;
});
