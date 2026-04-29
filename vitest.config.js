import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    // Transforma archivos JS — necesario para import/export ESM
    include: ["__tests__/**/*.test.js"],
  },
});
