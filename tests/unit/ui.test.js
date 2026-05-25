import { beforeEach, describe, expect, it } from "vitest";
import { PigGame } from "../../src/game/pig-game.js";
import { mount } from "../../src/ui.js";

function rngFrom(seq) { let i = 0; return () => { const v = seq[i % seq.length]; i++; return v; }; }
const r = (d) => (d - 1) / 6 + 0.001;

describe("mount", () => {
  let root;
  beforeEach(() => {
    document.body.innerHTML = '<div id="app"></div>';
    root = document.getElementById("app");
  });

  it("renders two player panels + controls", () => {
    mount(root, new PigGame());
    expect(root.querySelectorAll('[data-testid^="player-panel-"]').length).toBe(2);
    expect(root.querySelector("#btn-roll")).toBeTruthy();
    expect(root.querySelector("#btn-hold")).toBeTruthy();
    expect(root.querySelector("#btn-new")).toBeTruthy();
  });

  it("Roll button updates current score for active player", () => {
    const g = new PigGame({ rng: rngFrom([r(5)]) });
    mount(root, g);
    root.querySelector("#btn-roll").click();
    expect(root.querySelector("#current-0").textContent).toBe("5");
    expect(root.querySelector("#current-1").textContent).toBe("0");
  });

  it("Hold transfers round → total", () => {
    const g = new PigGame({ rng: rngFrom([r(4)]) });
    mount(root, g);
    root.querySelector("#btn-roll").click();
    root.querySelector("#btn-hold").click();
    expect(root.querySelector("#score-0").textContent).toBe("4");
    // active panel is now player 1
    expect(root.querySelector('[data-testid="player-panel-1"]').classList.contains("active")).toBe(true);
  });

  it("winner panel gets the winner class + Winner! label (REGRESSION: original added then removed)", () => {
    const g = new PigGame({ rng: rngFrom([r(5)]), targetScore: 10 });
    mount(root, g);
    root.querySelector("#btn-roll").click();
    root.querySelector("#btn-roll").click();
    root.querySelector("#btn-hold").click();
    expect(root.querySelector('[data-testid="player-panel-0"]').classList.contains("winner")).toBe(true);
    expect(root.querySelector("#name-0").textContent).toBe("Winner!");
  });

  it("New game button resets via target input", () => {
    const g = new PigGame({ rng: rngFrom([r(3)]), targetScore: 50 });
    mount(root, g);
    root.querySelector("#btn-roll").click();
    root.querySelector("#btn-hold").click();
    const targetInput = root.querySelector("#target-input");
    targetInput.value = "30";
    root.querySelector("#btn-new").click();
    expect(root.querySelector("#score-0").textContent).toBe("0");
    expect(g.target).toBe(30);
  });
});
