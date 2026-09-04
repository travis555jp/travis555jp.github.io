
/* ================= Menu control ================= */
function goTitle() { G.state = 'title'; G.sel = 0; }
function menuKey(code) {
  if (G.state === 'title') {
    if (code === 'ArrowUp' || code === 'KeyW') G.sel = (G.sel + 2) % 3;
    else if (code === 'ArrowDown' || code === 'KeyS') G.sel = (G.sel + 1) % 3;
    else if (code === 'Enter' || code === 'Space') menuSelect(G.sel);
  } else if (G.state === 'select') {
    if (code === 'ArrowLeft' || code === 'KeyA') G.charSel = (G.charSel + CHARS.length - 1) % CHARS.length;
    else if (code === 'ArrowRight' || code === 'KeyD') G.charSel = (G.charSel + 1) % CHARS.length;
    else if (code === 'Enter' || code === 'Space') newGame(G.charSel);
    else if (code === 'Escape') goTitle();
  } else if (G.state === 'howto' || G.state === 'ranking') {
    if (code === 'Enter' || code === 'Space' || code === 'Escape') goTitle();
  } else if (G.state === 'gameover' && G.overT > 100) {
    if (code === 'Enter' || code === 'Space') newGame();
    else if (code === 'Escape') goTitle();
  }
}
function menuSelect(i) {
  if (i === 0) { G.state = 'select'; G.charSel = G.charSel || 0; } else if (i === 1) G.state = 'howto'; else { G.ranking = RankingStore.load(); G.state = 'ranking'; }
}
function menuClick(x, y) {
  if (G.state === 'title') {
    MENU.forEach((m, i) => { if (x > W / 2 - 80 && x < W / 2 + 80 && y > m[1] && y < m[1] + 24) { G.sel = i; menuSelect(i); } });
  } else if (G.state === 'select') {
    if (y > 208 && y < 244 && x > W / 2 - 70 && x < W / 2 + 70) newGame(G.charSel);
    else CHARS.forEach((c, i) => { const cx = 10 + i * 116; if (x > cx && x < cx + 108 && y > 44 && y < 204) G.charSel = i; });
  } else if (G.state === 'howto' || G.state === 'ranking') {
    if (y > 200) goTitle();
  } else if (G.state === 'gameover' && G.overT > 100) {
    if (y > 210 && y < 250) { if (x < W / 2) newGame(); else goTitle(); }
  }
}

/* ================= Loop ================= */
let last = performance.now(), acc = 0;
function loop(now) {
  const dt = now - last; last = now; acc += Math.min(dt, 100);
  while (acc >= 16.667) { step(); acc -= 16.667; }
  draw();
  touchEl.style.display = (isTouch && G.state === 'playing') ? 'block' : 'none';
  requestAnimationFrame(loop);
}
document.addEventListener('visibilitychange', () => { if (!document.hidden) { last = performance.now(); acc = 0; } });
buildMap(1);
requestAnimationFrame(loop);
