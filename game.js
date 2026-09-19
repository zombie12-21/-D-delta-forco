const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

const startMenu = document.getElementById('startMenu');
const gameOverOverlay = document.getElementById('gameOver');
const hpValue = document.getElementById('hpValue');
const armorValue = document.getElementById('armorValue');
const killValue = document.getElementById('killValue');
const ammoValue = document.getElementById('ammoValue');
const weaponLabel = document.getElementById('weaponLabel');
const missionList = document.getElementById('missionList');
const crateList = document.getElementById('crateList');
const gameOverText = document.getElementById('gameOverText');
const crateAnim = document.getElementById('crateAnim');
const crateAnimIcon = document.getElementById('crateAnimIcon');
const crateAnimName = document.getElementById('crateAnimName');
const crateAnimReward = document.getElementById('crateAnimReward');

const world = { width: 2400, height: 1800 };
const keys = {};
const mouse = { x: canvas.width / 2, y: canvas.height / 2, down: false };
const ui = { recoil: 0, flash: 0 };

const weaponCatalog = {
  pistol: { name: 'Pistol', damage: 16, rate: 0.22, mag: 18, color: '#ffd86d', speed: 680 },
  rifle: { name: 'AR', damage: 22, rate: 0.12, mag: 30, color: '#ff9f6e', speed: 760 },
  sniper: { name: 'Sniper', damage: 78, rate: 0.9, mag: 5, color: '#a28dff', speed: 980 },
  shotgun: { name: 'Shotgun', damage: 15, rate: 0.48, mag: 7, color: '#8fe5ff', speed: 520 }
};

const crateTemplates = [
  { name: 'Common', icon: '#c9c9c7', loot: 'ammo', rarity: 'common' },
  { name: 'Ammo', icon: '#ff7d39', loot: 'ammo', rarity: 'common' },
  { name: 'Medic', icon: '#63d86e', loot: 'med', rarity: 'common' },
  { name: 'Armor', icon: '#4ab7ff', loot: 'armor', rarity: 'rare' },
  { name: 'Rifle', icon: '#ffb330', loot: 'weapon', rarity: 'rare' },
  { name: 'Sniper', icon: '#c77dff', loot: 'weapon', rarity: 'epic' },
  { name: 'Grenade', icon: '#ff4d8f', loot: 'grenade', rarity: 'rare' },
  { name: 'Supply', icon: '#90d765', loot: 'ammo', rarity: 'common' },
  { name: 'Gold', icon: '#e8d86d', loot: 'coins', rarity: 'epic' },
  { name: 'Boss Key', icon: '#ff5c5c', loot: 'key', rarity: 'legendary' },
  { name: 'Elite', icon: '#7f67ff', loot: 'weapon', rarity: 'legendary' },
  { name: 'Survival', icon: '#73d7dc', loot: 'med', rarity: 'common' }
];

const missionListData = [
  { text: 'Collect 3 crates', done: false },
  { text: 'Defeat 5 enemies', done: false },
  { text: 'Take down the boss', done: false },
  { text: 'Hold the extraction line', done: false }
];

const player = {
  x: 320,
  y: 1020,
  radius: 17,
  speed: 260,
  health: 100,
  armor: 0,
  angle: 0,
  weapon: 'pistol',
  ammo: 160,
  mag: 18,
  weaponsUnlocked: ['pistol', 'rifle', 'sniper', 'shotgun'],
  cameraX: 0,
  cameraY: 0,
  reloadTimer: 0,
  isReloading: false,
  recoil: 0,
  medkits: 2,
  grenades: 2,
  coins: 0,
  keys: 0,
  kills: 0,
  lastWeaponIndex: 0,
  flashTimer: 0,
  input: { dx: 0, dy: 0 }
};

const bullets = [];
const enemyBullets = [];
const enemies = [];
const particles = [];
const crates = [];
const obstacles = [];
const boss = {
  x: 1880,
  y: 470,
  radius: 38,
  health: 420,
  maxHealth: 420,
  fireCooldown: 0,
  active: true
};

