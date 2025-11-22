import { MAX_RUN_STARS } from '../rewardUtils.js';

const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const DEFAULT_REVEAL_DELAY = 460;

export default class StarReveal {
  constructor(canvas, options = {}) {
    if (!canvas) {
      throw new Error('StarReveal requires a canvas element');
    }
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.stars = [];
    this.currentCount = 0;
    this._raf = null;
    this._pending = Promise.resolve();
    this._onReveal = typeof options.onReveal === 'function' ? options.onReveal : null;
    this.revealDelay = typeof options.revealDelay === 'number' ? options.revealDelay : DEFAULT_REVEAL_DELAY;
    this._layout();
    this._loop = this._loop.bind(this);
    this._raf = requestAnimationFrame(this._loop);
  }

  _layout() {
    const spacing = 80;
    const startX = this.canvas.width / 2 - ((MAX_RUN_STARS - 1) * spacing) / 2;
    this.stars = Array.from({ length: MAX_RUN_STARS }, (_, i) => ({
      x: startX + i * spacing,
      y: this.canvas.height / 2,
      revealed: false,
      animStart: null,
    }));
  }

  setStars(target) {
    const safeTarget = Math.max(0, Math.min(MAX_RUN_STARS, target | 0));
    if (safeTarget > this.currentCount) {
      const start = this.currentCount;
      const chain = async () => {
        for (let i = start; i < safeTarget; i += 1) {
          this._reveal(i);
          if (!RM && this.revealDelay > 0) {
            await this._delay(this.revealDelay);
          }
        }
        this.currentCount = safeTarget;
      };
      this._pending = this._pending.then(chain);
      return this._pending;
    }

    for (let i = safeTarget; i < MAX_RUN_STARS; i += 1) {
      this.stars[i].revealed = i < safeTarget;
      this.stars[i].animStart = null;
    }
    this.currentCount = safeTarget;
    return Promise.resolve(safeTarget);
  }

  addOne() {
    return this.setStars(this.currentCount + 1);
  }

  destroy() {
    cancelAnimationFrame(this._raf);
  }

  _reveal(index) {
    const star = this.stars[index];
    if (!star) return;
    star.revealed = true;
    star.animStart = performance.now();
    if (!RM) {
      if (typeof this._onReveal === 'function') {
        this._onReveal(index);
      } else {
        this._pling(index);
      }
    }
  }

  _delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  _pling(index) {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 620 * Math.pow(1.08, index);
      gain.gain.setValueAtTime(0.22, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.14);
      osc.start();
      osc.stop(ctx.currentTime + 0.14);
    } catch (err) {
      // ignore audio errors
    }
  }

  _loop(time) {
    const ctx = this.ctx;
    const { width, height } = this.canvas;
    ctx.clearRect(0, 0, width, height);
    for (let i = 0; i < MAX_RUN_STARS; i += 1) {
      const star = this.stars[i];
      let scale = 1;
      let glitter = 0;
      let highlight = false;
      if (star.revealed) {
        if (star.animStart != null) {
          const elapsed = (time - star.animStart) / 520;
          if (elapsed < 1 && !RM) {
            const pop = Math.min(1, elapsed < 0.45 ? elapsed / 0.45 : 1);
            const wobble = Math.sin((elapsed - 0.45) * Math.PI * 4) * 0.06;
            scale = Math.max(0.92, pop) * (1 + wobble);
            glitter = (Math.sin(time / 220) + 1) / 2;
            highlight = true;
          } else {
            star.animStart = null;
          }
        }
        this._drawStar(star.x, star.y, 30, '#ffca28', scale, glitter, highlight);
      } else {
        ctx.save();
        ctx.globalAlpha = 0.18;
        this._drawStar(star.x, star.y, 30, '#ffca28', 0.9, 0, false);
        ctx.restore();
      }
    }
    this._raf = requestAnimationFrame(this._loop);
  }

  _starPath(rOut = 36, rIn = 18) {
    const path = new Path2D();
    for (let i = 0; i < 5; i += 1) {
      const a = -Math.PI / 2 + i * ((2 * Math.PI) / 5);
      const ax = Math.cos(a) * rOut;
      const ay = Math.sin(a) * rOut;
      const b = a + Math.PI / 5;
      const bx = Math.cos(b) * rIn;
      const by = Math.sin(b) * rIn;
      if (i === 0) path.moveTo(ax, ay);
      else path.lineTo(ax, ay);
      path.lineTo(bx, by);
    }
    path.closePath();
    return path;
  }

  _drawStar(x, y, radius, fill, scale = 1, glitter = 0, highlight = false) {
    const ctx = this.ctx;
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const path = this._starPath(radius, radius * 0.5);
    const gradient = ctx.createRadialGradient(0, 0, radius * 0.35, 0, 0, radius);
    gradient.addColorStop(0, '#ffe082');
    gradient.addColorStop(1, fill);
    ctx.fillStyle = gradient;
    ctx.shadowColor = 'rgba(255,215,80,0.6)';
    ctx.shadowBlur = 18;
    ctx.fill(path);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.miterLimit = 2;
    ctx.lineWidth = radius * 0.28;
    ctx.strokeStyle = gradient;
    ctx.stroke(path);
    if (highlight) {
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.rotate(-0.25);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.ellipse(-radius * 0.1, -radius * 0.25, radius * 0.55, radius * 0.25, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (glitter > 0) {
      ctx.save();
      ctx.clip(path);
      ctx.globalCompositeOperation = 'lighter';
      ctx.rotate(glitter * 3);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.fillRect(-radius * 1.2 + glitter * radius * 2.6, -radius * 1.0, radius * 0.45, radius * 2.0);
      ctx.restore();
    }
    ctx.restore();
  }
}
