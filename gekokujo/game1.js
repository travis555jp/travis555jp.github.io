'use strict';
const W = 480, H = 270, TS = 16, MW = 30, MH = 17;
const cv = document.getElementById('c');
cv.width = W; cv.height = H;
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const isTouch = ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
const orientEl = document.getElementById('orient');
const touchEl = document.getElementById('touch');
const stickEl = document.getElementById('stick');
const knobEl = document.getElementById('knob');

function resize() {
  const s = Math.min(innerWidth / W, innerHeight / H);
  cv.style.width = Math.floor(W * s) + 'px';
  cv.style.height = Math.floor(H * s) + 'px';
  orientEl.style.display = (isTouch && innerHeight > innerWidth) ? 'block' : 'none';
}
addEventListener('resize', resize);
addEventListener('orientationchange', () => setTimeout(resize, 250));
resize();

/* ================= Sound (Web Audio, no files) ================= */
const SFX = {
  ac: null,
  init() {
    try {
      if (!this.ac) { const A = window.AudioContext || window.webkitAudioContext; if (!A) return; this.ac = new A(); }
      if (this.ac.state === 'suspended') this.ac.resume();
    } catch (e) {}
  },
  tone(f, d, type, vol, f2, delay) {
    if (!this.ac) return;
    try {
      const t = this.ac.currentTime + (delay || 0);
      const o = this.ac.createOscillator(), g = this.ac.createGain();
      o.type = type || 'square';
      o.frequency.setValueAtTime(f, t);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
      g.gain.setValueAtTime(vol || 0.08, t);
      g.gain.exponentialRampToValueAtTime(0.001, t + d);
      o.connect(g); g.connect(this.ac.destination);
      o.start(t); o.stop(t + d + 0.02);
    } catch (e) {}
  },
  play(n) {
    switch (n) {
      case 'attack': this.tone(700, 0.07, 'square', 0.04, 350); break;
      case 'hit': this.tone(180, 0.1, 'sawtooth', 0.06, 90); break;
      case 'item': this.tone(800, 0.08, 'square', 0.06); this.tone(1200, 0.12, 'square', 0.06, null, 0.08); break;
      case 'combo': this.tone(900, 0.06, 'square', 0.05); this.tone(1350, 0.1, 'square', 0.05, null, 0.06); break;
      case 'gekokujo': [400, 600, 800, 1200, 1600].forEach((f, i) => this.tone(f, 0.12, 'square', 0.07, null, i * 0.08)); break;
      case 'damage': this.tone(150, 0.25, 'sawtooth', 0.1, 50); break;
      case 'gameover': [400, 300, 200, 120].forEach((f, i) => this.tone(f, 0.25, 'triangle', 0.09, null, i * 0.22)); break;
      case 'warn': this.tone(1000, 0.1, 'square', 0.06); this.tone(1000, 0.1, 'square', 0.06, null, 0.15); break;
      case 'clear': [600, 800, 1000, 1400].forEach((f, i) => this.tone(f, 0.18, 'square', 0.07, null, i * 0.12)); break;
      case 'boss': this.tone(100, 0.5, 'sawtooth', 0.1, 60); break;
    }
  }
};

/* ================= Sprites (original pixel art) ================= */
function mkSprite(rows, pal) {
  const h = rows.length, w = rows[0].length;
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d');
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const ch = rows[y][x]; if (ch === '.') continue;
    g.fillStyle = pal[ch] || '#f0f'; g.fillRect(x, y, 1, 1);
  }
  return c;
}
const HAT = [
  '....hhhhhhhh....', '...hhhhhhhhhh...', '.hhhhhhhhhhhhhh.', 'hhhhhhhhhhhhhhhh',
  '....ssssssss....', '....seessees....', '....ssssssss....', '.....ssssss.....',
  '...bbbbbbbbbb...', '..bbbbbbbbbbbb..', '.sbbbbbbbbbbbbs.', '.s.bbbbbbbbbb.s.',
  '...bbbbbbbbbb...', '...bb......bb...', '...bb......bb...', '..kkk......kkk..'];
const HELM = [
  '....hhhhhhhh....', '...hhhhhhhhhh...', '...hhhhhhhhhh...', '...hh.hhhh.hh...',
  '....ssssssss....', '....seessees....', '....ssssssss....', '.....ssssss.....',
  '...bbbbbbbbbb...', '..bbbbbbbbbbbb..', '.sbbbbbbbbbbbbs.', '.s.bbbbbbbbbb.s.',
  '...bbbbbbbbbb...', '...bb......bb...', '...bb......bb...', '..kkk......kkk..'];
const KANMURI = [
  '......hhhh......', '......hhhh......', '....hhhhhhhh....', '...hhhhhhhhhh...',
  '....ssssssss....', '....seessees....', '....ssssssss....', '.....ssssss.....',
  '..bbbbbbbbbbbb..', '.bbbbbbbbbbbbbb.', 'sbbbbbbbbbbbbbbs', 's.bbbbbbbbbbbb.s',
  '..bbbbbbbbbbbb..', '..bbbb....bbbb..', '..bbbb....bbbb..', '.kkkk......kkkk.'];
