/* PD 1.0 demo account system.
   This is intentionally offline-only: it provides a prototype login flow without a backend.
   Do not use real passwords here; replace with Firebase or another auth provider before production. */
(() => {
  const PROFILE_KEY = 'delta-strike-profile-v1';
  const USERS_KEY = 'delta-strike-pd10-users-v1';
  const SESSION_KEY = 'delta-strike-pd10-session-v1';

  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch (_) { return fallback; } };
  const write = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const currentUser = () => localStorage.getItem(SESSION_KEY);

  function profileFor(email) {
    const profiles = read(PROFILE_KEY + '-accounts', {});
    profiles[email] ||= { email, displayName: email.split('@')[0], xp: 0, level: 1, missions: 0, inventory: [], loadouts: {}, settings: {} };
    write(PROFILE_KEY + '-accounts', profiles);
    return profiles[email];
  }
  function showToast(message, error = false) {
    const toast = document.createElement('div'); toast.className = 'pd-toast' + (error ? ' error' : ''); toast.textContent = message;
    document.body.appendChild(toast); setTimeout(() => toast.remove(), 2200);
  }
  function renderAccount() {
    let panel = document.getElementById('pdAccountPanel');
    if (!panel) {
      panel = document.createElement('section'); panel.id = 'pdAccountPanel'; panel.className = 'pd-account-panel';
      document.body.appendChild(panel);
    }
    const email = currentUser();
    if (email) {
      const profile = profileFor(email);
      panel.innerHTML = `<span class="pd-online">● ACCOUNT ONLINE</span><b>${profile.displayName}</b><small>${email}</small><button id="pdLogout">LOG OUT</button>`;
      panel.querySelector('#pdLogout').onclick = () => { localStorage.removeItem(SESSION_KEY); renderAccount(); showToast('Logged out'); };
    } else {
      panel.innerHTML = `<span class="pd-online">● PD 1.0 DEMO ACCOUNT</span><button id="pdLogin">LOGIN</button><button id="pdRegister">REGISTER</button>`;
      panel.querySelector('#pdLogin').onclick = () => openAuth('login');
      panel.querySelector('#pdRegister').onclick = () => openAuth('register');
    }
  }
  function openAuth(mode) {
    let modal = document.getElementById('pdAuthModal');
    if (!modal) { modal = document.createElement('div'); modal.id = 'pdAuthModal'; modal.className = 'pd-auth-modal'; document.body.appendChild(modal); }
    const registering = mode === 'register';
    modal.innerHTML = `<form class="pd-auth-card"><button type="button" class="pd-auth-close">×</button><span class="pd-kicker">DELTA STRIKE // PD 1.0</span><h2>${registering ? 'CREATE OPERATOR' : 'OPERATOR LOGIN'}</h2><p>${registering ? 'Create an offline prototype profile.' : 'Continue with this browser profile.'}</p>${registering ? '<input id="pdName" placeholder="Operator name" maxlength="20" required>' : ''}<input id="pdEmail" type="email" placeholder="Email" required><input id="pdPassword" type="password" placeholder="Password (demo only)" minlength="4" required><button class="primary" type="submit">${registering ? 'CREATE ACCOUNT' : 'LOGIN'}</button><small>PD 1.0 offline prototype — passwords never leave this browser.</small></form>`;
    modal.querySelector('.pd-auth-close').onclick = () => modal.remove();
    modal.querySelector('form').onsubmit = event => {
      event.preventDefault(); const email = modal.querySelector('#pdEmail').value.trim().toLowerCase(); const password = modal.querySelector('#pdPassword').value;
      const users = read(USERS_KEY, {});
      if (registering) {
        if (users[email]) return showToast('Account already exists', true);
        users[email] = { password, displayName: modal.querySelector('#pdName').value.trim() || email.split('@')[0] }; write(USERS_KEY, users); const profile = profileFor(email); profile.displayName = users[email].displayName; write(PROFILE_KEY + '-accounts', { ...read(PROFILE_KEY + '-accounts', {}), [email]: profile });
      } else if (!users[email] || users[email].password !== password) return showToast('Invalid demo login', true);
      localStorage.setItem(SESSION_KEY, email); modal.remove(); renderAccount(); showToast(registering ? 'Account created' : 'Welcome back');
    };
  }
  function loadProfile() { const email = currentUser(); return email ? profileFor(email) : read(PROFILE_KEY, { xp: 0, missions: 0, level: 1 }); }
  function saveProfile(profile) { const email = currentUser(); if (email) { const profiles = read(PROFILE_KEY + '-accounts', {}); profiles[email] = profile; write(PROFILE_KEY + '-accounts', profiles); } else write(PROFILE_KEY, profile); }
  function levelFromXp(xp) { return Math.floor(xp / 500) + 1; }
  function updateProfileUI() { const p = loadProfile(), level = levelFromXp(p.xp), floor = (level - 1) * 500; const set = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; }; set('profileLevel', `LV ${level}`); set('profileXP', `${p.xp - floor} / 500 XP`); set('profileMissions', `${p.missions || 0} MISSIONS`); const bar = document.getElementById('profileXPBar'); if (bar) bar.style.width = `${((p.xp - floor) / 500) * 100}%`; }
  window.pd10 = { currentUser, loadProfile, saveProfile, updateProfileUI, awardXp(amount, label) { const p = loadProfile(); p.xp = (p.xp || 0) + amount; p.level = levelFromXp(p.xp); saveProfile(p); updateProfileUI(); showToast(`+${amount} XP // ${label}`); } };
  document.addEventListener('DOMContentLoaded', () => { renderAccount(); updateProfileUI(); const start = document.getElementById('startBtn'); if (start) start.addEventListener('click', () => { const p = loadProfile(); p.missions = (p.missions || 0) + 1; saveProfile(p); updateProfileUI(); }); });
})();
