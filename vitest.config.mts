import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: { "@raycast/api": path.resolve("test/mocks/raycast-api.ts") },
  },
  test: {
    include: ["test/**/*.test.ts"],
    clearMocks: true,
    // @raycast/utils must resolve @raycast/api to the mock too, so it is bundled instead of loaded from node_modules.
    server: { deps: { inline: [/@raycast\/utils/] } },
  },
});
