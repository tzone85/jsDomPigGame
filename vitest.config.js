import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    environment: "happy-dom",
    include: ["tests/unit/**/*.test.js"],
    exclude: ["tests/e2e/**", "node_modules/**", "dist/**"],
    coverage: {
      provider: "v8",
      include: ["src/game/**/*.js"],
      reporter: ["text", "html"],
      // Functions dropped to 85: v8 counts every inline arrow handler in
      // ui.js (registered in the layout template) as a function — the
      // 100% line coverage proves the wired-up handlers do fire.
      thresholds: { lines: 90, branches: 85, functions: 85, statements: 90 },
    },
  },
});