let fireCooldown = 0;
let gameState = 'menu';
let lastTime = 0;

function clamp(v, min, max) { return Math.max(min, Math.min(max, v)); }
function rand(min, max) { return min + Math.random() * (max - min); }

function createMap() {
  obstacles.length = 0;

  const buildings = [
    { x: 320, y: 440, w: 280, h: 200 },
    { x: 760, y: 350, w: 420, h: 260 },
    { x: 1300, y: 420, w: 320, h: 250 },
    { x: 1600, y: 900, w: 340, h: 240 },
    { x: 880, y: 980, w: 320, h: 230 },
    { x: 280, y: 1180, w: 240, h: 220 },
    { x: 1460, y: 1280, w: 240, h: 200 },
    { x: 1820, y: 1200, w: 240, h: 200 }
  ];

  for (const b of buildings) {
    obstacles.push({ type: 'building', ...b });
  }

  const trees = [
    { x: 80, y: 270, r: 28 }, { x: 560, y: 220, r: 26 }, { x: 980, y: 210, r: 30 }, { x: 1760, y: 260, r: 26 },
    { x: 2100, y: 560, r: 28 }, { x: 2010, y: 1080, r: 32 }, { x: 1180, y: 620, r: 24 }, { x: 720, y: 1440, r: 26 },
    { x: 1350, y: 1500, r: 32 }, { x: 2000, y: 1480, r: 30 }, { x: 300, y: 780, r: 22 }, { x: 1000, y: 1400, r: 28 }
  ];

  for (const t of trees) {
    obstacles.push({ type: 'tree', x: t.x, y: t.y, r: t.r });
  }

  const rocks = [
    { x: 1060, y: 860, r: 18 }, { x: 1530, y: 980, r: 16 }, { x: 620, y: 980, r: 18 }, { x: 1740, y: 690, r: 18 }, { x: 1200, y: 1210, r: 15 }
  ];

  for (const r of rocks) {
    obstacles.push({ type: 'rock', x: r.x, y: r.y, r: r.r });
  }
}

function createCrates() {
  crates.length = 0;
  for (let i = 0; i < 26; i++) {
    const c = crateTemplates[Math.floor(Math.random() * crateTemplates.length)];
    let x = rand(120, world.width - 120);
    let y = rand(120, world.height - 120);
    let tries = 0;
    while (tries < 80 && isBlocked(x, y, 18)) {
      x = rand(120, world.width - 120);
      y = rand(120, world.height - 120);
      tries++;
    }
    crates.push({ x, y, r: 16, color: c.icon, name: c.name, loot: c.loot, opened: false, pulse: Math.random() * Math.PI * 2 });
  }
}

function createEnemies() {
  enemies.length = 0;
  for (let i = 0; i < 14; i++) {
    let x = rand(180, world.width - 180);
    let y = rand(180, world.height - 180);
    let tries = 0;
    while (tries < 80 && isBlocked(x, y, 18)) {
      x = rand(180, world.width - 180);
      y = rand(180, world.height - 180);
      tries++;
    }
    enemies.push({ x, y, radius: 14, health: 52, speed: 95 + Math.random() * 26, color: i % 2 === 0 ? '#d55452' : '#7c8cff', attackCooldown: 0, alive: true });
  }
}

function isBlocked(x, y, radius) {
  for (const o of obstacles) {
    if (o.type === 'building') {
      const nx = clamp(x, o.x, o.x + o.w);
      const ny = clamp(y, o.y, o.y + o.h);
      const dx = x - nx;
      const dy = y - ny;
      if (dx * dx + dy * dy < radius * radius) return true;
    } else {
      const dx = x - o.x;
      const dy = y - o.y;
      if (dx * dx + dy * dy < (o.r + radius) * (o.r + radius)) return true;
    }
  }
  return false;
}

