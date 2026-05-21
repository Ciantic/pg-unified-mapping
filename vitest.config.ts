import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    typecheck: {
      tsconfig: "tsconfig.json",
      enabled: true,
      include: ["**/*.test.ts"],
    },
    exclude: ["node_modules", ".git", "tests/postgrejs.test.ts"],
  },
});
