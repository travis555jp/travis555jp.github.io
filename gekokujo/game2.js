function blocked(x, y, w, h) {
  for (const o of obstacles) if (x < o.x + o.w && x + w > o.x && y < o.y + o.h && y + h > o.y) return true;
  const x0 = Math.floor(x / TS), x1 = Math.floor((x + w - 1) / TS), y0 = Math.floor(y / TS), y1 = Math.floor((y + h - 1) / TS);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
    if (ty < 0 || ty >= MH || tx < 0 || tx >= MW) continue;
    if (tiles[ty][tx] === 3) return true;
  }
  return false;
}
function moveEnt(e, dx, dy, clamp) {
  let moved = false;
  if (dx) { const nx = e.x + dx; if (!blocked(nx - 5, e.y + 1, 10, 7)) { e.x = nx; moved = true; } }
  if (dy) { const ny = e.y + dy; if (!blocked(e.x - 5, ny + 1, 10, 7)) { e.y = ny; moved = true; } }
  if (clamp) { e.x = Math.max(6, Math.min(W - 6, e.x)); e.y = Math.max(8, Math.min(H - 8, e.y)); }
  return moved;
}

const RankingStore = {
  key: 'gekokujo_ranking_v1',
  load() { try { const r = JSON.parse(localStorage.getItem(this.key) || '[]'); return Array.isArray(r) ? r : []; } catch (e) { return []; } },
  save(list) { try { localStorage.setItem(this.key, JSON.stringify(list)); } catch (e) {} },
  add(entry) {
    const l = this.load(); l.push(entry); l.sort((a, b) => b.score - a.score);
    const top = l.slice(0, 10); this.save(top); return top.indexOf(entry);
  }
};
function estRank(s) { return Math.max(1, Math.round(100000 / Math.pow(1 + s / 2000, 2))); }
function rankOf(s) { const r = estRank(s); return r > 50000 ? '百姓' : r > 10000 ? '一揆衆' : r > 1000 ? '下剋上人' : r > 100 ? '上位ランカー' : '天下人'; }

