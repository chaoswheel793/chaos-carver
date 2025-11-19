// src/js/main.js – FINAL WORKING VERSION
import { Game } from './game.js';

const canvas = document.getElementById('gameCanvas');
const loading = document.getElementById('loading');

const game = new Game(canvas);

// This function will be called the moment the first frame renders
game.hideLoading = () => {
  console.log('Workshop ready – hiding spinner');
  loading.style.transition = 'opacity 1s ease-out';
  loading.style.opacity = '0';
  setTimeout(() => loading.style.display = 'none', 1000);
};

(async () => {
  try {
    await game.init();
    game.start();  // Starts the render loop
  } catch (e) {
    console.error(e);
    loading.textContent = 'Error – open console (F12)';
  }
})();

window.addEventListener('resize', () => game.resize());
