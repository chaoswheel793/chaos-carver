// src/js/main.js – FINAL: Hides loading only when first frame renders
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
      await this.game.init();

      // Called from render() when first frame is visible
      this.game.hideLoading = () => {
        console.log('First frame rendered – hiding loading spinner');
        this.loading.style.transition = 'opacity 1s';
        this.loading.style.opacity = '0';
        setTimeout(() => {
          this.loading.style.display = 'none';
        }, 1000);
      };

      this.game.start();
    } catch (err) {
      console.error('Game failed to load:', err);
      this.loading.innerHTML = 'Error – check console (F12)';
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
