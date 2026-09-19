/* GitHub Pages-friendly progression and home screen. No server or build step required. */
(() => {
  const KEY = 'delta-strike-profile-v1';
  const getProfile = () => {
    try { return JSON.parse(localStorage.getItem(KEY)) || { xp: 0, best: 0, missions: 0 }; }
    catch (_) { return { xp: 0, best: 0, missions: 0 }; }
  };
  const saveProfile = profile => localStorage.setItem(KEY, JSON.stringify(profile));
  const levelFor = xp => Math.floor(xp / 500) + 1;
  const nextXP = level => level * 500;

  function addHomePanel() {
    const menu = document.querySelector('#startMenu .menu');
    if (!menu || document.getElementById('profilePanel')) return;
    const panel = document.createElement('div');
    panel.id = 'profilePanel';
    panel.className = 'profile-panel';
    panel.innerHTML = `
      <div class="profile-heading"><span>OPERATOR PROFILE</span><b id="profileLevel">LV 1</b></div>
      <div class="xp-track"><span id="profileXPBar"></span></div>
      <div class="profile-meta"><span id="profileXP">0 / 500 XP</span><span id="profileMissions">0 MISSIONS</span></div>
      <small>Earn XP by eliminating enemies, opening crates, and completing deployments.</small>`;
    menu.insertBefore(panel, menu.querySelector('.crate-panel') || null);
  }

  function updateProfile() {
    const profile = getProfile();
    const level = levelFor(profile.xp);
    const previous = levelFor(Math.max(0, profile.xp - 1));
    const floor = (level - 1) * 500;
    const progress = Math.min(100, ((profile.xp - floor) / (nextXP(level) - floor)) * 100);
    const levelEl = document.getElementById('profileLevel');
    const xpEl = document.getElementById('profileXP');
    const bar = document.getElementById('profileXPBar');
    const missions = document.getElementById('profileMissions');
    if (levelEl) levelEl.textContent = `LV ${level}`;
    if (xpEl) xpEl.textContent = `${profile.xp - floor} / ${nextXP(level) - floor} XP`;
    if (bar) bar.style.width = `${progress}%`;
    if (missions) missions.textContent = `${profile.missions} MISSION${profile.missions === 1 ? '' : 'S'}`;
    if (level > previous) showToast(`LEVEL UP // OPERATOR LV ${level}`);
  }

  function showToast(message) {
    let toast = document.getElementById('xpToast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'xpToast';
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  }

  function awardXP(amount, reason) {
    const profile = getProfile();
    profile.xp += amount;
    saveProfile(profile);
    updateProfile();
    showToast(`+${amount} XP // ${reason}`);
  }

  function startMission() {
    const profile = getProfile();
    profile.missions += 1;
    saveProfile(profile);
    awardXP(25, 'DEPLOYMENT READY');
  }

  function observeKills() {
    const killEl = document.getElementById('killValue');
    if (!killEl) return;
    let lastKills = Number(killEl.textContent) || 0;
    setInterval(() => {
      const kills = Number(killEl.textContent) || 0;
      if (kills > lastKills) awardXP((kills - lastKills) * 100, 'TARGET ELIMINATED');
      lastKills = kills;
    }, 250);
  }

  function init() {
    addHomePanel();
    updateProfile();
    observeKills();
    const start = document.getElementById('startBtn');
    if (start) start.addEventListener('click', startMission, { once: true });
    const restart = document.getElementById('restartBtn');
    if (restart) restart.addEventListener('click', () => showToast('REDEPLOYING // GOOD HUNT'));
    document.querySelectorAll('.crate').forEach(crate => crate.addEventListener('click', () => awardXP(35, 'SUPPLY RECOVERED')));
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
