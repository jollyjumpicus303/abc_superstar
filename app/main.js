import {
  getProgress,
  saveProgress,
  markCorrect,
  markWrong
} from './progressStore.js';
import { pickNext } from './letterPool.js';
import { advanceAfterRun } from './progression.js';
import { computeRunStars, MAX_RUN_STARS } from './rewardUtils.js';
import StarReveal from './js/starRevealCanvas.js';

// Persisted Lernfortschritt wird sofort initialisiert
getProgress();
// ——————————————————————————————————————————
// ABC-Abenteuer – Logik
// ——————————————————————————————————————————

// ——————————————————————————————————————————
// Soundeffekte (Web Audio API)
// ——————————————————————————————————————————
const AudioContext = window.AudioContext || window.webkitAudioContext;
let audioCtx = null;
let unlockBannerTimer = null;

const SOUND_FILES = {
  success: { url: 'app/sfx/success.mp3', volume: 0.8 },
  fail: { url: 'app/sfx/fail.mp3', volume: 0.75 },
  click: { url: 'app/sfx/click.mp3', volume: 0.4 },
  start: { url: 'app/sfx/start.mp3', volume: 0.7 },
  unlock: { url: 'app/sfx/unlock.mp3', volume: 0.75 },
  reward: { url: 'app/sfx/reward.mp3', volume: 0.85 },
  starReveal: { url: 'app/sfx/star.mp3', volume: 0.9 },
  medalIntro: { url: 'SPECS/AdditionalInput/PlayBeforeMedalSound.mp3', volume: 0.85 },
  giftPop: { url: 'SPECS/AdditionalInput/pop.mp3', volume: 0.8 },
  stickerPop: { url: 'app/sfx/pop.mp3', volume: 0.85 },
};

const BUNDLED_SETS_CONFIG = Object.freeze({
  url: 'abc-abenteuer-sets-2025-11-18.zip',
  storageKey: 'bundledSetsImported-2025-11-18',
});

const soundBuffers = new Map();
const soundLoadingPromises = new Map();
const INTRO_PROMPT_DELAY = 2000;
const MEDAL_TYPES = ['gold', 'silver', 'bronze'];
const MEDAL_LABELS = {
  gold: 'Gold',
  silver: 'Silber',
  bronze: 'Bronze',
};

function initAudioContext(){
  if(!audioCtx){
    audioCtx = new AudioContext();
  }
  return audioCtx;
}

function ensureAudioContextRunning(){
  const ctx = initAudioContext();
  if(ctx.state === 'suspended'){
    ctx.resume().catch(()=>{});
  }
  return ctx;
}

function loadSoundBuffer(id){
  if(soundBuffers.has(id)){
    return Promise.resolve(soundBuffers.get(id));
  }
  if(soundLoadingPromises.has(id)){
    return soundLoadingPromises.get(id);
  }
  const config = SOUND_FILES[id];
  if(!config){
    return Promise.resolve(null);
  }
  const ctx = ensureAudioContextRunning();
  const loadPromise = fetch(config.url)
    .then(response => {
      if(!response.ok){
        throw new Error(`Sound ${id} konnte nicht geladen werden`);
      }
      return response.arrayBuffer();
    })
    .then(data => ctx.decodeAudioData(data))
    .then(buffer => {
      soundBuffers.set(id, buffer);
      soundLoadingPromises.delete(id);
      return buffer;
    })
    .catch(err => {
      soundLoadingPromises.delete(id);
      console.warn('[Audio]', err);
      return null;
    });

  soundLoadingPromises.set(id, loadPromise);
  return loadPromise;
}

function playSfx(id, options = {}){
  const config = SOUND_FILES[id];
  if(!config){
    return;
  }
  const ctx = ensureAudioContextRunning();
  const volume = typeof options.volume === 'number' ? options.volume : (config.volume ?? 1);

  const startPlayback = (buffer) => {
    if(!buffer){
      return;
    }
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
    });
  };

  if(soundBuffers.has(id)){
    startPlayback(soundBuffers.get(id));
    return;
  }

  loadSoundBuffer(id).then(startPlayback);
}

function playSuccessSound(){ playSfx('success'); }
function playErrorSound(){ playSfx('fail'); }
function playClickSound(){ playSfx('click'); }
function playStartSound(){ playSfx('start'); }
function playUnlockSound(){ playSfx('unlock'); }
function playRewardSound(){ playSfx('reward'); }
function playStarRevealSound(){ playSfx('starReveal'); }
function playGiftPopSound(){ playSfx('giftPop'); }
function playStickerPopSound(){ playSfx('stickerPop'); }

async function playSfxAndWait(id, options = {}){
  const config = SOUND_FILES[id];
  if(!config){
    return 0;
  }
  const ctx = ensureAudioContextRunning();
  const buffer = soundBuffers.get(id) || await loadSoundBuffer(id);
  if(!buffer){
    return 0;
  }
  return new Promise((resolve) => {
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();
    const volume = typeof options.volume === 'number' ? options.volume : (config.volume ?? 1);
    gain.gain.value = volume;
    source.buffer = buffer;
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start();
    source.addEventListener('ended', () => {
      source.disconnect();
      gain.disconnect();
      resolve(buffer.duration);
    });
  });
}

function playMedalIntroSound(){
  return playSfxAndWait('medalIntro');
}

const sleep = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms));

const LETTERS = Array.from("ABCDEFGHIJKLMNOPQRSTUVWXYZ");
const RECORD_MODES = {
  SINGLE: 'single',
  SERIES: 'series',
};
const clipHistoryQueues = new Map();

function makeClipHistoryKey(scope, setId, letter, difficulty){
  return `${scope}:${setId || 'default'}:${letter || '?'}:${(difficulty || 'LEICHT').toUpperCase()}`;
}

function shuffleArray(array){
  const arr = array.slice();
  for(let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const elLetters = document.getElementById('letters');
const elStatusGrid = document.getElementById('statusGrid');
const elRecLetter = document.getElementById('recLetter');
const elRecTitle = document.getElementById('recTitle');
const elRecStatus = document.getElementById('recStatus');
const elBtnRecord = document.getElementById('btnRecord');
const elSeriesToggle = document.getElementById('seriesToggle');
const elBtnPlay = document.getElementById('btnPlay');
const elBtnDelete = document.getElementById('btnDelete');
const elRecordDifficultyGroup = document.getElementById('recordDifficultyGroup');
const elClipList = document.getElementById('clipList');
const elMotivationList = document.getElementById('motivationList');
const elMotivationStatus = document.getElementById('motivationStatus');
const elBtnMotivationRecord = document.getElementById('btnMotivationRecord');
const elMotivationTimer = document.getElementById('motivationTimer');
const elBtnMotivationUpload = document.getElementById('btnMotivationUpload');
const elMotivationFile = document.getElementById('motivationFile');
const elInGameSetSelector = document.getElementById('inGameSetSelector');
const elPracticeSetSelector = document.getElementById('practiceSetSelector');
const elLernwegTrack = document.getElementById('lernwegTrack');
const elLernwegDetail = document.getElementById('lernwegDetail');
const elLernwegFill = document.getElementById('lernwegFill');
const elLernwegNext = document.getElementById('lernwegNext');
const elTimer = document.getElementById('timer');
const elRoundNow = document.getElementById('roundNow');
const elUnlockBanner = document.getElementById('unlockBanner');
const elUnlockBannerText = document.getElementById('unlockBannerText');
const dialogModeCards = Array.from(document.querySelectorAll('[data-mode-option]'));
const elModeDialog = document.getElementById('modeDialog');
const elModeDialogStart = document.getElementById('modeDialogStart');
const elModeDialogCancel = document.getElementById('modeDialogCancel');
const elModeControls = document.getElementById('modeControls');
const elFreeCountGroup = document.getElementById('freeCountGroup');
const elDifficultyGroup = document.getElementById('difficultyGroup');
const elDifficultyWrapper = document.getElementById('difficultyWrapper');
const elIndividualPanel = document.getElementById('individualPanel');
const elRoundMax = document.getElementById('roundMax');
const elOk = document.getElementById('okCount');
const elBad = document.getElementById('badCount');
const elBar = document.getElementById('bar');
const elHud = document.getElementById('hud');
const elMissionText = document.getElementById('missionText');
const elStarTrack = document.getElementById('starTrack');
const elStarTrackStars = document.getElementById('starTrackStars');
const elStarTrackProgressText = document.getElementById('starTrackProgressText');
const elOverlayGood = document.getElementById('overlayGood');
const elOverlayBad = document.getElementById('overlayBad');
const elCorrectLetter = document.getElementById('correctLetter');
const elModal = document.getElementById('modal');
const elResultTitle = document.getElementById('resultTitle');
const elResultText = document.getElementById('resultText');
const elStarCanvas = document.getElementById('starCanvas');
const elStarSummaryText = document.getElementById('starSummaryText');
const elResultGift = document.getElementById('resultGift');
const elResultGiftButton = document.getElementById('resultGiftButton');
const elResultGiftLottie = document.getElementById('resultGiftLottie');
const elTrophyAnimation = document.getElementById('trophyAnimation');
const elInstallBtn = document.getElementById('installBtn');
const elBtnStart = document.getElementById('btnStart');
const elBtnChangeMode = document.getElementById('btnChangeMode');
const elModeHint = document.getElementById('modeHint');
const elBtnTestAudio = document.getElementById('btnTestAudio');
const elBtnEndGame = document.getElementById('btnEndGame');
const elRounds = document.getElementById('rounds');
const elRoundsOut = document.getElementById('roundsOut');
const elLetterImport = document.getElementById('btnLetterImport');
const elLetterImportFile = document.getElementById('letterImportFile');
const elThemeSwitcher = document.getElementById('themeSwitcher');
const elThemeTrigger = document.getElementById('themeSwitcherBtn');
const elThemeMenu = document.getElementById('themeSwitcherMenu');
const elThemeLabel = document.getElementById('currentThemeLabel');
const metaThemeColor = document.querySelector('meta[name="theme-color"]');
const themeOptionButtons = elThemeMenu ? Array.from(elThemeMenu.querySelectorAll('[data-theme-option]')) : [];
const medalControls = MEDAL_TYPES.reduce((acc, type) => {
  acc[type] = {
    recordBtn: document.getElementById(`btnMedalRecord-${type}`),
    uploadBtn: document.getElementById(`btnMedalUpload-${type}`),
    fileInput: document.getElementById(`medalFile-${type}`),
    timerEl: document.getElementById(`medalTimer-${type}`),
    statusEl: document.getElementById(`medalStatus-${type}`),
    listEl: document.getElementById(`medalList-${type}`),
  };
  return acc;
}, {});
let trophyAnimation = null;
let trophyLoader = null;
let installPromptEvent = null;

const THEME_STORAGE_KEY = 'abc-abenteuer-theme';
const THEME_OPTIONS = {
  classic: { id: 'classic', label: 'Sonnig', emoji: '🌈', metaColor: '#5a6ff0' },
  nebula: { id: 'nebula', label: 'Nachthimmel', emoji: '🌌', metaColor: '#0f1022' }
};
const DEFAULT_THEME = 'classic';
let isThemeMenuOpen = false;
let activeTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;

initThemeSelector();
registerServiceWorker();
initPWAInstall();

function ensureTrophyAnimation(path){
  if(trophyAnimation && trophyAnimation.__path === path){
    return Promise.resolve(trophyAnimation);
  }
  if(trophyLoader){
    return trophyLoader;
  }
  if(!elTrophyAnimation || typeof window.lottie === 'undefined'){
    return Promise.resolve(null);
  }
  trophyLoader = new Promise((resolve) => {
    try{
      if(trophyAnimation){
        trophyAnimation.destroy();
        trophyAnimation = null;
      }
      trophyAnimation = window.lottie.loadAnimation({
        container: elTrophyAnimation,
        renderer: 'svg',
        loop: false,
        autoplay: false,
        path,
      });
      trophyAnimation.__path = path;
      const handleReady = () => {
        trophyAnimation.removeEventListener('data_ready', handleReady);
        resolve(trophyAnimation);
      };
      trophyAnimation.addEventListener('data_ready', handleReady);
      trophyAnimation.addEventListener('data_failed', () => {
        trophyAnimation = null;
        resolve(null);
      }, { once: true });
    }catch(err){
      console.warn('Lottie Animation konnte nicht geladen werden', err);
      resolve(null);
    }
  }).finally(() => {
    trophyLoader = null;
  });
  return trophyLoader;
}

function playTrophyAnimation(path){
  ensureTrophyAnimation(path).then(animation => {
    if(!animation) return;
    animation.stop();
    animation.goToAndPlay(0, true);
  });
}

function registerServiceWorker(){
  if(!('serviceWorker' in navigator)) return;
  const register = () => {
    navigator.serviceWorker.register('sw.js').catch(err => {
      console.warn('Service Worker Registrierung fehlgeschlagen', err);
    });
  };
  if(document.readyState === 'complete'){
    register();
  } else {
    window.addEventListener('load', register, { once: true });
  }
}

function initPWAInstall(){
  if(!elInstallBtn) return;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    installPromptEvent = event;
    elInstallBtn.classList.add('show');
  });

  elInstallBtn.addEventListener('click', async () => {
    if(!installPromptEvent) return;
    elInstallBtn.disabled = true;
    try{
      installPromptEvent.prompt();
      const result = await installPromptEvent.userChoice;
      if(result && result.outcome === 'accepted'){
        elInstallBtn.classList.remove('show');
      }
    }catch(err){
      console.warn('PWA-Installation fehlgeschlagen', err);
    }finally{
      installPromptEvent = null;
      elInstallBtn.disabled = false;
    }
  });

  window.addEventListener('appinstalled', () => {
    installPromptEvent = null;
    elInstallBtn.classList.remove('show');
  });
}

function initThemeSelector(){
  const storedTheme = readStoredTheme();
  applyTheme(storedTheme);

  if(!elThemeTrigger || !elThemeMenu || !elThemeSwitcher) return;

  elThemeTrigger.addEventListener('click', (event) => {
    event.stopPropagation();
    toggleThemeMenu();
  });

  elThemeMenu.addEventListener('click', (event) => event.stopPropagation());

  themeOptionButtons.forEach(btn => {
    btn.addEventListener('click', (event) => {
      event.stopPropagation();
      selectTheme(btn.dataset.themeOption);
    });
  });

  document.addEventListener('click', handleThemeMenuOutside);
  document.addEventListener('keydown', handleThemeMenuKeydown);
}

function readStoredTheme(){
  try{
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if(stored && THEME_OPTIONS[stored]){
      return stored;
    }
  }catch(err){ /* ignore storage issues */ }
  return document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
}

function saveTheme(themeId){
  try{
    localStorage.setItem(THEME_STORAGE_KEY, themeId);
  }catch(err){ /* ignore storage issues */ }
}

function applyTheme(themeId){
  const nextTheme = THEME_OPTIONS[themeId] ? themeId : DEFAULT_THEME;
  activeTheme = nextTheme;
  document.documentElement.setAttribute('data-theme', nextTheme);
  const theme = THEME_OPTIONS[nextTheme];
  if(metaThemeColor && theme?.metaColor){
    metaThemeColor.setAttribute('content', theme.metaColor);
  }
  updateThemeMenu(nextTheme);
  saveTheme(nextTheme);
}

function updateThemeMenu(themeId){
  const theme = THEME_OPTIONS[themeId] || THEME_OPTIONS[DEFAULT_THEME];
  if(elThemeLabel && theme){
    elThemeLabel.textContent = `${theme.emoji} ${theme.label}`;
  }
  if(themeOptionButtons.length){
    themeOptionButtons.forEach(btn => {
      const isActive = btn.dataset.themeOption === themeId;
      btn.setAttribute('aria-checked', String(isActive));
      btn.classList.toggle('is-active', isActive);
    });
  }
}

function selectTheme(themeId){
  applyTheme(themeId);
  closeThemeMenu();
}

function toggleThemeMenu(){
  setThemeMenuOpen(!isThemeMenuOpen);
}

function setThemeMenuOpen(shouldOpen){
  if(!elThemeMenu || !elThemeTrigger || !elThemeSwitcher) return;
  isThemeMenuOpen = shouldOpen;
  elThemeMenu.classList.toggle('hidden', !shouldOpen);
  elThemeTrigger.setAttribute('aria-expanded', String(shouldOpen));
  elThemeSwitcher.classList.toggle('open', shouldOpen);
}

function closeThemeMenu(){
  if(isThemeMenuOpen){
    setThemeMenuOpen(false);
  }
}

function handleThemeMenuOutside(event){
  if(!isThemeMenuOpen || !elThemeSwitcher) return;
  if(!elThemeSwitcher.contains(event.target)){
    closeThemeMenu();
  }
}

function handleThemeMenuKeydown(event){
  if(event.key === 'Escape' && isThemeMenuOpen){
    closeThemeMenu();
    if(elThemeTrigger){
      elThemeTrigger.focus();
    }
  }
}
elBtnChangeMode.addEventListener('click', openModeDialog);
elBtnStart.addEventListener('click', startGame);
elBtnEndGame.addEventListener('click', confirmEndGame);

// Eltern-Sperre
const elParentalGate = document.getElementById('parentalGate');
const elGateQuestion = document.getElementById('gateQuestion');
const elGateAnswer = document.getElementById('gateAnswer');
const elGateCancel = document.getElementById('gateCancel');
const elGateSubmit = document.getElementById('gateSubmit');
let gateNum1, gateNum2;
let isParentalGatePassed = false; // Simple session flag

// Tabs & Parental Gate
const tabsContainer = document.querySelector('.tabs');

function openParentalGate() {
  gateNum1 = Math.floor(Math.random() * 5) + 5;
  gateNum2 = Math.floor(Math.random() * 5) + 1;
  elGateQuestion.textContent = `Was ist ${gateNum1} + ${gateNum2}?`;
  elGateAnswer.value = '';
  elParentalGate.classList.remove('hidden');
  elGateAnswer.focus();
}

function closeParentalGate() {
  elParentalGate.classList.add('hidden');
}

elGateCancel.addEventListener('click', closeParentalGate);
elGateSubmit.addEventListener('click', () => {
  const answer = parseInt(elGateAnswer.value, 10);
  if (answer === gateNum1 + gateNum2) {
    isParentalGatePassed = true;
    closeParentalGate();
    switchToTab('eltern');
  } else {
    alert('Leider falsch. Bitte versuche es nochmal.');
    openParentalGate();
  }
});

function switchToTab(tabName) {
  tabsContainer.querySelectorAll('button').forEach(b => {
    const isActive = b.dataset.tab === tabName;
    b.classList.toggle('active', isActive);
  });
  document.getElementById('spiel').classList.toggle('hidden', tabName !== 'spiel');
  document.getElementById('ueben').classList.toggle('hidden', tabName !== 'ueben');
  document.getElementById('album').classList.toggle('hidden', tabName !== 'album');
  document.getElementById('einstellungen').classList.toggle('hidden', tabName !== 'einstellungen');
  document.getElementById('eltern').classList.toggle('hidden', tabName !== 'eltern');

  if (tabName === 'einstellungen') {
    renderSetsList();
    updateStatusGridFromDB();
    updateUIForRecordingState();
  }

  if (tabName === 'album') {
    renderAlbum();
  }

  if (tabName === 'eltern') {
    renderStatistics();
  }

  if (tabName === 'ueben') {
    renderPracticeGrid();
  }
}