const keys = {};
const input = { sx: 0, sy: 0, attack: false };
addEventListener('keydown', e => {
  SFX.init();
  if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) e.preventDefault();
  if (!keys[e.code]) menuKey(e.code);
  keys[e.code] = true;
});
addEventListener('keyup', e => { keys[e.code] = false; });
let stickId = null, atkId = null, stickOrigin = { x: 0, y: 0 };
touchEl.addEventListener('touchstart', e => {
  e.preventDefault(); SFX.init();
  for (const t of e.changedTouches) {
    if (t.clientX < innerWidth / 2 && stickId === null) {
      stickId = t.identifier; stickOrigin = { x: t.clientX, y: t.clientY };
      stickEl.style.left = (t.clientX - 55) + 'px'; stickEl.style.top = (t.clientY - 55) + 'px'; stickEl.style.bottom = 'auto';
      knobEl.style.transform = '';
    } else if (t.clientX >= innerWidth / 2 && atkId === null) { atkId = t.identifier; input.attack = true; }
  }
}, { passive: false });
touchEl.addEventListener('touchmove', e => {
  e.preventDefault();
  for (const t of e.changedTouches) if (t.identifier === stickId) {
    let dx = t.clientX - stickOrigin.x, dy = t.clientY - stickOrigin.y;
    const len = Math.hypot(dx, dy), max = 45;
    if (len > max) { dx = dx / len * max; dy = dy / len * max; }
    knobEl.style.transform = `translate(${dx}px,${dy}px)`;
    const nx = dx / max, ny = dy / max, nl = Math.hypot(nx, ny);
    if (nl < 0.2) { input.sx = 0; input.sy = 0; } else { input.sx = nx; input.sy = ny; }
  }
}, { passive: false });
const touchEnd = e => {
  e.preventDefault();
  for (const t of e.changedTouches) {
    if (t.identifier === stickId) { stickId = null; input.sx = 0; input.sy = 0; knobEl.style.transform = ''; }
    if (t.identifier === atkId) { atkId = null; input.attack = false; }
  }
};
touchEl.addEventListener('touchend', touchEnd, { passive: false });
touchEl.addEventListener('touchcancel', touchEnd, { passive: false });
document.addEventListener('gesturestart', e => e.preventDefault());
document.addEventListener('touchmove', e => { if (e.target === document.body || e.target === document.documentElement) e.preventDefault(); }, { passive: false });
cv.addEventListener('pointerdown', e => {
  SFX.init();
  const r = cv.getBoundingClientRect();
  menuClick((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H);
});

const G = { state: 'title', frame: 0, sel: 0, ranking: [], result: null };
const EDEF = {
  ashigaru: { hp: 2, spd: 0.7, score: 100 },
  samurai: { hp: 8, spd: 0.42, score: 300 },
  ninja: { hp: 3, spd: 1.35, score: 250 },
};
const CHARS = [
  { id: 'farmer', name: '農民', desc: ['バランス型', 'HP 6 / 速さ 中 / 連射 中'], hp: 6, spd: 1.5, cd: 17, dmg: 1 },
  { id: 'hunter', name: '猟師', desc: ['速さと連射で押す', 'HP 4 / 速さ 高 / 連射 高'], hp: 4, spd: 1.7, cd: 12, dmg: 1 },
  { id: 'yamaotoko', name: '山男', desc: ['硬くて一撃が重い', 'HP 8 / 速さ 低 / 威力 2'], hp: 8, spd: 1.25, cd: 22, dmg: 2 },
  { id: 'ronin', name: '浪人', desc: ['刀の斬撃で近接戦', '短射程 / 貫通 / 威力 2'], hp: 5, spd: 1.45, cd: 20, dmg: 2, weapon: 'slash' },
];
const ITEM_NAME = { waraji: '草鞋！速い！', onigiri: 'おにぎり！', kama: '鎌強化！', akakama: '赤鎌！', omamori: '御守り！無敵！' };

function newGame(ci) {
  const C = CHARS[ci === undefined ? G.charSel || 0 : ci]; G.charSel = CHARS.indexOf(C);
  input.attack = false; input.sx = 0; input.sy = 0; stickId = null; atkId = null; knobEl.style.transform = '';
  Object.assign(G, {
    state: 'playing', time: 0, score: 0, kills: 0, stageKills: 0, stage: 1,
    combo: 0, comboTimer: 0, maxCombo: 0, gauge: 0, noKill: 0, mode: false, modeTimer: 0, modeBanner: 0,
    enemies: [], scythes: [], ebullets: [], items: [], particles: [], popups: [], flyers: [], slashes: [],
    boss: null, tsuji: null, tsTimer: 60 * 50, spawnT: 30, shake: 0, flash: 0, msg: null, cmsg: null, clearT: 0,
    hpMul: 1, spdMul: 1, chr: C,
    p: { x: 0, y: 0, hp: C.hp, maxHp: C.hp, face: 1, cd: 0, inv: 0, sandal: 0, shield: 0, scythes: 1, power: 1, anim: 0, moving: false }
  });
  startStage();
}
function startStage() {
  buildMap(G.stage);
  G.hpMul = 1 + 0.3 * (G.stage - 1); G.spdMul = 1 + 0.06 * (G.stage - 1);
  let px = W / 2, py = H / 2;
  for (let i = 0; i < 100; i++) { const tx = Math.floor(Math.random() * MW), ty = Math.floor(Math.random() * MH); if (tiles[ty][tx] === 1) { px = tx * TS + 8; py = ty * TS + 8; break; } }
  G.p.x = px; G.p.y = py;
  G.enemies = []; G.ebullets = []; G.scythes = []; G.items = []; G.boss = null; G.tsuji = null; G.stageKills = 0; G.spawnT = 60;
  G.msg = { text: 'STAGE ' + G.stage, t: 120, size: 22, color: '#fff' };
}
function popup(x, y, text, color, size) { G.popups.push({ x, y, text, color: color || '#fff', size: size || 9, life: 45 }); }
function burst(x, y, color, n, spd) {
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, s = (spd || 2) * (0.4 + Math.random()); G.particles.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 20 + Math.random() * 15, color, size: 1 + Math.random() * 2 }); }
}
function comboMult() { return 1 + Math.min(G.combo, 50) * 0.1; }
function addScore(base, x, y) {
  const v = Math.floor(base * comboMult() * (G.mode ? 2 : 1));
  G.score += v; popup(x, y - 8, '+' + v, G.mode ? '#ffe040' : '#fff');
}
function onKill(x, y, base) {
  G.kills++; G.stageKills++; G.combo++; G.comboTimer = 120; G.noKill = 0;
  if (G.combo > G.maxCombo) G.maxCombo = G.combo;
  addScore(base, x, y);
  if (!G.mode) { G.gauge = Math.min(100, G.gauge + 8); if (G.gauge >= 100) startMode(); }
  const c = G.combo;
  if ([3, 10, 30, 50, 100, 150, 200, 300].includes(c)) {
    G.cmsg = { text: c + ' COMBO!', t: 60, big: c >= 50 }; SFX.play('combo');
    if (c >= 50) { G.shake = Math.max(G.shake, 9); G.flash = 18; burst(W / 2, H / 2, '#ffe040', 40, 5); }
  }
  if (c >= 10) G.shake = Math.max(G.shake, Math.min(2 + c / 15, 6));
  if (Math.random() < (G.mode ? 0.16 : 0.12)) dropItem(x, y);
}
