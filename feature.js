/* GitHub Pages-friendly progression system. */
(() => {
  const KEY = 'delta-strike-profile-v1';

  function loadProfile() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || { xp: 0, missions: 0, level: 1 };
    } catch {
      return { xp: 0, missions: 0, level: 1 };
    }
  }

  function saveProfile(profile) {
    localStorage.setItem(KEY, JSON.stringify(profile));
  }

  function levelFromXp(xp) {
    return Math.floor(xp / 500) + 1;
  }

  function updateProfileUI() {
    const profile = loadProfile();
    const level = levelFromXp(profile.xp);
    const floor = (level - 1) * 500;
    const next = level * 500;
    const progress = ((profile.xp - floor) / (next - floor)) * 100;

    const levelEl = document.getElementById('profileLevel');
    const xpEl = document.getElementById('profileXP');
    const barEl = document.getElementById('profileXPBar');
    const missionsEl = document.getElementById('profileMissions');

    if (levelEl) levelEl.textContent = `LV ${level}`;
    if (xpEl) xpEl.textContent = `${profile.xp - floor} / ${next - floor} XP`;
    if (barEl) barEl.style.width = `${Math.min(100, Math.max(0, progress))}%`;
    if (missionsEl) missionsEl.textContent = `${profile.missions} MISSIONS`;
  }

  function awardXp(amount, label) {
    const profile = loadProfile();
    profile.xp += amount;
    profile.level = levelFromXp(profile.xp);
    saveProfile(profile);
    updateProfileUI();

    const toast = document.getElementById('xpToast') || document.createElement('div');
    toast.id = 'xpToast';
    toast.textContent = `+${amount} XP // ${label}`;
    toast.style.position = 'fixed';
    toast.style.right = '24px';
    toast.style.bottom = '24px';
    toast.style.zIndex = '9999';
    toast.style.padding = '10px 16px';
    toast.style.background = 'rgba(12,25,18,.9)';
    toast.style.border = '1px solid rgba(128,220,114,.9)';
    toast.style.color = '#ecfbe5';
    toast.style.fontSize = '12px';
    toast.style.letterSpacing = '1.2px';
    if (!toast.isConnected) document.body.appendChild(toast);
    clearTimeout(toast._timer);
    toast._timer = setTimeout(() => toast.remove(), 1200);
  }

  function bindMissionStart() {
    const startBtn = document.getElementById('startBtn');
    if (!startBtn) return;

    startBtn.addEventListener('click', () => {
      const profile = loadProfile();
      profile.missions = (profile.missions || 0) + 1;
      saveProfile(profile);
      updateProfileUI();
      awardXp(50, 'DEPLOYMENT');
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    updateProfileUI();
    bindMissionStart();
  });
})();
