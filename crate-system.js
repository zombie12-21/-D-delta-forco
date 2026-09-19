/* Original tactical supply-case system for Delta Strike 2D. */
(() => {
  const STORAGE_KEY = 'delta-strike-crate-inventory-v1';
  const rarities = [
    { name: 'COMMON', className: 'common', color: '#aeb8ae', weight: 55, xp: 25 },
    { name: 'UNCOMMON', className: 'uncommon', color: '#78d58b', weight: 25, xp: 50 },
    { name: 'RARE', className: 'rare', color: '#62a9ff', weight: 12, xp: 90 },
    { name: 'EPIC', className: 'epic', color: '#bd7cff', weight: 6, xp: 150 },
    { name: 'LEGENDARY', className: 'legendary', color: '#f0b94d', weight: 2, xp: 300 }
  ];
  const rewards = [
    ['5.56 NATO Ammo Pack', 'AMMUNITION', 'Refills rifle reserve ammunition.', 'ammo'],
    ['Field Medkit', 'MEDICAL', 'Restores operator health after combat.', 'medkit'],
    ['Composite Armor Plate', 'ARMOR', 'Adds protection against incoming fire.', 'armor'],
    ['G17 // Sandline', 'WEAPON SKIN', 'A desert-tan sidearm finish.', 'skin'],
    ['AR-15 // Night Grid', 'WEAPON SKIN', 'A low-visibility tactical rifle finish.', 'skin'],
    ['M24 // Longwatch', 'WEAPON SKIN', 'A reconnaissance blue-grey finish.', 'skin'],
    ['SG-12 // Breacher', 'WEAPON SKIN', 'A high-contrast breaching finish.', 'skin'],
    ['Recon Drone Battery', 'EQUIPMENT', 'Unlocks a tactical scan charge.', 'equipment'],
    ['Breach Charge', 'EQUIPMENT', 'A compact charge for fortified positions.', 'equipment'],
    ['Operator Patch', 'COSMETIC', 'A permanent Sector 07 service patch.', 'cosmetic']
  ];
  const defaultInventory = { opened: 0, claimed: 0, items: [] };
  let inventory = loadInventory();
  let pendingReward = null;

  const $ = id => document.getElementById(id);
  function loadInventory() {
    try { return { ...defaultInventory, ...(JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}) }; }
    catch (_) { return { ...defaultInventory }; }
  }
  function saveInventory() { localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory)); }
  function pickRarity() {
    const total = rarities.reduce((sum, item) => sum + item.weight, 0);
    let roll = Math.random() * total;
    return rarities.find(item => (roll -= item.weight) <= 0) || rarities[0];
  }
  function pickReward() {
    const reward = rewards[Math.floor(Math.random() * rewards.length)];
    const rarity = pickRarity();
    return { rarity, name: reward[0], type: reward[1], detail: reward[2], kind: reward[3], xp: rarity.xp };
  }
  function openPage() {
    const modal = $('crateModal');
    if (!modal) return;
    modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false');
    resetScreen(); renderInventory();
  }
  function closePage() {
    const modal = $('crateModal');
    if (!modal) return;
    modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true');
  }
  function resetScreen() {
    $('crateStatus').textContent = 'SEALED SUPPLY CASE';
    $('rewardRarity').textContent = 'READY';
    $('rewardRarity').className = '';
    $('rewardName').textContent = 'SELECT A SUPPLY CASE';
    $('rewardDetail').textContent = 'Open a case to receive equipment, a weapon skin, and operator XP.';
    $('rewardType').textContent = '—'; $('rewardXp').textContent = '+0 XP';
    $('openCaseBtn').classList.remove('hidden'); $('claimRewardBtn').classList.add('hidden');
    $('caseVisual').classList.remove('opening', 'opened');
  }
  function openCase() {
    const caseVisual = $('caseVisual');
    const button = $('openCaseBtn');
    button.disabled = true; caseVisual.classList.add('opening');
    $('crateStatus').textContent = 'AUTHENTICATING // UNSEALING';
    setTimeout(() => {
      pendingReward = pickReward();
      inventory.opened += 1; saveInventory();
      caseVisual.classList.remove('opening'); caseVisual.classList.add('opened');
      const r = pendingReward.rarity;
      $('crateStatus').textContent = `${r.name} REWARD DETECTED`;
      $('rewardRarity').textContent = r.name; $('rewardRarity').className = r.className;
      $('rewardRarity').style.color = r.color;
      $('rewardName').textContent = pendingReward.name;
      $('rewardDetail').textContent = pendingReward.detail;
      $('rewardType').textContent = pendingReward.type;
      $('rewardXp').textContent = `+${pendingReward.xp} XP`;
      $('openCaseBtn').classList.add('hidden'); $('claimRewardBtn').classList.remove('hidden');
    }, 1150);
  }
  function claimReward() {
    if (!pendingReward) return;
    inventory.claimed += 1;
    inventory.items.unshift({ ...pendingReward, receivedAt: Date.now() });
    inventory.items = inventory.items.slice(0, 30);
    saveInventory();
    if (typeof awardXp === 'function') awardXp(pendingReward.xp, `${pendingReward.rarity.name} CASE REWARD`);
    renderInventory();
    $('crateStatus').textContent = 'REWARD STORED // READY FOR DEPLOYMENT';
    $('claimRewardBtn').classList.add('hidden'); $('openCaseBtn').classList.remove('hidden'); $('openCaseBtn').disabled = false;
    pendingReward = null;
  }
  function renderInventory() {
    const strip = $('inventoryStrip');
    if (!strip) return;
    strip.innerHTML = `<div class="inventory-count">CASES OPENED ${inventory.opened} · ITEMS CLAIMED ${inventory.claimed}</div>` +
      inventory.items.slice(0, 8).map(item => `<div class="inventory-item ${item.rarity.className}"><b>${item.rarity.name}</b><span>${item.name}</span><small>${item.type}</small></div>`).join('');
  }
  document.addEventListener('DOMContentLoaded', () => {
    $('openCratePage')?.addEventListener('click', openPage);
    $('closeCratePage')?.addEventListener('click', closePage);
    $('openCaseBtn')?.addEventListener('click', openCase);
    $('claimRewardBtn')?.addEventListener('click', claimReward);
    $('crateModal')?.addEventListener('click', event => { if (event.target.id === 'crateModal') closePage(); });
    addEventListener('keydown', event => { if (event.key === 'Escape') closePage(); });
    renderInventory();
  });
})();
