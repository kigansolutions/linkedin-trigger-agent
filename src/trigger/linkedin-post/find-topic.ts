import { schedules } from "@trigger.dev/sdk";
import { draftPost } from "./draft-post.js";

// Seed dedup with topics/angles already posted via the original (non-Trigger.dev) pipeline,
// so this separate ClickUp-backed list doesn't immediately repeat them.
const SEED_USED_TOPICS = [
  "Stop marrying your model — local vs frontier models",
  "Agent tool-sprawl vs shipping one reliable job first",
  "The 'silent failure' problem in production multi-agent systems",
  "Auditing whether your agent's tools actually still work, not just whether they're connected",
];

async function fetchExistingClickUpTitles(): Promise<string[]> {
  const apiKey = process.env.CLICKUP_API_KEY;
  const listId = process.env.CLICKUP_LIST_ID;
  if (!apiKey) throw new Error("CLICKUP_API_KEY is not set");
  if (!listId) throw new Error("CLICKUP_LIST_ID is not set");

  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task?include_closed=true`, {
    headers: { Authorization: apiKey },
  });
  if (!res.ok) throw new Error(`ClickUp task fetch failed: ${res.status}`);
  const data = (await res.json()) as any;
  return (data.tasks ?? []).map((t: any) => t.name as string);
}

export const findTopic = schedules.task({
  id: "find-topic",
  cron: "0 6 * * 1", // Monday 06:00 UTC
  run: async (payload) => {
    const existingTopics = [...SEED_USED_TOPICS, ...(await fetchExistingClickUpTitles())];

    const weekKey = payload.timestamp.toISOString().slice(0, 10);
    const result = await draftPost.triggerAndWait(
      { existingTopics },
      { idempotencyKey: `linkedin-draft-${weekKey}` }
    );

    if (!result.ok) {
      throw new Error(`draft-post failed: ${result.error}`);
    }

    return result.output;
  },
});
