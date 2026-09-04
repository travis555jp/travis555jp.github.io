function fire() {
  const p = G.p; p.cd = Math.round(G.chr.cd * (G.mode ? 0.55 : 1)); SFX.play('attack');
  let tx = null, ty = null, best = 1e9;
  const cand = (x, y) => { const d = Math.hypot(x - p.x, y - p.y); if (d < best) { best = d; tx = x; ty = y; } };
  for (const e of G.enemies) cand(e.x, e.y);
  if (G.boss && G.boss.state !== 'enter' && G.boss.state !== 'dead') cand(G.boss.x, G.boss.y);
  if (G.tsuji && G.tsuji.phase === 'dash') cand(G.tsuji.x, G.tsuji.y);
  const base = tx === null ? (p.face > 0 ? 0 : Math.PI) : Math.atan2(ty - p.y, tx - p.x);
  const offs = p.scythes === 1 ? [0] : p.scythes === 2 ? [-0.22, 0.22] : [-0.35, 0, 0.35];
  for (const o of offs) {
    const a = base + o;
    if (G.chr.weapon === 'slash') G.scythes.push({ x: p.x, y: p.y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, life: G.mode ? 26 : 18, rot: a, pierce: true, dmg: p.power + G.chr.dmg - 1, hits: new Set(), red: p.power > 1, kind: 'slash', r: 15 });
    else G.scythes.push({ x: p.x, y: p.y, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, life: 52, rot: 0, pierce: G.mode, dmg: p.power + G.chr.dmg - 1, hits: new Set(), red: p.power > 1, r: 10 });
  }
}

