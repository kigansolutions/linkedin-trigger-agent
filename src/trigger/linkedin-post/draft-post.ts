import { task } from "@trigger.dev/sdk";
import { query } from "@anthropic-ai/claude-agent-sdk";
import {
  buildClickUpDescription,
  buildSystemPrompt,
  buildUserPrompt,
  CONTENT_LANE_GUIDANCE,
  CONTENT_LANES,
  enforceDraftSafety,
  parseDraftOutput,
  type AngleType,
  type DraftOutput,
} from "./voice-v2.js";

type DraftPostPayload = {
  existingTopics: string[];
};

const SUBREDDITS = [
  "smallbusiness",
  "Entrepreneur",
  "startups",
  "SaaS",
  "consulting",
  "marketing",
  "branding",
  "automation",
  "nocode",
  "business",
  "productivity",
  "ChatGPT",
  "ClaudeAI",
  "ArtificialInteligence",
  "AI_Agents",
  "mcp",
  "n8n",
];

const TAVILY_FALLBACK_QUERIES = [
  "small business workflow automation reddit practical problems",
  "AI adoption small business human review reddit",
  "brand positioning unclear offer reddit founder",
  "business process before automation reddit",
  "AI agent oversight business workflow reddit",
  "founder building in public AI automation lessons reddit",
];

const OPERATOR_ANGLE_SEEDS: { angleType: AngleType; topic: string; source: string }[] = [
  {
    angleType: "Founder/operator observations",
    topic: "The handoff is usually where the system breaks",
    source: "operator experience",
  },
  {
    angleType: "Kigan-building-in-public",
    topic: "Why Kigan is choosing narrow proof-led engagements before bigger claims",
    source: "Kigan first-party evidence",
  },
  {
    angleType: "Brand clarity",
    topic: "Brand clarity starts before the logo when the offer is still fuzzy",
    source: "Kigan first-party evidence",
  },
  {
    angleType: "Workflow improvement",
    topic: "Some workflows need a better process before they need AI",
    source: "operator experience",
  },
  {
    angleType: "Human-governed AI",
    topic: "Review gates are not bureaucracy when AI is touching business decisions",
    source: "Kigan first-party evidence",
  },
  {
    angleType: "Technical proof",
    topic: "Technical architecture only matters when it changes the operating decision",
    source: "operator experience",
  },
];

type SourcePost = {
  subreddit: string;
  title: string;
  url: string;
  score: number;
  numComments: number;
  excerpt: string;
};

// Reddit's own OAuth API works fine for authenticated calls — it's only anonymous/
// unauthenticated scraping (bare JSON/RSS fetches, most search-engine crawlers) that
// gets blocked. Composio holds the OAuth connection, so this goes through Reddit's
// real API rather than working around a block that only applies to unauthenticated access.
async function fetchRedditPosts(): Promise<SourcePost[]> {
  const apiKey = process.env.COMPOSIO_API_KEY;
  const connectedAccountId = process.env.COMPOSIO_REDDIT_CONNECTED_ACCOUNT_ID;
  const userId = process.env.COMPOSIO_REDDIT_USER_ID;
  if (!apiKey || !connectedAccountId || !userId) {
    console.log("[draft-post] Composio Reddit not configured, skipping");
    return [];
  }

  const posts: SourcePost[] = [];
  for (const subreddit of SUBREDDITS) {
    try {
      const res = await fetch(`https://backend.composio.dev/api/v3/tools/execute/REDDIT_RETRIEVE_REDDIT_POST`, {
        method: "POST",
        headers: { "x-api-key": apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({
          connected_account_id: connectedAccountId,
          // Composio requires the connected account's own user_id alongside
          // connected_account_id, or execution fails with a 400
          // (ActionExecute_ConnectedAccountEntityIdRequired).
          user_id: userId,
          arguments: { subreddit, size: 5 },
        }),
      });
      if (!res.ok) {
        console.log(`[draft-post] Reddit fetch failed for r/${subreddit}: ${res.status} ${await res.text()}`);
        continue;
      }
      const body = (await res.json()) as { successful?: boolean; error?: string; data?: { posts_list?: any[] } };
      if (!body.successful) {
        console.log(`[draft-post] Reddit fetch unsuccessful for r/${subreddit}: ${body.error}`);
        continue;
      }
      for (const p of body.data?.posts_list ?? []) {
        posts.push({
          subreddit,
          title: p.title,
          url: `https://reddit.com${p.permalink}`,
          score: p.score ?? p.ups ?? 0,
          numComments: p.num_comments ?? 0,
          excerpt: (p.selftext ?? "").slice(0, 400),
        });
      }
    } catch (err) {
      console.log(`[draft-post] Reddit fetch error for r/${subreddit}: ${err}`);
    }
  }
  console.log(`[draft-post] Composio Reddit returned ${posts.length} posts across ${SUBREDDITS.length} subreddits`);
  return posts;
}

async function fetchTavilyFallback(): Promise<SourcePost[]> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    console.log("[draft-post] Tavily not configured, skipping fallback");
    return [];
  }

  const posts: SourcePost[] = [];
  for (const query of TAVILY_FALLBACK_QUERIES) {
    try {
      const res = await fetch("https://api.tavily.com/search", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          query,
          search_depth: "basic",
          max_results: 5,
          include_domains: ["reddit.com"],
        }),
      });
      if (!res.ok) {
        console.log(`[draft-post] Tavily fetch failed for "${query}": ${res.status}`);
        continue;
      }
      const body = (await res.json()) as { results?: { title: string; url: string; content: string }[] };
      for (const r of body.results ?? []) {
        posts.push({ subreddit: "?", title: r.title, url: r.url, score: 0, numComments: 0, excerpt: r.content.slice(0, 400) });
      }
    } catch (err) {
      console.log(`[draft-post] Tavily fetch error for "${query}": ${err}`);
    }
  }
  console.log(`[draft-post] Tavily fallback returned ${posts.length} results`);
  return posts;
}

