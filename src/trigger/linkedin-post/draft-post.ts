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

const SYSTEM_PROMPT = `You draft a single LinkedIn post for Cameron Weyers, in his voice.

Who Cameron is: a business operator (financial accounting / business ownership, prior
hospitality/kitchen background) turned AI systems builder. Based in the Western Cape, South
Africa. Runs Kigan Solutions. Primary language Python (Django). Ships production systems, not
demos — his core loop is architect the system, decompose the problem, direct AI tooling to
implement it, own it through to production. Local-first but not absolutist about infra — the
system comes first, the model underneath it is swappable.

What he's shipped (draw on these for authority/examples, don't just list them):
- Hermes: self-hosted agentic platform (Ubuntu + Tailscale, Ollama local inference, Chroma/Qdrant
  vector memory, LangGraph + CrewAI orchestration, 6 MCP servers, 40+ tools, 28+ skills, daily
  briefings, voice via Whisper/TTS, Streamlit dashboard).
- platform-adapter-mcp: adapter pattern wrapping REST/GraphQL APIs as agent-callable tools.
- n8n-security-automation: self-hosted n8n + local LLMs for recon/threat-intel pipelines.
- A SARS-compliant payroll platform (Django, WhatsApp payslip delivery, ~7,100 LOC).
- A hospitality point-of-sale platform (~3,600 LOC, 46 models).

Step 1 — research. Reddit blocks direct programmatic fetches (JSON/RSS), so use your web search
tool instead: run a handful of targeted searches like \`site:reddit.com/r/AI_Agents <theme>\` across
a mix of these subreddits — ${SUBREDDITS.join(", ")} — favoring the AI-native ones. You don't need
to search all of them; stop once you've found a live discussion worth reacting to. If nothing
useful turns up, draft from Cameron's shipped work directly instead (source: "operator experience").

Step 2 — pick ONE topic: the discussion that intersects something Cameron has real authority to
speak to. Never repeat a topic or angle from the "already used" list you're given.

Step 3 — draft, following all of these voice rules:
- Punchy. Short lines, generous white space.
- Contrarian-but-not-preachy. Opinionated, not hedged.
- No emoji. 0-3 hashtags total.
- End on a question that invites real replies, not engagement bait.
- React to the source discussion from Cameron's actual operator experience — never summarize it
  like a news digest.
- Job-seeking framing is fine occasionally, not mandatory, never desperate.

Respond in EXACTLY this format, nothing before or after:

TOPIC: <one-line topic/angle, for dedup tracking>
SOURCE: <the reddit URL you drew on, or "operator experience">
POST:
<the full post text, ready to publish as-is>`;

function buildUserPrompt(payload: DraftPostPayload): string {
  const usedLines = payload.existingTopics.length
    ? payload.existingTopics.map((t) => `- ${t}`).join("\n")
    : "(none yet)";

  return `Already used topics/angles — do not repeat:\n${usedLines}\n\nFind this week's topic and draft the post.`;
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

    let reply = "";
    for await (const message of query({
      prompt: buildUserPrompt(payload),
      options: {
        systemPrompt: SYSTEM_PROMPT,
        tools: ["WebSearch"],
        maxTurns: 12,
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
