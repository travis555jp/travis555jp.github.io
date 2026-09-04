function startMode() {
  G.mode = true; G.modeTimer = 480; G.modeBanner = 90; G.gauge = 100; SFX.play('gekokujo');
  G.shake = 6; G.flash = 12; burst(G.p.x, G.p.y, '#ffe040', 30, 4);
}
function dropItem(x, y) {
  const r = Math.random();
  const type = r < 0.25 ? 'waraji' : r < 0.5 ? 'onigiri' : r < 0.68 ? 'kama' : r < 0.85 ? 'akakama' : 'omamori';
  G.items.push({ type, x: Math.max(8, Math.min(W - 8, x)), y: Math.max(8, Math.min(H - 8, y)), life: 600 });
}
function hurtPlayer(d) {
  const p = G.p; if (p.inv > 0 || G.state !== 'playing') return;
  p.hp -= d; p.inv = 75; G.shake = Math.max(G.shake, 6); SFX.play('damage');
  popup(p.x, p.y - 14, '痛っ！', '#ff6060', 10); burst(p.x, p.y, '#ff4040', 10, 2);
  if (p.hp <= 0) { p.hp = 0; gameOver(); }
}
function gameOver() {
  G.state = 'gameover'; G.overT = 0; SFX.play('gameover');
  const entry = { score: G.score, combo: G.maxCombo, kills: G.kills, time: Math.floor(G.time / 60), stage: G.stage, chr: G.chr.name, date: Date.now() };
  const idx = RankingStore.add(entry);
  G.result = { ...entry, rank: rankOf(G.score), est: estRank(G.score), place: idx };
}
function spawnEnemy(type, sx, sy) {
  const d = EDEF[type]; let x = sx, y = sy;
  if (x === undefined) {
    for (let i = 0; i < 8; i++) {
      const s = Math.floor(Math.random() * 4);
      if (s === 0) { x = -12; y = Math.random() * H; } else if (s === 1) { x = W + 12; y = Math.random() * H; }
      else if (s === 2) { x = Math.random() * W; y = -12; } else { x = Math.random() * W; y = H + 12; }
      if (Math.hypot(x - G.p.x, y - G.p.y) > 90) break;
    }
  }
  const hp = Math.ceil(d.hp * G.hpMul);
  G.enemies.push({ type, x, y, hp, maxHp: hp, spd: d.spd, score: d.score, face: 1, anim: 0, stuck: 0, ghost: 0, flash: 0, cd: 60 + Math.random() * 60, windup: 0, kx: 0, ky: 0, dead: false });
}
function difficulty() {
  const s = G.time / 60;
  let interval = s < 30 ? 90 : s < 120 ? 62 : s < 180 ? 46 : s < 300 ? 36 : 26;
  interval = Math.max(18, interval - G.stage * 3);
  const maxE = Math.min(30, 10 + Math.floor(s / 15) + G.stage * 2);
  const wS = s > 40 ? 0.35 : 0, wN = s > 180 ? 0.5 : s > 90 ? 0.32 : s > 45 ? 0.12 : 0;
  return { interval, maxE, wS, wN, s };
}
function spawnBoss() {
  const hp = Math.floor(60 * (1 + 0.5 * (G.stage - 1)));
  G.boss = { x: W / 2, y: -40, hp, maxHp: hp, state: 'enter', t: 0, cd: 110, face: 1, flash: 0, vx: 0, vy: 0, enraged: false, pat: 0 };
  G.msg = { text: '代官 出現！', t: 120, size: 20, color: '#ffd040' }; SFX.play('boss'); G.shake = 8;
}
function spawnTsuji() {
  const p = G.p, axis = Math.random() < 0.5 ? 'h' : 'v', dir = Math.random() < 0.5 ? 1 : -1;
  const pos = axis === 'h' ? Math.max(14, Math.min(H - 14, p.y)) : Math.max(14, Math.min(W - 14, p.x));
  G.tsuji = { phase: 'warn', t: 60, axis, dir, pos, x: axis === 'h' ? (dir > 0 ? -20 : W + 20) : pos, y: axis === 'h' ? pos : (dir > 0 ? -20 : H + 20), hp: Math.ceil(6 * G.hpMul), flash: 0, hit: false, trail: [] };
  G.msg = { text: '辻斬り！', t: 60, size: 18, color: '#ff4040' }; SFX.play('warn');
}
function damageEnemy(e, d, vx, vy) {
  e.hp -= d; e.flash = 6; e.kx += vx * 0.6; e.ky += vy * 0.6; SFX.play('hit');
  burst(e.x, e.y, '#fff', 3, 1.5);
  if (e.hp <= 0 && !e.dead) {
    e.dead = true; onKill(e.x, e.y, e.score);
    const big = G.mode;
    const a = Math.atan2(vy, vx);
    G.flyers.push({ spr: SPR[e.type], x: e.x, y: e.y, vx: big ? Math.cos(a) * 6 + (Math.random() - 0.5) : (Math.random() - 0.5) * 1.5, vy: big ? Math.sin(a) * 6 - 3 : -3.2, rot: 0, rs: big ? 0.6 : 0.25, life: big ? 45 : 32, face: e.face });
    popup(e.x, e.y - 4, 'ポン！', '#ffe040', 10); burst(e.x, e.y, big ? '#ffe040' : '#ffb0b0', big ? 14 : 6, big ? 4 : 2);
  }
}
function damageBoss(d) {
  const b = G.boss; if (!b || b.state === 'enter' || b.state === 'dead') return;
  b.hp -= d; b.flash = 5; SFX.play('hit'); burst(b.x, b.y, '#fff', 3, 2);
  if (!b.enraged && b.hp <= b.maxHp * 0.4) { b.enraged = true; G.msg = { text: '代官、激怒！', t: 80, size: 16, color: '#ff6060' }; }
  if (b.hp <= 0) bossDefeated();
}
function bossDefeated() {
  const b = G.boss; b.state = 'dead';
  onKill(b.x, b.y, 3000 * G.stage);
  for (const e of G.enemies) { burst(e.x, e.y, '#ffe040', 6, 3); }
  G.enemies = []; G.ebullets = []; G.tsuji = null;
  burst(b.x, b.y, '#ffe040', 60, 5); burst(b.x, b.y, '#fff', 30, 3);
  G.flyers.push({ spr: SPR.daikan, x: b.x, y: b.y, vx: 2, vy: -6, rot: 0, rs: 0.5, life: 70, face: 1, scale: 2 });
  G.state = 'clear'; G.clearT = 200; G.shake = 10; G.flash = 20; SFX.play('clear');
  G.msg = { text: '下剋上 成功', t: 200, size: 26, color: '#ffe040' };
}
function step() {
  G.frame++;
  if (G.state === 'playing') updateGame();
  else if (G.state === 'clear') { updateFx(); if (--G.clearT <= 0) { G.stage++; G.p.hp = Math.min(G.p.maxHp, G.p.hp + 2); G.state = 'playing'; startStage(); } }
  else if (G.state === 'gameover') { G.overT++; updateFx(); }
  if (G.shake > 0) G.shake *= 0.85; if (G.shake < 0.3) G.shake = 0;
  if (G.flash > 0) G.flash--;
}
function updateFx() {
  for (const q of G.particles) { q.x += q.vx; q.y += q.vy; q.vy += 0.05; q.life--; }
  G.particles = G.particles.filter(q => q.life > 0);
  for (const q of G.popups) { q.y -= 0.5; q.life--; }
  G.popups = G.popups.filter(q => q.life > 0);
  for (const f of G.flyers) { f.x += f.vx; f.y += f.vy; f.vy += 0.18; f.rot += f.rs; f.life--; }
  G.flyers = G.flyers.filter(f => f.life > 0);
  for (const s of G.slashes) s.life--;
  G.slashes = G.slashes.filter(s => s.life > 0);
  if (G.msg && --G.msg.t <= 0) G.msg = null;
  if (G.cmsg && --G.cmsg.t <= 0) G.cmsg = null;
}
function updateGame() {
  const p = G.p; G.time++;
  const D = difficulty();
  let dx = (keys.ArrowRight || keys.KeyD ? 1 : 0) - (keys.ArrowLeft || keys.KeyA ? 1 : 0) + input.sx;
  let dy = (keys.ArrowDown || keys.KeyS ? 1 : 0) - (keys.ArrowUp || keys.KeyW ? 1 : 0) + input.sy;
  const l = Math.hypot(dx, dy); if (l > 1) { dx /= l; dy /= l; }
  const spd = G.chr.spd * (G.mode ? 1.4 : 1) * (p.sandal > 0 ? 1.3 : 1);
  p.moving = l > 0.05;
  if (p.moving) { moveEnt(p, dx * spd, dy * spd, true); p.anim++; if (Math.abs(dx) > 0.2) p.face = dx > 0 ? 1 : -1; }
  if (p.cd > 0) p.cd--; if (p.inv > 0) p.inv--; if (p.sandal > 0) p.sandal--; if (p.shield > 0) p.shield--;
  if ((keys.Space || input.attack) && p.cd <= 0) fire();
  if (G.mode) { if (--G.modeTimer <= 0) { G.mode = false; G.gauge = 0; } if (G.modeBanner > 0) G.modeBanner--; if (G.frame % 3 === 0) G.particles.push({ x: p.x + (Math.random() - 0.5) * 12, y: p.y + 6, vx: 0, vy: -0.6, life: 20, color: '#ffe040', size: 2 }); }
  else { G.noKill++; if (G.noKill > 90 && G.gauge > 0) G.gauge = Math.max(0, G.gauge - 0.18); }
  if (G.combo > 0 && --G.comboTimer <= 0) G.combo = 0;
  if (!G.boss) {
    if (G.stageKills >= 28 + G.stage * 10) spawnBoss();
    else if (--G.spawnT <= 0) {
      G.spawnT = D.interval;
      if (G.enemies.length < D.maxE) {
        const r = Math.random();
        spawnEnemy(r < D.wN ? 'ninja' : r < D.wN + D.wS ? 'samurai' : 'ashigaru');
        if (D.s > 120 && G.enemies.length < D.maxE - 2 && Math.random() < 0.4) spawnEnemy('ashigaru');
      }
    }
    if (D.s > 45 && !G.tsuji && --G.tsTimer <= 0) { spawnTsuji(); G.tsTimer = D.s > 180 ? 300 + Math.random() * 240 : 540 + Math.random() * 400; }
  }
  for (const e of G.enemies) {
    e.anim++; if (e.flash > 0) e.flash--; if (e.ghost > 0) e.ghost--;
    const ex = p.x - e.x, ey = p.y - e.y, dist = Math.hypot(ex, ey) || 1, ux = ex / dist, uy = ey / dist;
    let mx = 0, my = 0;
    if (e.type === 'ninja') {
      if (e.cd > 0) e.cd--;
      if (dist > 110) { mx = ux; my = uy; } else if (dist < 70) { mx = -ux; my = -uy; } else { mx = -uy * 0.7; my = ux * 0.7; }
      if (e.cd <= 0 && dist < 170 && e.x > 0 && e.x < W && e.y > 0 && e.y < H) { G.ebullets.push({ x: e.x, y: e.y, vx: ux * 2.6, vy: uy * 2.6, life: 120, kind: 'shuriken', rot: 0 }); e.cd = 90 + Math.random() * 50; }
    } else if (e.type === 'samurai') {
      if (e.cd > 0) e.cd--;
      if (e.windup > 0) { e.windup--; if (e.windup === 0) { G.slashes.push({ x: e.x + e.face * 12, y: e.y, life: 10 }); if (dist < 28) hurtPlayer(2); e.cd = 70; } }
      else if (dist < 22 && e.cd <= 0) e.windup = 25;
      else { mx = ux; my = uy; }
    } else { mx = ux; my = uy; }
    const sp = e.spd * G.spdMul;
    const ddx = mx * sp + e.kx, ddy = my * sp + e.ky; e.kx *= 0.8; e.ky *= 0.8;
    if (mx) e.face = mx > 0 ? 1 : -1;
    if (e.ghost > 0 || e.x < 4 || e.x > W - 4 || e.y < 4 || e.y > H - 4) { e.x += ddx; e.y += ddy; }
    else { const moved = moveEnt(e, ddx, ddy, false); if (!moved && (ddx || ddy)) { if (++e.stuck > 25) { e.ghost = 60; e.stuck = 0; } } else e.stuck = 0; }
    e.x = Math.max(-20, Math.min(W + 20, e.x)); e.y = Math.max(-20, Math.min(H + 20, e.y));
    if (dist < 11 && e.windup === 0) { hurtPlayer(1); e.kx = -ux * 3; e.ky = -uy * 3; }
  }
  G.enemies = G.enemies.filter(e => !e.dead);
  const T = G.tsuji;
  if (T) {
    if (T.phase === 'warn') { if (--T.t <= 0) T.phase = 'dash'; }
    else {
      T.trail.push({ x: T.x, y: T.y }); if (T.trail.length > 8) T.trail.shift();
      if (T.axis === 'h') T.x += 6.5 * T.dir; else T.y += 6.5 * T.dir;
      if (T.flash > 0) T.flash--;
      if (!T.hit && Math.hypot(T.x - p.x, T.y - p.y) < 13) { T.hit = true; hurtPlayer(3); }
      if (T.x < -30 || T.x > W + 30 || T.y < -30 || T.y > H + 30) G.tsuji = null;
    }
  }
  const b = G.boss;
  if (b && b.state !== 'dead') {
    if (b.flash > 0) b.flash--;
    const bx = p.x - b.x, by = p.y - b.y, dist = Math.hypot(bx, by) || 1, ux = bx / dist, uy = by / dist;
    const spdB = b.enraged ? 0.75 : 0.45;
    if (b.state === 'enter') { b.y += 1; if (b.y >= 50) { b.state = 'move'; b.t = 0; } }
    else if (b.state === 'move') {
      b.x += ux * spdB; b.y += uy * spdB; if (ux) b.face = ux > 0 ? 1 : -1;
      if (--b.cd <= 0) { b.pat = (b.pat + 1) % 3; b.state = ['summon', 'fan', 'charge'][b.pat]; b.t = b.state === 'fan' ? 34 : 40; }
    } else if (b.state === 'summon') {
      if (--b.t === 20) { const n = b.enraged ? 4 : 3; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; spawnEnemy(b.enraged && i === 0 ? 'ninja' : 'ashigaru', b.x + Math.cos(a) * 24, b.y + Math.sin(a) * 24); } popup(b.x, b.y - 22, '出あえ！', '#ffd040', 10); }
      if (b.t <= 0) { b.state = 'move'; b.cd = b.enraged ? 60 : 110; }
    } else if (b.state === 'fan') {
      const shoot = (n) => { const base = Math.atan2(uy, ux); for (let i = 0; i < n; i++) { const a = base + (i - (n - 1) / 2) * 0.22; G.ebullets.push({ x: b.x, y: b.y, vx: Math.cos(a) * 2.2, vy: Math.sin(a) * 2.2, life: 160, kind: 'bullet' }); } SFX.play('attack'); };
      b.t--; if (b.t === 20) shoot(b.enraged ? 9 : 7); if (b.enraged && b.t === 4) shoot(9); if (b.t <= 0) { b.state = 'move'; b.cd = b.enraged ? 60 : 110; }
    } else if (b.state === 'charge') {
      if (--b.t > 0) { if (b.t === 30) popup(b.x, b.y - 24, '！', '#ff4040', 16); b.x += (Math.random() - 0.5); }
      else { b.state = 'dash'; b.vx = ux * (b.enraged ? 5 : 4); b.vy = uy * (b.enraged ? 5 : 4); b.t = 42; b.face = ux > 0 ? 1 : -1; }
    } else if (b.state === 'dash') {
      b.x += b.vx; b.y += b.vy; if (b.x < 16 || b.x > W - 16) b.vx *= -1; if (b.y < 30 || b.y > H - 16) b.vy *= -1; if (G.frame % 2 === 0) burst(b.x, b.y + 12, '#c9a978', 2, 1.5); if (dist < 20) hurtPlayer(2); if (--b.t <= 0) { b.state = 'move'; b.cd = b.enraged ? 60 : 110; }
    }
    if (b.state !== 'dash' && b.state !== 'enter' && dist < 18) hurtPlayer(1);
    b.x = Math.max(16, Math.min(W - 16, b.x)); b.y = Math.max(-40, Math.min(H - 16, b.y));
  }
  for (const s of G.scythes) {
    s.x += s.vx; s.y += s.vy; s.life--; if (s.kind !== 'slash') s.rot += 0.45;
    let dead = false;
    for (const e of G.enemies) { if (e.dead || s.hits.has(e)) continue; if (Math.hypot(e.x - s.x, e.y - s.y) < s.r) { s.hits.add(e); damageEnemy(e, s.dmg, s.vx, s.vy); if (!s.pierce) { dead = true; break; } } }
    if (!dead && b && b.state !== 'enter' && b.state !== 'dead' && !s.hits.has(b) && Math.hypot(b.x - s.x, b.y - s.y) < s.r + 8) { s.hits.add(b); damageBoss(s.dmg); if (!s.pierce) dead = true; }
    if (!dead && G.tsuji && G.tsuji.phase === 'dash' && !s.hits.has(G.tsuji) && Math.hypot(G.tsuji.x - s.x, G.tsuji.y - s.y) < s.r + 1) {
      const t = G.tsuji; s.hits.add(t); t.hp -= s.dmg; t.flash = 5; SFX.play('hit'); burst(t.x, t.y, '#fff', 3, 2);
      if (t.hp <= 0) { onKill(t.x, t.y, 800); popup(t.x, t.y - 4, '返り討ち！', '#ffe040', 11); burst(t.x, t.y, '#ffe040', 16, 4); G.flyers.push({ spr: SPR.tsuji, x: t.x, y: t.y, vx: s.vx * 1.2, vy: -4, rot: 0, rs: 0.5, life: 45, face: 1 }); G.tsuji = null; }
      if (!s.pierce) dead = true;
    }
    if (dead || s.life <= 0 || s.x < -10 || s.x > W + 10 || s.y < -10 || s.y > H + 10) s.dead = true;
  }
  G.scythes = G.scythes.filter(s => !s.dead);
  for (const q of G.ebullets) { q.x += q.vx; q.y += q.vy; q.life--; if (q.kind === 'shuriken') q.rot += 0.3; if (Math.hypot(q.x - p.x, q.y - p.y) < 8) { hurtPlayer(1); q.life = 0; } if (p.shield > 0 && Math.hypot(q.x - p.x, q.y - p.y) < 14) { q.life = 0; burst(q.x, q.y, '#ffe040', 3, 1); } }
  G.ebullets = G.ebullets.filter(q => q.life > 0 && q.x > -10 && q.x < W + 10 && q.y > -10 && q.y < H + 10);
  for (const it of G.items) {
    it.life--;
    if (Math.hypot(it.x - p.x, it.y - p.y) < 11) {
      it.life = 0; SFX.play('item'); popup(p.x, p.y - 16, ITEM_NAME[it.type], '#80ff80', 10); burst(it.x, it.y, '#80ff80', 8, 2);
      if (it.type === 'waraji') p.sandal = 600; else if (it.type === 'onigiri') p.hp = Math.min(p.maxHp, p.hp + 2); else if (it.type === 'kama') { if (p.scythes < 3) p.scythes++; else G.score += 500; } else if (it.type === 'akakama') { if (p.power < 3) p.power++; else G.score += 500; } else { p.inv = Math.max(p.inv, 240); p.shield = 240; }
    }
  }
  G.items = G.items.filter(it => it.life > 0); updateFx();
}