function resetGame() {
  player.x = 320;
  player.y = 1010;
  player.health = 100;
  player.armor = 0;
  player.weapon = 'pistol';
  player.ammo = 160;
  player.mag = weaponCatalog.pistol.mag;
  player.medkits = 2;
  player.grenades = 2;
  player.coins = 0;
  player.keys = 0;
  player.kills = 0;
  player.recoil = 0;
  fireCooldown = 0;
  ui.recoil = 0;
  ui.flash = 0;
  bullets.length = 0;
  enemyBullets.length = 0;
  particles.length = 0;
  boss.health = boss.maxHealth;
  boss.active = true;
  boss.x = 1880;
  boss.y = 470;
  createMap();
  createCrates();
  createEnemies();
  updateMissionList();
  updateHud();
}

function triggerCrateAnim(crateName, rewardText, color) {
  crateAnimIcon.style.background = color;
  crateAnimName.textContent = crateName;
  crateAnimReward.textContent = rewardText;
  crateAnim.classList.remove('hidden');
  clearTimeout(triggerCrateAnim._timer);
  triggerCrateAnim._timer = setTimeout(() => crateAnim.classList.add('hidden'), 1100);
}

function renderCrateMenu() {
  crateList.innerHTML = '';
  for (const item of crateTemplates) {
    const card = document.createElement('div');
    card.className = 'crate-card';
    card.innerHTML = `
      <span class="crate-icon" style="background:${item.icon};"></span>
      <h3>${item.name}</h3>
      <p>${item.rarity}</p>
    `;
    card.addEventListener('click', () => {
      const rewardMap = {
        ammo: () => { player.ammo += 25; },
        med: () => { player.medkits += 1; },
        armor: () => { player.armor = Math.min(player.armor + 25, 100); },
        coins: () => { player.coins += 80; },
        grenade: () => { player.grenades += 1; },
        weapon: () => {
          const choices = ['rifle', 'sniper', 'shotgun'];
          const next = choices[Math.floor(Math.random() * choices.length)];
          if (!player.weaponsUnlocked.includes(next)) player.weaponsUnlocked.push(next);
          player.weapon = next;
          player.lastWeaponIndex = ['pistol','rifle','sniper','shotgun'].indexOf(next);
          player.mag = weaponCatalog[next].mag;
        },
        key: () => { player.keys += 1; }
      };
      const rewardKey = item.loot;
      if (rewardMap[rewardKey]) rewardMap[rewardKey]();
      triggerCrateAnim(item.name, `+ ${rewardKey.toUpperCase()}`, item.icon);
      card.style.borderColor = '#f9d76d';
      setTimeout(() => card.style.borderColor = '', 450);
      updateHud();
    });
    crateList.appendChild(card);
  }
}

renderCrateMenu();

document.getElementById('openRandomBtn').addEventListener('click', () => {
  const item = crateTemplates[Math.floor(Math.random() * crateTemplates.length)];
  const map = {
    ammo: 'Ammo +25',
    med: 'Medkit +1',
    armor: 'Armor +25',
    coins: 'Coins +80',
    grenade: 'Grenade +1',
    weapon: 'Weapon Unlock',
    key: 'Boss Key +1'
  };
  const reward = item.loot;
  if (reward === 'ammo') player.ammo += 25;
  if (reward === 'med') player.medkits += 1;
  if (reward === 'armor') player.armor = Math.min(player.armor + 25, 100);
  if (reward === 'coins') player.coins += 80;
  if (reward === 'grenade') player.grenades += 1;
  if (reward === 'key') player.keys += 1;
  if (reward === 'weapon') {
    const choices = ['rifle', 'sniper', 'shotgun'];
    const next = choices[Math.floor(Math.random() * choices.length)];
    if (!player.weaponsUnlocked.includes(next)) player.weaponsUnlocked.push(next);
    player.weapon = next;
  }
  triggerCrateAnim(item.name, map[reward], item.icon);
  updateHud();
});

document.getElementById('startBtn').addEventListener('click', () => {
  startMenu.classList.add('hidden');
  gameState = 'playing';
  resetGame();
  updateHud();
});