tabsContainer.addEventListener('click', (e) => {
  const targetButton = e.target.closest('button');
  if (!targetButton) return;
  const tabName = targetButton.dataset.tab;

  if(tabName === 'spiel' && game){
    const ended = confirmEndGame();
    if(ended){
      switchToTab('spiel');
    }
    return;
  }

  if (tabName === 'eltern' && !isParentalGatePassed) {
    openParentalGate();
    return;
  }

  switchToTab(tabName);
});

function renderStatistics() {
  const elternSection = document.getElementById('eltern');
  const progress = getProgress();
  const log = progress.attemptLog || [];

  if (log.length < 10) { // Require a minimum amount of data
    elternSection.innerHTML = `
      <h2>Statistiken & Fortschritt</h2>
      <p class="muted">Es sind noch nicht genügend Daten vorhanden. Spielen Sie noch ein paar Runden, um eine aussagekräftige Auswertung zu sehen.</p>
    `;
    return;
  }

  // Data processing
  const wrongAttempts = {}; // { B: 5, D: 3 }
  const confusions = {}; // { B: { P: 4, D: 1 } }
  const correctCounts = {}; // { A: 10, C: 12 }

  for (const attempt of log) {
    if (attempt.correct) {
      correctCounts[attempt.target] = (correctCounts[attempt.target] || 0) + 1;
    } else {
      if (!attempt.target || !attempt.chosen) continue; // Skip incomplete log entries
      wrongAttempts[attempt.target] = (wrongAttempts[attempt.target] || 0) + 1;
      if (!confusions[attempt.target]) {
        confusions[attempt.target] = {};
      }
      confusions[attempt.target][attempt.chosen] = (confusions[attempt.target][attempt.chosen] || 0) + 1;
    }
  }

  const sortedWrong = Object.entries(wrongAttempts).sort((a, b) => b[1] - a[1]);

  const superBuchstaben = Object.entries(correctCounts)
    .filter(([letter, count]) => count >= 5 && !wrongAttempts[letter])
    .map(([letter]) => letter)
    .sort();

  // HTML Rendering
  let html = '<h2>Statistiken & Fortschritt</h2>';

  // 1. Nächste Herausforderung
  html += '<h3>Nächste Herausforderungen</h3>';
  const topWrong = sortedWrong.slice(0, 3);

  if (topWrong.length > 0) {
    html += '<p class="muted">Dies sind die Buchstaben, die aktuell am häufigsten verwechselt werden.</p>';
    html += '<div class="challenge-grid">';
    for (const [letter, count] of topWrong) {
      let confusionText = '';
      if (confusions[letter]) {
        const sortedConfusions = Object.entries(confusions[letter]).sort((a, b) => b[1] - a[1]);
        if (sortedConfusions.length > 0) {
          confusionText = `(wird oft mit <b>${sortedConfusions[0][0]}</b> verwechselt)`;
        }
      }
      html += `
        <div class="challenge-card">
          <div class="challenge-letter">${letter}</div>
          <div class="challenge-count">${count} mal falsch</div>
          <div class="challenge-confusion">${confusionText}</div>
        </div>
      `;
    }
    html += '</div>';
    const practiceLetters = topWrong.map(([l]) => l).join(',');
    html += `<div style="margin-top: 16px;"><button class="btn practice-btn" data-letters="${practiceLetters}">Diese ${topWrong.length} Buchstaben üben</button></div>`;
  } else {
    html += '<p class="muted">🎉 Super! Aktuell gibt es keine besonderen Herausforderungen.</p>';
  }

  // 2. Super-Buchstaben
  html += '<h3 style="margin-top: 24px;">Super-Buchstaben</h3>';
  if (superBuchstaben.length > 0) {
    html += `<p class="muted">Diese ${superBuchstaben.length} Buchstaben werden schon sehr gut erkannt.</p>`;
    html += '<div class="super-letter-grid">';
    html += superBuchstaben.map(l => `<div class="super-letter-tile">${l}</div>`).join('');
    html += '</div>';
  } else {
    html += '<p class="muted">Noch keine Super-Buchstaben. Aber das wird schon!</p>';
  }

  elternSection.innerHTML = html;

  // Add event listeners for the new buttons
  elternSection.querySelectorAll('.practice-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const letters = e.currentTarget.dataset.letters.split(',');
      startPracticeGame(letters);
    });
  });
}

dialogModeCards.forEach(card => {
  card.addEventListener('click', () => {
    if (!pendingModeSelection) {
      pendingModeSelection = extractSelectionFromProgress(getProgress());
    }
    const mode = card.dataset.mode || 'FREI';
    pendingModeSelection.mode = mode;

    // Automatically open the individual panel for custom games
    toggleIndividualPanel(mode === 'FREI');

    updateModeDialogCards(pendingModeSelection);
    elModeDialogStart.disabled = false;
  });
});

if(elModeDialogStart){
  elModeDialogStart.addEventListener('click', () => {
    if(!pendingModeSelection) return;

    const updates = { 
      mode: pendingModeSelection.mode, 
      difficulty: pendingModeSelection.difficulty || 'LEICHT',
    };

    if(pendingModeSelection.mode === 'FREI'){
      updates.freeLetterCount = pendingModeSelection.freeLetterCount || 4;
    } else {
      // Lernweg uses its own progression for letter count
    }

    saveAndApply(updates);
    closeModeDialog();
    startGame();
  });
}

if(elFreeCountGroup){
  elFreeCountGroup.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-free-count]');
    if(!chip || !pendingModeSelection) return;
    const count = Number(chip.dataset.freeCount || 0);
    if(!count) return;
    pendingModeSelection.freeLetterCount = count;
    setActiveChip(elFreeCountGroup, c => c === chip);
  });
}

if(elDifficultyGroup){
  elDifficultyGroup.addEventListener('click', (e) => {
    const chip = e.target.closest('[data-difficulty]');
    if(!chip || !pendingModeSelection) return;
    const value = chip.dataset.difficulty;
    if(!value) return;
    pendingModeSelection.difficulty = value;
    setActiveChip(elDifficultyGroup, c => c === chip);
  });
}
elModeDialogCancel.addEventListener('click', closeModeDialog);

const elInGameDifficulty = document.getElementById('inGameDifficulty');
if(elInGameDifficulty){
  elInGameDifficulty.addEventListener('change', async (e)=>{
    const value = e.target.value || 'LEICHT';
    const saved = saveAndApply({ difficulty: value });
    if(game){
      game.difficulty = value;
      game.progress = saved;
      await playCurrentPrompt();
    }
  });
}

