import { defineConfig } from "@trigger.dev/sdk";
import { additionalPackages } from "@trigger.dev/build/extensions/core";

export default defineConfig({
  project: "proj_zbdsyaosfxsvzboftqgy",
  runtime: "node",
  maxDuration: 300,
  dirs: ["./src/trigger"],
  build: {
    // The Claude Agent SDK's native CLI binary ships as an optionalDependency
    // (@anthropic-ai/claude-agent-sdk-linux-x64), which Trigger.dev's build strips via
    // --omit=optional. Force it in explicitly for the deploy target (linux-x64).
    extensions: [
      additionalPackages({ packages: ["@anthropic-ai/claude-agent-sdk-linux-x64@0.3.211"] }),
    ],
  },
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
