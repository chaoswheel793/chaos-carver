// src/js/main.js – GPU-safe bootstrap
import { Game } from './game.js';

class IMakeThings {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.loading = document.getElementById('loading');
    this.game = null;
  }

  async init() {
    try {
      // GPU check
      const gl = this.canvas.getContext('webgl');
      if (!gl) {
        this.loading.innerHTML = 'WebGL not supported – update Chrome OS.';
        return;
      }
      console.log('WebGL supported');

      this.game = new Game(this.canvas);
      await this.game.init();

      this.game.onFirstRender = () => {
        console.log('First render – hiding loading');
        this.loading.style.transition = 'opacity 0.5s';
        this.loading.style.opacity = '0';
        setTimeout(() => this.loading.style.display = 'none', 500);
      };

      this.game.start();
    } catch (err) {
      console.error('Init failed:', err);
      this.loading.innerHTML = 'Error – check console (F12).';
    }
  }

  handleResize = () => this.game?.resize();
}

const app = new IMakeThings();
app.init();

window.addEventListener('resize', app.handleResize);
window.addEventListener('orientationchange', () => setTimeout(app.handleResize, 300));