function formatSourceContext(posts: SourcePost[]): string {
  const lanes = CONTENT_LANES.map((lane) => {
    const seeds = OPERATOR_ANGLE_SEEDS.filter((seed) => seed.angleType === lane)
      .map((seed) => `  - ${seed.topic} (source: ${seed.source})`)
      .join("\n");
    return `- ${lane}: ${CONTENT_LANE_GUIDANCE[lane].join(" ")}\n${seeds}`;
  }).join("\n\n");

  const externalSources = posts.length
    ? posts
    .map((p) => `- r/${p.subreddit} — "${p.title}" (score ${p.score}, ${p.numComments} comments)\n  ${p.url}\n  ${p.excerpt || "(no body text)"}`)
    .join("\n\n")
    : "(no live external source material found this run)";

  return `Recurring Kigan/Cameron content lanes and safe seed angles:\n${lanes}\n\nOptional external inspiration:\n${externalSources}`;
}

async function createClickUpTask(draft: DraftOutput): Promise<string> {
  const apiKey = process.env.CLICKUP_API_KEY;
  const listId = process.env.CLICKUP_LIST_ID;
  if (!apiKey) throw new Error("CLICKUP_API_KEY is not set");
  if (!listId) throw new Error("CLICKUP_LIST_ID is not set");

  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `LinkedIn Draft — ${today} — ${draft.topic}`,
      description: buildClickUpDescription(draft),
      tags: ["linkedin-draft"],
    }),
  });
  if (!res.ok) {
    throw new Error(`ClickUp task creation failed: ${res.status} ${await res.text()}`);
  }
  const created = (await res.json()) as { url: string };
  return created.url;
}

export const draftPost = task({
  id: "draft-post",
  run: async (payload: DraftPostPayload) => {
    const token = process.env.CLAUDE_CODE_OAUTH_TOKEN;
    if (!token) throw new Error("CLAUDE_CODE_OAUTH_TOKEN is not set");

    let sourcePosts = await fetchRedditPosts();
    if (sourcePosts.length === 0) {
      sourcePosts = await fetchTavilyFallback();
    }
    const sourceContext = formatSourceContext(sourcePosts);

    let reply = "";
    for await (const message of query({
      prompt: buildUserPrompt(payload.existingTopics, sourceContext),
      options: {
        systemPrompt: buildSystemPrompt(),
        tools: [],
        maxTurns: 4,
        // Windows dev environments don't ship the SDK's bundled native CLI binary as an
        // optional dependency the way Linux does — point at the local Claude Code install instead.
        // Not needed on the Linux deploy target, so this is a no-op there.
        ...(process.env.CLAUDE_CODE_EXECUTABLE_PATH
          ? { pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_EXECUTABLE_PATH }
          : {}),
      },
    })) {
      if (message.type === "result" && message.subtype === "success") {
        reply = message.result;
      }
    }
    if (!reply) throw new Error("Agent SDK returned no result");

    const draft = enforceDraftSafety(parseDraftOutput(reply));
    const clickupTaskUrl = await createClickUpTask(draft);
    console.log(`Created ClickUp task: ${clickupTaskUrl}`);

    return { ...draft, clickupTaskUrl };
  },
});