document.getElementById('restartBtn').addEventListener('click', () => {
  gameOverOverlay.classList.add('hidden');
  startMenu.classList.remove('hidden');
  gameState = 'menu';
});

document.querySelectorAll('.weapon-slot').forEach((slot) => {
  slot.addEventListener('click', () => {
    const idx = Number(slot.dataset.slot);
    const selected = ['pistol', 'rifle', 'sniper', 'shotgun'][idx];
    if (player.weaponsUnlocked.includes(selected)) {
      player.weapon = selected;
      player.lastWeaponIndex = idx;
      const w = weaponCatalog[selected];
      player.mag = w.mag;
      player.isReloading = false;
      updateHud();
    }
  });
});

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  keys[key] = true;
  if (key === 'q') cycleWeapon(-1);
  if (key === 'e') cycleWeapon(1);
  if (key === 'r') startReload();
  if (key === 'h' && player.medkits > 0) {
    player.medkits -= 1;
    player.health = clamp(player.health + 35, 0, 100);
  }
  if (key === 'f' && player.grenades > 0) {
    player.grenades -= 1;
    const angle = player.angle;
    bullets.push({ x: player.x + Math.cos(angle) * 18, y: player.y + Math.sin(angle) * 18, vx: Math.cos(angle) * 380, vy: Math.sin(angle) * 380, radius: 8, damage: 52, owner: 'grenade' });
  }
});

window.addEventListener('keyup', (event) => { keys[event.key.toLowerCase()] = false; });

canvas.addEventListener('mousemove', (event) => {
  const rect = canvas.getBoundingClientRect();
  mouse.x = (event.clientX - rect.left) * (canvas.width / rect.width);
  mouse.y = (event.clientY - rect.top) * (canvas.height / rect.height);
});
canvas.addEventListener('mousedown', () => mouse.down = true);
window.addEventListener('mouseup', () => mouse.down = false);
window.addEventListener('contextmenu', (event) => event.preventDefault());

function cycleWeapon(dir) {
  const order = ['pistol', 'rifle', 'sniper', 'shotgun'];
  let idx = order.indexOf(player.weapon);
  let safe = 0;
  do {
    idx = (idx + dir + order.length) % order.length;
    safe++;
  } while (!player.weaponsUnlocked.includes(order[idx]) && safe < 10);
  player.weapon = order[idx];
  player.lastWeaponIndex = idx;
  player.mag = weaponCatalog[player.weapon].mag;
  player.isReloading = false;
  updateHud();
}

function startReload() {
  const weapon = weaponCatalog[player.weapon];
  if (player.isReloading || player.mag >= weapon.mag || player.ammo <= 0) return;
  player.isReloading = true;
  player.reloadTimer = 0.7;
}

function updateHud() {
  hpValue.textContent = Math.ceil(player.health);
  armorValue.textContent = Math.ceil(player.armor);
  killValue.textContent = player.kills;
  ammoValue.textContent = `${player.mag}/${player.ammo}`;
  weaponLabel.textContent = weaponCatalog[player.weapon].name;
  document.querySelectorAll('.weapon-slot').forEach((slot, index) => {
    slot.classList.toggle('active', index === player.lastWeaponIndex);
  });
}

function updateMissionList() {
  missionList.innerHTML = '';
  missionListData.forEach((m) => {
    const li = document.createElement('li');
    li.textContent = m.text;
    if (m.done) li.classList.add('done');
    missionList.appendChild(li);
  });
}

function spawnParticles(x, y, color, count = 12) {
  for (let i = 0; i < count; i++) {
    particles.push({ x, y, vx: rand(-90, 90), vy: rand(-90, 90), life: rand(0.35, 0.9), color, size: rand(2, 4) });
  }
}

function fireBullet(fromX, fromY, angle, damage, speed, owner, spread = 0) {
  const dir = angle + rand(-spread, spread);
  bullets.push({ x: fromX, y: fromY, vx: Math.cos(dir) * speed, vy: Math.sin(dir) * speed, damage, radius: owner === 'player' ? 4 : 5, owner, life: 2.2 });
}