const PAL = {
  farmer: { h: '#d4a94a', s: '#f2c79a', e: '#222', b: '#3a6fb5', k: '#5a3a1a' },
  hunter: { h: '#4a3a2a', s: '#e8b890', e: '#222', b: '#3a8a4a', k: '#2a2a2a' },
  yamaotoko: { h: '#8a6a3a', s: '#d8a070', e: '#222', b: '#8a3a2a', k: '#3a2a1a' },
  ronin: { h: '#3a3a44', s: '#f2c79a', e: '#222', b: '#6a6a7a', k: '#2a2a2a' },
  ashigaru: { h: '#7a7a82', s: '#f2c79a', e: '#222', b: '#b23a3a', k: '#3a2a1a' },
  samurai: { h: '#2a2a3a', s: '#f2c79a', e: '#222', b: '#5a3a8a', k: '#2a2a2a' },
  ninja: { h: '#1e1e2e', s: '#1e1e2e', e: '#fff', b: '#1e1e2e', k: '#2a2a3a' },
  tsuji: { h: '#151515', s: '#f2c79a', e: '#c00', b: '#ececec', k: '#222' },
  daikan: { h: '#151515', s: '#f2c79a', e: '#222', b: '#c9a020', k: '#333' },
};
const SPR = {
  farmer: mkSprite(HAT, PAL.farmer),
  hunter: mkSprite(HAT, PAL.hunter),
  yamaotoko: mkSprite(HAT, PAL.yamaotoko),
  ronin: mkSprite(HAT, PAL.ronin),
  ashigaru: mkSprite(HELM, PAL.ashigaru),
  samurai: mkSprite(HELM, PAL.samurai),
  ninja: mkSprite(HELM, PAL.ninja),
  tsuji: mkSprite(HAT, PAL.tsuji),
  daikan: mkSprite(KANMURI, PAL.daikan),
  scythe: mkSprite(['....kkk.', '...kkkkk', '..kk..kk', '.kk....k', '.k......', '.w......', '.w......', '.w......'], { k: '#d8d8ee', w: '#8a5a2a' }),
  scytheRed: mkSprite(['....kkk.', '...kkkkk', '..kk..kk', '.kk....k', '.k......', '.w......', '.w......', '.w......'], { k: '#ff5050', w: '#8a5a2a' }),
  shuriken: mkSprite(['w......w', '.w....w.', '..w..w..', '...ww...', '...ww...', '..w..w..', '.w....w.', 'w......w'], { w: '#c8c8d8' }),
  bullet: mkSprite(['.rr.', 'rrrr', 'rrrr', '.rr.'], { r: '#ffb030' }),
  heart: mkSprite(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#ff4060' }),
  heartOff: mkSprite(['.rr.rr.', 'rrrrrrr', 'rrrrrrr', '.rrrrr.', '..rrr..', '...r...'], { r: '#444' }),
  waraji: mkSprite(['..yyyy..', '.yy..yy.', 'bbybbybb', 'bbbyybbb', 'bbbbbbbb', 'bbbbbbbb', '.bbbbbb.', '..bbbb..'], { b: '#c08a40', y: '#5a3a1a' }),
  onigiri: mkSprite(['...ww...', '..wwww..', '.wwwwww.', '.wwwwww.', 'wwwwwwww', 'wwwnnwww', 'wwnnnnww', 'wwnnnnww'], { w: '#f6f6f6', n: '#203020' }),
  omamori: mkSprite(['...gg...', '...gg...', '.rrrrrr.', '.rrrrrr.', '.rrggrr.', '.rrrrrr.', '.rrrrrr.', '..rrrr..'], { r: '#c02020', g: '#f0c030' }),
};
SPR.kama = SPR.scythe; SPR.akakama = SPR.scytheRed;

/* ================= Map ================= */
let tiles = [], obstacles = [], mapCanvas = null;
function buildMap(stage) {
  let seed = stage * 7919 + 13;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  tiles = []; for (let y = 0; y < MH; y++) tiles.push(new Array(MW).fill(0));
  const riverX = 18 + Math.floor(rnd() * 6);
  for (let y = 0; y < MH; y++) { tiles[y][riverX] = 3; tiles[y][riverX + 1] = 3; }
  const pathY = 6 + Math.floor(rnd() * 5);
  for (let x = 0; x < MW; x++) tiles[pathY][x] = tiles[pathY][x] === 3 ? 4 : 1;
  const pathX = 5 + Math.floor(rnd() * 8);
  for (let y = 0; y < MH; y++) if (tiles[y][pathX] === 0) tiles[y][pathX] = 1;
  const b2 = (pathY + 6) % MH; tiles[b2][riverX] = 4; tiles[b2][riverX + 1] = 4;
  for (let i = 0; i < 4; i++) {
    const px = 1 + Math.floor(rnd() * 26), py = 1 + Math.floor(rnd() * 13);
    for (let y = py; y < py + 3; y++) for (let x = px; x < px + 3; x++) if (y < MH && x < MW && tiles[y][x] === 0) tiles[y][x] = 2;
  }
  obstacles = []; const objs = [];
  const occupied = (tx, ty) => objs.some(o => tx >= o.tx && tx < o.tx + o.w && ty >= o.ty && ty < o.ty + o.h);
  const canPlace = (tx, ty, w, h) => {
    for (let y = ty; y < ty + h; y++) for (let x = tx; x < tx + w; x++) {
      if (x < 0 || y < 0 || x >= MW || y >= MH || tiles[y][x] !== 0 || occupied(x, y)) return false;
      if (Math.abs(x - pathX) <= 1 || Math.abs(y - pathY) <= 1) return false;
    }
    return true;
  };
  const tryPlace = (kind, w, h, n) => {
    let placed = 0, guard = 0;
    while (placed < n && guard++ < 200) {
      const tx = Math.floor(rnd() * MW), ty = Math.floor(rnd() * MH);
      if (canPlace(tx, ty, w, h)) { objs.push({ kind, tx, ty, w, h }); placed++; }
    }
  };
  tryPlace('house', 2, 2, 1 + (stage % 2));
  tryPlace('tree', 1, 1, 7);
  tryPlace('rock', 1, 1, 4);
  for (const o of objs) {
    const px = o.tx * TS, py = o.ty * TS;
    if (o.kind === 'tree') obstacles.push({ x: px + 3, y: py + 6, w: 10, h: 9 });
    else if (o.kind === 'rock') obstacles.push({ x: px + 2, y: py + 4, w: 12, h: 10 });
    else obstacles.push({ x: px, y: py + 8, w: 32, h: 24 });
  }
  mapCanvas = document.createElement('canvas'); mapCanvas.width = W; mapCanvas.height = H;
  const g = mapCanvas.getContext('2d');
  for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++) {
    const t = tiles[y][x], px = x * TS, py = y * TS;
    if (t === 0) {
      g.fillStyle = '#55a545'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#4a9539'; for (let i = 0; i < 4; i++) g.fillRect(px + Math.floor(rnd() * 15), py + Math.floor(rnd() * 15), 2, 1);
      if (rnd() < 0.15) { g.fillStyle = '#6cc058'; g.fillRect(px + Math.floor(rnd() * 12), py + Math.floor(rnd() * 12), 1, 3); }
    } else if (t === 1) {
      g.fillStyle = '#c9a978'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#b8976a'; for (let i = 0; i < 3; i++) g.fillRect(px + Math.floor(rnd() * 14), py + Math.floor(rnd() * 14), 2, 2);
    } else if (t === 2) {
      g.fillStyle = '#3f86a8'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#5cc04a'; for (let yy = 3; yy < TS; yy += 6) for (let xx = 2; xx < TS; xx += 4) g.fillRect(px + xx, py + yy, 1, 3);
      g.fillStyle = '#8a6a3a'; g.fillRect(px, py, TS, 1); g.fillRect(px, py, 1, TS);
    } else if (t === 3) {
      g.fillStyle = '#3778c8'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#5a98e0'; g.fillRect(px + 2, py + 5, 6, 1); g.fillRect(px + 8, py + 12, 6, 1);
    } else {
      g.fillStyle = '#a8743c'; g.fillRect(px, py, TS, TS);
      g.fillStyle = '#7a5028'; for (let yy = 0; yy < TS; yy += 4) g.fillRect(px, py + yy, TS, 1);
      g.fillStyle = '#5a3a1a'; g.fillRect(px, py, 1, TS); g.fillRect(px + 15, py, 1, TS);
    }
  }
  for (const o of objs) {
    const px = o.tx * TS, py = o.ty * TS;
    if (o.kind === 'tree') {
      g.fillStyle = '#6b4a2a'; g.fillRect(px + 6, py + 9, 4, 7);
      g.fillStyle = '#2f7f2f'; g.fillRect(px + 2, py + 3, 12, 8); g.fillRect(px + 4, py + 1, 8, 12);
      g.fillStyle = '#45a045'; g.fillRect(px + 4, py + 2, 5, 3); g.fillRect(px + 3, py + 5, 3, 2);
    } else if (o.kind === 'rock') {
      g.fillStyle = '#606060'; g.fillRect(px + 2, py + 6, 12, 8);
      g.fillStyle = '#8c8c8c'; g.fillRect(px + 3, py + 4, 10, 8);
      g.fillStyle = '#b4b4b4'; g.fillRect(px + 4, py + 5, 4, 2);
    } else {
      g.fillStyle = '#d8c8a0'; g.fillRect(px + 2, py + 14, 28, 18);
      g.fillStyle = '#6a4a2a'; g.fillRect(px + 2, py + 14, 28, 1); g.fillRect(px + 16, py + 14, 1, 18);
      g.fillStyle = '#503020'; g.fillRect(px + 6, py + 22, 6, 10);
      g.fillStyle = '#7a4a2a'; g.fillRect(px, py + 8, 32, 7); g.fillRect(px + 4, py + 4, 24, 4); g.fillRect(px + 10, py + 1, 12, 3);
      g.fillStyle = '#9a6a3a'; g.fillRect(px + 2, py + 9, 28, 1); g.fillRect(px + 6, py + 5, 20, 1);
    }
  }
}
