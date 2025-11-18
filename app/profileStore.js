const PROFILES_KEY = 'abc_abenteuer_profiles';
const ACTIVE_PROFILE_KEY = 'abc_abenteuer_active_profile';
const PROFILE_MIGRATION_PREFIX = 'abc_abenteuer_profile_migrated_';

const DEFAULT_COLORS = ['#7c3aed', '#fb7185', '#f97316', '#0ea5e9', '#22c55e'];
const DEFAULT_EMOJIS = ['🐣', '🦄', '🦕', '🌈', '🚀', '🐙'];

function safeStorage(){
  try{
    if(typeof window !== 'undefined' && window.localStorage){
      return window.localStorage;
    }
  }catch(_){
    // ignore
  }
  return null;
}

function readProfiles(){
  const storage = safeStorage();
  if(!storage) return [];
  try{
    const payload = storage.getItem(PROFILES_KEY);
    if(!payload) return [];
    const parsed = JSON.parse(payload);
    if(!Array.isArray(parsed)) return [];
    return parsed.filter(p => p && typeof p.id === 'string');
  }catch(_){
    return [];
  }
}

function writeProfiles(list){
  const storage = safeStorage();
  if(!storage) return;
  storage.setItem(PROFILES_KEY, JSON.stringify(list));
}

function randomFrom(list){
  if(!Array.isArray(list) || list.length === 0) return null;
  const idx = Math.floor(Math.random() * list.length);
  return list[idx];
}

function makeId(){
  if(typeof crypto !== 'undefined' && crypto.randomUUID){
    return crypto.randomUUID();
  }
  return `profile-${Math.random().toString(16).slice(2)}${Date.now().toString(16)}`;
}

export function getProfiles(){
  return readProfiles();
}

export function getActiveProfileId(){
  const storage = safeStorage();
  if(!storage){
    const profiles = readProfiles();
    return profiles[0] ? profiles[0].id : null;
  }
  const val = storage.getItem(ACTIVE_PROFILE_KEY);
  if(val) return val;
  const profiles = readProfiles();
  return profiles[0] ? profiles[0].id : null;
}

export function setActiveProfile(profileId){
  const profiles = readProfiles();
  if(!profiles.find(p => p.id === profileId)){
    return getActiveProfileId();
  }
  const storage = safeStorage();
  if(storage){
    storage.setItem(ACTIVE_PROFILE_KEY, profileId);
  }
  return profileId;
}

export function getActiveProfile(){
  const id = getActiveProfileId();
  if(!id) return null;
  const profiles = readProfiles();
  return profiles.find(p => p.id === id) || profiles[0] || null;
}

function createProfileRecord({ name, emoji, color }){
  return {
    id: makeId(),
    name: (name || 'SPIELER').trim().toUpperCase().slice(0, 12),
    emoji: emoji || randomFrom(DEFAULT_EMOJIS) || '🐣',
    color: color || randomFrom(DEFAULT_COLORS) || '#7c3aed',
    created: Date.now(),
    lastSetId: null,
  };
}

export function createProfile(data){
  const profiles = readProfiles();
  const profile = createProfileRecord(data || {});
  profiles.push(profile);
  writeProfiles(profiles);
  setActiveProfile(profile.id);
  return profile;
}

export function updateProfile(profileId, updates){
  const profiles = readProfiles();
  let changed = false;
  const next = profiles.map(profile => {
    if(profile.id !== profileId) return profile;
    changed = true;
    return {
      ...profile,
      ...updates,
      name: updates && updates.name ? updates.name.trim().toUpperCase().slice(0, 12) : profile.name,
    };
  });
  if(changed){
    writeProfiles(next);
  }
  return next.find(p => p.id === profileId) || null;
}

export function deleteProfile(profileId){
  const profiles = readProfiles();
  if(profiles.length <= 1){
    return profiles;
  }
  const filtered = profiles.filter(p => p.id !== profileId);
  writeProfiles(filtered);
  const activeId = getActiveProfileId();
  if(activeId === profileId && filtered.length){
    setActiveProfile(filtered[0].id);
  }
  return filtered;
}

export function ensureProfileSetup(){
  const profiles = readProfiles();
  if(profiles.length){
    const active = getActiveProfile();
    if(!active){
      setActiveProfile(profiles[0].id);
      return { profile: profiles[0], created: false };
    }
    return { profile: active, created: false };
  }
  const profile = createProfileRecord({
    name: 'SPIELER 1',
    emoji: '🐣',
    color: '#7c3aed',
  });
  writeProfiles([profile]);
  setActiveProfile(profile.id);
  return { profile, created: true };
}

export function markProfileMigrated(profileId){
  const storage = safeStorage();
  if(!storage) return;
  storage.setItem(PROFILE_MIGRATION_PREFIX + profileId, '1');
}

export function wasProfileMigrated(profileId){
  const storage = safeStorage();
  if(!storage) return false;
  return storage.getItem(PROFILE_MIGRATION_PREFIX + profileId) === '1';
}

export function setProfileLastSet(profileId, setId){
  if(!profileId) return;
  const profiles = readProfiles();
  let changed = false;
  const next = profiles.map(profile => {
    if(profile.id !== profileId) return profile;
    changed = true;
    return { ...profile, lastSetId: setId || null };
  });
  if(changed){
    writeProfiles(next);
  }
}

export function getProfileLastSet(profileId){
  const profile = getProfiles().find(p => p.id === profileId);
  return profile ? profile.lastSetId || null : null;
}
