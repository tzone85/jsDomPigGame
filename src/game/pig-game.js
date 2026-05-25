/**
 * Pig dice game — pure state machine.
 *
 * Rules:
 *  - Two players alternate turns.
 *  - On each turn the active player rolls a 1d6 any number of times,
 *    adding each roll to their ROUND score.
 *  - Roll a 1 → round score lost, turn passes.
 *  - Roll a 6 twice in a row → TOTAL score wiped, turn passes (bonus rule).
 *  - "Hold" → round score added to total, turn passes.
 *  - First player to reach `targetScore` total wins.
 *
 * No DOM access; the UI subscribes to snapshot updates.
 */
export const DEFAULT_TARGET_SCORE = 100;
export const SIDES = 6;

export class PigGame {
  #scores = [0, 0];
  #roundScore = 0;
  #active = 0;
  #lastDice = null;
  #winner = null;
  #target;
  #rng;
  #listeners = new Set();

  constructor({ targetScore = DEFAULT_TARGET_SCORE, rng = Math.random } = {}) {
    this.#target = clampTarget(targetScore);
    this.#rng = rng;
  }

  get target() { return this.#target; }
  get activePlayer() { return this.#active; }
  get isOver() { return this.#winner !== null; }
  get winner() { return this.#winner; }

  snapshot() {
    return {
      scores: [...this.#scores],
      roundScore: this.#roundScore,
      activePlayer: this.#active,
      lastDice: this.#lastDice,
      winner: this.#winner,
      target: this.#target,
      isOver: this.#winner !== null,
    };
  }

  subscribe(fn) {
    this.#listeners.add(fn);
    return () => this.#listeners.delete(fn);
  }

  setTarget(value) {
    if (this.#anyMovesPlayed()) {
      return { ok: false, reason: "cannot change target after a roll" };
    }
    this.#target = clampTarget(value);
    this.#emit();
    return { ok: true };
  }

  roll() {
    if (this.isOver) return { ok: false, reason: "game over" };
    const dice = Math.floor(this.#rng() * SIDES) + 1;
    if (dice === 1) {
      this.#roundScore = 0;
      this.#lastDice = dice;
      this.#switchPlayer();
      this.#emit();
      return { ok: true, dice, event: "rolled-one" };
    }
    if (dice === 6 && this.#lastDice === 6) {
      // double-6 → wipe total
      this.#scores[this.#active] = 0;
      this.#roundScore = 0;
      this.#lastDice = dice;
      this.#switchPlayer();
      this.#emit();
      return { ok: true, dice, event: "double-six-wipe" };
    }
    this.#roundScore += dice;
    this.#lastDice = dice;
    this.#emit();
    return { ok: true, dice, event: "added" };
  }

  hold() {
    if (this.isOver) return { ok: false, reason: "game over" };
    this.#scores[this.#active] += this.#roundScore;
    this.#roundScore = 0;
    this.#lastDice = null; // hold breaks the double-six streak
    if (this.#scores[this.#active] >= this.#target) {
      this.#winner = this.#active;
      this.#emit();
      return { ok: true, event: "won" };
    }
    this.#switchPlayer();
    this.#emit();
    return { ok: true, event: "held" };
  }

  reset({ targetScore } = {}) {
    this.#scores = [0, 0];
    this.#roundScore = 0;
    this.#active = 0;
    this.#lastDice = null;
    this.#winner = null;
    if (targetScore !== undefined) this.#target = clampTarget(targetScore);
    this.#emit();
  }

  #switchPlayer() {
    this.#active = this.#active === 0 ? 1 : 0;
    this.#roundScore = 0;
    this.#lastDice = null;
  }

  #anyMovesPlayed() {
    return this.#scores.some((s) => s > 0) || this.#roundScore > 0 || this.#lastDice !== null;
  }

  #emit() {
    const snap = this.snapshot();
    for (const fn of this.#listeners) fn(snap);
  }
}

function clampTarget(v) {
  const n = Number(v);
  if (!Number.isFinite(n)) return DEFAULT_TARGET_SCORE;
  return Math.max(10, Math.min(1000, Math.floor(n)));
}
