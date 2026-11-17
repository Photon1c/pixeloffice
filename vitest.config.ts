import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["server/**/*.test.ts"],
    globals: true,
    testTimeout: 30000,
    hookTimeout: 10000,
  },
  resolve: {
    alias: {
      "@": "/home/sherlockhums/systems-lab/infrastructure/pixelworld/pixel_office",
    },
  },
});