// src/js/main.js – Chaos Carver entry point
import { Game } from './game.js';

class ChaosCarver {
  constructor() {
    this.canvas = document.getElementById('gameCanvas');
    this.loading = document.getElementById('loading');
    this.game = null;
  }

  async init() {
    this.game = new Game(this.canvas);
    await this.game.init();

    // Hide loading screen once Three.js scene is ready
    this.loading.style.opacity = '0';
    setTimeout(() => this.loading.style.display = 'none', 600);

    this.game.start();
  }

  // Forward resize/orientation events to the game instance
  handleResize = () => {
    if (this.game) this.game.resize();
  };
}

// Boot the app
const app = new ChaosCarver();
app.init().catch(err => console.error('Init failed:', err));

// Mobile-friendly resize handling
window.addEventListener('resize', app.handleResize);
window.addEventListener('orientationchange', () => {
  setTimeout(app.handleResize, 300);
});
