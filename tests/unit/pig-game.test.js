import { describe, expect, it, vi } from "vitest";
import { PigGame } from "../../src/game/pig-game.js";

/** Build an RNG that returns the next number in `sequence` each call (cycles). */
function rngFrom(sequence) {
  let i = 0;
  return () => {
    const v = sequence[i % sequence.length];
    i++;
    return v;
  };
}

// helper: convert a desired dice value (1..6) into the 0..1 RNG output PigGame uses
const r = (dice) => (dice - 1) / 6 + 0.001; // small offset to avoid boundary

describe("PigGame initial state", () => {
  it("starts with 0/0 scores, player 0 active, target 100", () => {
    const g = new PigGame();
    const s = g.snapshot();
    expect(s.scores).toEqual([0, 0]);
    expect(s.roundScore).toBe(0);
    expect(s.activePlayer).toBe(0);
    expect(s.target).toBe(100);
    expect(s.isOver).toBe(false);
  });

  it("clamps target between 10 and 1000", () => {
    expect(new PigGame({ targetScore: 1 }).target).toBe(10);
    expect(new PigGame({ targetScore: 9999 }).target).toBe(1000);
    expect(new PigGame({ targetScore: "abc" }).target).toBe(100);
  });
});

describe("roll", () => {
  it("adds non-1 dice to round score", () => {
    const g = new PigGame({ rng: rngFrom([r(4)]) });
    const out = g.roll();
    expect(out.dice).toBe(4);
    expect(out.event).toBe("added");
    expect(g.snapshot().roundScore).toBe(4);
  });

  it("rolling a 1 zeros round score and passes turn", () => {
    const g = new PigGame({ rng: rngFrom([r(3), r(1)]) });
    g.roll();
    expect(g.snapshot().roundScore).toBe(3);
    g.roll();
    expect(g.snapshot().roundScore).toBe(0);
    expect(g.snapshot().activePlayer).toBe(1);
  });

  it("double 6 wipes total score and passes turn", () => {
    // p0: roll 6, hold (6 goes to total), then roll 6 again on next turn... no, wait.
    // Actually: double-6 means two 6s IN A ROW on the same turn. So p0 rolls 6, 6.
    const g = new PigGame({ rng: rngFrom([r(6), r(6)]) });
    g.roll(); // first 6 — added to round
    expect(g.snapshot().roundScore).toBe(6);
    g.roll(); // second 6 — wipes total
    const s = g.snapshot();
    expect(s.scores[0]).toBe(0);
    expect(s.roundScore).toBe(0);
    expect(s.activePlayer).toBe(1);
  });

  it("hold then double-6-on-next-turn doesn't apply (lastDice cleared on hold)", () => {
    // p0 rolls 6, holds → total = 6, lastDice cleared.
    // turn passes to p1, p1 rolls 6 → just adds to roundScore (no streak).
    const g = new PigGame({ rng: rngFrom([r(6), r(6)]) });
    g.roll();
    g.hold();
    expect(g.snapshot().scores[0]).toBe(6);
    expect(g.snapshot().activePlayer).toBe(1);
    g.roll();
    expect(g.snapshot().roundScore).toBe(6);
    expect(g.snapshot().scores[1]).toBe(0);
  });
});

describe("hold", () => {
  it("commits round score to total + passes turn", () => {
    const g = new PigGame({ rng: rngFrom([r(4), r(2)]) });
    g.roll(); g.roll();
    expect(g.snapshot().roundScore).toBe(6);
    g.hold();
    const s = g.snapshot();
    expect(s.scores[0]).toBe(6);
    expect(s.activePlayer).toBe(1);
  });

  it("hitting target on hold ends the game (REGRESSION: original capped at 20 not 100)", () => {
    const g = new PigGame({ rng: rngFrom([r(5)]) , targetScore: 10 });
    // p0 rolls 5,5 (10 total) → hold → reaches 10 → wins
    g.roll(); g.roll(); g.hold();
    const s = g.snapshot();
    expect(s.isOver).toBe(true);
    expect(s.winner).toBe(0);
  });

  it("further roll/hold after game over is rejected", () => {
    const g = new PigGame({ rng: rngFrom([r(5)]), targetScore: 10 });
    g.roll(); g.roll(); g.hold();
    expect(g.roll().ok).toBe(false);
    expect(g.hold().ok).toBe(false);
  });
});

describe("setTarget", () => {
  it("allowed before any move is made", () => {
    const g = new PigGame();
    expect(g.setTarget(50).ok).toBe(true);
    expect(g.target).toBe(50);
  });

  it("rejected after a roll", () => {
    const g = new PigGame({ rng: rngFrom([r(3)]) });
    g.roll();
    expect(g.setTarget(50).ok).toBe(false);
  });

  it("allowed again after reset", () => {
    const g = new PigGame({ rng: rngFrom([r(3)]) });
    g.roll(); g.hold();
    g.reset();
    expect(g.setTarget(50).ok).toBe(true);
  });
});

describe("reset", () => {
  it("zeros everything, sends back to player 0, optionally changes target", () => {
    const g = new PigGame({ rng: rngFrom([r(5)]), targetScore: 50 });
    g.roll(); g.roll(); g.hold();
    g.reset({ targetScore: 30 });
    const s = g.snapshot();
    expect(s.scores).toEqual([0, 0]);
    expect(s.activePlayer).toBe(0);
    expect(s.target).toBe(30);
    expect(s.isOver).toBe(false);
  });
});

describe("subscribe", () => {
  it("fires listener after every state-changing op", () => {
    const g = new PigGame({ rng: rngFrom([r(4)]) });
    const fn = vi.fn();
    g.subscribe(fn);
    g.roll();
    g.hold();
    g.reset();
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it("returns an unsubscribe function", () => {
    const g = new PigGame({ rng: rngFrom([r(4)]) });
    const fn = vi.fn();
    const off = g.subscribe(fn);
    g.roll();
    off();
    g.roll();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});
