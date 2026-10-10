import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    include: ["lib/**/*.test.ts"],
    environment: "node",
    env: { LINK_SECRET: "test-schluessel-vitest", PUBLIC_BASE_URL: "https://www.paloskin.de" },
  },
  resolve: {
    alias: { "@": path.resolve(__dirname, ".") },
  },
});