function shoot() {
  if (player.isReloading || fireCooldown > 0) return;
  const weapon = weaponCatalog[player.weapon];
  if (player.mag <= 0) {
    startReload();
    return;
  }

  const angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
  const muzzleX = player.x - player.cameraX + Math.cos(angle) * 18;
  const muzzleY = player.y - player.cameraY + Math.sin(angle) * 18;

  if (player.weapon === 'shotgun') {
    for (let i = -2; i <= 2; i++) {
      fireBullet(muzzleX, muzzleY, angle + i * 0.18, weapon.damage, weapon.speed, 'player', 0.08);
    }
  } else {
    fireBullet(muzzleX, muzzleY, angle, weapon.damage, weapon.speed, 'player', player.weapon === 'sniper' ? 0.02 : 0.04);
  }

  player.mag -= 1;
  fireCooldown = weapon.rate;
  ui.recoil = Math.min(22, ui.recoil + (player.weapon === 'sniper' ? 12 : 6));
  player.flashTimer = 0.08;
  updateHud();
}

function updatePlayer(dt) {
  const moveX = (keys['d'] || keys['arrowright'] ? 1 : 0) - (keys['a'] || keys['arrowleft'] ? 1 : 0);
  const moveY = (keys['s'] || keys['arrowdown'] ? 1 : 0) - (keys['w'] || keys['arrowup'] ? 1 : 0);

  if (moveX || moveY) {
    const len = Math.hypot(moveX, moveY) || 1;
    const stepX = (moveX / len) * player.speed * dt;
    const stepY = (moveY / len) * player.speed * dt;

    const nextX = player.x + stepX;
    const nextY = player.y + stepY;
    if (!isBlocked(nextX, player.y, player.radius)) player.x = nextX;
    if (!isBlocked(player.x, nextY, player.radius)) player.y = nextY;
  }

  player.angle = Math.atan2(mouse.y - canvas.height / 2, mouse.x - canvas.width / 2);
  player.cameraX = clamp(player.x - canvas.width / 2, 0, world.width - canvas.width);
  player.cameraY = clamp(player.y - canvas.height / 2, 0, world.height - canvas.height);

  if (mouse.down && gameState === 'playing') shoot();
  fireCooldown = Math.max(0, fireCooldown - dt);
  ui.recoil = Math.max(0, ui.recoil - dt * 18);
  player.flashTimer = Math.max(0, player.flashTimer - dt);

  if (player.isReloading) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      const weapon = weaponCatalog[player.weapon];
      const need = weapon.mag - player.mag;
      const taken = Math.min(need, player.ammo);
      if (taken > 0) {
        player.mag += taken;
        player.ammo -= taken;
      }
      player.isReloading = false;
      updateHud();
    }
  }
}

function updateEnemies(dt) {
  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    const dx = player.x - enemy.x;
    const dy = player.y - enemy.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 520) {
      const nx = dx / dist;
      const ny = dy / dist;
      const nextX = enemy.x + nx * enemy.speed * dt;
      const nextY = enemy.y + ny * enemy.speed * dt;
      if (!isBlocked(nextX, enemy.y, enemy.radius)) enemy.x = nextX;
      if (!isBlocked(enemy.x, nextY, enemy.radius)) enemy.y = nextY;

      enemy.attackCooldown -= dt;
      if (dist < 250 && enemy.attackCooldown <= 0) {
        const ang = Math.atan2(dy, dx);
        enemyBullets.push({ x: enemy.x, y: enemy.y, vx: Math.cos(ang) * 270, vy: Math.sin(ang) * 270, radius: 4.5, damage: 13 });
        enemy.attackCooldown = 1.1;
      }
    }
  }

  if (boss.active) {
    const dx = player.x - boss.x;
    const dy = player.y - boss.y;
    const dist = Math.hypot(dx, dy) || 1;
    if (dist < 620) {
      const nx = dx / dist;
      const ny = dy / dist;
      const nextX = boss.x + nx * 88 * dt;
      const nextY = boss.y + ny * 88 * dt;
      if (!isBlocked(nextX, boss.y, boss.radius)) boss.x = nextX;
      if (!isBlocked(boss.x, nextY, boss.radius)) boss.y = nextY;
      boss.fireCooldown -= dt;
      if (dist < 300 && boss.fireCooldown <= 0) {
        const ang = Math.atan2(dy, dx);
        enemyBullets.push({ x: boss.x, y: boss.y, vx: Math.cos(ang) * 290, vy: Math.sin(ang) * 290, radius: 6, damage: 20 });
        boss.fireCooldown = 1.2;
      }
    }
  }
}

