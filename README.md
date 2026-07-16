# linkedin-trigger-agent

Weekly pipeline that drafts a LinkedIn post in Cameron Weyers' voice and hands it to him for
review — hosted on [Trigger.dev](https://trigger.dev), built with Claude Code.

## How it works

Every Monday at 06:00 UTC:

1. **`find-topic`** (`src/trigger/linkedin-post/find-topic.ts`) — fetches existing draft titles
   from a ClickUp list to avoid repeating a topic, then triggers `draft-post`.
2. **`draft-post`** (`src/trigger/linkedin-post/draft-post.ts`) — calls the
   [Claude Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk), authenticated
   via a Claude subscription token (`CLAUDE_CODE_OAUTH_TOKEN`, generated with `claude setup-token`)
   rather than a metered API key. The agent uses its built-in `WebSearch` tool to find a live AI
   discussion on Reddit — Reddit blocks direct programmatic `.json`/`.rss` fetches outright, so
   this sidesteps that — picks a topic that intersects Cameron's real operator experience, drafts
   the post, and creates a ClickUp task with the draft for review.

Never auto-publishes. Every run produces a reviewable draft, not a live post.

## Local development

```bash
npm install
cp .env.example .env   # fill in CLAUDE_CODE_OAUTH_TOKEN, CLICKUP_API_KEY, CLICKUP_LIST_ID
npm run dev
```

Fire a test run of `find-topic` from the Trigger.dev dashboard's Test tab (Development
environment) and watch the logs stream in this terminal.

## Deploying

This repo is connected in the Trigger.dev dashboard via the installed GitHub App, so every push
auto-deploys to production. Env vars live in the dashboard under Environment Variables (Prod) —
they only exist in `.env` locally otherwise.
