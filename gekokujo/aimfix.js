// White scythe aiming fix: keep one projectile on target when upgraded.
function fire() {
  const p = G.p;
  p.cd = Math.round(G.chr.cd * (G.mode ? 0.55 : 1));
  SFX.play('attack');

  let tx = null, ty = null, best = 1e9;
  const cand = (x, y) => {
    const d = Math.hypot(x - p.x, y - p.y);
    if (d < best) { best = d; tx = x; ty = y; }
  };
  for (const e of G.enemies) cand(e.x, e.y);
  if (G.boss && G.boss.state !== 'enter' && G.boss.state !== 'dead') cand(G.boss.x, G.boss.y);
  if (G.tsuji && G.tsuji.phase === 'dash') cand(G.tsuji.x, G.tsuji.y);

  const base = tx === null ? (p.face > 0 ? 0 : Math.PI) : Math.atan2(ty - p.y, tx - p.x);

  // 1本: 中央 / 2本: 1本は中央、もう1本だけ少し外側 / 3本: 中央+左右
  // 2本目の左右はフレームごとに交互にして見た目の偏りも防ぐ。
  const side = (G.frame & 1) ? 0.18 : -0.18;
  const offs = p.scythes === 1 ? [0] : p.scythes === 2 ? [0, side] : [-0.28, 0, 0.28];

  for (const o of offs) {
    const a = base + o;
    if (G.chr.weapon === 'slash') {
      G.scythes.push({ x: p.x, y: p.y, vx: Math.cos(a) * 3.2, vy: Math.sin(a) * 3.2, life: G.mode ? 26 : 18, rot: a, pierce: true, dmg: p.power + G.chr.dmg - 1, hits: new Set(), red: p.power > 1, kind: 'slash', r: 15 });
    } else {
      G.scythes.push({ x: p.x, y: p.y, vx: Math.cos(a) * 4.5, vy: Math.sin(a) * 4.5, life: 52, rot: 0, pierce: G.mode, dmg: p.power + G.chr.dmg - 1, hits: new Set(), red: p.power > 1, r: 10 });
    }
  }
}
