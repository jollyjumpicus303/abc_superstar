const fs = require('fs');
const path = require('path');

const DEFAULT_CONFIG = {
  defaultSetName: 'ABC Abenteuer TTS',
  defaultEmoji: '🔤',
  defaultSpeechSpeed: null,
  variants: {},
  contentOverrides: {},
  letterPronunciations: {},
};

function loadGeneratorConfig(customPath){
  const resolved = customPath
    ? path.resolve(process.cwd(), customPath)
    : path.resolve(process.cwd(), 'generator.config.json');

  if(!fs.existsSync(resolved)){
    return {
      ...DEFAULT_CONFIG,
      configPath: resolved,
      hasCustomConfig: false,
    };
  }

  try{
    const raw = fs.readFileSync(resolved, 'utf-8');
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
      variants: parsed.variants || DEFAULT_CONFIG.variants,
      contentOverrides: parsed.contentOverrides || DEFAULT_CONFIG.contentOverrides,
      letterPronunciations: parsed.letterPronunciations || DEFAULT_CONFIG.letterPronunciations,
      configPath: resolved,
      hasCustomConfig: true,
    };
  }catch(error){
    throw new Error(`Konfigurationsdatei konnte nicht gelesen werden (${resolved}): ${error.message}`);
  }
}

module.exports = {
  loadGeneratorConfig,
};
