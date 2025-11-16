let openaiClient = null;
let elevenLabsClient = null;

function ensureOpenAIClient(){
  if(openaiClient) return openaiClient;
  const apiKey = process.env.OPENAI_API_KEY;
  if(!apiKey){
    throw new Error('OPENAI_API_KEY ist nicht gesetzt.');
  }
  try{
    const { OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey });
    return openaiClient;
  }catch(err){
    throw new Error(`OpenAI SDK konnte nicht geladen werden: ${err.message}`);
  }
}

function ensureElevenLabsClient(){
  if(elevenLabsClient) return elevenLabsClient;
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if(!apiKey){
    throw new Error('ELEVENLABS_API_KEY ist nicht gesetzt.');
  }
  try{
    const { ElevenLabsClient } = require('elevenlabs');
    elevenLabsClient = new ElevenLabsClient({ apiKey });
    return elevenLabsClient;
  }catch(err){
    throw new Error(`ElevenLabs SDK konnte nicht geladen werden: ${err.message}`);
  }
}

const DEFAULT_OPENAI_MODEL = 'gpt-4o-mini-tts';
const DEFAULT_ELEVEN_MODEL = 'eleven_multilingual_v2';
const ELEVEN_FORMATS = {
  mp3: 'mp3_44100_128',
  wav: 'pcm_44100',
  ogg: 'ogg_44100',
};

async function synthesizeWithOpenAI(options){
  const client = ensureOpenAIClient();
  const model = options.model || DEFAULT_OPENAI_MODEL;
  const voice = options.voice || 'alloy';
  if(!options.text){
    throw new Error('OpenAI-Synthese benötigt Text.');
  }
  const format = options.format || 'mp3';
  const response = await client.audio.speech.create({
    model,
    voice,
    input: options.text,
    format,
    speed: typeof options.speed === 'number' ? options.speed : undefined,
  });
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return {
    buffer,
    mimeType: `audio/${format}`,
    extension: format,
  };
}

async function synthesizeWithElevenLabs(options){
  const client = ensureElevenLabsClient();
  const voice = options.voice;
  if(!voice){
    throw new Error('ElevenLabs benötigt eine Voice-ID.');
  }
  const text = options.text;
  if(!text){
    throw new Error('ElevenLabs-Synthese benötigt Text.');
  }
  const modelId = options.model || DEFAULT_ELEVEN_MODEL;
  const requestedFormat = options.format || 'mp3';
  const output_format = ELEVEN_FORMATS[requestedFormat] || ELEVEN_FORMATS.mp3;
  const stream = await client.generate({
    voice,
    text,
    model_id: modelId,
    output_format,
    voice_settings: {
      stability: typeof options.stability === 'number' ? options.stability : undefined,
      similarity_boost: typeof options.similarity === 'number' ? options.similarity : undefined,
    },
  });
  const chunks = [];
  for await (const chunk of stream){
    chunks.push(Buffer.from(chunk));
  }
  const buffer = Buffer.concat(chunks);
  const extension = requestedFormat;
  const mimeType = extension === 'wav' ? 'audio/wav' : extension === 'ogg' ? 'audio/ogg' : 'audio/mpeg';
  return { buffer, mimeType, extension };
}

async function synthesizeSpeech(task){
  if(!task || !task.provider){
    throw new Error('Provider ist erforderlich, um Audio zu generieren.');
  }
  if(task.provider === 'openai'){
    return synthesizeWithOpenAI(task);
  }
  if(task.provider === 'elevenlabs'){
    return synthesizeWithElevenLabs(task);
  }
  throw new Error(`Unbekannter Provider: ${task.provider}`);
}

module.exports = {
  synthesizeSpeech,
};
