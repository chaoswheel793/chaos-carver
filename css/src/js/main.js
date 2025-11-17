import { Game } from './game.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    const loading = document.getElementById('loading');
    if (loading) loading.style.display = 'none';

    this.game = new Game();
    this.game.start();
  }
}

new App();