function updateCrates(dt) {
  for (const crate of crates) {
    crate.pulse += dt * 3;
    if (!crate.opened && Math.hypot(player.x - crate.x, player.y - crate.y) < 28) {
      crate.opened = true;
      const reward = crate.loot;
      if (reward === 'ammo') player.ammo += 25;
      if (reward === 'med') player.medkits += 1;
      if (reward === 'armor') player.armor = Math.min(player.armor + 25, 100);
      if (reward === 'coins') player.coins += 80;
      if (reward === 'grenade') player.grenades += 1;
      if (reward === 'key') player.keys += 1;
      spawnParticles(crate.x, crate.y, '#f7d66d', 18);
      triggerCrateAnim(crate.name, `+ ${reward.toUpperCase()}`, crate.color);
      missionListData[0].done = true;
      updateMissionList();
      updateHud();
    }
  }
}

function updateBullets(dt) {
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    b.life -= dt;
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    if (b.life <= 0 || b.x < 0 || b.x > world.width || b.y < 0 || b.y > world.height) {
      bullets.splice(i, 1);
      continue;
    }

    let hitWall = false;
    for (const o of obstacles) {
      if (o.type === 'building') {
        if (b.x > o.x && b.x < o.x + o.w && b.y > o.y && b.y < o.y + o.h) {
          hitWall = true;
          break;
        }
      } else {
        const dx = b.x - o.x;
        const dy = b.y - o.y;
        if (dx * dx + dy * dy < (o.r + b.radius) * (o.r + b.radius)) {
          hitWall = true;
          break;
        }
      }
    }
    if (hitWall) { bullets.splice(i, 1); continue; }

    if (b.owner === 'player') {
      for (let j = enemies.length - 1; j >= 0; j--) {
        const e = enemies[j];
        if (!e.alive) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        if (dx * dx + dy * dy < (e.radius + b.radius) * (e.radius + b.radius)) {
          e.health -= b.damage;
          bullets.splice(i, 1);
          spawnParticles(e.x, e.y, '#ffd27b', 7);
          if (e.health <= 0) {
            e.alive = false;
            player.kills += 1;
            spawnParticles(e.x, e.y, '#ffe27b', 18);
            missionListData[1].done = player.kills >= 5;
            updateMissionList();
          }
          break;
        }
      }

      if (boss.active) {
        const dx = b.x - boss.x;
        const dy = b.y - boss.y;
        if (dx * dx + dy * dy < (boss.radius + b.radius) * (boss.radius + b.radius)) {
          boss.health -= b.damage;
          bullets.splice(i, 1);
          spawnParticles(boss.x, boss.y, '#ff9e73', 8);
          if (boss.health <= 0) {
            boss.active = false;
            missionListData[2].done = true;
            updateMissionList();
          }
        }
      }
    }
  }

  for (let i = enemyBullets.length - 1; i >= 0; i--) {
    const b = enemyBullets[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;

    const dx = b.x - player.x;
    const dy = b.y - player.y;
    if (dx * dx + dy * dy < (player.radius + b.radius) * (player.radius + b.radius)) {
      let dmg = b.damage;
      if (player.armor > 0) {
        const absorb = Math.min(player.armor, dmg * 0.7);
        player.armor -= absorb;
        dmg -= absorb;
      }
      player.health -= dmg;
      enemyBullets.splice(i, 1);
      spawnParticles(player.x, player.y, '#ff6f6f', 8);
      if (player.health <= 0) {
        gameState = 'gameover';
        gameOverOverlay.classList.remove('hidden');
        gameOverText.textContent = 'You were eliminated by the boss and raiders.';
      }
      continue;
    }

    if (b.x < 0 || b.x > world.width || b.y < 0 || b.y > world.height) {
      enemyBullets.splice(i, 1);
    }
  }
}

