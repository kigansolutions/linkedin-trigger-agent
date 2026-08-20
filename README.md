# linkedin-trigger-agent

Weekly draft-only LinkedIn content engine for Cameron Weyers and Kigan Agentic AI Solutions.

The system creates a ClickUp review task. It does not publish to LinkedIn, schedule posts, scrape
engagement, send DMs, or bypass human approval.

## Current schedule

Trigger.dev runs `find-topic` every Monday at 06:00 UTC:

```ts
cron: "0 6 * * 1"
```

## How it works

1. **`find-topic`** (`src/trigger/linkedin-post/find-topic.ts`)
   - Reads existing ClickUp task titles from the configured list.
   - Adds seed topics already used by earlier LinkedIn drafting work.
   - Triggers `draft-post` with the combined dedup list.

2. **`draft-post`** (`src/trigger/linkedin-post/draft-post.ts`)
   - Retrieves optional public Reddit source material through Composio's authenticated Reddit
     tool execution API.
   - Uses Tavily as a fallback search source when Composio Reddit returns no usable posts.
   - Supplies source context directly to the Claude Agent SDK.
   - Calls the Claude Agent SDK with `tools: []`; it does not use built-in WebSearch.
   - Creates one ClickUp task for Cameron's review.

## LinkedIn Content Engine v2

The v2 voice model is defined in `src/trigger/linkedin-post/voice-v2.ts`.

It shifts topic selection away from "react to an AI Reddit post" and toward "choose a weekly
angle Cameron can credibly write about":

- Founder/operator observations
- Kigan-building-in-public
- Brand clarity
- Workflow improvement
- Human-governed AI
- Technical proof

Reddit and search results are optional inspiration. The model may instead use operator
experience, current safe Kigan work, public AI/business discussion, recurring content lanes, or
non-private project lessons. It must not ingest private client or stakeholder content.

## Voice and safety

The draft voice is founder-first, practical, evidence-led, and review-gated:

- business operator credibility first
- technical depth as supporting proof
- process before automation where appropriate
- evidence before claims
- human-governed AI and clear approval boundaries
- no fake client outcomes
- no generic thought-leader voice or engagement bait

The expected model output contract is:

```text
TOPIC:
ANGLE_TYPE:
SOURCE:
CLAIM_RISK:
REVIEW_NOTES:
POST:
```

Lightweight guardrails flag risky wording such as unsupported client claims, production claims,
fully automated/autonomous language, ROI or savings percentages, revenue/growth claims,
compliance claims, scale claims, staff replacement implications, fake case-study phrasing, and
generic "AI is revolutionising..." language.

If guardrails detect risky wording, the task is marked `CLAIM_RISK: HIGH` in ClickUp with review
notes explaining the flagged pattern. It remains a draft requiring Cameron's human approval.

## ClickUp review gate

Each ClickUp task includes:

- draft status
- topic
- angle type
- source
- claim risk
- review notes
- post body
- a clear instruction that the draft requires Cameron's approval before public use

The existing `linkedin-draft` tag is preserved.

## Local development

```bash
npm install
cp .env.example .env
npm run typecheck
npm test
npm run dev
```

Fill in `.env` locally:

- `CLAUDE_CODE_OAUTH_TOKEN`
- `CLICKUP_API_KEY`
- `CLICKUP_LIST_ID`
- `COMPOSIO_API_KEY`
- `COMPOSIO_REDDIT_CONNECTED_ACCOUNT_ID`
- `COMPOSIO_REDDIT_USER_ID`
- `TAVILY_API_KEY` (optional fallback)
- `CLAUDE_CODE_EXECUTABLE_PATH` (Windows local dev only, if needed)

Fire a test run of `find-topic` from the Trigger.dev dashboard's Test tab in the Development
environment and watch the logs stream in the terminal.

## Deploying

This repo is connected in the Trigger.dev dashboard through the installed GitHub App, so pushes
deploy according to the dashboard configuration. Production environment variables live in
Trigger.dev. Local `.env` values are only for development.