/* ================= Draw ================= */
function txt(s, x, y, size, color, align, outline) {
  ctx.font = `bold ${size}px "Courier New", monospace`; ctx.textAlign = align || 'left'; ctx.textBaseline = 'top';
  if (outline !== false) { ctx.lineWidth = Math.max(2, size / 5); ctx.strokeStyle = '#000'; ctx.lineJoin = 'round'; ctx.strokeText(s, x, y); }
  ctx.fillStyle = color || '#fff'; ctx.fillText(s, x, y);
}
function drawSpr(spr, x, y, face, scale, rot, alpha) {
  const w = spr.width * (scale || 1), h = spr.height * (scale || 1);
  ctx.save(); ctx.translate(Math.round(x), Math.round(y));
  if (alpha !== undefined) ctx.globalAlpha = alpha;
  if (rot) ctx.rotate(rot);
  if (face < 0) ctx.scale(-1, 1);
  ctx.drawImage(spr, -w / 2, -h / 2, w, h); ctx.restore();
}
function drawHuman(spr, x, y, face, anim, moving, flash, scale) {
  const bob = moving && Math.floor(anim / 8) % 2 === 0 ? 1 : 0;
  drawSpr(spr, x, y - bob, face, scale || 1);
  if (flash > 0) { ctx.save(); ctx.globalAlpha = 0.7; ctx.fillStyle = '#fff'; const s = (scale || 1) * 16; ctx.fillRect(Math.round(x - s / 2), Math.round(y - s / 2 - bob), s, s); ctx.restore(); }
}
function draw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
  if (G.state === 'title') { drawTitle(); return; }
  if (G.state === 'howto') { drawHowto(); return; }
  if (G.state === 'select') { drawSelect(); return; }
  if (G.state === 'ranking') { drawRanking(); return; }
  const sh = G.shake;
  ctx.save();
  if (sh > 0) ctx.translate(Math.round((Math.random() - 0.5) * sh * 2), Math.round((Math.random() - 0.5) * sh * 2));
  ctx.drawImage(mapCanvas, 0, 0);
  if (G.mode) { ctx.fillStyle = `rgba(255,${120 + Math.floor(Math.sin(G.frame * 0.3) * 40)},0,${0.1 + Math.sin(G.frame * 0.4) * 0.04})`; ctx.fillRect(0, 0, W, H); }
  const p = G.p;
  for (const it of G.items) { if (it.life < 120 && Math.floor(it.life / 6) % 2 === 0) continue; const bob = Math.sin(G.frame * 0.15 + it.x) * 1.5; ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(it.x - 4, it.y + 4, 8, 2); drawSpr(SPR[it.type], it.x, it.y + bob - 2, 1, 1); }
  const T = G.tsuji;
  if (T && T.phase === 'warn') {
    if (Math.floor(T.t / 5) % 2 === 0) {
      ctx.strokeStyle = '#ff3030'; ctx.lineWidth = 1; ctx.setLineDash([6, 4]); ctx.beginPath();
      if (T.axis === 'h') { ctx.moveTo(0, T.pos); ctx.lineTo(W, T.pos); } else { ctx.moveTo(T.pos, 0); ctx.lineTo(T.pos, H); }
      ctx.stroke(); ctx.setLineDash([]);
    }
    const wx = T.axis === 'h' ? (T.dir > 0 ? 6 : W - 30) : T.pos - 12, wy = T.axis === 'h' ? T.pos - 22 : (T.dir > 0 ? 24 : H - 40);
    txt('！！', wx, wy, 18, Math.floor(T.t / 4) % 2 ? '#ff3030' : '#ffff40', 'left');
  }
  for (const s of G.slashes) { ctx.strokeStyle = `rgba(255,255,255,${s.life / 10})`; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(s.x, s.y, 12, -1, 1); ctx.stroke(); }
  for (const e of G.enemies) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(e.x - 6), Math.round(e.y + 7), 12, 2);
    if (e.type === 'samurai') {
      if (e.windup > 0) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(e.x + e.face * 6, e.y - 2); ctx.lineTo(e.x + e.face * 6, e.y - 16); ctx.stroke(); }
      ctx.fillStyle = '#e8c040'; ctx.fillRect(Math.round(e.x - 2), Math.round(e.y - 10), 4, 2);
    }
    drawHuman(SPR[e.type], e.x, e.y, e.face, e.anim, true, e.flash, 1, e.ghost > 0);
    if (e.ghost > 0) { ctx.save(); ctx.globalAlpha = 0.5; ctx.fillStyle = '#88f'; ctx.fillRect(Math.round(e.x - 3), Math.round(e.y - 12), 6, 2); ctx.restore(); }
  }
  if (T && T.phase === 'dash') {
    for (let i = 0; i < T.trail.length; i++) { const tr = T.trail[i]; ctx.fillStyle = `rgba(255,40,40,${(i + 1) / T.trail.length * 0.5})`; ctx.fillRect(tr.x - 3, tr.y - 8, 6, 16); }
    drawHuman(SPR.tsuji, T.x, T.y, T.axis === 'h' ? T.dir : 1, G.frame, true, T.flash);
    ctx.strokeStyle = '#f44'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(T.x - 14, T.y + 2); ctx.lineTo(T.x + 14, T.y - 6); ctx.stroke();
  }
  const b = G.boss;
  if (b && b.state !== 'dead') {
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(Math.round(b.x - 12), Math.round(b.y + 14), 24, 3);
    if (b.state === 'charge' && b.t < 30) { ctx.fillStyle = 'rgba(255,60,60,0.35)'; ctx.fillRect(Math.round(b.x - 20), Math.round(b.y - 20), 40, 40); }
    drawHuman(SPR.daikan, b.x, b.y, b.face, G.frame, b.state === 'move' || b.state === 'dash', b.flash, 2);
    if (b.enraged) { ctx.fillStyle = '#ff4040'; ctx.fillRect(Math.round(b.x - 8), Math.round(b.y - 26), 3, 3); ctx.fillRect(Math.round(b.x + 5), Math.round(b.y - 26), 3, 3); }
  }
  if (!(p.inv > 0 && p.shield <= 0 && Math.floor(p.inv / 4) % 2 === 0)) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(Math.round(p.x - 6), Math.round(p.y + 7), 12, 2);
    if (G.mode) drawSpr(SPR[G.chr.id], p.x - p.face * 4, p.y, p.face, 1, 0, 0.3);
    drawHuman(SPR[G.chr.id], p.x, p.y, p.face, p.anim, p.moving, 0);
    if (p.shield > 0) { ctx.strokeStyle = `rgba(255,224,64,${0.5 + Math.sin(G.frame * 0.4) * 0.3})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(p.x, p.y, 13, 0, Math.PI * 2); ctx.stroke(); }
    if (p.sandal > 0 && p.moving && G.frame % 4 === 0) G.particles.push({ x: p.x - p.face * 4, y: p.y + 7, vx: -p.face * 0.5, vy: -0.3, life: 12, color: '#c9a978', size: 2 });
  }
  for (const s of G.scythes) {
    if (s.kind === 'slash') { ctx.save(); ctx.translate(s.x, s.y); ctx.rotate(s.rot); ctx.strokeStyle = s.red ? '#ff6060' : (G.mode ? '#ffe040' : '#fff'); ctx.lineWidth = G.mode ? 3 : 2; ctx.beginPath(); ctx.arc(-6, 0, G.mode ? 18 : 14, -0.9, 0.9); ctx.stroke(); ctx.restore(); }
    else drawSpr(s.red ? SPR.scytheRed : SPR.scythe, s.x, s.y, 1, G.mode ? 1.5 : 1, s.rot);
  }
  for (const q of G.ebullets) { if (q.kind === 'shuriken') drawSpr(SPR.shuriken, q.x, q.y, 1, 1, q.rot); else drawSpr(SPR.bullet, q.x, q.y, 1, 1); }
  for (const f of G.flyers) drawSpr(f.spr, f.x, f.y, f.face, f.scale || 1, f.rot, Math.min(1, f.life / 10));
  for (const q of G.particles) { ctx.fillStyle = q.color; ctx.fillRect(Math.round(q.x), Math.round(q.y), q.size, q.size); }
  for (const q of G.popups) txt(q.text, q.x, q.y - 4, q.size, q.color, 'center');
  ctx.restore();
  if (G.flash > 0) { ctx.fillStyle = `rgba(255,255,255,${G.flash / 40})`; ctx.fillRect(0, 0, W, H); }
  drawHUD();
  if (G.state === 'gameover') drawGameOver();
}
