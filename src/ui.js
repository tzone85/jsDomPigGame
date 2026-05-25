/**
 * DOM bindings for PigGame. Pure logic stays in src/game/pig-game.js;
 * this layer only renders snapshots + dispatches user input.
 */
const PLAYER_PANEL_CLASS = (n) => `player-${n}-panel`;

export function mount(root, game) {
  // Build the layout once; render() patches text + classes only.
  root.innerHTML = `
    <main class="wrapper">
      <section class="player-0-panel active" data-testid="player-panel-0">
        <h2 class="player-name" id="name-0">Player 1</h2>
        <p class="player-score" id="score-0">0</p>
        <div class="player-current-box">
          <p class="player-current-label">Current</p>
          <p class="player-current-score" id="current-0">0</p>
        </div>
      </section>
      <section class="player-1-panel" data-testid="player-panel-1">
        <h2 class="player-name" id="name-1">Player 2</h2>
        <p class="player-score" id="score-1">0</p>
        <div class="player-current-box">
          <p class="player-current-label">Current</p>
          <p class="player-current-score" id="current-1">0</p>
        </div>
      </section>
      <div class="controls">
        <label class="target-label">
          Target score
          <input id="target-input" type="number" min="10" max="1000" step="10" value="100" />
        </label>
        <button type="button" class="btn-new" id="btn-new">New game</button>
        <button type="button" class="btn-roll" id="btn-roll">Roll dice</button>
        <button type="button" class="btn-hold" id="btn-hold">Hold</button>
        <img class="dice" id="dice" alt="dice" src="dice-1.png" style="display:none" />
      </div>
    </main>
  `;

  const $ = (sel) => root.querySelector(sel);
  const dice = $("#dice");
  const targetInput = $("#target-input");

  $("#btn-roll").addEventListener("click", () => {
    const r = game.roll();
    if (r.ok) {
      dice.src = `dice-${r.dice}.png`;
      dice.style.display = "block";
    }
  });
  $("#btn-hold").addEventListener("click", () => game.hold());
  $("#btn-new").addEventListener("click", () => {
    const next = Number(targetInput.value);
    game.reset({ targetScore: Number.isFinite(next) ? next : undefined });
    dice.style.display = "none";
  });
  targetInput.addEventListener("change", () => {
    const next = Number(targetInput.value);
    if (Number.isFinite(next)) game.setTarget(next);
  });

  function render(snap) {
    $("#score-0").textContent = String(snap.scores[0]);
    $("#score-1").textContent = String(snap.scores[1]);
    // current = roundScore for active player, 0 for inactive
    $("#current-0").textContent = String(
      snap.activePlayer === 0 ? snap.roundScore : 0,
    );
    $("#current-1").textContent = String(
      snap.activePlayer === 1 ? snap.roundScore : 0,
    );

    for (const n of [0, 1]) {
      const panel = $(`.${PLAYER_PANEL_CLASS(n)}`);
      panel.classList.toggle("active", snap.activePlayer === n && !snap.isOver);
      panel.classList.toggle("winner", snap.winner === n);
      $(`#name-${n}`).textContent =
        snap.winner === n ? "Winner!" : `Player ${n + 1}`;
    }
    if (snap.isOver) dice.style.display = "none";
    targetInput.value = String(snap.target);
  }

  const unsubscribe = game.subscribe(render);
  render(game.snapshot());
  return { unmount: unsubscribe };
}
