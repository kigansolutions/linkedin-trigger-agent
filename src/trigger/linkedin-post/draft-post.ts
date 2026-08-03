import { task } from "@trigger.dev/sdk";
import { query } from "@anthropic-ai/claude-agent-sdk";

type DraftPostPayload = {
  existingTopics: string[];
};

const SUBREDDITS = [
  "AI_Agents", "ArtificialInteligence", "AskClaw", "automation", "bash",
  "ChatGPT", "ChatGPTPromptGenius", "ClaudeAI", "ClaudeCode", "GeminiAI",
  "GoogleAntigravityIDE", "GoogleGeminiAI", "hermesagent", "mcp", "netsec",
  "notebooklm", "ollama", "OpenAI", "OSINT", "PromptEngineering", "startups",
  "technology", "vibecoding",
];

const TAVILY_FALLBACK_QUERIES = [
  "AI agent production failure reddit discussion",
  "MCP server security reddit",
  "local LLM ollama business use reddit",
  "AI automation client reddit complaint",
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
  if (!posts.length) return "(no live source material found this run)";
  return posts
    .map((p) => `- r/${p.subreddit} — "${p.title}" (score ${p.score}, ${p.numComments} comments)\n  ${p.url}\n  ${p.excerpt || "(no body text)"}`)
    .join("\n\n");
}

const SYSTEM_PROMPT = `You draft a single LinkedIn post for Cameron Weyers, in his voice.

Who Cameron is: a business operator (financial accounting / business ownership, prior
hospitality/kitchen background) turned AI systems builder. Based in the Western Cape, South
Africa. Runs Kigan Solutions. Primary language Python (Django). Ships production systems, not
demos — his core loop is architect the system, decompose the problem, direct AI tooling to
implement it, own it through to production. Local-first but not absolutist about infra — the
system comes first, the model underneath it is swappable.

What he's shipped (draw on these for authority/examples, don't just list them — never state
tool/skill/server/LOC counts, they read as vanity padding, not signal):
- Hermes: self-hosted agentic platform (Ubuntu + Tailscale, Ollama local inference, Chroma/Qdrant
  vector memory, LangGraph + CrewAI orchestration, daily briefings, voice via Whisper/TTS,
  Streamlit dashboard).
- platform-adapter-mcp: adapter pattern wrapping REST/GraphQL APIs as agent-callable tools.
- n8n-security-automation: self-hosted n8n + local LLMs for recon/threat-intel pipelines.
- A SARS-compliant payroll platform (Django, WhatsApp payslip delivery).
- A hospitality point-of-sale platform.

Step 1 — pick ONE topic from the real Reddit posts you're given below. Favor the AI-native
subreddits and posts with real engagement (score/comments) over noise. Never repeat a topic or
angle from the "already used" list you're given. If nothing in the batch intersects something
Cameron has real authority to speak to, draft from Cameron's shipped work directly instead
(source: "operator experience") — don't force a reach.

Step 2 — draft, following all of these voice rules:
- Punchy. Short lines, generous white space.
- Contrarian-but-not-preachy. Opinionated, not hedged.
- No emoji. 0-3 hashtags total.
- End on a question that invites real replies, not engagement bait.
- React to the source post from Cameron's actual operator experience — never summarize it like a
  news digest.
- Job-seeking framing is fine occasionally, not mandatory, never desperate.

Respond in EXACTLY this format, nothing before or after:

TOPIC: <one-line topic/angle, for dedup tracking>
SOURCE: <the reddit URL you drew on, or "operator experience">
POST:
<the full post text, ready to publish as-is>`;

function buildUserPrompt(payload: DraftPostPayload, sourceContext: string): string {
  const usedLines = payload.existingTopics.length
    ? payload.existingTopics.map((t) => `- ${t}`).join("\n")
    : "(none yet)";

  return `Already used topics/angles — do not repeat:\n${usedLines}\n\nReal Reddit posts from this week:\n${sourceContext}\n\nPick this week's topic and draft the post.`;
}

async function createClickUpTask(topic: string, source: string, post: string): Promise<string> {
  const apiKey = process.env.CLICKUP_API_KEY;
  const listId = process.env.CLICKUP_LIST_ID;
  if (!apiKey) throw new Error("CLICKUP_API_KEY is not set");
  if (!listId) throw new Error("CLICKUP_LIST_ID is not set");

  const today = new Date().toISOString().slice(0, 10);
  const res = await fetch(`https://api.clickup.com/api/v2/list/${listId}/task`, {
    method: "POST",
    headers: { Authorization: apiKey, "Content-Type": "application/json" },
    body: JSON.stringify({
      name: `LinkedIn Draft — ${today} — ${topic}`,
      description: `**Source:** ${source}\n\n---\n\n${post}`,
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
      prompt: buildUserPrompt(payload, sourceContext),
      options: {
        systemPrompt: SYSTEM_PROMPT,
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

    const topicMatch = reply.match(/TOPIC:\s*(.+)/);
    const sourceMatch = reply.match(/SOURCE:\s*(.+)/);
    const postMatch = reply.match(/POST:\s*([\s\S]+)/);
    if (!topicMatch || !sourceMatch || !postMatch) {
      throw new Error(`Could not parse draft reply:\n${reply}`);
    }

    const topic = topicMatch[1].trim();
    const source = sourceMatch[1].trim();
    const post = postMatch[1].trim();

    const clickupTaskUrl = await createClickUpTask(topic, source, post);
    console.log(`Created ClickUp task: ${clickupTaskUrl}`);

    return { topic, source, clickupTaskUrl };
  },
});
