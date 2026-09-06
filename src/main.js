let game = null;
let starting = false;

// Lazy-boot the entire engine on "Begin Journey" — keeps page load a near-empty shell
// and defers the Three.js bundle evaluation off the critical path.
function wireStart() {
  const btn = document.getElementById('start-game-btn');
  if (!btn) {
    setTimeout(wireStart, 50);
    return;
  }
  btn.addEventListener('click', async () => {
    if (game || starting) return;
    starting = true;
    const { BushidoGame } = await import('./game.js');
    game = new BushidoGame();
    game.init();
    game.startGame();
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireStart);
} else {
  wireStart();
}