// src/js/main.js – I Make Things bootstrap with proper loading
import { Game } from './game.js';

class IMakeThings {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.loading = document.getElementById('loading');
    this.game = null;
  }

  async init() {
    try {
      this.game = new Game(this.canvas);
      await this.game.init(); // Wait for scene ready

      // Hide loading after init success
      this.loading.style.transition = 'opacity 0.5s';
      this.loading.style.opacity = '0';
      setTimeout(() => this.loading.style.display = 'none', 500);

      this.game.start();
    } catch (err) {
      console.error('Init failed:', err);
      this.loading.innerHTML = 'Error loading – check console (F12). Refresh to retry.';
    }
  }

  handleResize = () => {
    if (this.game) this.game.resize();
  };
}

const app = new IMakeThings();
app.init();

window.addEventListener('resize', app.handleResize);
window.addEventListener('orientationchange', () => setTimeout(app.handleResize, 300));