const elModeWarningAction = document.getElementById('modeWarningAction');
if(elModeWarningAction){
  elModeWarningAction.addEventListener('click', () => {
    switchToTab('einstellungen');
    elStatusGrid?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
}

// Rundenanzeige
elRounds.addEventListener('input', ()=> elRoundsOut.textContent = elRounds.value);

// UX: Aufnahmen-Status prüfen und UI aktualisieren
const elEmptyState = document.getElementById('emptyState');
const elProgressBadge = document.getElementById('progressBadge');

async function updateUIForRecordingState() {
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const clips = setData && setData.clips ? setData.clips : [];
  const recordedLetters = clips.map(clip => clip.letter);
  const recordedSet = new Set(recordedLetters);
  const recordedCount = recordedSet.size;
  const hasRecordings = recordedCount > 0;

  // Spiel-Tab: Empty State anzeigen/verstecken
  elEmptyState.classList.toggle('hidden', hasRecordings);

  const progress = getProgress();
  const mode = progress?.mode || 'FREI';
  const desiredFreeCount = progress?.freeLetterCount || 4;
  const unlockedForPath = progress?.unlocked || 4;
  updateStartButtonLabel(progress);
  updateLernwegProgress(progress);

  const baseWarnings = [];
  if(hasRecordings){
    if(mode === 'FREI'){
      const targetLetters = LETTERS.slice(0, desiredFreeCount);
      const missingBase = targetLetters.filter(letter => !recordedSet.has(letter));
      if(missingBase.length){
        baseWarnings.push(desiredFreeCount === 26
          ? `Für alle 26 Buchstaben fehlen noch ${missingBase.length}.`
          : `Es fehlen Aufnahmen für: ${missingBase.join(', ')}`);
      }
    } else if(mode === 'LERNWEG'){
      const requiredLetters = LETTERS.slice(0, unlockedForPath);
      const missingBase = requiredLetters.filter(letter => !recordedSet.has(letter));
      if(missingBase.length){
        baseWarnings.push(`Für den Lernweg fehlen Aufnahmen für: ${missingBase.join(', ')}`);
      }
    }
  }

  const warningMessage = [...baseWarnings].join(' ');
  const canStart = hasRecordings && baseWarnings.length === 0;
  elBtnStart.disabled = !canStart;
  elBtnStart.style.opacity = canStart ? '1' : '0.5';
  elBtnStart.style.cursor = canStart ? 'pointer' : 'not-allowed';
  elBtnStart.title = canStart ? '' : (hasRecordings ? 'Bitte nimm die fehlenden Buchstaben auf, bevor du startest.' : 'Bitte nimm zuerst mindestens eine Aufnahme auf.');

  if(elModeHint){
    if(warningMessage){
      elModeHint.textContent = `⚠️ ${warningMessage}`;
      elModeHint.classList.remove('hidden');
    } else {
      elModeHint.textContent = '';
      elModeHint.classList.add('hidden');
    }
  }

  // Fortschrittsanzeige in Einstellungen
  elProgressBadge.textContent = `${recordedCount} von 26 Buchstaben aufgenommen`;
  elProgressBadge.classList.toggle('empty', recordedCount === 0);

  // Buchstaben-Buttons im Preview-Modus aktualisieren
  await updateLetterButtons();
}

const ACTIVE_SET_SELECTOR_IDS = ['setSelector', 'inGameSetSelector', 'practiceSetSelector'];

// Hilfsfunktion: Set-Selectoren für Spiel/HUD/Üben befüllen
async function populateSetSelector(){
  const sets = await getAllSets();
  const activeSetId = await getActiveSet();
  const selectors = ACTIVE_SET_SELECTOR_IDS
    .map(id => document.getElementById(id))
    .filter(Boolean);

  if(!selectors.length) return;

  selectors.forEach(select => {
    select.innerHTML = '';
    if(!sets.length){
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Keine Sets verfügbar';
      select.appendChild(option);
      select.disabled = true;
      return;
    }

    select.disabled = false;
    for(const set of sets){
      const option = document.createElement('option');
      option.value = set.id;
      option.textContent = `${set.emoji} ${set.name}`;
      option.selected = set.id === activeSetId;
      select.appendChild(option);
    }
  });
}

// Hilfsfunktion: Standard-Set-Selector in Einstellungen befüllen
async function populateDefaultSetSelector(){
  const sets = await getAllSets();
  const activeSetId = await getActiveSet();
  const selector = document.getElementById('defaultSetSelector');

  if(!selector) return; // Element existiert nicht

  selector.innerHTML = '';
  for(const set of sets) {
    const option = document.createElement('option');
    option.value = set.id;
    option.textContent = `${set.emoji} ${set.name}`;
    option.selected = set.id === activeSetId;
    selector.appendChild(option);
  }
}

async function handleSetChange(newSetId, { refreshSetsList = false } = {}){
  if(!newSetId) return;
  const current = await getActiveSet();
  if(current === newSetId && !refreshSetsList){
    return;
  }

  await setActiveSet(newSetId);
  await syncActiveGameWithSet(newSetId);
  await updateRecordingUI();
  await populateSetSelector();
  await populateDefaultSetSelector();

  if(refreshSetsList){
    await renderSetsList();
  }

  if(game && game.target){
    await playCurrentPrompt({ suppressAlert: false });
  }
}

async function syncActiveGameWithSet(newSetId){
  if(!game) return;
  const setData = await loadSetData(newSetId);
  const clips = setData && Array.isArray(setData.clips) ? setData.clips : [];
  const recordedSet = new Set(clips.map(clip => clip.letter));

  if(recordedSet.size === 0){
    alert('Für dieses Set gibt es noch keine Aufnahmen. Das laufende Spiel wurde beendet.');
    endGame();
    return;
  }

  const progress = game.progress || getProgress();
  const mode = game.mode || progress?.mode || 'FREI';
  let pool = Array.from(recordedSet).sort();

  if(mode === 'LERNWEG'){
    const unlockedCount = progress && progress.unlocked ? progress.unlocked : 4;
    const unlockedLetters = LETTERS.slice(0, unlockedCount);
    pool = unlockedLetters.filter(letter => recordedSet.has(letter));
  } else {
    const desiredCount = progress && progress.freeLetterCount ? progress.freeLetterCount : 4;
    const targetLetters = LETTERS.slice(0, desiredCount);
    pool = targetLetters.filter(letter => recordedSet.has(letter));
  }

  if(pool.length === 0){
    alert('In diesem Set fehlen die notwendigen Aufnahmen für den aktuellen Modus. Das Spiel wurde beendet.');
    endGame();
    return;
  }

  game.setId = newSetId;
  game.recorded = pool.slice();
  game.pool = pool.slice();
  game.progress = progress;
}

// "Jetzt Aufnahmen machen" Button
document.getElementById('goToSettings').addEventListener('click', () => {
  switchToTab('einstellungen');
});

// Settings-Zahnrad Button (oben rechts)
document.getElementById('settingsBtn').addEventListener('click', () => {
  switchToTab('einstellungen');
});

// Set-Selector im Spiel-Tab für Kinder
document.getElementById('setSelector').addEventListener('change', async (e) => {
  await handleSetChange(e.target.value);
});

// Standard-Set-Selector in Einstellungen für Erwachsene
document.getElementById('defaultSetSelector').addEventListener('change', async (e) => {
  await handleSetChange(e.target.value, { refreshSetsList: true });
});

if(elInGameSetSelector){
  elInGameSetSelector.addEventListener('change', async (e) => {
    await handleSetChange(e.target.value);
  });
}

if(elPracticeSetSelector){
  elPracticeSetSelector.addEventListener('change', async (e) => {
    await handleSetChange(e.target.value);
  });
}



// ——————————————————————————————————————————
// IndexedDB (Aufnahmen & Sets)
// ——————————————————————————————————————————
const DB_NAME='abc-abenteuer-db';
const STORE='recordings';
const DB_VERSION = 2;

let dbPromise = new Promise((resolve,reject)=>{
  const req = indexedDB.open(DB_NAME, DB_VERSION);
  req.onupgradeneeded = (e)=> {
    const db = req.result;
    const oldVersion = e.oldVersion;

    // Version 1: Recordings Store erstellen
    if(!db.objectStoreNames.contains(STORE)) {
      db.createObjectStore(STORE);
    }

    // Version 2: Migration für Multi-Sets (wird später bei Bedarf durchgeführt)
    // Alte "audio-X" Keys bleiben vorerst, werden bei erster Nutzung migriert
  };
  req.onsuccess = ()=> resolve(req.result);
  req.onerror = ()=> reject(req.error);
});

function idbGet(key){
  return dbPromise.then(db=> new Promise((res,rej)=>{
    const tx = db.transaction(STORE,'readonly');
    const st = tx.objectStore(STORE);
    const r = st.get(key);
    r.onsuccess = ()=> res(r.result || null);
    r.onerror = ()=> rej(r.error);
  }));
}
function idbSet(key,val){
  return dbPromise.then(db=> new Promise((res,rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    const st = tx.objectStore(STORE);
    const r = st.put(val,key);
    r.onsuccess = ()=> res(true);
    r.onerror = ()=> rej(r.error);
  }));
}
function idbDel(key){
  return dbPromise.then(db=> new Promise((res,rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    const st = tx.objectStore(STORE);
    const r = st.delete(key);
    r.onsuccess = ()=> res(true);
    r.onerror = ()=> rej(r.error);
  }));
}
function idbKeys(){
  return dbPromise.then(db=> new Promise((res,rej)=>{
    const tx = db.transaction(STORE,'readonly');
    const st = tx.objectStore(STORE);
    const keys=[];
    if(st.getAllKeys){
      const r = st.getAllKeys();
      r.onsuccess = ()=> res(r.result || []);
      r.onerror = ()=> rej(r.error);
    }else{
      // Fallback über Cursor
      st.openCursor().onsuccess = (e)=>{
        const cursor = e.target.result;
        if(cursor){ keys.push(cursor.key); cursor.continue(); }
        else res(keys);
      };
    }
  }));
}
function idbClear(){
  return dbPromise.then(db=> new Promise((res,rej)=>{
    const tx = db.transaction(STORE,'readwrite');
    tx.objectStore(STORE).clear().onsuccess = ()=> res(true);
    tx.onerror = ()=> rej(tx.error);
  }));
}

// ——————————————————————————————————————————
// Set-Management
// ——————————————————————————————————————————
let currentSetId = null;

// UUID generieren
function generateUUID(){
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const AUDIO_DIFFICULTIES = ['LEICHT', 'MITTEL', 'SCHWER', 'AFFIG'];
const AUDIO_FILE_EXT_PATTERN = /\.(webm|ogg|mp3|mp4|m4a|wav)$/i;

function makeEmptyMedalMap(){
  const map = {};
  MEDAL_TYPES.forEach(type => { map[type] = []; });
  return map;
}

function isAudioFileLike(file){
  if(!file) return false;
  if(file.type && file.type.startsWith('audio/')) return true;
  if(file.name && AUDIO_FILE_EXT_PATTERN.test(file.name)) return true;
  return false;
}

function normaliseLetterInput(value){
  if(typeof value !== 'string') return null;
  const trimmed = value.trim().toUpperCase();
  return trimmed && /^[A-ZÄÖÜ]$/.test(trimmed) ? trimmed : null;
}

function normaliseDifficultyInput(value){
  const fallback = 'LEICHT';
  if(!value) return fallback;
  const normalised = value.toString().trim().toUpperCase();
  return AUDIO_DIFFICULTIES.includes(normalised) ? normalised : fallback;
}

function sanitiseMotivationClips(list){
  if(!Array.isArray(list)) return [];
  const seen = new Set();
  return list
    .filter(entry => entry && typeof entry.id === 'string' && entry.id)
    .map(entry => {
      if(seen.has(entry.id)) return null;
      seen.add(entry.id);
      return {
        id: entry.id,
        created: typeof entry.created === 'number' ? entry.created : Date.now(),
      };
    })
    .filter(Boolean);
}

function sanitiseMedalSounds(raw){
  const result = makeEmptyMedalMap();
  if(!raw || typeof raw !== 'object'){
    return result;
  }
  for(const type of MEDAL_TYPES){
    const source = raw[type];
    const list = Array.isArray(source) ? source : source && typeof source === 'object' ? [source] : [];
    result[type] = list
      .filter(entry => entry && typeof entry.id === 'string' && entry.id)
      .map(entry => ({
        id: entry.id,
        created: typeof entry.created === 'number' ? entry.created : Date.now(),
      }));
  }
  return result;
}

async function loadSetData(setId){
  if(!setId) return null;
  const setKey = 'set-' + setId;
  const raw = await idbGet(setKey);
  if(!raw){
    return null;
  }

  let changed = false;
  const data = {
    name: raw.name || 'Meine Aufnahmen',
    emoji: raw.emoji || '🎤',
    created: raw.created || Date.now(),
    clips: Array.isArray(raw.clips) ? raw.clips.slice() : [],
    motivationClips: sanitiseMotivationClips(raw.motivationClips),
    medalSounds: sanitiseMedalSounds(raw.medalSounds),
  };

  const seen = new Set();
  data.clips = data.clips
    .filter(clip => clip && typeof clip.id === 'string' && clip.id)
    .map(clip => {
      const id = clip.id;
      if(seen.has(id)) return null;
      seen.add(id);
      const letter = normaliseLetterInput(clip.letter) || 'A';
      const difficulty = normaliseDifficultyInput(clip.difficulty);
      return {
        id,
        letter,
        difficulty,
        created: typeof clip.created === 'number' ? clip.created : Date.now(),
      };
    })
    .filter(Boolean);

  if(!Array.isArray(raw.clips) || raw.clips.length !== data.clips.length){
    changed = true;
  }
  if(!Array.isArray(raw.motivationClips) || raw.motivationClips.length !== data.motivationClips.length){
    changed = true;
  }
  if(raw.medalSounds){
    for(const type of MEDAL_TYPES){
      const rawEntry = raw.medalSounds[type];
      const rawCount = Array.isArray(rawEntry)
        ? rawEntry.filter(entry => entry && typeof entry.id === 'string').length
        : (rawEntry && typeof rawEntry.id === 'string' ? 1 : 0);
      const sanitisedCount = Array.isArray(data.medalSounds[type]) ? data.medalSounds[type].length : 0;
      if(rawCount !== sanitisedCount){
        changed = true;
        break;
      }
    }
  }

  const migrated = await migrateLegacyRecordingsForSet(setId, data);
  changed = changed || migrated;

  if(changed){
    await idbSet(setKey, data);
  }

  return data;
}

async function migrateLegacyRecordingsForSet(setId, setData){
  const prefix = 'audio-' + setId + '-';
  const keys = await idbKeys();
  const knownIds = new Set(setData.clips.map(clip => clip.id));
  const legacyKeys = keys.filter(key => key.startsWith(prefix));
  let updated = false;

  for(const key of legacyKeys){
    const suffix = key.slice(prefix.length);
    if(knownIds.has(suffix)){
      continue;
    }

    if(/^[A-ZÄÖÜ]$/.test(suffix)){
      const letter = suffix;
      const blob = await idbGet(key);
      if(!blob) continue;
      const clip = {
        id: generateUUID(),
        letter,
        difficulty: 'LEICHT',
        created: Date.now(),
      };
      await idbSet('audio-' + setId + '-' + clip.id, blob);
      await idbDel(key);
      setData.clips.push(clip);
      knownIds.add(clip.id);
      updated = true;
    }
  }

  return updated;
}

async function createSet(name, emoji){
  const setId = generateUUID();
  const setData = {
    name: name || 'Neues Set',
    emoji: emoji || '🎤',
    created: Date.now(),
    clips: [],
    motivationClips: [],
    medalSounds: makeEmptyMedalMap(),
  };
  await idbSet('set-' + setId, setData);
  return setId;
}

// Alle Sets abrufen
async function getAllSets(){
  const keys = await idbKeys();
  const setKeys = keys.filter(k => k.startsWith('set-'));
  const sets = [];
  for(const key of setKeys){
    const id = key.replace('set-', '');
    const data = await loadSetData(id);
    if(data){
      sets.push({ id, ...data });
    }
  }
  return sets.sort((a,b) => (a.created || 0) - (b.created || 0));
}

// Set löschen (inkl. aller Aufnahmen)
async function deleteSet(setId){
  // Set-Metadaten löschen
  await idbDel('set-' + setId);

  // Alle Audio-Aufnahmen des Sets löschen
  const keys = await idbKeys();
  const prefixes = [
    'audio-' + setId + '-',
    'motivation-' + setId + '-',
    'medal-' + setId + '-',
  ];
  const audioKeys = keys.filter(k => prefixes.some(prefix => k.startsWith(prefix)));
  for(const key of audioKeys){
    await idbDel(key);
  }
}

// Set umbenennen
async function updateSet(setId, name, emoji){
  const setData = await loadSetData(setId);
  if(setData){
    setData.name = name;
    setData.emoji = emoji;
    await idbSet('set-' + setId, setData);
  }
}

// Aktives Set setzen
async function setActiveSet(setId){
  currentSetId = setId;
  await idbSet('activeSet', setId);
}

// Aktives Set laden
async function getActiveSet(){
  if(currentSetId) return currentSetId;
  const saved = await idbGet('activeSet');
  if(saved){
    currentSetId = saved;
    return saved;
  }
  // Kein aktives Set? Erstes verfügbares Set nutzen oder Default erstellen
  const sets = await getAllSets();
  if(sets.length > 0){
    currentSetId = sets[0].id;
    await setActiveSet(currentSetId);
    return currentSetId;
  }
  // Default-Set erstellen
  const defaultId = await createSet('Meine Aufnahmen', '🎤');
  await setActiveSet(defaultId);
  return defaultId;
}

// Anzahl Aufnahmen pro Set
async function getSetRecordingCount(setId){
  const data = await loadSetData(setId);
  if(!data) return 0;
  const uniqueLetters = new Set(data.clips.map(clip => clip.letter));
  return uniqueLetters.size;
}

function hasMedalSounds(map){
  if(!map || typeof map !== 'object'){
    return false;
  }
  return MEDAL_TYPES.some(type => Array.isArray(map[type]) && map[type].length > 0);
}

function isSetCompletelyEmpty(data){
  if(!data) return true;
  const hasClips = Array.isArray(data.clips) && data.clips.length > 0;
  const hasMotivations = Array.isArray(data.motivationClips) && data.motivationClips.length > 0;
  const hasMedals = hasMedalSounds(data.medalSounds);
  return !hasClips && !hasMotivations && !hasMedals;
}

async function cleanupPlaceholderSets(){
  const sets = await getAllSets();
  if(!sets.length){
    return;
  }

  const placeholderIds = [];
  for(const set of sets){
    if((set.name || '').trim() !== 'Meine Aufnahmen') continue;
    if((set.emoji || '').trim() !== '🎤') continue;
    const data = await loadSetData(set.id);
    if(isSetCompletelyEmpty(data)){
      placeholderIds.push(set.id);
    }
  }

  if(!placeholderIds.length){
    return;
  }

  const remainingCandidates = sets.filter(set => !placeholderIds.includes(set.id));
  if(!remainingCandidates.length){
    // Behalte mindestens ein Set, damit Aufnahmen weiterhin möglich sind.
    return;
  }

  const activeSetId = await getActiveSet();
  let activeRemoved = false;
  for(const id of placeholderIds){
    await deleteSet(id);
    if(id === activeSetId){
      activeRemoved = true;
    }
  }

  if(activeRemoved){
    const remainingSets = await getAllSets();
    if(remainingSets.length){
      await setActiveSet(remainingSets[0].id);
    }
  }
}

// Migration: Alte Aufnahmen (audio-X) in neues Format (audio-SETID-X) migrieren
async function migrateOldRecordings(){
  const keys = await idbKeys();

  const oldKeys = keys.filter(k => k.startsWith('audio-') && /^[A-ZÄÖÜ]$/.test(k.replace('audio-', '')));
  if(oldKeys.length === 0) return;

  console.log(`Migriere ${oldKeys.length} alte Aufnahmen...`);

  const migrationSetId = await createSet('Meine Aufnahmen', '🎤');
  const setData = await loadSetData(migrationSetId) || { clips: [] };

  for(const oldKey of oldKeys){
    const letter = oldKey.replace('audio-', '');
    const blob = await idbGet(oldKey);
    if(!blob) continue;
    const clip = {
      id: generateUUID(),
      letter,
      difficulty: 'LEICHT',
      created: Date.now(),
    };
    await idbSet('audio-' + migrationSetId + '-' + clip.id, blob);
    setData.clips.push(clip);
    await idbDel(oldKey);
  }

  await idbSet('set-' + migrationSetId, setData);
  await setActiveSet(migrationSetId);

  console.log(`Migration abgeschlossen: ${oldKeys.length} Aufnahmen migriert.`);
}

// ——————————————————————————————————————————
// Sticker-Album & Belohnungssystem
// ——————————————————————————————————————————

// Sticker-Katalog: 4 Themen × 12 Sticker
const STICKER_CATALOG = {
  animals: {
    name: 'Tiere',
    emoji: '🦁',
    stickers: [
      {id: 'a1', emoji: '🦁', name: 'Löwe'},
      {id: 'a2', emoji: '🐘', name: 'Elefant'},
      {id: 'a3', emoji: '🦒', name: 'Giraffe'},
      {id: 'a4', emoji: '🦓', name: 'Zebra'},
      {id: 'a5', emoji: '🐼', name: 'Panda'},
      {id: 'a6', emoji: '🦊', name: 'Fuchs'},
      {id: 'a7', emoji: '🐨', name: 'Koala'},
      {id: 'a8', emoji: '🦘', name: 'Känguru'},
      {id: 'a9', emoji: '🐯', name: 'Tiger'},
      {id: 'a10', emoji: '🐻', name: 'Bär'},
      {id: 'a11', emoji: '🐧', name: 'Pinguin'},
      {id: 'a12', emoji: '🦉', name: 'Eule'}
    ]
  },
  space: {
    name: 'Weltraum',
    emoji: '🚀',
    stickers: [
      {id: 's1', emoji: '🚀', name: 'Rakete'},
      {id: 's2', emoji: '🛸', name: 'UFO'},
      {id: 's3', emoji: '🌙', name: 'Mond'},
      {id: 's4', emoji: '⭐', name: 'Stern'},
      {id: 's5', emoji: '🌟', name: 'Glitzerstern'},
      {id: 's6', emoji: '🪐', name: 'Saturn'},
      {id: 's7', emoji: '🌍', name: 'Erde'},
      {id: 's8', emoji: '☄️', name: 'Komet'},
      {id: 's9', emoji: '🌌', name: 'Galaxie'},
      {id: 's10', emoji: '👾', name: 'Alien'},
      {id: 's11', emoji: '🛰️', name: 'Satellit'},
      {id: 's12', emoji: '🔭', name: 'Teleskop'}
    ]
  },
  ocean: {
    name: 'Unterwasser',
    emoji: '🐠',
    stickers: [
      {id: 'o1', emoji: '🐠', name: 'Fisch'},
      {id: 'o2', emoji: '🐡', name: 'Kugelfisch'},
      {id: 'o3', emoji: '🐟', name: 'Goldfisch'},
      {id: 'o4', emoji: '🐬', name: 'Delfin'},
      {id: 'o5', emoji: '🐳', name: 'Wal'},
      {id: 'o6', emoji: '🦈', name: 'Hai'},
      {id: 'o7', emoji: '🐙', name: 'Oktopus'},
      {id: 'o8', emoji: '🦀', name: 'Krabbe'},
      {id: 'o9', emoji: '🦞', name: 'Hummer'},
      {id: 'o10', emoji: '🐚', name: 'Muschel'},
      {id: 'o11', emoji: '⭐', name: 'Seestern'},
      {id: 'o12', emoji: '🪸', name: 'Koralle'}
    ]
  },
  fairy: {
    name: 'Märchen',
    emoji: '🏰',
    stickers: [
      {id: 'f1', emoji: '🏰', name: 'Schloss'},
      {id: 'f2', emoji: '👑', name: 'Krone'},
      {id: 'f3', emoji: '🧙', name: 'Zauberer'},
      {id: 'f4', emoji: '🧚', name: 'Fee'},
      {id: 'f5', emoji: '🐉', name: 'Drache'},
      {id: 'f6', emoji: '🦄', name: 'Einhorn'},
      {id: 'f7', emoji: '🗡️', name: 'Schwert'},
      {id: 'f8', emoji: '🛡️', name: 'Schild'},
      {id: 'f9', emoji: '💎', name: 'Diamant'},
      {id: 'f10', emoji: '🔮', name: 'Kristallkugel'},
      {id: 'f11', emoji: '📜', name: 'Schriftrolle'},
      {id: 'f12', emoji: '🪄', name: 'Zauberstab'}
    ]
  }
};

// Alle Sticker-IDs sammeln
const ALL_STICKER_IDS = Object.values(STICKER_CATALOG)
  .flatMap(theme => theme.stickers.map(s => s.id));

// Sticker finden nach ID
function getStickerById(stickerId){
  for(const theme of Object.values(STICKER_CATALOG)){
    const sticker = theme.stickers.find(s => s.id === stickerId);
    if(sticker) return sticker;
  }
  return null;
}

function getStickerThemeKey(stickerId){
  for(const [key, theme] of Object.entries(STICKER_CATALOG)){
    if(theme.stickers.some(s => s.id === stickerId)){
      return key;
    }
  }
  return null;
}

const STARS_PER_PACK = 10;

// Sterne abrufen
async function getStars(){
  const stars = await idbGet('stars');
  return stars || 0;
}

// Sterne setzen
async function setStars(count){
  await idbSet('stars', count);
}

// Sterne hinzufügen
async function addStars(count){
  const current = await getStars();
  await setStars(current + count);
  return current + count;
}

// Gesammelte Sticker abrufen
async function getCollectedStickers(){
  const stickers = await idbGet('collectedStickers');
  return stickers || [];
}

// Sticker hinzufügen
async function addSticker(stickerId){
  const collected = await getCollectedStickers();
  if(!collected.includes(stickerId)){
    collected.push(stickerId);
    await idbSet('collectedStickers', collected);
    return true; // Neu gesammelt
  }
  return false; // Duplikat
}

const STAR_TRACK_SIZE = STARS_PER_PACK;
let totalStarBank = 0;
let starTrackNodes = [];
let starRevealWidget = null;
let giftLottieAnimation = null;
const reduceMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
let prefersReducedMotion = reduceMotionQuery.matches;
const handleReduceMotionChange = (event) => {
  prefersReducedMotion = event.matches;
};
if(typeof reduceMotionQuery.addEventListener === 'function'){
  reduceMotionQuery.addEventListener('change', handleReduceMotionChange);
} else if(typeof reduceMotionQuery.addListener === 'function'){
  reduceMotionQuery.addListener(handleReduceMotionChange);
}

// Buchstaben-Statistik abrufen
async function getLetterStats(){
  const stats = await idbGet('letterStats');
  return stats || {}; // {A: 5, B: 3, ...}
}

// Buchstaben-Statistik inkrementieren
async function incrementLetterStat(letter){
  const stats = await getLetterStats();
  stats[letter] = (stats[letter] || 0) + 1;
  await idbSet('letterStats', stats);
  return stats[letter];
}

function shouldReduceMotion(){
  return prefersReducedMotion;
}

// Badge-Level für Buchstabe berechnen (Bronze: 3, Silber: 10, Gold: 25)
function getLetterBadge(count){
  if(count >= 25) return {level: 'gold', emoji: '🥇', name: 'Gold'};
  if(count >= 10) return {level: 'silver', emoji: '🥈', name: 'Silber'};
  if(count >= 3) return {level: 'bronze', emoji: '🥉', name: 'Bronze'};
  return null;
}

// Zufälliges Sticker-Pack öffnen (3 zufällige Sticker, keine Duplikate im Pack)
function openStickerPack(){
  const available = [...ALL_STICKER_IDS];
  const pack = [];

  // 3 zufällige Sticker ziehen
  for(let i = 0; i < 3 && available.length > 0; i++){
    const randomIndex = Math.floor(Math.random() * available.length);
    const stickerId = available.splice(randomIndex, 1)[0];
    pack.push(stickerId);
  }

  return pack;
}

function updateMissionStatus(completed = 0, total = 0){
  if(!elMissionText) return;
  if(!total){
    elMissionText.textContent = 'Starte ein Abenteuer!';
    return;
  }
  const clamped = Math.max(0, Math.min(completed, total));
  if(clamped >= total){
    elMissionText.textContent = 'Mission erfüllt! 🎉';
    return;
  }
  elMissionText.textContent = `${clamped} von ${total} Buchstaben entdeckt`;
}

function initStarTrack(){
  if(!elStarTrackStars) return;
  elStarTrackStars.innerHTML = '';
  starTrackNodes = [];
  for(let i = 0; i < STAR_TRACK_SIZE; i += 1){
    const star = document.createElement('span');
    star.className = 'star-track__star';
    star.setAttribute('aria-hidden', 'true');
    elStarTrackStars.appendChild(star);
    starTrackNodes.push(star);
  }
  updateStarTrackDisplay();
}

function updateStarTrackDisplay(){
  if(!starTrackNodes.length) return;
  const combined = totalStarBank;
  const ready = combined >= STARS_PER_PACK;
  const progress = ready ? STARS_PER_PACK : (combined % STARS_PER_PACK);
  starTrackNodes.forEach((node, index) => {
    node.classList.toggle('filled', index < progress);
  });
  if(elStarTrackProgressText){
    elStarTrackProgressText.textContent = `${progress}/${STARS_PER_PACK}`;
  }
}

async function refreshStoredStars(){
  totalStarBank = await getStars();
  updateStarTrackDisplay();
}

function updateStarSummary(count){
  if(!elStarSummaryText) return;
  const safe = Math.max(0, Math.min(MAX_RUN_STARS, count));
  elStarSummaryText.textContent = `${safe} von ${MAX_RUN_STARS} Sternen`;
}

function getStarRevealWidget(){
  if(!elStarCanvas) return null;
  if(!starRevealWidget){
    starRevealWidget = new StarReveal(elStarCanvas, {
      onReveal: () => {
        if(shouldReduceMotion()) return;
        playStarRevealSound();
      },
      revealDelay: 1000,
    });
  }
  return starRevealWidget;
}

async function animateResultStars(count){
  updateStarSummary(count);
  const widget = getStarRevealWidget();
  if(!widget){
    return;
  }
  await widget.setStars(0);
  await widget.setStars(count);
}

function ensureGiftLottie(){
  if(!elResultGiftLottie || typeof lottie === 'undefined'){
    return null;
  }
  if(!giftLottieAnimation){
    giftLottieAnimation = lottie.loadAnimation({
      container: elResultGiftLottie,
      renderer: 'svg',
      loop: true,
      autoplay: false,
      path: 'SPECS/AdditionalInput/GiftLotti.json',
    });
  }
  return giftLottieAnimation;
}

function toggleResultGift(show){
  if(!elResultGift) return;
  if(show){
    if(elResultGift.classList.contains('hidden')){
      playGiftPopSound();
    }
    elResultGift.classList.remove('hidden');
    const anim = ensureGiftLottie();
    if(anim){
      anim.goToAndPlay(0, true);
    }
  } else {
    elResultGift.classList.add('hidden');
    if(giftLottieAnimation){
      giftLottieAnimation.stop();
    }
  }
}

// ——————————————————————————————————————————
// UI – Set-Verwaltung
// ——————————————————————————————————————————
const elSetsList = document.getElementById('setsList');
const elBtnCreateSet = document.getElementById('btnCreateSet');

// Sets-Liste rendern
async function renderSetsList(){
  const sets = await getAllSets();
  const activeSetId = await getActiveSet();

  elSetsList.innerHTML = '';

  for(const set of sets){
    const count = await getSetRecordingCount(set.id);
    const isActive = set.id === activeSetId;

    const card = document.createElement('div');
    card.className = 'set-card' + (isActive ? ' active' : '');
    card.innerHTML = `
      <div class="set-actions">
        <button class="set-btn" data-action="edit" data-id="${set.id}" title="Bearbeiten">✏️</button>
        <button class="set-btn" data-action="delete" data-id="${set.id}" title="Löschen">🗑️</button>
      </div>
      <span class="set-emoji">${set.emoji}</span>
      <div class="set-name">${set.name}</div>
      <div class="set-count">${count} / 26 Buchstaben</div>
    `;

    // Klick auf Karte: Set aktivieren
    card.addEventListener('click', async (e) => {
      // Nicht aktivieren wenn auf Buttons geklickt wurde
      if(e.target.closest('.set-btn')) return;
      await handleSetChange(set.id, { refreshSetsList: true });
    });

    elSetsList.appendChild(card);
  }
}

// Set erstellen Dialog
elBtnCreateSet.addEventListener('click', async () => {
  const name = prompt('Name des Sets:', 'Neues Set');
  if(!name) return;

  const emoji = prompt('Emoji für das Set (z.B. 🍎, 🔤, 👶):', '🎤');
  if(emoji === null) return;

  const setId = await createSet(name, emoji || '🎤');
  await handleSetChange(setId, { refreshSetsList: true });
});

// Set-Aktionen (Bearbeiten/Löschen)
elSetsList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.set-btn');
  if(!btn) return;

  e.stopPropagation();

  const action = btn.dataset.action;
  const setId = btn.dataset.id;

  if(action === 'delete'){
    const sets = await getAllSets();
    if(sets.length <= 1){
      alert('Du musst mindestens ein Set behalten!');
      return;
    }

    if(confirm('Set wirklich löschen? Alle Aufnahmen gehen verloren!')){
      const wasActive = (await getActiveSet()) === setId;
      await deleteSet(setId);

      // Wenn das aktive Set gelöscht wurde, erstes verfügbares Set aktivieren
      if(wasActive){
        const remainingSets = await getAllSets();
        if(remainingSets.length > 0){
          await setActiveSet(remainingSets[0].id);
        }
      }

      await renderSetsList();
      await updateRecordingUI();
      await populateSetSelector();
      await populateDefaultSetSelector();
    }
  }

  if(action === 'edit'){
    const setData = await loadSetData(setId);
    if(!setData) return;

    const name = prompt('Name des Sets:', setData.name);
    if(name === null) return;

    const emoji = prompt('Emoji für das Set:', setData.emoji);
    if(emoji === null) return;

    await updateSet(setId, name || setData.name, emoji || setData.emoji);
    await renderSetsList();
    await populateSetSelector();
    await populateDefaultSetSelector();
  }
});

// Hilfsfunktion: Komplettes UI der Aufnahmen aktualisieren
async function updateRecordingUI(){
  await updateStatusGridFromDB();
  await updateUIForRecordingState();
  await updatePracticeLetterButtons();
  if(currentLetter) await selectLetter(currentLetter);
  await refreshSupportAudioUI();
}

async function refreshSupportAudioUI(){
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  renderMotivationList(setData && Array.isArray(setData.motivationClips) ? setData.motivationClips : []);
  updateMedalUI(setData && setData.medalSounds ? setData.medalSounds : makeEmptyMedalMap());
}

// ——————————————————————————————————————————
// UI – Sticker-Album
// ——————————————————————————————————————————
let currentAlbumTheme = 'animals';

async function renderAlbum(){
  const stars = await getStars();
  totalStarBank = stars;
  updateStarTrackDisplay();
  const collected = await getCollectedStickers();
  const collectedSet = new Set(collected);

  // Sterne anzeigen
  document.getElementById('starCount').textContent = stars;

  // Pack-Button aktivieren/deaktivieren
  const btnOpenPack = document.getElementById('btnOpenPack');
  btnOpenPack.disabled = stars < STARS_PER_PACK;

  // Themen-Tabs rendern
  const albumTabs = document.getElementById('albumTabs');
  albumTabs.innerHTML = '';
  for(const [key, theme] of Object.entries(STICKER_CATALOG)){
    const btn = document.createElement('button');
    btn.className = 'btn secondary';
    if(key === currentAlbumTheme) btn.classList.add('active');
    btn.textContent = `${theme.emoji} ${theme.name}`;
    btn.onclick = () => { currentAlbumTheme = key; renderAlbum(); };
    albumTabs.appendChild(btn);
  }

  // Sticker-Grid rendern
  const theme = STICKER_CATALOG[currentAlbumTheme];
  const albumContent = document.getElementById('albumContent');
  albumContent.innerHTML = `<div class="album-grid"></div>`;
  const grid = albumContent.querySelector('.album-grid');

  for(const sticker of theme.stickers){
    const slot = document.createElement('div');
    slot.className = 'sticker-slot';
    slot.dataset.stickerId = sticker.id;
    const hasSticker = collectedSet.has(sticker.id);
    if(hasSticker){
      slot.classList.add('collected');
      slot.textContent = sticker.emoji;
      slot.title = sticker.name;
    } else {
      slot.classList.add('locked');
      slot.textContent = '❓';
      slot.title = '??? - Noch nicht gesammelt';
    }
    grid.appendChild(slot);
  }

  // Fortschritt anzeigen
  const themeCollected = theme.stickers.filter(s => collectedSet.has(s.id)).length;
  const progress = document.createElement('p');
  progress.className = 'muted';
  progress.style.marginTop = '16px';
  progress.textContent = `${themeCollected} von ${theme.stickers.length} Stickern gesammelt`;
  albumContent.appendChild(progress);
}

async function animateStickerUnlock(stickers){
  if(!Array.isArray(stickers) || !stickers.length){
    return;
  }
  const albumSection = document.getElementById('album');
  if(albumSection && albumSection.classList.contains('hidden')){
    switchToTab('album');
    await sleep(150);
  }
  for(const sticker of stickers){
    const themeKey = getStickerThemeKey(sticker.id);
    if(themeKey){
      currentAlbumTheme = themeKey;
    }
    await renderAlbum();
    await sleep(60);
    const slot = document.querySelector(`[data-sticker-id=\"${sticker.id}\"]`);
    if(slot){
      slot.classList.add('reveal');
      playStickerPopSound();
      await sleep(1100);
      slot.classList.remove('reveal');
    } else {
      await sleep(300);
    }
  }
  await renderAlbum();
}

// Pack öffnen
document.getElementById('btnOpenPack').addEventListener('click', async () => {
  const stars = await getStars();
  if(stars < STARS_PER_PACK) return;

  // 10 Sterne abziehen
  await setStars(stars - STARS_PER_PACK);
  totalStarBank = stars - STARS_PER_PACK;
  updateStarTrackDisplay();

  // 3 zufällige Sticker ziehen
  const pack = openStickerPack();
  const newStickers = [];

  for(const stickerId of pack){
    const isNew = await addSticker(stickerId);
    if(isNew){
      newStickers.push(getStickerById(stickerId));
    }
  }

  if(newStickers.length > 0){
    await animateStickerUnlock(newStickers);
  } else {
    alert('🎁 Pack geöffnet!\n\nLeider nur Duplikate. Versuche es erneut!');
    await renderAlbum();
  }
});

async function onPracticeLetterClick(e) {
  const letter = e.currentTarget.getAttribute('data-letter');
  const btn = e.currentTarget;

  // Buchstaben-Animation beim Klick
  btn.classList.add('letter-bounce');
  setTimeout(()=> btn.classList.remove('letter-bounce'), 500);

  // Klick-Sound
  playClickSound();

  // Audio abspielen
  const difficulty = document.getElementById('practiceDifficulty').value;
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const historyKey = makeClipHistoryKey('practice', setId, letter, difficulty);
  const clipData = await fetchClipForLetter({ setId, letter, difficulty, setData, historyKey });
  if(!clipData){
    alert('Keine Aufnahme für diese Schwierigkeit gefunden.');
    return;
  }
  const url = URL.createObjectURL(clipData.blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  audio.addEventListener('error', () => URL.revokeObjectURL(url));
  await audio.play().catch(()=>{});
}

async function updatePracticeLetterButtons() {
    const setId = await getActiveSet();
    const setData = await loadSetData(setId);
    if (!setData || !setData.clips) return;
    const hasSet = new Set(setData.clips.map(clip => clip.letter));
    document.querySelectorAll('#practiceLetters .btn-letter').forEach(btn => {
        const letter = btn.getAttribute('data-letter');
        btn.disabled = !hasSet.has(letter);
    });
}

function renderPracticeGrid() {
    const elPracticeLetters = document.getElementById('practiceLetters');
    if (!elPracticeLetters) return;
    elPracticeLetters.innerHTML = '';
    LETTERS.forEach(ch => {
        const b = document.createElement('button');
        b.className = 'btn-letter';
        b.textContent = ch;
        b.setAttribute('data-letter', ch);
        b.setAttribute('aria-label', 'Buchstabe ' + ch);
        b.addEventListener('click', onPracticeLetterClick);
        elPracticeLetters.appendChild(b);
    });
    updatePracticeLetterButtons();
}

// ——————————————————————————————————————————
// UI – Buchstabenraster
// ——————————————————————————————————————————
function renderLetterGrid(){
  elLetters.innerHTML='';
  LETTERS.forEach(ch=>{
    const b=document.createElement('button');
    b.className='btn-letter';
    b.textContent=ch;
    b.setAttribute('data-letter',ch);
    b.setAttribute('aria-label', 'Buchstabe ' + ch);
    b.addEventListener('click', onLetterClick);
    elLetters.appendChild(b);
  });
}
renderLetterGrid();

// Buchstaben-Buttons basierend auf verfügbaren Aufnahmen aktivieren/deaktivieren
async function updateLetterButtons(){
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const hasSet = new Set((setData && setData.clips ? setData.clips : []).map(clip => clip.letter));
  const progress = getProgress();
  const unlockedCount = progress && progress.unlocked ? progress.unlocked : 4;
  const freeCount = progress && typeof progress.freeLetterCount === 'number' ? progress.freeLetterCount : 4;
  const mode = progress && progress.mode ? progress.mode : 'FREI';
  const allowedSet = mode === 'LERNWEG'
    ? new Set(LETTERS.slice(0, unlockedCount))
    : mode === 'FREI'
      ? new Set(LETTERS.slice(0, freeCount))
      : null;
  document.querySelectorAll('.btn-letter').forEach(btn => {
    const letter = btn.getAttribute('data-letter');
    let disabled = !hasSet.has(letter);
    if(!disabled && allowedSet && !allowedSet.has(letter)){
      disabled = true;
    }
    btn.disabled = disabled;
    if(allowedSet){
      btn.classList.toggle('locked', !allowedSet.has(letter));
    } else {
      btn.classList.remove('locked');
    }
  });
}

function setActiveChip(group, predicate){
  if(!group) return;
  let matched = false;
  group.querySelectorAll('.chip').forEach(chip => {
    const active = predicate(chip);
    chip.classList.toggle('active', active);
    if(active) matched = true;
  });
  if(!matched){
    const first = group.querySelector('.chip');
    if(first) first.classList.add('active');
  }
}

function applyModeToUI(progress){
  const mode = (progress && progress.mode) || 'FREI';
  const diff = (progress && progress.difficulty) || 'LEICHT';


  if(elModeControls){
    elModeControls.classList.toggle('hidden', mode !== 'FREI');
  }

  if(elInGameDifficulty){
    elInGameDifficulty.value = diff;
  }

  if(mode === 'FREI'){
    const desiredCount = progress && progress.freeLetterCount ? progress.freeLetterCount : 4;

    setActiveChip(elFreeCountGroup, chip => Number(chip.dataset.freeLetterCount || 0) === desiredCount);
    setActiveChip(elDifficultyGroup, chip => (chip.dataset.difficulty || '') === diff);
  }

  updateModeDialogCards(extractSelectionFromProgress(progress));
  updateStartButtonLabel(progress);
}

const DIFFICULTY_LABELS = {
  LEICHT: 'Leicht',
  MITTEL: 'Mittel',
  SCHWER: 'Schwer',
  AFFIG: 'Affig',
};

const DIFFICULTY_DESCRIPTIONS = {
  LEICHT: 'Leicht (Buchstabe + Anlaut)',
  MITTEL: 'Mittel (Nur Buchstabe)',
  SCHWER: 'Schwer (Beispielwort)',
  AFFIG: 'Affig (Extra Schwer)',
};

const LERNWEG_STEPS = [4, 8, 12, 16, 20, 24, 26]; // Defined LERNWEG_STEPS

function deriveLernwegMeta(progress){
  const unlockedRaw = progress && Number.isFinite(progress.unlocked) ? progress.unlocked : 4;
  const unlocked = LERNWEG_STEPS.includes(unlockedRaw)
    ? unlockedRaw
    : LERNWEG_STEPS.find(step => step > unlockedRaw) || 4;
  const stepIndex = Math.max(0, LERNWEG_STEPS.indexOf(unlocked));
  const step = stepIndex + 1;
  const completedStages = step; // Simplified, as audio sets are removed
  const percent = Math.min(100, Math.round((completedStages / LERNWEG_STEPS.length) * 100));
  const flawless = progress && Number.isFinite(progress.flawlessStreak) ? Math.max(0, progress.flawlessStreak) : 0;
  const roundsRemaining = Math.max(0, 2 - flawless);
  const atFinalStage = step >= LERNWEG_STEPS.length;
  const nextStep = stepIndex < LERNWEG_STEPS.length - 1 ? LERNWEG_STEPS[stepIndex + 1] : LERNWEG_STEPS[stepIndex];

  return {
    unlocked,
    step,
    stepTotal: LERNWEG_STEPS.length,
    percent,
    roundsRemaining,
    atFinalStage,
    nextStep,
    flawless,
  };
}

function updateLernwegProgress(progress){
  if(!elLernwegTrack || !elLernwegDetail || !elLernwegFill || !elLernwegNext){
    return;
  }

  if(!progress || progress.mode !== 'LERNWEG'){
    elLernwegTrack.classList.add('hidden');
    return;
  }

  const meta = deriveLernwegMeta(progress);
  elLernwegTrack.classList.remove('hidden');

  elLernwegDetail.textContent = `Stufe ${meta.step} von ${meta.stepTotal}`;
  elLernwegFill.style.width = `${meta.percent}%`;
  const progressBar = elLernwegTrack.querySelector('.lernweg-bar');
  if(progressBar){
    progressBar.setAttribute('aria-valuenow', String(meta.percent));
    progressBar.setAttribute('aria-valuetext', `Fortschritt ${meta.percent} Prozent`);
  }

  if(meta.atFinalStage){
    elLernwegNext.textContent = 'Du hast den gesamten Lernweg gemeistert! 🎉';
  }else{
    if(meta.roundsRemaining > 0){
      const suffix = meta.roundsRemaining === 1 ? 'fehlerfreie Runde' : 'fehlerfreie Runden';
      elLernwegNext.textContent = `Noch ${meta.roundsRemaining} ${suffix} bis Stufe ${meta.step + 1}.`;
    } else {
      elLernwegNext.textContent = 'Fast geschafft! Eine perfekte Runde katapultiert dich auf die nächste Stufe.';
    }
  }
}

function updateStartButtonLabel(progress){
  if(!elBtnStart) return;
  const mode = progress && progress.mode ? progress.mode : 'FREI';
  const difficulty = progress && progress.difficulty ? progress.difficulty : 'LEICHT';
  const desc = formatDifficultyLabel(difficulty);
  if(mode === 'LERNWEG'){
    elBtnStart.textContent = `Spiel starten – Lernweg (${desc})`;
  } else {
    const count = progress && progress.freeLetterCount ? progress.freeLetterCount : 4;
    elBtnStart.textContent = `Spiel starten – ${count} Buchstaben (${desc})`;
  }
}

function extractSelectionFromProgress(progress){
  const difficulty = progress && progress.difficulty ? progress.difficulty : 'LEICHT';
  return {
    mode: progress && progress.mode ? progress.mode : 'FREI',
    freeLetterCount: progress && progress.freeLetterCount ? progress.freeLetterCount : 4,
    difficulty,
  };
}

function toggleIndividualPanel(forceOpen){
  if(!elIndividualPanel) return;
  const shouldOpen = typeof forceOpen === 'boolean'
    ? forceOpen
    : elIndividualPanel.classList.contains('hidden');

  if(shouldOpen){
    elIndividualPanel.classList.remove('hidden');
    pendingModeSelection = extractSelectionFromProgress(getProgress());
    pendingModeSelection.mode = 'FREI';
    const desiredCount = pendingModeSelection.freeLetterCount || 4;
    const diff = pendingModeSelection.difficulty || 'LEICHT';
    setActiveChip(elFreeCountGroup, chip => Number(chip.dataset.freeCount || 0) === desiredCount);
    setActiveChip(elDifficultyGroup, chip => (chip.dataset.difficulty || '') === diff);

    updateModeDialogCards(pendingModeSelection);
    if(elModeDialogStart){
      elModeDialogStart.disabled = false;
    }
  } else {
    elIndividualPanel.classList.add('hidden');
  }
}

let pendingModeSelection = null;

function updateModeDialogCards(selection){
  if(!selection) return;
  dialogModeCards.forEach(card => {
    const cardMode = card.dataset.mode || 'FREI';
    const cardCount = Number(card.dataset.count || NaN);
    let active = false;
    if(selection.mode === 'LERNWEG'){
      active = cardMode === 'LERNWEG';
    } else if(cardMode === 'FREI' && selection.mode === 'FREI'){
      if(!Number.isNaN(cardCount)){
        active = selection.freeLetterCount === cardCount;
      } else {
        active = true;
      }
    }
    card.classList.toggle('active', active);
  });
  if(elModeDialogStart){
    elModeDialogStart.disabled = !selection;
  }
}



function openModeDialog(){
  const currentProgress = getProgress();
  pendingModeSelection = extractSelectionFromProgress(currentProgress);

  toggleIndividualPanel(false);
  updateModeDialogCards(pendingModeSelection);
  elModeDialog.classList.remove('hidden');
}

function closeModeDialog(){
  elModeDialog.classList.add('hidden');
  toggleIndividualPanel(false);
  pendingModeSelection = null;
}

function saveAndApply(partial){
  const current = getProgress();
  const updates = { ...partial };
  if(updates.difficulty){
    updates.difficulty = updates.difficulty.toUpperCase();
  }
  const saved = saveProgress(updates);
  applyModeToUI(saved);
  updateUIForRecordingState();
  if(pendingModeSelection){
    pendingModeSelection = extractSelectionFromProgress(saved);
  }
  return saved;
}

function formatDifficultyLabel(difficulty){
  switch(difficulty){
    case 'MITTEL': return 'Mittel';
    case 'SCHWER': return 'Schwer';
    case 'AFFIG': return 'Affig';
    default: return 'Leicht';
  }
}

function formatClipTimestamp(created){
  const date = new Date(created || Date.now());
  return date.toLocaleDateString(undefined, {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}

function renderStatusGrid(hasSet=new Set(), byDifficulty=new Map()){
  elStatusGrid.innerHTML='';
  LETTERS.forEach(ch=>{
    const t=document.createElement('div');
    const hasLetter = hasSet.has(ch);
    const isActive = currentLetter === ch;
    const classes = ['status-tile'];
    if(hasLetter) classes.push('has');
    if(isActive) classes.push('active');
    t.className = classes.join(' ');
    const diffCounts = byDifficulty.get(ch);
    let badges = '';
    if(diffCounts){
      badges = '<div class="status-diffs">' + AUDIO_DIFFICULTIES.map(diff => {
        const count = diffCounts[diff] || 0;
        return `<span class="status-pill${count ? ' filled' : ''}" data-diff="${diff}">${count || ''}</span>`;
      }).join('') + '</div>';
    }
    t.innerHTML=`${ch}<i class="status-dot"></i>${badges}`;
    const summary = diffCounts ? AUDIO_DIFFICULTIES
      .filter(diff => (diffCounts[diff] || 0) > 0)
      .map(diff => `${formatDifficultyLabel(diff)} (${diffCounts[diff]})`) : [];
    if(isActive){
      t.setAttribute('aria-current', 'true');
    }
    const title = hasLetter ? (summary.length ? 'Aufnahmen: ' + summary.join(', ') : 'Aufnahme vorhanden') : 'Keine Aufnahme';
    t.title = title;
    t.addEventListener('click', ()=> selectLetter(ch));
    elStatusGrid.appendChild(t);
  });
}

function highlightClipSelection(){
  if(!elClipList) return;
  Array.from(elClipList.querySelectorAll('.clip-item')).forEach(item => {
    item.classList.toggle('active', item.dataset.clipId === currentClipId);
  });
}

function setCurrentClip(clipId){
  currentClipId = clipId;
  highlightClipSelection();
  const clip = currentLetterClips.find(c => c.id === clipId) || null;
  if(clip){
    elRecStatus.textContent = `${formatDifficultyLabel(clip.difficulty)} · ${formatClipTimestamp(clip.created)}`;
  } else {
    const count = currentLetterClips.length;
    elRecStatus.textContent = count ? `${count} Aufnahme${count === 1 ? '' : 'n'} gespeichert` : 'Keine Aufnahme';
  }
  elBtnPlay.disabled = !clip;
  elBtnDelete.disabled = !clip;
}

function renderClipList(clips){
  currentLetterClips = clips.slice();
  const difficultyOrder = new Map(AUDIO_DIFFICULTIES.map((diff, index) => [diff, index]));
  currentLetterClips.sort((a,b) => {
    const diffCompare = (difficultyOrder.get(a.difficulty) || 0) - (difficultyOrder.get(b.difficulty) || 0);
    if(diffCompare !== 0) return diffCompare;
    return (b.created || 0) - (a.created || 0);
  });

  if(elClipList){
    elClipList.innerHTML = '';
    if(!currentLetterClips.length){
      const empty = document.createElement('div');
      empty.className = 'muted';
      empty.textContent = 'Noch keine Aufnahmen für diesen Buchstaben.';
      elClipList.appendChild(empty);
    } else {
      currentLetterClips.forEach(clip => {
        const item = document.createElement('div');
        item.className = 'clip-item';
        item.dataset.clipId = clip.id;
        item.dataset.clipDifficulty = clip.difficulty;
        item.innerHTML = `
          <div class="clip-info">
            <span class="clip-badge">${formatDifficultyLabel(clip.difficulty)}</span>
            <span class="clip-meta">${formatClipTimestamp(clip.created)}</span>
          </div>
          <div class="clip-actions">
            <button type="button" class="btn ghost" data-action="play">▶️</button>
            <button type="button" class="btn ghost" data-action="edit">✏️</button>
            <button type="button" class="btn ghost" data-action="delete">🗑️</button>
          </div>`;
        elClipList.appendChild(item);
      });
    }
  }

  const preferred = currentLetterClips.find(clip => clip.difficulty === currentDifficulty) || currentLetterClips[0] || null;
  setCurrentClip(preferred ? preferred.id : null);
  highlightClipSelection();
}

function renderMotivationList(clips){
  motivationClipsCache = clips.slice().sort((a, b) => (b.created || 0) - (a.created || 0));
  if(elMotivationStatus){
    const count = motivationClipsCache.length;
    elMotivationStatus.textContent = count ? `${count} Clip${count === 1 ? '' : 's'}` : 'Keine Clips';
  }
  if(!elMotivationList) return;
  elMotivationList.innerHTML = '';
  if(!motivationClipsCache.length){
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Noch keine Motivationssounds.';
    elMotivationList.appendChild(empty);
    return;
  }
  motivationClipsCache.forEach(clip => {
    const item = document.createElement('div');
    item.className = 'clip-item';
    item.dataset.clipId = clip.id;
    item.innerHTML = `
      <div class="clip-info">
        <span class="clip-meta">${formatClipTimestamp(clip.created)}</span>
      </div>
      <div class="clip-actions">
        <button type="button" class="btn ghost" data-action="play">▶️</button>
        <button type="button" class="btn ghost" data-action="delete">🗑️</button>
      </div>`;
    elMotivationList.appendChild(item);
  });
}

function renderMedalList(type, clips){
  const controls = medalControls[type];
  if(!controls || !controls.listEl) return;
  const listEl = controls.listEl;
  listEl.innerHTML = '';
  if(!clips || !clips.length){
    const empty = document.createElement('div');
    empty.className = 'muted';
    empty.textContent = 'Noch keine Sounds.';
    listEl.appendChild(empty);
    return;
  }
  clips.forEach(clip => {
    const item = document.createElement('div');
    item.className = 'clip-item';
    item.dataset.clipId = clip.id;
    item.dataset.medalType = type;
    item.innerHTML = `
      <div class="clip-info">
        <span class="clip-meta">${formatClipTimestamp(clip.created)}</span>
      </div>
      <div class="clip-actions">
        <button type="button" class="btn ghost" data-action="play">▶️</button>
        <button type="button" class="btn ghost" data-action="delete">🗑️</button>
      </div>`;
    listEl.appendChild(item);
  });
}

function updateMedalUI(medalSounds = {}){
  const map = makeEmptyMedalMap();
  if(medalSounds && typeof medalSounds === 'object'){
    for(const type of MEDAL_TYPES){
      const list = medalSounds[type];
      map[type] = Array.isArray(list)
        ? list.slice().sort((a, b) => (b.created || 0) - (a.created || 0))
        : [];
    }
  }
  medalSoundsCache = map;
  for(const type of MEDAL_TYPES){
    const controls = medalControls[type];
    if(!controls) continue;
    const list = medalSoundsCache[type] || [];
    if(controls.statusEl){
      controls.statusEl.textContent = list.length
        ? `${list.length} Clip${list.length === 1 ? '' : 's'}`
        : 'Standard-Sound aktiv';
    }
    renderMedalList(type, list);
  }
}

function setRecordDifficulty(difficulty, options = {}){
  currentDifficulty = difficulty;
  if(elRecordDifficultyGroup){
    Array.from(elRecordDifficultyGroup.querySelectorAll('[data-record-difficulty]')).forEach(btn => {
      btn.classList.toggle('active', btn.dataset.recordDifficulty === difficulty);
    });
  }

  if(options.preserveSelection){
    if(options.clipId && currentLetterClips.some(clip => clip.id === options.clipId)){
      setCurrentClip(options.clipId);
    } else {
      highlightClipSelection();
    }
    return;
  }

  if(options.clipId && currentLetterClips.some(clip => clip.id === options.clipId)){
    setCurrentClip(options.clipId);
    return;
  }

  const matching = currentLetterClips.find(clip => clip.difficulty === difficulty);
  if(matching){
    setCurrentClip(matching.id);
  } else if(currentClipId && currentLetterClips.some(c => c.id === currentClipId)){
    highlightClipSelection();
  } else {
    setCurrentClip(currentLetterClips[0] ? currentLetterClips[0].id : null);
  }
}

function aggregateClipsByLetter(clips){
  const map = new Map();
  clips.forEach(clip => {
    const letter = clip.letter;
    if(!map.has(letter)){
      map.set(letter, {});
    }
    const entry = map.get(letter);
    entry[clip.difficulty] = (entry[clip.difficulty] || 0) + 1;
  });
  return map;
}

async function refreshCurrentLetterClips(){
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const clips = (setData && setData.clips ? setData.clips : []).filter(clip => clip.letter === currentLetter);
  renderClipList(clips);
  setRecordDifficulty(currentDifficulty, { preserveSelection: true, clipId: currentClipId });
  return { setId, setData };
}

async function persistClip(setId, letter, difficulty, blob) {
  const clipId = generateUUID();
  const clipKey = `audio-${setId}-${clipId}`;
  await idbSet(clipKey, blob);

  const setKey = `set-${setId}`;
  const setData = await loadSetData(setId) || {
    name: 'Meine Aufnahmen',
    emoji: '🎤',
    created: Date.now(),
    clips: [],
    motivationClips: [],
    medalSounds: makeEmptyMedalMap(),
  };

  setData.clips.push({
    id: clipId,
    letter,
    difficulty,
    created: Date.now(),
  });

  await idbSet(setKey, setData);
}

async function importLetterAudioFile(file){
  if(!file){
    return;
  }
  const letter = normaliseLetterInput(currentLetter);
  if(!letter){
    alert('Bitte wähle zuerst einen Buchstaben aus.');
    return;
  }
  if(!isAudioFileLike(file)){
    alert('Bitte wähle eine gültige Audiodatei (mp3, wav, ogg …).');
    return;
  }
  const difficulty = normaliseDifficultyInput(currentDifficulty);
  const setId = await getActiveSet();
  let setData = await loadSetData(setId);
  if(!setData){
    setData = {
      name: 'Meine Aufnahmen',
      emoji: '🎤',
      created: Date.now(),
      clips: [],
      motivationClips: [],
      medalSounds: makeEmptyMedalMap(),
    };
  }
  if(!Array.isArray(setData.clips)){
    setData.clips = [];
  }

  const clipId = generateUUID();
  setData.clips.push({
    id: clipId,
    letter,
    difficulty,
    created: Date.now(),
  });

  await idbSet(`audio-${setId}-${clipId}`, file);
  await idbSet(`set-${setId}`, setData);
  currentClipId = clipId;

  await refreshCurrentLetterClips();
  await updateStatusGridFromDB();
  await updateUIForRecordingState();
  await renderSetsList();
  alert(`✅ Neue Aufnahme für ${letter} (${difficulty}) hinzugefügt. Alte Versionen bleiben erhalten, du kannst sie bei Bedarf löschen.`);
}

async function persistMotivationClip(setId, blob){
  const clipId = generateUUID();
  const clipKey = `motivation-${setId}-${clipId}`;
  await idbSet(clipKey, blob);

  const setData = await loadSetData(setId) || {
    name: 'Meine Aufnahmen',
    emoji: '🎤',
    created: Date.now(),
    clips: [],
    motivationClips: [],
    medalSounds: makeEmptyMedalMap(),
  };

  if(!Array.isArray(setData.motivationClips)){
    setData.motivationClips = [];
  }
  setData.motivationClips.push({ id: clipId, created: Date.now() });
  await idbSet('set-' + setId, setData);
  return clipId;
}

async function importMotivationFiles(files){
  const valid = files.filter(isValidAudioFile);
  if(!valid.length){
    alert('Keine gültigen Audiodateien ausgewählt.');
    return;
  }
  const setId = await getActiveSet();
  let imported = 0;
  for(const file of valid){
    await persistMotivationClip(setId, file);
    imported++;
  }
  await refreshSupportAudioUI();
  alert(`✅ ${imported} Motivationssound${imported === 1 ? '' : 's'} importiert!`);
}

async function removeMotivationClip(setId, clipId){
  const setData = await loadSetData(setId);
  if(!setData || !Array.isArray(setData.motivationClips)) return;
  setData.motivationClips = setData.motivationClips.filter(entry => entry.id !== clipId);
  await idbSet('set-' + setId, setData);
  await idbDel(`motivation-${setId}-${clipId}`);
}

async function getMotivationClipBlob(setId, clipId){
  return idbGet(`motivation-${setId}-${clipId}`);
}

async function saveMedalSound(setId, type, blob){
  if(!MEDAL_TYPES.includes(type)) return null;
  const clipId = generateUUID();
  await idbSet(`medal-${setId}-${clipId}`, blob);

  const setData = await loadSetData(setId) || {
    name: 'Meine Aufnahmen',
    emoji: '🎤',
    created: Date.now(),
    clips: [],
    motivationClips: [],
    medalSounds: makeEmptyMedalMap(),
  };

  if(!setData.medalSounds || typeof setData.medalSounds !== 'object'){
    setData.medalSounds = makeEmptyMedalMap();
  }
  if(!Array.isArray(setData.medalSounds[type])){
    setData.medalSounds[type] = [];
  }
  setData.medalSounds[type].push({ id: clipId, created: Date.now() });
  await idbSet('set-' + setId, setData);
  return clipId;
}

async function importMedalFiles(type, files){
  if(!MEDAL_TYPES.includes(type)) return;
  const valid = files.filter(isValidAudioFile);
  if(!valid.length){
    alert('Keine gültigen Audiodateien ausgewählt.');
    return;
  }
  const setId = await getActiveSet();
  let imported = 0;
  for(const file of valid){
    await saveMedalSound(setId, type, file);
    imported++;
  }
  await refreshSupportAudioUI();
  const label = MEDAL_LABELS[type] || type;
  alert(`✅ ${imported} ${label}-Sound${imported === 1 ? '' : 's'} importiert!`);
}

async function deleteMedalSound(setId, type, clipId){
  if(!MEDAL_TYPES.includes(type)) return;
  const setData = await loadSetData(setId);
  if(!setData || !setData.medalSounds || !Array.isArray(setData.medalSounds[type])) return;
  setData.medalSounds[type] = setData.medalSounds[type].filter(entry => entry.id !== clipId);
  await idbSet('set-' + setId, setData);
  await idbDel(`medal-${setId}-${clipId}`);
}

async function getMedalClipBlob(setId, clipId){
  return idbGet(`medal-${setId}-${clipId}`);
}

function pickClip(clips, difficulty, options = {}) {
  if (!clips || clips.length === 0) {
    return null;
  }

  const { historyKey } = options;
  const difficulties = ['AFFIG', 'SCHWER', 'MITTEL', 'LEICHT'];
  const requestedDifficultyIndex = difficulties.indexOf(difficulty);

  const chooseFromPool = (pool) => {
    if(!pool.length) return null;
    if(historyKey && pool.length > 0){
      const availableIds = pool.map(c => c.id);
      const availableSet = new Set(availableIds);
      let queue = clipHistoryQueues.get(historyKey) || [];
      queue = queue.filter(id => availableSet.has(id));
      if(queue.length === 0){
        queue = shuffleArray(availableIds);
      }
      const nextId = queue.shift();
      clipHistoryQueues.set(historyKey, queue);
      const chosen = pool.find(c => c.id === nextId);
      if(chosen){
        return chosen;
      }
    }
    return pool[Math.floor(Math.random() * pool.length)];
  };

  // Fallback-Suche von der angeforderten Stufe abwärts
  if (requestedDifficultyIndex !== -1) {
    for (let i = requestedDifficultyIndex; i < difficulties.length; i++) {
      const currentDifficulty = difficulties[i];
      const matchingClips = clips.filter(c => c.difficulty === currentDifficulty);
      if (matchingClips.length > 0) {
        return chooseFromPool(matchingClips);
      }
    }
  }

  // Wenn nichts gefunden wurde, versuche irgendeinen Clip für diesen Buchstaben
  if (clips.length > 0) {
    return chooseFromPool(clips);
  }

  return null;
}

function pickFromHistoryPool(pool, historyKey){
  if(!pool || pool.length === 0){
    return null;
  }
  if(!historyKey){
    return pool[Math.floor(Math.random() * pool.length)];
  }
  const availableIds = pool.map(item => item.id);
  const availableSet = new Set(availableIds);
  let queue = clipHistoryQueues.get(historyKey) || [];
  queue = queue.filter(id => availableSet.has(id));
  if(queue.length === 0){
    queue = shuffleArray(availableIds);
  }
  const nextId = queue.shift();
  clipHistoryQueues.set(historyKey, queue);
  return pool.find(item => item.id === nextId) || pool[0];
}

async function getAudio(letter, difficulty = 'LEICHT') {
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  if (!setData || !setData.clips) return null;

  const letterClips = setData.clips.filter(c => c.letter === letter);
  const clip = pickClip(letterClips, difficulty);

  if (clip) {
    const clipKey = `audio-${setId}-${clip.id}`;
    const blob = await idbGet(clipKey);
    return { clip, blob };
  }

  return null;
}

async function removeClip(setId, clipId){
  const setData = await loadSetData(setId);
  if(!setData) return null;
  const idx = setData.clips.findIndex(clip => clip.id === clipId);
  if(idx === -1) return null;
  const [clip] = setData.clips.splice(idx, 1);
  await idbSet('set-' + setId, setData);
  await idbDel('audio-' + setId + '-' + clipId);
  return clip;
}

async function getClipBlob(setId, clipId){
  return idbGet('audio-' + setId + '-' + clipId);
}

function difficultySearchOrder(difficulty){
  const normalised = normaliseDifficultyInput(difficulty);
  const idx = AUDIO_DIFFICULTIES.indexOf(normalised);
  const order = [];
  if(idx >= 0){
    for(let i = idx; i >= 0; i--){
      const diff = AUDIO_DIFFICULTIES[i];
      if(!order.includes(diff)) order.push(diff);
    }
  }
  if(!order.includes('LEICHT')){
    order.push('LEICHT');
  }
  return order;
}



async function fetchClipForLetter({ setId, letter, difficulty, setData, historyKey }){
  const clips = setData.clips.filter(c => c.letter === letter);
  const clip = pickClip(clips, difficulty, { historyKey });
  if(!clip) return null;
  const blob = await getClipBlob(setId, clip.id);
  if(!blob) return null;
  return { clip, blob };
}

async function fetchMotivationClip({ setId, setData, historyKey }){
  const clips = setData && Array.isArray(setData.motivationClips) ? setData.motivationClips : [];
  if(!clips.length){
    return null;
  }
  const clip = pickFromHistoryPool(clips, historyKey);
  if(!clip) return null;
  const blob = await getMotivationClipBlob(setId, clip.id);
  if(!blob) return null;
  return { clip, blob };
}

async function playClipById(clipId){
  const setId = await getActiveSet();
  const blob = await getClipBlob(setId, clipId);
  if(!blob){
    alert('Keine Aufnahme gefunden.');
    return;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  audio.addEventListener('error', () => URL.revokeObjectURL(url));
  lastPlayed = audio;
  await audio.play().catch(()=>{});
}

function hasPendingMotivation(letter){
  if(!game || !letter) return false;
  if(!game.pendingMotivations){
    game.pendingMotivations = new Set();
  }
  return game.pendingMotivations.has(letter);
}

function clearMotivationChain(){
  if(motivationChainSource && motivationChainHandler){
    try {
      motivationChainSource.removeEventListener('ended', motivationChainHandler);
    }catch(_){ /* ignore */ }
  }
  motivationChainSource = null;
  motivationChainHandler = null;
}

function queueMotivationPlayback(primaryAudio, clipData){
  if(!primaryAudio || !clipData || !clipData.blob){
    return;
  }
  clearMotivationChain();
  motivationChainSource = primaryAudio;
  motivationChainHandler = () => {
    if(motivationChainSource && motivationChainHandler){
      motivationChainSource.removeEventListener('ended', motivationChainHandler);
    }
    motivationChainSource = null;
    motivationChainHandler = null;
    const url = URL.createObjectURL(clipData.blob);
    const followUp = new Audio(url);
    followUp.addEventListener('ended', () => URL.revokeObjectURL(url));
    followUp.addEventListener('error', () => URL.revokeObjectURL(url));
    lastPlayed = followUp;
    followUp.play().catch(() => {
      URL.revokeObjectURL(url);
    });
  };
  primaryAudio.addEventListener('ended', motivationChainHandler);
}

async function playMedalCelebration(medalType){
  if(!medalType) return false;
  const setId = game && game.setId ? game.setId : await getActiveSet();
  const setData = await loadSetData(setId);
  const list = setData && setData.medalSounds && Array.isArray(setData.medalSounds[medalType])
    ? setData.medalSounds[medalType]
    : [];
  if(!list.length){
    return false;
  }
  const historyKey = makeClipHistoryKey('medal', setId, medalType.toUpperCase(), 'CUSTOM');
  const clip = pickFromHistoryPool(list, historyKey);
  if(!clip){
    return false;
  }
  const blob = await getMedalClipBlob(setId, clip.id);
  if(!blob){
    return false;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  return new Promise((resolve) => {
    const cleanup = (result) => {
      URL.revokeObjectURL(url);
      resolve(result);
    };
    audio.addEventListener('ended', () => cleanup(true), { once: true });
    audio.addEventListener('error', () => cleanup(false), { once: true });
    audio.play().catch(() => cleanup(false));
  });
}

async function playMotivationClip(clipId){
  const setId = await getActiveSet();
  const blob = await getMotivationClipBlob(setId, clipId);
  if(!blob){
    alert('Keine Aufnahme gefunden.');
    return;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  audio.addEventListener('error', () => URL.revokeObjectURL(url));
  lastPlayed = audio;
  await audio.play().catch(()=>{});
}

async function deleteClipById(clipId){
  const setId = await getActiveSet();
  const removed = await removeClip(setId, clipId);
  if(!removed){
    alert('Aufnahme nicht gefunden.');
    return;
  }
  if(currentClipId === clipId){
    currentClipId = null;
  }
  await refreshCurrentLetterClips();
  await updateStatusGridFromDB();
  await updateUIForRecordingState();
  await renderSetsList();
}

async function deleteMotivationClip(clipId){
  const setId = await getActiveSet();
  await removeMotivationClip(setId, clipId);
  await refreshSupportAudioUI();
}

async function playMedalClip(type, clipId){
  if(!MEDAL_TYPES.includes(type)) return;
  const setId = await getActiveSet();
  const blob = await getMedalClipBlob(setId, clipId);
  if(!blob){
    alert('Keine Aufnahme gefunden.');
    return;
  }
  const url = URL.createObjectURL(blob);
  const audio = new Audio(url);
  audio.addEventListener('ended', () => URL.revokeObjectURL(url));
  audio.addEventListener('error', () => URL.revokeObjectURL(url));
  await audio.play().catch(()=>{});
}

async function deleteMedalClip(type, clipId){
  if(!MEDAL_TYPES.includes(type)) return;
  const setId = await getActiveSet();
  await deleteMedalSound(setId, type, clipId);
  await refreshSupportAudioUI();
}

async function editClipDifficulty(clipId){
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  if(!setData || !Array.isArray(setData.clips)){
    alert('Set-Daten konnten nicht geladen werden.');
    return;
  }

  const clip = setData.clips.find(c => c.id === clipId);
  if(!clip){
    alert('Aufnahme nicht gefunden.');
    return;
  }

  const item = elClipList?.querySelector(`[data-clip-id="${clipId}"]`);
  if(!item){
    alert('Clip-Element nicht gefunden.');
    return;
  }
  if(item.classList.contains('editing')){
    return;
  }
  item.classList.add('editing');

  const controls = document.createElement('div');
  controls.className = 'clip-edit-controls';

  const select = document.createElement('select');
  select.className = 'clip-edit-select';
  AUDIO_DIFFICULTIES.forEach(diff => {
    const opt = document.createElement('option');
    opt.value = diff;
    opt.textContent = formatDifficultyLabel(diff);
    select.appendChild(opt);
  });
  select.value = clip.difficulty || 'LEICHT';

  const saveBtn = document.createElement('button');
  saveBtn.type = 'button';
  saveBtn.className = 'btn';
  saveBtn.textContent = 'Speichern';

  const cancelBtn = document.createElement('button');
  cancelBtn.type = 'button';
  cancelBtn.className = 'btn ghost';
  cancelBtn.textContent = 'Abbrechen';

  controls.appendChild(select);
  controls.appendChild(saveBtn);
  controls.appendChild(cancelBtn);

  const info = item.querySelector('.clip-info');
  if(!info){
    item.classList.remove('editing');
    return;
  }
  info.appendChild(controls);
  select.focus();

  let cleaned = false;
  const cleanup = () => {
    if(cleaned) return;
    cleaned = true;
    item.classList.remove('editing');
    if(controls.isConnected){
      try {
        controls.remove();
      } catch(err) {
        if(!(err && err.name === 'NotFoundError')){
          throw err;
        }
      }
    }
  };

  cancelBtn.addEventListener('click', cleanup);

  controls.addEventListener('focusout', (event) => {
    const next = event.relatedTarget;
    if(!controls.contains(next)){
      cleanup();
    }
  });

  select.addEventListener('keydown', (event) => {
    if(event.key === 'Escape'){
      event.stopPropagation();
      cleanup();
    } else if(event.key === 'Enter'){
      event.preventDefault();
      saveBtn.click();
    }
  });

  saveBtn.addEventListener('click', async () => {
    const candidate = select.value;
    if(candidate === clip.difficulty){
      cleanup();
      return;
    }
    clip.difficulty = candidate;
    await idbSet('set-' + setId, setData);
    cleanup();
    await refreshCurrentLetterClips();
    await updateStatusGridFromDB();
    await updateUIForRecordingState();
    await renderSetsList();
  });
}

async function selectNextLetter(fromLetter){
  const letter = fromLetter || currentLetter;
  const idx = LETTERS.indexOf(letter);
  if(idx === -1){
    await selectLetter(currentLetter || 'A');
    return;
  }
  const nextLetter = LETTERS[(idx + 1) % LETTERS.length];
  await selectLetter(nextLetter);
}

// ——————————————————————————————————————————
// Recorder
// ——————————————————————————————————————————
let mediaStream=null, recorder=null, recChunks=[];
let currentLetter='A', timerInt=null, timerStart=0, lastPlayed=null;
let currentDifficulty='LEICHT';
let currentClipId=null;
let currentLetterClips=[];
let motivationClipsCache = [];
let medalSoundsCache = makeEmptyMedalMap();
let motivationChainSource = null;
let motivationChainHandler = null;
let activeRecordMode = null;
let autoAdvancePlanned = false;
let recordingSession = null;

function resetPrimaryRecorderButton(){
  if(elBtnRecord){
    elBtnRecord.disabled = false;
    elBtnRecord.textContent = '🎙️ Aufnehmen';
    elBtnRecord.classList.remove('danger');
    elBtnRecord.removeAttribute('data-mode');
  }
  if(elSeriesToggle){
    elSeriesToggle.disabled = false;
  }
}

function markRecordingButton(mode){
  if(!elBtnRecord) return;
  const isSeries = mode === RECORD_MODES.SERIES;
  elBtnRecord.textContent = isSeries ? '⏹️ Serie stoppen' : '⏹️ Stoppen';
  elBtnRecord.classList.add('danger');
  elBtnRecord.disabled = false;
  elBtnRecord.dataset.mode = isSeries ? 'series' : 'single';
  if(elSeriesToggle){
    elSeriesToggle.disabled = true;
  }
}

function resetPrimaryRecorderUI(){
  resetPrimaryRecorderButton();
  if(timerInt){
    clearInterval(timerInt);
    timerInt = null;
  }
  if(elTimer){
    elTimer.classList.remove('blink');
    elTimer.textContent = '00:00';
  }
  setCurrentClip(currentClipId);
}

function stopActiveRecording({ skipAutoAdvance = false } = {}){
  if(skipAutoAdvance){
    autoAdvancePlanned = false;
  }
  if(recorder && recorder.state === 'recording'){
    resetPrimaryRecorderUI();
    try{
      recorder.stop();
    }catch(err){
      console.warn('Recorder konnte nicht gestoppt werden', err);
    }
  }
}

async function startPrimaryRecording(mode){
  if(!mode){
    return;
  }
  try{
    await ensureRecordingStream();
    if(typeof MediaRecorder === 'undefined'){
      alert('MediaRecorder wird in diesem Browser nicht unterstützt.');
      return;
    }
  }catch(err){
    alert('Mikrofonzugriff fehlgeschlagen. Bitte Browserberechtigungen prüfen.');
    return;
  }

  const mimeType = selectRecordingMimeType();
  recorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
  recChunks = [];
  recordingSession = {
    letter: currentLetter,
    difficulty: currentDifficulty,
  };
  activeRecordMode = mode;
  autoAdvancePlanned = mode === RECORD_MODES.SERIES;

  recorder.ondataavailable = (event) => {
    if(event.data){
      recChunks.push(event.data);
    }
  };

  recorder.onstop = async () => {
    const blob = new Blob(recChunks, { type: recorder?.mimeType || 'audio/webm' });
    recChunks = [];
    recorder = null;
    const session = recordingSession;
    recordingSession = null;
    const recordedLetter = session && session.letter ? session.letter : currentLetter;
    const recordedDifficulty = session && session.difficulty ? session.difficulty : currentDifficulty;
    const shouldAdvance = autoAdvancePlanned && activeRecordMode === RECORD_MODES.SERIES;
    autoAdvancePlanned = false;
    activeRecordMode = null;
    resetPrimaryRecorderUI();

    try{
      const setId = await getActiveSet();
      await persistClip(setId, recordedLetter, recordedDifficulty, blob);
      if(currentLetter === recordedLetter){
        await refreshCurrentLetterClips();
      }
      await updateStatusGridFromDB();
      await updateUIForRecordingState();
      await renderSetsList();
      if(shouldAdvance){
        requestAnimationFrame(() => {
          selectNextLetter(recordedLetter).catch(err => console.error('Auto-advance failed', err));
        });
      }
    }catch(err){
      console.error('Aufnahme konnte nicht gespeichert werden:', err);
      alert('Die Aufnahme konnte nicht gespeichert werden.');
    }
  };

  markRecordingButton(mode);
  elBtnPlay.disabled = true;
  elBtnDelete.disabled = true;
  timerStart = performance.now();
  elTimer.classList.add('blink');
  timerInt = setInterval(() => {
    elTimer.textContent = fmt(performance.now() - timerStart);
  }, 200);
  recorder.start();
}

async function handlePrimaryRecordClick(){
  if(recorder && recorder.state === 'recording'){
    stopActiveRecording();
    return;
  }
  const mode = elSeriesToggle && elSeriesToggle.checked ? RECORD_MODES.SERIES : RECORD_MODES.SINGLE;
  await startPrimaryRecording(mode);
}

if(elRecordDifficultyGroup){
  elRecordDifficultyGroup.addEventListener('click', (event) => {
    const btn = event.target.closest('[data-record-difficulty]');
    if(!btn) return;
    event.preventDefault();
    const diff = btn.dataset.recordDifficulty || 'LEICHT';
    setRecordDifficulty(diff);
  });
}

if(elBtnRecord){
  elBtnRecord.addEventListener('click', () => {
    handlePrimaryRecordClick().catch(err => {
      console.error('Aufnahme fehlgeschlagen', err);
    });
  });
}

if(elLetterImport && elLetterImportFile){
  elLetterImport.addEventListener('click', () => {
    if(!normaliseLetterInput(currentLetter)){
      alert('Bitte wähle zuerst einen Buchstaben aus.');
      return;
    }
    elLetterImportFile.value = '';
    elLetterImportFile.click();
  });

  elLetterImportFile.addEventListener('change', async (event) => {
    const file = event.target.files && event.target.files[0];
    if(!file) return;
    try{
      await importLetterAudioFile(file);
    }catch(err){
      console.error('Buchstaben-Import fehlgeschlagen', err);
      alert('❌ Die Datei konnte nicht importiert werden.');
    }finally{
      event.target.value = '';
    }
  });
}

if(elClipList){
  elClipList.addEventListener('click', async (event) => {
    const item = event.target.closest('.clip-item');
    if(!item) return;
    const clipId = item.dataset.clipId;
    if(!clipId) return;
    const actionBtn = event.target.closest('[data-action]');
    if(actionBtn){
      const action = actionBtn.dataset.action;
      if(action === 'play'){
        await playClipById(clipId);
      } else if(action === 'edit'){
        await editClipDifficulty(clipId);
      } else if(action === 'delete'){
        if(confirm('Aufnahme wirklich löschen?')){
          await deleteClipById(clipId);
        }
      }
      return;
    }
    setCurrentClip(clipId);
    const diff = item.dataset.clipDifficulty;
    if(diff){
      setRecordDifficulty(diff, { preserveSelection: true, clipId });
    }
  });
}

if(elMotivationList){
  elMotivationList.addEventListener('click', async (event) => {
    const item = event.target.closest('.clip-item');
    if(!item) return;
    const clipId = item.dataset.clipId;
    if(!clipId) return;
    const actionBtn = event.target.closest('[data-action]');
    if(!actionBtn) return;
    if(actionBtn.dataset.action === 'play'){
      await playMotivationClip(clipId);
    } else if(actionBtn.dataset.action === 'delete'){
      if(confirm('Motivationssound wirklich löschen?')){
        await deleteMotivationClip(clipId);
      }
    }
  });
}

for(const type of MEDAL_TYPES){
  const controls = medalControls[type];
  if(controls && controls.listEl){
    controls.listEl.addEventListener('click', async (event) => {
      const item = event.target.closest('.clip-item');
      if(!item) return;
      const clipId = item.dataset.clipId;
      if(!clipId) return;
      const actionBtn = event.target.closest('[data-action]');
      if(!actionBtn) return;
      if(actionBtn.dataset.action === 'play'){
        await playMedalClip(type, clipId);
      } else if(actionBtn.dataset.action === 'delete'){
        if(confirm('Sound wirklich löschen?')){
          await deleteMedalClip(type, clipId);
        }
      }
    });
  }
}

setRecordDifficulty(currentDifficulty);
selectLetter('A');
updateStatusGridFromDB();
initStarTrack();
refreshStoredStars();
updateMissionStatus();

async function selectLetter(ch){
  // Laufende Aufnahme stoppen, falls eine aktiv ist
  if(recorder && recorder.state === 'recording') {
    stopActiveRecording({ skipAutoAdvance: true });
  }

  currentLetter = ch;
  elRecLetter.textContent = ch;
  elRecTitle.textContent = ch;
  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const clips = (setData && setData.clips ? setData.clips : []).filter(clip => clip.letter === ch);
  renderClipList(clips);
  setRecordDifficulty(currentDifficulty, { preserveSelection: true, clipId: currentClipId });
  updateStatusGridFromDB();
}

async function updateStatusGridFromDB(){
  const setId = await getActiveSet();
  const data = await loadSetData(setId);
  const clips = data && data.clips ? data.clips : [];
  const hasSet = new Set(clips.map(clip => clip.letter));
  const byDifficulty = aggregateClipsByLetter(clips);
  renderStatusGrid(hasSet, byDifficulty);
}

function fmt(t){
  const s=Math.floor(t/1000);
  const mm=String(Math.floor(s/60)).padStart(2,'0');
  const ss=String(s%60).padStart(2,'0');
  return `${mm}:${ss}`;
}

const RECORDER_MIME_CANDIDATES = ['audio/webm;codecs=opus','audio/ogg;codecs=opus','audio/mp4'];

function selectRecordingMimeType(){
  if(typeof MediaRecorder === 'undefined' || !MediaRecorder.isTypeSupported){
    return '';
  }
  for(const type of RECORDER_MIME_CANDIDATES){
    if(MediaRecorder.isTypeSupported(type)){
      return type;
    }
  }
  return '';
}

function isValidAudioFile(file){
  if(!file) return false;
  if(file.type && file.type.startsWith('audio/')){
    return true;
  }
  const name = typeof file.name === 'string' ? file.name : '';
  return /\.(mp3|ogg|webm|wav|m4a|mp4)$/i.test(name);
}

async function ensureRecordingStream(){
  if(mediaStream){
    return mediaStream;
  }
  if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    throw new Error('Mikrofonzugriff nicht verfügbar.');
  }
  mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
  return mediaStream;
}

function createAuxRecorder({ button, timerEl, onSave }){
  if(!button) return null;
  let localRecorder = null;
  let localChunks = [];
  let localTimer = null;
  let localTimerStart = 0;

  const resetUI = () => {
    button.textContent = '🎙️ Aufnehmen';
    button.classList.remove('danger');
    if(localTimer){
      clearInterval(localTimer);
      localTimer = null;
    }
    if(timerEl){
      timerEl.classList.remove('blink');
      timerEl.textContent = '00:00';
    }
  };

  const stopRecording = () => {
    if(localRecorder && localRecorder.state === 'recording'){
      localRecorder.stop();
    }
  };

  const startRecording = async () => {
    try{
      await ensureRecordingStream();
      if(typeof MediaRecorder === 'undefined'){
        alert('MediaRecorder wird in diesem Browser nicht unterstützt.');
        return;
      }
      const mimeType = selectRecordingMimeType();
      localRecorder = new MediaRecorder(mediaStream, mimeType ? { mimeType } : undefined);
    }catch(err){
      alert('Mikrofonzugriff fehlgeschlagen. Bitte Browserberechtigungen prüfen.');
      return;
    }

    localChunks = [];
    localRecorder.ondataavailable = (event) => {
      if(event.data){
        localChunks.push(event.data);
      }
    };
    localRecorder.onstop = async () => {
      const blob = new Blob(localChunks, { type: localRecorder?.mimeType || 'audio/webm' });
      localRecorder = null;
      localChunks = [];
      resetUI();
      if(onSave){
        try {
          await onSave(blob);
        }catch(err){
          console.error('Aufnahme konnte nicht gespeichert werden:', err);
          alert('Die Aufnahme konnte nicht gespeichert werden.');
        }
      }
    };

    localRecorder.start();
    button.textContent = '⏹️ Stoppen';
    button.classList.add('danger');
    if(timerEl){
      localTimerStart = performance.now();
      timerEl.classList.add('blink');
      localTimer = setInterval(() => {
        timerEl.textContent = fmt(performance.now() - localTimerStart);
      }, 200);
    }
  };

  button.addEventListener('click', () => {
    if(localRecorder && localRecorder.state === 'recording'){
      stopRecording();
    } else {
      startRecording();
    }
  });

  return {
    stop: stopRecording,
    isRecording: () => localRecorder && localRecorder.state === 'recording',
  };
}

elBtnPlay.addEventListener('click', async ()=>{
  if(!currentClipId){
    alert('Bitte zuerst eine Aufnahme auswählen oder erstellen.');
    return;
  }
  await playClipById(currentClipId);
});

elBtnDelete.addEventListener('click', async ()=>{
  if(!currentClipId){
    alert('Bitte zuerst eine Aufnahme auswählen.');
    return;
  }
  if(confirm('Ausgewählte Aufnahme löschen?')){
    await deleteClipById(currentClipId);
  }
});

if(elBtnMotivationRecord){
  createAuxRecorder({
    button: elBtnMotivationRecord,
    timerEl: elMotivationTimer,
    onSave: async (blob) => {
      const setId = await getActiveSet();
      await persistMotivationClip(setId, blob);
      await refreshSupportAudioUI();
    },
  });
}

if(elBtnMotivationUpload && elMotivationFile){
  elBtnMotivationUpload.addEventListener('click', () => elMotivationFile.click());
  elMotivationFile.addEventListener('change', async (event) => {
    const files = Array.from(event.target.files || []);
    if(files.length){
      await importMotivationFiles(files);
    }
    event.target.value = '';
  });
}

for(const type of MEDAL_TYPES){
  const controls = medalControls[type];
  if(!controls || !controls.recordBtn) continue;
  createAuxRecorder({
    button: controls.recordBtn,
    timerEl: controls.timerEl,
    onSave: async (blob) => {
      const setId = await getActiveSet();
      await saveMedalSound(setId, type, blob);
      await refreshSupportAudioUI();
    },
  });

  if(controls.uploadBtn && controls.fileInput){
    controls.uploadBtn.addEventListener('click', () => controls.fileInput.click());
    controls.fileInput.addEventListener('change', async (event) => {
      const files = Array.from(event.target.files || []);
      if(files.length){
        await importMedalFiles(type, files);
      }
      event.target.value = '';
    });
  }
}

document.getElementById('clearAll').addEventListener('click', async ()=>{
  if(confirm('Wirklich ALLE Aufnahmen löschen?')){
    await idbClear();
    updateStatusGridFromDB();
    updateUIForRecordingState();
    if(currentLetter) selectLetter(currentLetter);
    await refreshSupportAudioUI();
  }
});

// ——————————————————————————————————————————
// Export/Import
// ——————————————————————————————————————————
document.getElementById('exportBtn').addEventListener('click', async ()=>{
  try{
    const sets = await getAllSets();

    if(sets.length === 0){
      alert('Keine Sets zum Exportieren vorhanden.');
      return;
    }

    const zip = new JSZip();

    // Set-Metadaten exportieren
    const setsMetadata = [];
    let totalAudio = 0;

    for(const set of sets){
      const setFolder = zip.folder(set.id);
      const clipEntries = [];
      const motivationEntries = [];
      const medalEntries = makeEmptyMedalMap();

      if(Array.isArray(set.clips)){
        for(const clip of set.clips){
          const blob = await getClipBlob(set.id, clip.id);
          if(!blob){
            console.warn('Clip ohne Audiodatei, wird übersprungen:', set.id, clip.id);
            continue;
          }
          const extension = blob.type.includes('webm') ? 'webm'
            : blob.type.includes('ogg') ? 'ogg'
            : blob.type.includes('mp3') ? 'mp3'
            : blob.type.includes('m4a') ? 'm4a'
            : blob.type.includes('wav') ? 'wav'
            : blob.type.includes('mp4') ? 'mp4'
            : 'audio';
          const fileName = `${clip.letter}-${clip.id}.${extension}`;
          if(setFolder){
            setFolder.file(fileName, blob);
          }
          clipEntries.push({
            id: clip.id,
            letter: clip.letter,
            difficulty: clip.difficulty,
            created: clip.created,
            file: fileName,
          });
          totalAudio++;
        }
      }

      if(Array.isArray(set.motivationClips)){
        for(const clip of set.motivationClips){
          const blob = await getMotivationClipBlob(set.id, clip.id);
          if(!blob){
            console.warn('Motivationsclip ohne Audiodatei, wird übersprungen:', set.id, clip.id);
            continue;
          }
          const extension = blob.type.includes('webm') ? 'webm'
            : blob.type.includes('ogg') ? 'ogg'
            : blob.type.includes('mp3') ? 'mp3'
            : blob.type.includes('m4a') ? 'm4a'
            : blob.type.includes('wav') ? 'wav'
            : blob.type.includes('mp4') ? 'mp4'
            : 'audio';
          const fileName = `motivation/${clip.id}.${extension}`;
          if(setFolder){
            setFolder.file(fileName, blob);
          }
          motivationEntries.push({
            id: clip.id,
            created: clip.created,
            file: fileName,
          });
          totalAudio++;
        }
      }

      if(set.medalSounds && typeof set.medalSounds === 'object'){
        for(const type of MEDAL_TYPES){
          const entries = Array.isArray(set.medalSounds[type]) ? set.medalSounds[type] : [];
          for(const meta of entries){
            if(!meta || !meta.id) continue;
            const blob = await idbGet(`medal-${set.id}-${meta.id}`);
            if(!blob){
              console.warn('Medaillen-Sound ohne Audiodatei, wird übersprungen:', set.id, type);
              continue;
            }
            const extension = blob.type.includes('webm') ? 'webm'
              : blob.type.includes('ogg') ? 'ogg'
              : blob.type.includes('mp3') ? 'mp3'
              : blob.type.includes('m4a') ? 'm4a'
              : blob.type.includes('wav') ? 'wav'
              : blob.type.includes('mp4') ? 'mp4'
              : 'audio';
            const fileName = `medals/${type}-${meta.id}.${extension}`;
            if(setFolder){
              setFolder.file(fileName, blob);
            }
            medalEntries[type].push({
              id: meta.id,
              created: meta.created,
              file: fileName,
            });
            totalAudio++;
          }
        }
      }

      setsMetadata.push({
        id: set.id,
        name: set.name,
        emoji: set.emoji,
        created: set.created,
        clips: clipEntries,
        motivationClips: motivationEntries,
        medals: medalEntries,
      });
    }

    // sets.json hinzufügen
    zip.file('sets.json', JSON.stringify(setsMetadata, null, 2));

    // ZIP generieren und herunterladen
    const content = await zip.generateAsync({type: 'blob'});
    const url = URL.createObjectURL(content);
    const a = document.createElement('a');
    a.href = url;
    a.download = `abc-abenteuer-sets-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`✅ ${sets.length} Set(s) mit insgesamt ${totalAudio} Aufnahmen exportiert!`);
  }catch(e){
    console.error('Export fehlgeschlagen:', e);
    alert('❌ Export fehlgeschlagen: ' + e.message);
  }
});

async function importSetsZipBlob(blob, { showAlerts = true } = {}){
  const zip = new JSZip();
  const contents = await zip.loadAsync(blob);

  let importedSets = 0;
  let importedAudio = 0;
  let errorCount = 0;

  const setsJsonFile = contents.files['sets.json'];

  if(setsJsonFile){
    const setsJsonText = await setsJsonFile.async('text');
    const setsMetadata = JSON.parse(setsJsonText);

    for(const setMeta of setsMetadata){
      if(!setMeta || !setMeta.id){
        errorCount++;
        continue;
      }

      const clipList = [];
      const motivationList = [];
      const medalMap = makeEmptyMedalMap();
      const setPrefix = `${setMeta.id}/`;

      if(Array.isArray(setMeta.clips) && setMeta.clips.length){
        for(const clipMeta of setMeta.clips){
          const clipId = clipMeta && clipMeta.id ? clipMeta.id : generateUUID();
          const letter = normaliseLetterInput(clipMeta && clipMeta.letter ? clipMeta.letter : null) || 'A';
          const difficulty = normaliseDifficultyInput(clipMeta && clipMeta.difficulty ? clipMeta.difficulty : 'LEICHT');
          let fileName = clipMeta && clipMeta.file ? clipMeta.file : '';

          let zipEntry = null;
          if(fileName){
            const normalizedFile = fileName.replace(/^\/+/, '');
            zipEntry = contents.files[setPrefix + normalizedFile];
            if(!zipEntry){
              zipEntry = contents.files[normalizedFile];
            }
          }
          if(!zipEntry){
            zipEntry = Object.entries(contents.files).find(([name]) => {
              return !name.endsWith('/') && name.startsWith(setPrefix) && name.includes(clipId);
            });
            if(zipEntry){
              fileName = zipEntry[0].replace(setPrefix, '');
              zipEntry = zipEntry[1];
            }
          }

          if(!zipEntry || zipEntry.dir){
            console.warn('Audio-Datei für Clip nicht gefunden:', setMeta.id, clipId);
            errorCount++;
            continue;
          }

          const audioBlob = await zipEntry.async('blob');
          if(!audioBlob.type.startsWith('audio/') && !fileName.match(/\.(webm|ogg|mp3|mp4|m4a|wav|audio)$/i)){
            errorCount++;
            continue;
          }

          await idbSet(`audio-${setMeta.id}-${clipId}`, audioBlob);
          clipList.push({
            id: clipId,
            letter,
            difficulty,
            created: typeof clipMeta?.created === 'number' ? clipMeta.created : Date.now(),
          });
          importedAudio++;
        }
      } else {
        for(const [filename, zipEntry] of Object.entries(contents.files)){
          if(zipEntry.dir || !filename.startsWith(setPrefix)) continue;
          const rawName = filename.replace(setPrefix, '');
          if(!rawName) continue;
          const letter = normaliseLetterInput(rawName.split('.')[0]) || 'A';
          const audioBlob = await zipEntry.async('blob');
          if(!audioBlob.type.startsWith('audio/') && !rawName.match(/\.(webm|ogg|mp3|mp4|m4a|wav|audio)$/i)){
            errorCount++;
            continue;
          }
          const clipId = generateUUID();
          await idbSet(`audio-${setMeta.id}-${clipId}`, audioBlob);
          clipList.push({
            id: clipId,
            letter,
            difficulty: 'LEICHT',
            created: Date.now(),
          });
          importedAudio++;
        }
      }

      if(Array.isArray(setMeta.motivationClips) && setMeta.motivationClips.length){
        for(const clipMeta of setMeta.motivationClips){
          const clipId = clipMeta && clipMeta.id ? clipMeta.id : generateUUID();
          let fileName = clipMeta && clipMeta.file ? clipMeta.file : '';

          let zipEntry = null;
          if(fileName){
            const normalizedFile = fileName.replace(/^\/+/, '');
            zipEntry = contents.files[setPrefix + normalizedFile];
            if(!zipEntry){
              zipEntry = contents.files[normalizedFile];
            }
          }
          if(!zipEntry){
            zipEntry = Object.entries(contents.files).find(([name]) => {
              return !name.endsWith('/') && name.startsWith(setPrefix + 'motivation/') && name.includes(clipId);
            });
            if(zipEntry){
              fileName = zipEntry[0].replace(setPrefix, '');
              zipEntry = zipEntry[1];
            }
          }

          if(!zipEntry || zipEntry.dir){
            console.warn('Audio-Datei für Motivationsclip nicht gefunden:', setMeta.id, clipId);
            errorCount++;
            continue;
          }

          const audioBlob = await zipEntry.async('blob');
          if(!audioBlob.type.startsWith('audio/') && !fileName.match(/\.(webm|ogg|mp3|mp4|m4a|wav|audio)$/i)){
            errorCount++;
            continue;
          }

          await idbSet(`motivation-${setMeta.id}-${clipId}`, audioBlob);
          motivationList.push({
            id: clipId,
            created: typeof clipMeta?.created === 'number' ? clipMeta.created : Date.now(),
          });
          importedAudio++;
        }
      }

      if(setMeta.medals && typeof setMeta.medals === 'object'){
        for(const type of MEDAL_TYPES){
          const entries = setMeta.medals[type];
          const list = Array.isArray(entries) ? entries : entries ? [entries] : [];
          for(const medalMeta of list){
            const clipId = medalMeta && medalMeta.id ? medalMeta.id : generateUUID();
            let fileName = medalMeta && medalMeta.file ? medalMeta.file : '';

            let zipEntry = null;
            if(fileName){
              const normalizedFile = fileName.replace(/^\/+/, '');
              zipEntry = contents.files[setPrefix + normalizedFile];
              if(!zipEntry){
                zipEntry = contents.files[normalizedFile];
              }
            }
            if(!zipEntry){
              zipEntry = Object.entries(contents.files).find(([name]) => {
                return !name.endsWith('/') && name.startsWith(setPrefix + 'medals/') && name.includes(clipId);
              });
              if(zipEntry){
                fileName = zipEntry[0].replace(setPrefix, '');
                zipEntry = zipEntry[1];
              }
            }

            if(!zipEntry || zipEntry.dir){
              console.warn('Audio-Datei für Medaillen-Sound nicht gefunden:', setMeta.id, type);
              errorCount++;
              continue;
            }

            const audioBlob = await zipEntry.async('blob');
            if(!audioBlob.type.startsWith('audio/') && !fileName.match(/\.(webm|ogg|mp3|mp4|m4a|wav|audio)$/i)){
              errorCount++;
              continue;
            }

            await idbSet(`medal-${setMeta.id}-${clipId}`, audioBlob);
            medalMap[type].push({
              id: clipId,
              created: typeof medalMeta?.created === 'number' ? medalMeta.created : Date.now(),
            });
            importedAudio++;
          }
        }
      }

      await idbSet('set-' + setMeta.id, {
        name: setMeta.name,
        emoji: setMeta.emoji,
        created: setMeta.created || Date.now(),
        clips: clipList,
        motivationClips: motivationList,
        medalSounds: medalMap,
      });

      importedSets++;
    }

    if(showAlerts){
      alert(`✅ ${importedSets} Set(s) mit ${importedAudio} Aufnahmen importiert!${errorCount > 0 ? `\n⚠️ ${errorCount} Dateien übersprungen.` : ''}`);
    }
  } else {
    const currentSetId = await getActiveSet();

    for(const [filename, zipEntry] of Object.entries(contents.files)){
      if(zipEntry.dir || filename.startsWith('__MACOSX') || filename.startsWith('.')) continue;

      const letter = normaliseLetterInput(filename.split('.')[0]) || '';
      if(!/^[A-ZÄÖÜ]$/.test(letter)){
        errorCount++;
        continue;
      }

      const audioBlob = await zipEntry.async('blob');
      if(!audioBlob.type.startsWith('audio/') && !filename.match(/\.(webm|ogg|mp3|mp4|m4a|wav)$/i)){
        errorCount++;
        continue;
      }

      const clipId = generateUUID();
      await idbSet('audio-' + currentSetId + '-' + clipId, audioBlob);
      const setData = await loadSetData(currentSetId) || { name: 'Meine Aufnahmen', emoji: '🎤', created: Date.now(), clips: [] };
      setData.clips.push({
        id: clipId,
        letter,
        difficulty: 'LEICHT',
        created: Date.now(),
      });
      await idbSet('set-' + currentSetId, setData);
      importedAudio++;
    }

    if(showAlerts){
      if(importedAudio > 0){
        alert(`✅ ${importedAudio} Aufnahmen in aktuelles Set importiert!${errorCount > 0 ? `\n⚠️ ${errorCount} Dateien übersprungen.` : ''}`);
      } else {
        alert('❌ Keine gültigen Aufnahmen gefunden.');
      }
    }
  }

  return {
    importedSets,
    importedAudio,
    errorCount,
  };
}

function wasBundledSetsImportCompleted(){
  if(!BUNDLED_SETS_CONFIG.storageKey) return false;
  try{
    return typeof localStorage !== 'undefined' && localStorage.getItem(BUNDLED_SETS_CONFIG.storageKey) === '1';
  }catch(_){
    return false;
  }
}

function markBundledSetsImported(){
  if(!BUNDLED_SETS_CONFIG.storageKey) return;
  try{
    if(typeof localStorage !== 'undefined'){
      localStorage.setItem(BUNDLED_SETS_CONFIG.storageKey, '1');
    }
  }catch(_){}
}

async function importBundledSetsIfNeeded(){
  if(!BUNDLED_SETS_CONFIG.url || wasBundledSetsImportCompleted()){
    return false;
  }
  try{
    const existingSets = await getAllSets();
    if(existingSets.length > 0){
      markBundledSetsImported();
      return false;
    }
    const response = await fetch(BUNDLED_SETS_CONFIG.url);
    if(!response.ok){
      console.warn('Standardsets konnten nicht geladen werden:', response.status, response.statusText);
      return false;
    }
    const bundledBlob = await response.blob();
    const summary = await importSetsZipBlob(bundledBlob, { showAlerts: false });
    if(summary.importedSets > 0){
      markBundledSetsImported();
      console.info(`[Sets] ${summary.importedSets} vorinstallierte Set(s) importiert.`);
      return true;
    }
  }catch(err){
    console.warn('Automatischer Set-Import fehlgeschlagen:', err);
  }
  return false;
}

document.getElementById('importBtn').addEventListener('click', ()=>{
  document.getElementById('importFile').click();
});

document.getElementById('importFile').addEventListener('change', async (e)=>{
  const file = e.target.files[0];
  if(!file){
    return;
  }

  try{
    await importSetsZipBlob(file);
    await renderSetsList();
    await updateStatusGridFromDB();
    await updateUIForRecordingState();
    if(currentLetter) await selectLetter(currentLetter);
    await refreshSupportAudioUI();
  }catch(err){
    console.error('Import fehlgeschlagen:', err);
    alert('❌ Import fehlgeschlagen: ' + err.message);
  }finally{
    e.target.value = '';
  }
});

// ——————————————————————————————————————————
// Spiel-Logik
// ——————————————————————————————————————————
let game = null;
let currentAudio = null;

elBtnTestAudio.addEventListener('click', async () => {
  if(game && game.target){
    await playCurrentPrompt({ suppressAlert: true });
    return;
  }
  if(lastPlayed){
    try { lastPlayed.currentTime = 0; } catch(e) {}
    await lastPlayed.play().catch(()=>{});
  }
});
document.getElementById('closeModal').addEventListener('click', closeModal);

if(elResultGiftButton){
  elResultGiftButton.addEventListener('click', () => {
    playRewardSound();
    closeModal();
    switchToTab('album');
    requestAnimationFrame(() => {
      const btnOpenPack = document.getElementById('btnOpenPack');
      if(btnOpenPack){
        btnOpenPack.classList.add('pulse-hint');
        setTimeout(() => btnOpenPack.classList.remove('pulse-hint'), 2000);
        btnOpenPack.focus({ preventScroll: false });
      }
    });
  });
}

function closeModal(){
  elModal.classList.add('hidden');
  toggleResultGift(false);
}

function confirmEndGame() {
  if (!game) return false;
  if (confirm('Möchtest du wirklich aufhören?')) {
    endGame();
    return true;
  }
  return false;
}

function endGame() {
  clearMotivationChain();
  if(lastPlayed){
    try { lastPlayed.pause(); } catch(_){ /* ignore */ }
    try { lastPlayed.currentTime = 0; } catch(_){ /* ignore */ }
  }
  // Hide game view
  elHud.classList.add('hidden');
  elLetters.classList.add('hidden');

  // Show setup view
  document.getElementById('setup').classList.remove('hidden');

  // Reset game state
  game = null;
  currentLetter = null;
  currentAudio = null;
  renderLetterGrid();
  updateMissionStatus();

  // Update UI
  updateUIForRecordingState();
}

async function startGame(){
  const progress = getProgress();
  const mode = progress && progress.mode ? progress.mode : 'FREI';
  const unlockedCount = progress && progress.unlocked ? progress.unlocked : 4;
  const difficulty = progress && progress.difficulty ? progress.difficulty : 'LEICHT';

  const setId = await getActiveSet();
  const setData = await loadSetData(setId);
  const clips = setData && setData.clips ? setData.clips : [];
  const recordedSet = new Set(clips.map(clip => clip.letter));

  if(recordedSet.size === 0){
    alert('Bitte nimm zuerst Buchstaben auf (mindestens 1).');
    return;
  }

  const recorded = Array.from(recordedSet).sort();
  let pool = recorded.slice();

  if(mode === 'LERNWEG'){
    const unlockedLetters = LETTERS.slice(0, unlockedCount);
    pool = unlockedLetters.filter(letter => recordedSet.has(letter));
    if(pool.length === 0){
      alert('Für den Lernweg brauchst du Aufnahmen der freigeschalteten Buchstaben. Bitte nimm zuerst diese Buchstaben auf.');
      return;
    }
  } else {
    const desiredCount = progress && progress.freeLetterCount ? progress.freeLetterCount : 4;
    const targetLetters = LETTERS.slice(0, desiredCount);
    pool = targetLetters.filter(letter => recordedSet.has(letter));
    if(pool.length === 0){
      alert('Für die gewählte Buchstabenmenge fehlen Aufnahmen. Bitte passe die Auswahl an oder nimm die Buchstaben auf.');
      return;
    }
  }

  const rounds = parseInt(elRounds.value,10);
  game = {
    setId,
    recorded: pool.slice(),
    pool: pool.slice(),
    rounds,
    round: 0,
    ok: 0,
    bad: 0,
    target: null,
    busy: false,
    last: null,
    recent: [],
    progress,
    mode,
    difficulty,
    errorHistory: [],
    introPromptDelay: INTRO_PROMPT_DELAY,
  };
  game.pendingMotivations = new Set();
  elRoundMax.textContent = rounds;
  elOk.textContent=0; elBad.textContent=0;
  elBar.style.width='0%';
  updateStarTrackDisplay();
  updateMissionStatus(0, rounds);
  document.getElementById('setup').classList.add('hidden');
  elHud.classList.remove('hidden');
  elLetters.classList.remove('hidden');
  // sichere Tab: gehe auf "Spiel"
  document.querySelectorAll('.tabs button').forEach(b=>{
    const active = b.dataset.tab==='spiel';
    b.classList.toggle('active', active);
  });
  document.getElementById('spiel').classList.remove('hidden');
  document.getElementById('einstellungen').classList.add('hidden');

  // Runde 1
  playStartSound();
  await nextRound();
}

async function nextRound(){
  if(!game) return;
  game.round++;
  if(game.round > game.rounds){ return finishGame(); }
  elRoundNow.textContent = game.round;
  updateMissionStatus(game.round - 1, game.rounds);

  let pool = Array.isArray(game.pool) && game.pool.length ? game.pool : game.recorded;
  if(!pool || pool.length === 0){
    pool = game.recorded;
  }

  let pick = null;
  try {
    pick = pickNext({
      pool,
      last: game.last,
      wrongCounts: game.progress ? game.progress.wrongCounts : {},
      correctStreaks: game.progress ? game.progress.correctStreaks : {},
      askedCounts: game.progress ? game.progress.askedCounts : {},
      recent: game.recent || [],
      recentErrors: game.errorHistory || [],
    });
  } catch(err){
    console.warn('PickNext fehlgeschlagen, fallback auf erstes Element', err);
    pick = pool[0];
  }

  if(!pick){
    return finishGame();
  }

  game.target = pick;
  game.last = pick;
  game.recent = [pick, ...(game.recent || [])].slice(0, 3);

  const setData = await loadSetData(game.setId);
  if(game.introPromptDelay){
    await sleep(game.introPromptDelay);
    game.introPromptDelay = 0;
  }
  const clipPlayable = await playCurrentPrompt({ setData, suppressAlert: true });
  if(!clipPlayable){
    // Aufnahme fehlt unerwartet → Buchstabe aus Pool entfernen und weiter
    console.warn('Keine passende Aufnahme gefunden für', pick, 'in Schwierigkeit', game.difficulty);
    if(Array.isArray(game.pool)){
      game.pool = game.pool.filter(letter => letter !== pick);
    }
    if(!game.pool.length){
      return finishGame();
    }
    return nextRound();
  }
  // Eingaben erlauben
  game.busy=false;
  // visuelles Reset
  document.querySelectorAll('.btn-letter').forEach(b=> b.disabled=false);
}

async function playCurrentPrompt({ setData = null, suppressAlert = false } = {}){
  if(!game || !game.target){
    return false;
  }

  const desiredDifficulty = game.difficulty || 'LEICHT';
  const dataset = setData || await loadSetData(game.setId);
  if(!dataset || !Array.isArray(dataset.clips)){
    if(!suppressAlert){
      alert('Für dieses Set gibt es noch keine Aufnahmen.');
    }
    return false;
  }

  const historyKey = makeClipHistoryKey('game', game.setId, game.target, desiredDifficulty);
  const clipData = await fetchClipForLetter({
    setId: game.setId,
    letter: game.target,
    difficulty: desiredDifficulty,
    setData: dataset,
    historyKey,
  });

  if(!clipData){
    if(!suppressAlert){
      alert('Für diesen Buchstaben gibt es keine Aufnahme in der gewählten Schwierigkeit.');
    }
    return false;
  }

  let motivationClipData = null;
  let shouldChainMotivation = hasPendingMotivation(game.target);
  if(shouldChainMotivation){
    const motivationHistoryKey = makeClipHistoryKey('motivation', game.setId, 'ALL', desiredDifficulty);
    motivationClipData = await fetchMotivationClip({ setId: game.setId, setData: dataset, historyKey: motivationHistoryKey });
    if(!motivationClipData){
      shouldChainMotivation = false;
    }
  }

  clearMotivationChain();
  if(lastPlayed){
    try { lastPlayed.pause(); } catch(e) {}
    try { lastPlayed.currentTime = 0; } catch(e) {}
  }

  const url = URL.createObjectURL(clipData.blob);
  lastPlayed = new Audio(url);
  lastPlayed.addEventListener('ended', () => URL.revokeObjectURL(url));
  lastPlayed.addEventListener('error', () => URL.revokeObjectURL(url));
  if(shouldChainMotivation && motivationClipData){
    queueMotivationPlayback(lastPlayed, motivationClipData);
  }
  if(elBtnTestAudio){
    elBtnTestAudio.disabled = false;
  }
  await lastPlayed.play().catch(()=>{});
  return true;
}

// Haupt-Handler für Buchstaben-Klick
async function onLetterClick(e){
  const letter = e.currentTarget.getAttribute('data-letter');
  const btn = e.currentTarget;

  // Preview-Modus: Kein Spiel läuft, Sound abspielen
  if(!game){
    // Buchstaben-Animation beim Klick
    btn.classList.add('letter-bounce');
    setTimeout(()=> btn.classList.remove('letter-bounce'), 500);

    // Klick-Sound
    playClickSound();

    // Audio abspielen
    const setId = await getActiveSet();
    if(currentLetter === letter && currentClipId){ // currentLetter, currentClipId are for recorder
      await playClipById(currentClipId);
      return;
    }
    const setData = await loadSetData(setId);
    const historyKey = makeClipHistoryKey('preview', setId, letter, currentDifficulty);
    const clipData = await fetchClipForLetter({ setId, letter, difficulty: currentDifficulty, setData, historyKey });
    if(!clipData){
      alert('Keine Aufnahme gefunden.');
      return;
    }
    const url = URL.createObjectURL(clipData.blob);
    const audio = new Audio(url);
    audio.addEventListener('ended', () => URL.revokeObjectURL(url));
    audio.addEventListener('error', () => URL.revokeObjectURL(url));
    await audio.play().catch(()=>{});
    return;
  }

  // Spiel-Modus: Normale Guess-Logik
  if(game.busy) return;

  // Klick-Sperre für die Dauer der Animation
  game.busy=true;

  // Buchstaben-Animation beim Klick
  btn.classList.add('letter-bounce');
  setTimeout(()=> btn.classList.remove('letter-bounce'), 500);

  // Klick-Sound
  playClickSound();

  const targetLetter = game.target;
  const wrongCountsBefore = game.progress && game.progress.wrongCounts ? game.progress.wrongCounts : {};
  const wasErrorPick = (wrongCountsBefore[targetLetter] || 0) > 0;
  const correct = letter === targetLetter;
  if(correct){
    game.ok++;
    game.progress = markCorrect(targetLetter, letter);
    if(game.pendingMotivations){
      game.pendingMotivations.delete(targetLetter);
    }
    // Buchstaben-Statistik für Belohnungssystem tracken
    await incrementLetterStat(targetLetter);
  } else {
    game.bad++;
    game.progress = markWrong(targetLetter, letter);
    if(!game.pendingMotivations){
      game.pendingMotivations = new Set();
    }
    game.pendingMotivations.add(targetLetter);
  }

  game.errorHistory = [wasErrorPick, ...(game.errorHistory || [])].slice(0, 3);
  elOk.textContent = game.ok; elBad.textContent = game.bad;
  const progress = Math.min(100, Math.round(((game.round) / game.rounds)*100));
  elBar.style.width = progress + '%';

  // Soundeffekte für richtig/falsch
  if(correct){
    playSuccessSound();
  }else{
    playErrorSound();
  }

  // Feedback zeigen
  await showFeedback(correct, targetLetter);

  // nächste Runde
  await nextRound();
}

function showUnlockBanner(message){
  if(!elUnlockBanner) return;
  if(unlockBannerTimer){
    clearTimeout(unlockBannerTimer);
    unlockBannerTimer = null;
  }
  elUnlockBannerText.textContent = message;
  elUnlockBanner.classList.remove('hidden');
  requestAnimationFrame(()=>{
    elUnlockBanner.classList.add('visible');
  });
  playUnlockSound();
  unlockBannerTimer = setTimeout(()=>{
    elUnlockBanner.classList.remove('visible');
    unlockBannerTimer = setTimeout(()=>{
      elUnlockBanner.classList.add('hidden');
      unlockBannerTimer = null;
    }, 320);
  }, 2800);
}

function show(el, autoHide = true){
  el.classList.remove('hidden');
  if(autoHide){
    el.style.pointerEvents = 'none';
    return new Promise(res=> setTimeout(()=> { el.classList.add('hidden'); res(); }, 1200));
  } else {
    // Click-to-dismiss
    el.style.pointerEvents = 'auto';
    el.style.cursor = 'pointer';
    return new Promise(res=> {
      const dismiss = () => {
        el.classList.add('hidden');
        el.style.pointerEvents = 'none';
        el.style.cursor = 'default';
        el.removeEventListener('click', dismiss);
        res();
      };
      el.addEventListener('click', dismiss);
    });
  }
}
function showFeedback(ok, correctLetter){
  if(ok) return show(elOverlayGood, true); // Auto-hide bei Erfolg
  // Bei Fehler: Korrekten Buchstaben anzeigen + Click-to-dismiss
  elCorrectLetter.textContent = correctLetter;
  return show(elOverlayBad, false); // Muss weggeklickt werden
}

async function finishGame(){
  if(!game) return;
  toggleResultGift(false);
  const total = game.rounds;
  const ok = game.ok;
  const pct = Math.round((ok/total)*100);
  const msg = `${ok} von ${total} richtig (${pct} %)`;
  let animationPath;
  let medalTier = 'bronze';
  if(game.bad === 0){
    animationPath = 'app/assets/animations/Trophy.json';
    elResultTitle.textContent='Gold! Fantastisch ✨';
    medalTier = 'gold';
  } else if(pct >= 50){
    animationPath = 'app/assets/animations/Silver.json';
    elResultTitle.textContent='Silber! Super gemacht 🥈';
    medalTier = 'silver';
  } else {
    animationPath = 'app/assets/animations/bronze.json';
    elResultTitle.textContent='Bronze! Weiter so 🥉';
    medalTier = 'bronze';
  }
  playTrophyAnimation(animationPath);
  const medalIntroPromise = playMedalIntroSound();
  const progressBefore = game && game.progress ? game.progress : null;
  if(progressBefore && progressBefore.mode === 'LERNWEG'){
    const beforeUnlocked = progressBefore.unlocked || 0;
    const advanced = advanceAfterRun({
      result: { mistakes: game.bad },
      state: progressBefore,
    });
    const saved = saveProgress(advanced);
    const unlockedIncreased = saved.unlocked > beforeUnlocked;
    if(unlockedIncreased){
      const parts = [];
      if(unlockedIncreased){
        parts.push(`${saved.unlocked} Buchstaben aktiv.`);
      }
      showUnlockBanner(parts.join(' '));
    }
    game.progress = saved;
  }
  const savedProgressSnapshot = game && game.progress ? game.progress : progressBefore;
  const runStars = computeRunStars(ok, total);
  updateStarSummary(runStars);
  const existingWidget = getStarRevealWidget();
  if(existingWidget){
    existingWidget.setStars(0);
  }
  updateMissionStatus(game.rounds, game.rounds);
  elResultText.textContent = msg;

  document.getElementById('setup').classList.remove('hidden');
  elHud.classList.add('hidden');
  elModal.classList.remove('hidden');
  // Re-attach event listener for 'again' button to ensure it's active after game finish
  document.getElementById('again').addEventListener('click', ()=> { closeModal(); startGame(); });
  game=null;

  // Zurück in Preview-Modus: Buttons basierend auf Aufnahmen aktivieren
  updateLetterButtons();

  await medalIntroPromise;
  const customPlayed = await playMedalCelebration(medalTier);
  if(!customPlayed && runStars > 0){
    playRewardSound();
  }
  await animateResultStars(runStars);
  let totalStars = totalStarBank;
  if(runStars > 0){
    totalStars = await addStars(runStars);
  } else {
    totalStars = await getStars();
  }
  totalStarBank = totalStars;
  updateStarTrackDisplay();
  const canOpenPack = totalStars >= STARS_PER_PACK;
  const packsToOpen = canOpenPack ? Math.floor(totalStars / STARS_PER_PACK) : 0;
  let fullMsg = msg;
  if(runStars > 0){
    fullMsg += `\n⭐ +${runStars} Stern${runStars === 1 ? '' : 'e'}! (${totalStars} gesamt)`;
  } else {
    fullMsg += `\n⭐ Dieses Mal gab es keine Sterne – probiere es gleich nochmal!`;
  }
  elResultText.textContent = fullMsg;
  await renderAlbum();
  toggleResultGift(packsToOpen > 0);
}

async function startPracticeGame(letters) {
  if (!letters || letters.length === 0) return;

  // Switch to the game tab
  switchToTab('spiel');

  const progress = getProgress();
  const setId = await getActiveSet();

  const rounds = Math.min(15, letters.length * 2);

  game = {
    setId,
    recorded: letters.slice(),
    pool: letters.slice(),
    rounds,
    round: 0,
    ok: 0,
    bad: 0,
    target: null,
    busy: false,
    last: null,
    recent: [],
    progress,
    mode: 'FREI',
    difficulty: progress.difficulty,
    errorHistory: [],
    introPromptDelay: INTRO_PROMPT_DELAY,
  };
  game.pendingMotivations = new Set();

  elRounds.value = rounds;
  elRoundsOut.textContent = rounds;
  elRoundMax.textContent = rounds;
  elOk.textContent = 0;
  elBad.textContent = 0;
  elBar.style.width = '0%';
  document.getElementById('setup').classList.add('hidden');
  elHud.classList.remove('hidden');

  playStartSound();
  await nextRound();
}

// ——————————————————————————————————————————
// Zugänglichkeit / Kleinigkeiten
// ——————————————————————————————————————————
// Tastatursteuerung: Enter/Space hören, Fokus
elLetters.addEventListener('keydown', (e)=>{
  const btn = e.target.closest('button');
  if(!btn) return;
  if(e.key==='Enter' || e.key===' '){
    e.preventDefault(); btn.click();
  }
});

// Inhalte initial
(async function init(){
  // Migration alter Aufnahmen (falls vorhanden)
  await migrateOldRecordings();
  await importBundledSetsIfNeeded();
  await cleanupPlaceholderSets();

  // Default-Set sicherstellen und UI initialisieren
  await getActiveSet();
  await renderSetsList();
  await updateStatusGridFromDB();
  await populateSetSelector();
  await populateDefaultSetSelector();
  applyModeToUI(getProgress());
  updateStartButtonLabel(getProgress());
  await updateLetterButtons();
  await updateUIForRecordingState();
  await refreshSupportAudioUI();
})();
