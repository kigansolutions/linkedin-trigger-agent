import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: "proj_zbdsyaosfxsvzboftqgy",
  runtime: "node",
  maxDuration: 300,
  dirs: ["./src/trigger"],
  retries: {
    enabledInDev: true,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
