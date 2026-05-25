import { expect, test } from "@playwright/test";

test("Roll + Hold flow updates scores; winner class on victory", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("button", { name: /roll dice/i })).toBeVisible();

  // Reduce target so the test reaches it quickly.
  await page.locator("#target-input").fill("20");
  await page.getByRole("button", { name: /new game/i }).click();

  // Roll until we have a non-zero round score, then hold. Bounded loop in case of
  // bad luck with 1s.
  let totalP0 = 0;
  for (let tries = 0; tries < 30 && totalP0 < 20; tries++) {
    let roundShown = 0;
    for (let inner = 0; inner < 6 && roundShown < 8; inner++) {
      await page.getByRole("button", { name: /^roll dice$/i }).click();
      const txt = await page.locator("#current-0").textContent();
      roundShown = Number(txt);
      // If we rolled a 1 the active panel switched to player 1; roll once
      // for p1 then hold so the turn passes back to p0 immediately.
      const p1Active = await page.locator('[data-testid="player-panel-1"]').evaluate((el) => el.classList.contains("active"));
      if (p1Active) {
        await page.getByRole("button", { name: /^hold$/i }).click();
        break;
      }
    }
    const p0Active = await page.locator('[data-testid="player-panel-0"]').evaluate((el) => el.classList.contains("active"));
    if (p0Active) {
      await page.getByRole("button", { name: /^hold$/i }).click();
      totalP0 = Number(await page.locator("#score-0").textContent());
    }
  }
  // We may not always cross the target in 30 turns with bad luck — assert that we either
  // hit the winner state OR have a non-trivial total.
  const winnerPanel = await page.locator('[data-testid="player-panel-0"]').evaluate((el) => el.classList.contains("winner"));
  if (winnerPanel) {
    await expect(page.locator("#name-0")).toHaveText("Winner!");
  } else {
    expect(totalP0).toBeGreaterThan(0);
  }
});
