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
      thresholds: { lines: 90, branches: 85, functions: 90, statements: 90 },
    },
  },
});