function updateParticles(dt) {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    if (p.life <= 0) particles.splice(i, 1);
  }
}

function drawGround() {
  ctx.fillStyle = '#94d560';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const tile = 64;
  const ox = player.cameraX % tile;
  const oy = player.cameraY % tile;
  for (let x = -tile; x < canvas.width + tile; x += tile) {
    for (let y = -tile; y < canvas.height + tile; y += tile) {
      const parity = ((Math.floor((x + ox) / tile) + Math.floor((y + oy) / tile)) % 2 === 0);
      ctx.fillStyle = parity ? '#9ed96b' : '#8dcf62';
      ctx.fillRect(x, y, tile, tile);
    }
  }
}

function drawMapWorld() {
  ctx.save();
  ctx.translate(-player.cameraX, -player.cameraY);

  ctx.fillStyle = '#b5884d';
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = '#a98a66';
  ctx.fillRect(0, 820, world.width, 110);
  ctx.fillRect(1020, 0, 110, world.height);
  ctx.fillRect(560, 980, 260, 280);
  ctx.fillRect(1320, 980, 360, 220);

  for (const o of obstacles) {
    if (o.type === 'building') {
      ctx.fillStyle = '#b66c3d';
      ctx.fillRect(o.x, o.y, o.w, o.h);
      ctx.strokeStyle = '#7e4722';
      ctx.lineWidth = 4;
      ctx.strokeRect(o.x, o.y, o.w, o.h);

      ctx.fillStyle = '#c9ab6f';
      for (let x = o.x + 14; x < o.x + o.w - 12; x += 46) {
        ctx.fillRect(x, o.y + 20, 22, 12);
      }
      ctx.fillStyle = '#6d4f34';
      ctx.fillRect(o.x + 18, o.y + 90, o.w - 36, 18);
      ctx.fillStyle = '#7b2b2b';
      ctx.fillRect(o.x + o.w * 0.58, o.y + 110, 34, 18);
    }

    if (o.type === 'tree') {
      ctx.fillStyle = '#3a7d3b';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#2a5b2a';
      ctx.fillRect(o.x - 4, o.y + o.r * 0.9, 8, 18);
    }

    if (o.type === 'rock') {
      ctx.fillStyle = '#707070';
      ctx.beginPath();
      ctx.arc(o.x, o.y, o.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  for (const crate of crates) {
    if (crate.opened) continue;
    const size = 18 + Math.sin(crate.pulse) * 2.5;
    ctx.fillStyle = crate.color;
    ctx.fillRect(crate.x - size / 2, crate.y - size / 2, size, size);
    ctx.strokeStyle = '#fff';
    ctx.strokeRect(crate.x - size / 2, crate.y - size / 2, size, size);
  }

  for (const enemy of enemies) {
    if (!enemy.alive) continue;
    ctx.fillStyle = enemy.color;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#2d2d2d';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(enemy.x, enemy.y, enemy.radius + 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#181818';
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32, 6);
    ctx.fillStyle = '#b7ff4a';
    ctx.fillRect(enemy.x - 16, enemy.y - enemy.radius - 12, 32 * (enemy.health / 52), 6);
  }

  if (boss.active) {
    ctx.fillStyle = '#7a1d1d';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#d66041';
    ctx.beginPath();
    ctx.arc(boss.x, boss.y, boss.radius * 0.68, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1c1c1c';
    ctx.fillRect(boss.x - 48, boss.y - boss.radius - 18, 96, 9);
    ctx.fillStyle = '#ffd166';
    ctx.fillRect(boss.x - 48, boss.y - boss.radius - 18, 96 * (boss.health / boss.maxHealth), 9);
  }

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.fillStyle = '#e0f0ff';
  ctx.beginPath();
  ctx.arc(0, 0, player.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#fff';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(18, 0);
  ctx.stroke();
  ctx.restore();

  for (const b of bullets) {
    ctx.fillStyle = b.owner === 'grenade' ? '#ff5d8f' : '#f1d15f';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const b of enemyBullets) {
    ctx.fillStyle = '#ff5b6f';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const p of particles) {
    ctx.fillStyle = p.color;
    ctx.globalAlpha = clamp(p.life, 0, 1);
    ctx.fillRect(p.x, p.y, p.size, p.size);
    ctx.globalAlpha = 1;
  }

  ctx.restore();
}

function drawSniperScope() {
  if (player.weapon !== 'sniper') return;
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.55)';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.clearRect(cx - 110, cy - 110, 220, 220);
  ctx.strokeStyle = 'rgba(255,255,255,0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, 0);
  ctx.lineTo(cx, canvas.height);
  ctx.moveTo(0, cy);
  ctx.lineTo(canvas.width, cy);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
}

function drawHudExtra() {
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  if (player.weapon !== 'sniper') {
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(cx - 8, cy);
    ctx.lineTo(cx + 8, cy);
    ctx.moveTo(cx, cy - 8);
    ctx.lineTo(cx, cy + 8);
    ctx.stroke();
  }

  ctx.fillStyle = 'rgba(10, 12, 13, 0.38)';
  ctx.fillRect(20, canvas.height - 68, 160, 18);
  ctx.fillStyle = '#40d06d';
  ctx.fillRect(20, canvas.height - 68, 160 * (player.health / 100), 18);

  const mapX = 1110;
  const mapY = 52;
  ctx.fillStyle = 'rgba(10, 16, 15, 0.54)';
  ctx.fillRect(mapX, mapY, 110, 110);
  ctx.strokeStyle = '#dfeaf2';
  ctx.strokeRect(mapX, mapY, 110, 110);

  for (const o of obstacles) {
    if (o.type === 'building') {
      ctx.fillStyle = '#8d6e4d';
      ctx.fillRect(mapX + 8 + o.x * 0.04, mapY + 8 + o.y * 0.04, o.w * 0.04, o.h * 0.04);
    }
  }

  for (const crate of crates) {
    if (!crate.opened) {
      ctx.fillStyle = '#ffd56a';
      ctx.fillRect(mapX + 8 + crate.x * 0.04, mapY + 8 + crate.y * 0.04, 4, 4);
    }
  }

  if (boss.active) {
    ctx.fillStyle = '#ff5a5a';
    ctx.fillRect(mapX + 8 + boss.x * 0.04, mapY + 8 + boss.y * 0.04, 6, 6);
  }

  ctx.fillStyle = '#ffffff';
  ctx.fillRect(mapX + 8 + player.x * 0.04, mapY + 8 + player.y * 0.04, 5, 5);
}

function update(dt) {
  if (gameState !== 'playing') return;
  updatePlayer(dt);
  updateEnemies(dt);
  updateCrates(dt);
  updateBullets(dt);
  updateParticles(dt);
  updateHud();

  if (player.x > 2040 && player.y < 820 && boss.active === false) {
    missionListData[3].done = true;
    updateMissionList();
  }
}

function render() {
  drawGround();
  drawMapWorld();
  if (player.weapon === 'sniper') drawSniperScope();
  drawHudExtra();
}

function loop(ts) {
  const dt = Math.min((ts - lastTime) / 1000 || 0.016, 0.033);
  lastTime = ts;
  update(dt);
  render();
  requestAnimationFrame(loop);
}

resetGame();
requestAnimationFrame(loop);

startMenu.classList.remove('hidden');
updateMissionList();
updateHud();
