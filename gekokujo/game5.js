function drawHUD() {
  const p = G.p;
  ctx.fillStyle = G.mode ? 'rgba(80,20,0,0.65)' : 'rgba(0,0,0,0.55)'; ctx.fillRect(0, 0, W, 24);
  for (let i = 0; i < p.maxHp; i++) ctx.drawImage(i < p.hp ? SPR.heart : SPR.heartOff, 4 + i * 9, 4);
  txt('SCORE ' + String(G.score).padStart(7, '0'), 82, 3, 9, '#fff');
  txt('ST' + G.stage + ' ' + fmtTime(G.time), 82, 13, 8, '#bbb');
  const gx = 176, gw = 110;
  ctx.fillStyle = '#222'; ctx.fillRect(gx, 6, gw, 6); ctx.strokeStyle = '#888'; ctx.lineWidth = 1; ctx.strokeRect(gx + 0.5, 6.5, gw - 1, 5);
  const gv = G.mode ? G.modeTimer / 480 : G.gauge / 100;
  ctx.fillStyle = G.mode ? (G.frame % 6 < 3 ? '#ffe040' : '#ff8020') : G.gauge > 70 ? '#ffb020' : '#e05030';
  ctx.fillRect(gx + 1, 7, Math.round((gw - 2) * gv), 4);
  txt('下剋上ゲージ', gx, 13, 8, G.mode ? '#ffe040' : '#ddd');
  if (G.combo > 1) {
    const big = G.combo >= 30, col = G.combo >= 50 ? '#ff60ff' : G.combo >= 10 ? '#ffe040' : '#fff';
    txt(G.combo + ' COMBO', W - 6, 3, big ? 12 : 10, col, 'right');
    txt('x' + comboMult().toFixed(1), W - 6, big ? 15 : 13, 8, col, 'right');
  }
  if (G.mode && G.modeBanner > 0) {
    const s = 34 + Math.sin(G.frame * 0.5) * 3;
    txt('下剋上！', W / 2 + (Math.random() - 0.5) * 3, H / 2 - 30, s, G.frame % 4 < 2 ? '#ffe040' : '#ff8020', 'center');
  } else if (G.mode && G.frame % 8 < 6) txt('下剋上モード', W / 2, 28, 10, '#ffe040', 'center');
  if (G.cmsg) { const t = G.cmsg.t; const size = G.cmsg.big ? 24 + (t > 50 ? (t - 50) * 2 : 0) : 14 + (t > 50 ? (t - 50) : 0); txt(G.cmsg.text, W / 2, H / 2 - 60, size, G.cmsg.big ? (G.frame % 4 < 2 ? '#ff60ff' : '#ffe040') : '#ffe040', 'center'); }
  if (G.msg) { const a = Math.min(1, G.msg.t / 20); ctx.save(); ctx.globalAlpha = a; txt(G.msg.text, W / 2, H / 2 - G.msg.size / 2, G.msg.size, G.msg.color, 'center'); ctx.restore(); }
  const b = G.boss;
  if (b && b.state !== 'dead' && b.state !== 'enter') {
    ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(W / 2 - 80, H - 14, 160, 10);
    ctx.fillStyle = b.enraged ? '#ff3030' : '#c9a020'; ctx.fillRect(W / 2 - 78, H - 12, Math.round(156 * Math.max(0, b.hp) / b.maxHp), 6);
    txt('代官', W / 2 - 84, H - 16, 9, '#ffd040', 'right');
  }
  if (p.scythes > 1 || p.power > 1) txt('鎌x' + p.scythes + ' 威力' + p.power, W - 6, H - 12, 8, '#ccc', 'right');
}
function fmtTime(f) { const s = Math.floor(f / 60); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0'); }
function button(label, x, y, w, h, selected) {
  ctx.fillStyle = selected ? '#ffe040' : 'rgba(0,0,0,0.5)'; ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = selected ? '#fff' : '#aaa'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
  txt(label, x + w / 2, y + h / 2 - 6, 11, selected ? '#000' : '#fff', 'center', false);
}
const MENU = [['START', 152], ['HOW TO PLAY', 180], ['RANKING', 208]];
function drawTitle() {
  ctx.fillStyle = '#1a2a4a'; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#3d7a3a'; ctx.fillRect(0, 180, W, H - 180);
  ctx.fillStyle = '#c9a978'; ctx.fillRect(0, 232, W, 10);
  for (let i = 0; i < 20; i++) { const x = (i * 97) % W, y = (i * 53) % 150 + 10; ctx.fillStyle = (G.frame + i * 13) % 60 < 30 ? '#fff' : '#889'; ctx.fillRect(x, y, 1, 1); }
  txt('GEKOKUJO', W / 2 + 3, 51, 48, '#7a1a1a', 'center', false);
  txt('GEKOKUJO', W / 2, 48, 48, '#ffe040', 'center');
  txt('〜 農民、権力に鎌を投げる 〜', W / 2, 104, 11, '#fff', 'center');
  const bob = Math.floor(G.frame / 12) % 2;
  drawSpr(SPR.farmer, 60, 218 - bob, 1, 2); drawSpr(SPR.hunter, 24, 224 - (1 - bob), 1, 2); drawSpr(SPR.yamaotoko, 96, 224 - (1 - bob), 1, 2); drawSpr(SPR.ronin, 132, 220 - bob, 1, 2);
  drawSpr(SPR.daikan, 420, 210 - (1 - bob), -1, 2.5); drawSpr(SPR.ashigaru, 372, 220 - bob, -1, 2); drawSpr(SPR.scythe, 120 + (G.frame * 3) % 200, 210, 1, 2, G.frame * 0.3);
  MENU.forEach((m, i) => button(m[0], W / 2 - 80, m[1], 160, 24, G.sel === i));
  txt(isTouch ? 'タップで選択' : 'Enter / Space で決定', W / 2, 246, 8, '#ccc', 'center');
}
function drawSelect() {
  ctx.fillStyle = '#1a2a4a'; ctx.fillRect(0, 0, W, H); txt('キャラクター選択', W / 2, 12, 18, '#ffe040', 'center');
  CHARS.forEach((c, i) => {
    const x = 10 + i * 116, y = 44, w = 108, h = 160, sel = G.charSel === i;
    ctx.fillStyle = sel ? 'rgba(255,224,64,0.18)' : 'rgba(0,0,0,0.45)'; ctx.fillRect(x, y, w, h); ctx.strokeStyle = sel ? '#ffe040' : '#777'; ctx.lineWidth = 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2);
    const bob = sel ? Math.floor(G.frame / 10) % 2 : 0; drawSpr(SPR[c.id], x + w / 2, y + 42 - bob, 1, 2.5); txt(c.name, x + w / 2, y + 74, 14, sel ? '#ffe040' : '#fff', 'center'); c.desc.forEach((d, j) => txt(d, x + w / 2, y + 96 + j * 14, 7, '#ddd', 'center'));
    const bar = (label, v, max, yy) => { txt(label, x + 10, yy, 7, '#aaa'); ctx.fillStyle = '#333'; ctx.fillRect(x + 36, yy + 1, 64, 5); ctx.fillStyle = sel ? '#ffe040' : '#aaa'; ctx.fillRect(x + 36, yy + 1, Math.round(64 * v / max), 5); };
    bar('HP', c.hp, 8, y + 126); bar('速さ', c.spd, 1.8, y + 136); bar('連射', 24 - c.cd, 14, y + 146);
  });
  button('このキャラで行く', W / 2 - 70, 214, 140, 24, true); txt(isTouch ? 'タップで選択 → ボタンで決定' : '← → で選択、Enter で決定、Esc で戻る', W / 2, 246, 8, '#ccc', 'center');
}
function drawHowto() {
  ctx.fillStyle = '#1a2a4a'; ctx.fillRect(0, 0, W, H); txt('HOW TO PLAY', W / 2, 12, 20, '#ffe040', 'center');
  const lines = ['移動: WASD / 矢印キー / 左スティック','攻撃: Space / 右ボタン（押しっぱなしOK）','鎌は一番近い敵に自動で飛ぶ','連続撃破で COMBO → スコア倍率アップ','倒し続けて下剋上ゲージMAX → 下剋上モード！','「！！」が出たら辻斬りが来る。線から逃げろ','一定数倒すと代官（ボス）登場。倒して次のステージへ','アイテム: 草鞋=速度 おにぎり=回復 鎌=多方向','　　　　　赤鎌=威力 御守り=無敵'];
  lines.forEach((l, i) => txt(l, 30, 44 + i * 19, 10, '#fff')); [['waraji', 30], ['onigiri', 100], ['kama', 170], ['akakama', 240], ['omamori', 310]].forEach(([k, x]) => drawSpr(SPR[k], x + 8, 222, 1, 2)); button('BACK', W / 2 - 50, 236, 100, 22, true);
}
function drawRanking() {
  ctx.fillStyle = '#1a2a4a'; ctx.fillRect(0, 0, W, H); txt('RANKING TOP10', W / 2, 8, 18, '#ffe040', 'center'); txt('順位   スコア    最大コンボ  撃破数  称号 / 推定順位', 60, 34, 9, '#aaa');
  if (G.ranking.length === 0) txt('まだ記録がありません', W / 2, 110, 12, '#fff', 'center');
  G.ranking.forEach((r, i) => { const hl = G.result && r.date === G.result.date && r.score === G.result.score; const c = hl ? '#ffe040' : i === 0 ? '#ffd0a0' : '#fff'; txt(String(i + 1).padStart(2, ' ') + '位  ' + String(r.score).padStart(8, ' ') + '   ' + String(r.combo).padStart(6, ' ') + '     ' + String(r.kills).padStart(5, ' ') + '  ' + rankOf(r.score) + ' ' + estRank(r.score).toLocaleString() + '位', 60, 48 + i * 17, 9, c); });
  button('BACK', W / 2 - 50, 236, 100, 22, true);
}
function drawGameOver() {
  const r = G.result, t = G.overT; ctx.fillStyle = `rgba(0,0,0,${Math.min(0.75, t / 60)})`; ctx.fillRect(0, 0, W, H); if (t < 20) return; txt('GAME OVER', W / 2, 24, 28, '#ff4040', 'center');
  const rows = [['SCORE', String(r.score)], ['最高コンボ', r.combo + ' COMBO'], ['撃破数', r.kills + ' 人'], ['プレイ時間', fmtTime(r.time * 60)], ['到達ステージ', 'STAGE ' + r.stage]];
  rows.forEach((row, i) => { if (t > 30 + i * 8) { txt(row[0], W / 2 - 20, 66 + i * 16, 10, '#ccc', 'right'); txt(row[1], W / 2 - 4, 66 + i * 16, 10, '#fff', 'left'); } });
  if (t > 80) { txt('推定順位', W / 2 + 60, 150, 9, '#ccc', 'center'); txt(r.est.toLocaleString() + '位', W / 2 + 60, 162, 20, '#fff', 'center'); txt('称号', W / 2 - 60, 150, 9, '#ccc', 'center'); txt(r.rank, W / 2 - 60, 162, 20, t % 20 < 10 ? '#ffe040' : '#fff', 'center'); if (r.place >= 0) txt(r.place === 0 ? 'この端末で NEW RECORD!!' : 'この端末で ' + (r.place + 1) + '位', W / 2, 192, 10, '#80ff80', 'center'); }
  if (t > 100) { button('RETRY', W / 2 - 110, 220, 100, 24, true); button('TITLE', W / 2 + 10, 220, 100, 24, false); }
}
