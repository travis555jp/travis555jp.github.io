/* ================= 8-bit BGM (Web Audio, no files) ================= */
const BGM = {
  started: false,
  starting: false,
  timer: null,
  step: 0,
  nextTime: 0,
  mode: '',
  master: 0.055,

  note(n) {
    if (n == null) return 0;
    return 440 * Math.pow(2, (n - 69) / 12);
  },

  async init() {
    if (this.started || this.starting) return;
    this.starting = true;
    try {
      SFX.init();
      if (!SFX.ac) { this.starting = false; return; }
      if (SFX.ac.state !== 'running') await SFX.ac.resume();
      if (SFX.ac.state !== 'running') { this.starting = false; return; }

      this.started = true;
      this.starting = false;
      this.step = 0;
      this.mode = '';
      this.nextTime = SFX.ac.currentTime + 0.03;
      this.schedule();
      this.timer = setInterval(() => this.schedule(), 50);
    } catch (e) {
      this.starting = false;
    }
  },

  currentMode() {
    if (typeof G === 'undefined') return 'title';
    if (G.state !== 'playing' && G.state !== 'clear') return 'title';
    if (G.mode) return 'gekokujo';
    if (G.boss && G.boss.state !== 'dead') return 'boss';
    return 'normal';
  },

  pulse(freq, time, dur, vol, type='square') {
    if (!SFX.ac || !freq || SFX.ac.state !== 'running') return;
    const o = SFX.ac.createOscillator();
    const g = SFX.ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, time);
    g.gain.setValueAtTime(Math.max(0.0001, vol), time);
    g.gain.setValueAtTime(Math.max(0.0001, vol), Math.max(time, time + dur - 0.025));
    g.gain.exponentialRampToValueAtTime(0.0001, time + dur);
    o.connect(g); g.connect(SFX.ac.destination);
    o.start(time); o.stop(time + dur + 0.02);
  },

  kick(time, vol=0.02) {
    if (!SFX.ac || SFX.ac.state !== 'running') return;
    const o = SFX.ac.createOscillator();
    const g = SFX.ac.createGain();
    o.type = 'square';
    o.frequency.setValueAtTime(95, time);
    o.frequency.exponentialRampToValueAtTime(48, time + 0.055);
    g.gain.setValueAtTime(vol, time);
    g.gain.exponentialRampToValueAtTime(0.0001, time + 0.07);
    o.connect(g); g.connect(SFX.ac.destination);
    o.start(time); o.stop(time + 0.08);
  },

  patterns: {
    normal: {
      bpm: 138,
      lead: [76,79,81,79,76,74,71,74, 76,79,83,81,79,76,74,71],
      harmony: [64,null,67,null,64,null,62,null, 64,null,67,null,69,null,67,null],
      bass: [48,48,55,55,45,45,52,52, 48,48,55,55,45,45,43,43]
    },
    boss: {
      bpm: 154,
      lead: [67,67,70,67,72,70,67,65, 67,67,74,72,70,67,65,63],
      harmony: [55,null,58,null,60,null,58,null, 55,null,62,null,60,null,58,null],
      bass: [36,36,36,43,36,36,34,34, 36,36,36,46,43,41,39,34]
    },
    gekokujo: {
      bpm: 188,
      lead: [79,83,86,88,86,83,79,76, 81,84,88,91,88,84,81,79],
      harmony: [67,71,74,76,74,71,67,64, 69,72,76,79,76,72,69,67],
      bass: [48,55,48,55,45,52,45,52, 50,57,50,57,47,54,47,54]
    },
    title: {
      bpm: 108,
      lead: [72,null,76,null,79,null,76,null, 71,null,74,null,79,null,74,null],
      harmony: [60,null,null,null,64,null,null,null, 59,null,null,null,62,null,null,null],
      bass: [48,48,48,48,45,45,45,45, 47,47,47,47,43,43,43,43]
    }
  },

  schedule() {
    if (!this.started || !SFX.ac || SFX.ac.state !== 'running') return;

    const m = this.currentMode();
    if (m !== this.mode) {
      this.mode = m;
      this.step = 0;
      this.nextTime = SFX.ac.currentTime + 0.03;
    }

    const p = this.patterns[m];
    const beat = 60 / p.bpm / 2;

    while (this.nextTime < SFX.ac.currentTime + 0.20) {
      const i = this.step % 16;
      const t = this.nextTime;
      this.pulse(this.note(p.lead[i]), t, beat * 0.72, this.master, 'square');
      this.pulse(this.note(p.harmony[i]), t, beat * 0.58, this.master * 0.45, 'square');
      this.pulse(this.note(p.bass[i]), t, beat * 0.88, this.master * 0.75, 'triangle');
      if (i % 4 === 0) this.kick(t, this.master * 0.65);
      if (m === 'gekokujo' && i % 2 === 1) this.pulse(this.note(91), t, beat * 0.14, this.master * 0.20, 'square');
      this.step++;
      this.nextTime += beat;
    }
  }
};

// iPhone/Safari: unlock audio only from a real user gesture, then start BGM.
const unlockBGM = () => { BGM.init(); };
document.addEventListener('touchstart', unlockBGM, { passive: true, capture: true });
document.addEventListener('touchend', unlockBGM, { passive: true, capture: true });
document.addEventListener('pointerdown', unlockBGM, { passive: true, capture: true });
document.addEventListener('click', unlockBGM, { passive: true, capture: true });
document.addEventListener('keydown', unlockBGM, { passive: true, capture: true });
