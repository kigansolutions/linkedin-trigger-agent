export const CONTENT_LANES = [
  "Founder/operator observations",
  "Kigan-building-in-public",
  "Brand clarity",
  "Workflow improvement",
  "Human-governed AI",
  "Technical proof",
] as const;

export type AngleType = (typeof CONTENT_LANES)[number];
export type ClaimRisk = "LOW" | "MEDIUM" | "HIGH";

export type DraftOutput = {
  topic: string;
  angleType: AngleType;
  source: string;
  claimRisk: ClaimRisk;
  reviewNotes: string;
  post: string;
};

export type RiskFinding = {
  label: string;
  pattern: RegExp;
};

export type LaneCount = {
  angleType: AngleType;
  count: number;
};

export const ANGLE_TAG_PREFIX = "angle:";

export const CAMERON_IDENTITY = [
  "Cameron Weyers is the founder/operator building Kigan Agentic AI Solutions.",
  "He is a business operator first: restaurant ownership and financial/accounting context shape how he thinks about constraints, handoffs, cash, judgment, and operational mess.",
  "He is technically credible, but the technical depth supports the business point. It is not the default identity.",
  "He writes as one person building in public, not as an agency, a big team, or a generic AI influencer.",
];

export const KIGAN_IDENTITY = [
  "Kigan is a solo AI automation studio becoming an AI-native services company with specialised Studios and a shared Platform.",
  "Current public positioning is review-gated AI workflow design and implementation around real business processes.",
  "Brand Clarity Foundation helps clarify audience, offer, positioning, messaging, and brand direction before design work runs ahead of strategy.",
  "Workflow Proof Plan turns a messy recurring process into a scoped, testable workflow artifact with evidence, approval gates, and clear next steps.",
  "Kigan is evidence-led and pre-revenue in the reviewed canonical snapshot, so do not imply paid client outcomes, production deployments, scale, revenue, or mature autonomous delivery unless supplied as explicit evidence.",
];

export const VOICE_PRINCIPLES = [
  "Founder-first and operator-led.",
  "Business clarity before tool enthusiasm.",
  "Evidence before claims.",
  "Process changes before automation where appropriate.",
  "Human-governed AI: review gates, approval boundaries, and stop paths matter.",
  "Technical depth appears as proof, not as the whole point.",
  "Plainspoken, practical, occasionally blunt or dry, never theatrical.",
  "Short lines and readable white space, without becoming a formula.",
  "No fake client outcomes, no generic thought-leader voice, no engagement bait.",
];

export const CONTENT_LANE_GUIDANCE: Record<AngleType, string[]> = {
  "Founder/operator observations": [
    "Running real businesses, operational friction, systems under constraints, and what breaks in practice.",
    "Use business-owner judgment and lived operating mess as the source of authority.",
  ],
  "Kigan-building-in-public": [
    "What Kigan is learning, why narrow engagements matter, why evidence comes before claims, and how an AI-native organisation is being built under human approval.",
    "Do not make every post a sales post or force Kigan into every topic.",
  ],
  "Brand clarity": [
    "Unclear offers, audience clarity, positioning, messaging discipline, and why branding starts before design.",
    "Tie the point to business usefulness, not aesthetic preference.",
  ],
  "Workflow improvement": [
    "Repetitive work, messy handoffs, process before automation, deciding what should stay human, and when not to use AI.",
    "Avoid generic productivity hacks.",
  ],
  "Human-governed AI": [
    "Review gates, approval boundaries, safe progression toward autonomy, evidence, and stop paths.",
    "Autonomy is earned by evidence and controls; it is not the headline claim.",
  ],
  "Technical proof": [
    "MCP, agents, orchestration, RAG, n8n, APIs, and local AI can appear as supporting evidence.",
    "Never make tool names the core identity by default.",
  ],
};

export const CLAIMS_GUARDRAILS = [
  "Do not say 'for clients' unless the provided context explicitly supports client delivery.",
  "Do not say 'in production' unless explicit evidence is supplied.",
  "Do not claim full automation, autonomy, guaranteed results, ROI/savings percentages, revenue growth, compliance, scale, staff replacement, or fake case studies.",
  "Do not imply Kigan has employees, a large team, mature platform adoption, or production client integrations.",
  "Do not use private client/stakeholder content as source material.",
];

export const BANNED_PATTERNS = [
  "AI is revolutionising...",
  "Hot take:",
  "Unpopular opinion:",
  "Agree?",
  "Thoughts?",
  "Comment below",
  "I was today years old",
  "Here's the brutal truth",
  "10x your",
  "game-changer",
  "crushing it",
  "founder journey rollercoaster",
  "vulnerable post",
  "replace your team",
  "fully autonomous",
  "autopilot business",
  "hashtag stuffing",
  "emoji-heavy copy",
];

export const TECHNICAL_PROOF_RULES = [
  "Use technical details only when they prove the business point.",
  "Prefer 'I tested', 'I found', 'the check showed', and 'the workflow broke here' over broad claims.",
  "Name tools like MCP, agents, RAG, n8n, APIs, or local AI only when the post would be weaker without them.",
  "Avoid tool-count vanity, framework chatter, and local-LLM discourse unless they connect to a real operator lesson.",
];

export const CTA_RULES = [
  "Question endings are optional.",
  "A post may end with a clear observation, a practical principle, a concise takeaway, or a genuine question when natural.",
  "Do not force contrarian hooks or engagement-bait endings.",
];

export const PHRASING_EXAMPLES = {
  good: [
    "The boring handoff is usually where the automation breaks.",
    "I would rather prove one narrow workflow than claim an agent can run the business.",
    "Brand clarity is not the logo stage. It is the part where you stop asking design to fix a confused offer.",
    "The technical win only matters if it changes the operating decision.",
  ],
  bad: [
    "AI is revolutionising every business function and founders need to adapt now.",
    "Hot take: fully autonomous agents will replace your back office this year.",
    "We helped clients save 40% with production AI workflows.",
    "Comment YES if you want the exact framework.",
  ],
};

export const RISK_FINDINGS: RiskFinding[] = [
  { label: "unsupported client claim", pattern: /\bfor clients\b/i },
  { label: "production claim", pattern: /\bin production\b|\bproduction-ready\b/i },
  { label: "full automation claim", pattern: /\bfully automated\b|\bfull automation\b/i },
  { label: "autonomy claim", pattern: /\bautonomous\b|\bautonomy\b|\bautopilot\b/i },
  { label: "guaranteed result", pattern: /\bguarantee[sd]?\b|\bguaranteed results?\b/i },
  { label: "ROI or savings percentage", pattern: /\b(?:ROI|return on investment)\b|\b(?:save[sd]?|saving|savings?|reduced?|reduction|increase[sd]?|growth|ROI) \d+%|\b\d+% (?:savings?|saved|reduction|increase|growth|ROI)\b/i },
  { label: "revenue or growth claim", pattern: /\b(?:revenue|growth|sales|pipeline) (?:grew|growth|increase|increased|lift|uplift|boost|doubled|tripled)\b/i },
  { label: "compliance claim", pattern: /\b(?:SARS|GDPR|POPIA|HIPAA|compliance|compliant)\b/i },
  { label: "scale claim", pattern: /\bat scale\b|\bscaled\b|\benterprise-grade\b/i },
  { label: "every build claim", pattern: /\bevery build\b/i },
  { label: "case-study phrasing", pattern: /\bcase study\b|\bclient outcome\b|\bhelped (?:a|an|our) client\b/i },
  { label: "staff replacement implication", pattern: /\breplace (?:staff|employees|your team|people|humans)\b/i },
  { label: "generic AI revolution language", pattern: /\bAI is revolutioni[sz]ing\b|\btransforming the way businesses\b/i },
];

export const VOICE_FINDINGS: RiskFinding[] = [
  { label: "engagement bait", pattern: /\b(?:agree\?|thoughts\?|comment below|drop a comment|what do you think\?)\b/i },
  { label: "forced contrarian hook", pattern: /\b(?:hot take|unpopular opinion|brutal truth)\b/i },
  { label: "motivational fluff", pattern: /\b(?:crushing it|game-changer|10x your|level up your life)\b/i },
  { label: "emoji-heavy posting", pattern: /[\u{1F300}-\u{1FAFF}]/u },
  { label: "hashtag stuffing", pattern: /(?:#[\w-]+\s*){4,}/i },
];

const FIELD_PATTERN =
  /^TOPIC:\s*(?<topic>.+?)\s*\nANGLE_TYPE:\s*(?<angleType>.+?)\s*\nSOURCE:\s*(?<source>.+?)\s*\nCLAIM_RISK:\s*(?<claimRisk>[A-Za-z]+)\s*\nREVIEW_NOTES:\s*(?<reviewNotes>[\s\S]*?)\nPOST:\s*(?<post>[\s\S]+)$/;

export function detectRiskyClaims(text: string): string[] {
  const safeSpans = getSafeDisclaimerSpans(text);
  return RISK_FINDINGS.filter((finding) => hasUnsafeMatch(text, finding.pattern, safeSpans)).map((finding) => finding.label);
}

export function detectVoiceViolations(text: string): string[] {
  return VOICE_FINDINGS.filter((finding) => finding.pattern.test(text)).map((finding) => finding.label);
}

export function assessClaimRisk(text: string): ClaimRisk {
  const claimFindings = detectRiskyClaims(text);
  const voiceFindings = detectVoiceViolations(text);
  if (claimFindings.length > 0) return "HIGH";
  if (voiceFindings.length > 0) return "MEDIUM";
  return "LOW";
}

export function parseDraftOutput(reply: string): DraftOutput {
  const match = reply.trim().match(FIELD_PATTERN);
  if (!match?.groups) {
    throw new Error(`Could not parse draft reply:\n${reply}`);
  }

  const angleType = match.groups.angleType.trim();
  if (!isAngleType(angleType)) {
    throw new Error(`Unsupported ANGLE_TYPE "${angleType}"`);
  }

  const claimRisk = match.groups.claimRisk.trim().toUpperCase();
  if (!isClaimRisk(claimRisk)) {
    throw new Error(`Unsupported CLAIM_RISK "${match.groups.claimRisk.trim()}"`);
  }

  return {
    topic: match.groups.topic.trim(),
    angleType,
    source: match.groups.source.trim(),
    claimRisk,
    reviewNotes: match.groups.reviewNotes.trim(),
    post: match.groups.post.trim(),
  };
}

export function enforceDraftSafety(draft: DraftOutput): DraftOutput {
  const claimFindings = detectRiskyClaims(draft.post);
  const voiceFindings = detectVoiceViolations(draft.post);
  if (claimFindings.length === 0 && voiceFindings.length === 0) {
    return draft;
  }

  const findings = [...claimFindings, ...voiceFindings];
  return {
    ...draft,
    claimRisk: "HIGH",
    reviewNotes: [
      draft.reviewNotes,
      `Automated guardrail flagged: ${findings.join(", ")}. Do not approve without human rewrite or evidence.`,
    ].join("\n"),
  };
}

export function buildSystemPrompt(): string {
  return `You draft one LinkedIn post for Cameron Weyers using LinkedIn Content Engine v2.

CAMERON IDENTITY
${CAMERON_IDENTITY.map((line) => `- ${line}`).join("\n")}

KIGAN IDENTITY
${KIGAN_IDENTITY.map((line) => `- ${line}`).join("\n")}

VOICE PRINCIPLES
${VOICE_PRINCIPLES.map((line) => `- ${line}`).join("\n")}

CONTENT LANES
${CONTENT_LANES.map((lane) => `- ${lane}: ${CONTENT_LANE_GUIDANCE[lane].join(" ")}`).join("\n")}

CLAIMS GUARDRAILS
${CLAIMS_GUARDRAILS.map((line) => `- ${line}`).join("\n")}

BANNED PATTERNS
${BANNED_PATTERNS.map((line) => `- ${line}`).join("\n")}

TECHNICAL-PROOF RULES
${TECHNICAL_PROOF_RULES.map((line) => `- ${line}`).join("\n")}

CTA / ENDING RULES
${CTA_RULES.map((line) => `- ${line}`).join("\n")}

GOOD PHRASING
${PHRASING_EXAMPLES.good.map((line) => `- ${line}`).join("\n")}

BAD PHRASING
${PHRASING_EXAMPLES.bad.map((line) => `- ${line}`).join("\n")}

Choose a weekly angle worth Cameron writing about. Reddit and search material are optional inspiration, not the assignment. Prefer operator experience, current Kigan work that is safe to discuss, public AI/business discussion, recurring Kigan content lanes, and project lessons that do not reveal private client or stakeholder content.

Respond in EXACTLY this format, with no text before or after:

TOPIC: <one-line topic/angle for dedup tracking>
ANGLE_TYPE: <one of: ${CONTENT_LANES.join(" | ")}>
SOURCE: <reddit URL, search result URL, "operator experience", "Kigan first-party evidence", or another concise source label>
CLAIM_RISK: <LOW | MEDIUM | HIGH>
REVIEW_NOTES: <briefly explain why this fits Cameron/Kigan v2, any claim requiring human confirmation, and whether source material is external opinion vs Kigan first-party evidence>
POST:
<the full post text, draft only>`;
}

export function buildUserPrompt(existingTopics: string[], sourceContext: string, laneSummary = "No recent lane history available."): string {
  const usedLines = existingTopics.length ? existingTopics.map((topic) => `- ${topic}`).join("\n") : "(none yet)";
  return `Already used topics/angles — do not repeat:\n${usedLines}\n\nRecent content-lane mix — use as anti-clustering guidance, not rigid rotation:\n${laneSummary}\n\nCandidate weekly angles and optional source material:\n${sourceContext}\n\nPick this week's angle and draft the post.`;
}

export function buildClickUpDescription(draft: DraftOutput): string {
  return `**Status:** Draft — requires Cameron's human review and approval before any public use.

**Topic:** ${draft.topic}
**Angle type:** ${draft.angleType}
**Source:** ${draft.source}
**Claim risk:** ${draft.claimRisk}

**Review notes:**
${draft.reviewNotes}

---

**Post body:**

${draft.post}`;
}

export function buildClickUpTaskName(date: string, draft: DraftOutput): string {
  const baseName = `LinkedIn Draft — ${date} — ${draft.topic}`;
  return draft.claimRisk === "HIGH" ? `⚠️ HIGH RISK — ${baseName}` : baseName;
}

export function angleTagFor(angleType: AngleType): string {
  return `${ANGLE_TAG_PREFIX}${angleType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`;
}

export function angleTypeFromTag(tag: string): AngleType | undefined {
  const normalized = tag.trim().toLowerCase();
  return CONTENT_LANES.find((lane) => angleTagFor(lane) === normalized);
}

export function summarizeLaneCounts(angleTypes: AngleType[]): string {
  if (!angleTypes.length) return "No recent angle tags found.";

  const counts = CONTENT_LANES.map((angleType) => ({
    angleType,
    count: angleTypes.filter((lane) => lane === angleType).length,
  })).filter((entry) => entry.count > 0);

  const total = angleTypes.length;
  const busiest = counts.reduce<LaneCount | undefined>(
    (current, entry) => (!current || entry.count > current.count ? entry : current),
    undefined
  );
  const countLines = counts.map((entry) => `- ${entry.angleType}: ${entry.count}`).join("\n");
  const guidance = busiest && busiest.count > 1
    ? `Recent drafts lean toward "${busiest.angleType}". Prefer a different lane when the available angle is equally strong.`
    : "Recent drafts are not strongly clustered. Choose the strongest credible angle.";

  return `Last ${total} tagged draft${total === 1 ? "" : "s"}:\n${countLines}\n${guidance}`;
}

function isAngleType(value: string): value is AngleType {
  return (CONTENT_LANES as readonly string[]).includes(value);
}

function isClaimRisk(value: string): value is ClaimRisk {
  return value === "LOW" || value === "MEDIUM" || value === "HIGH";
}

function hasUnsafeMatch(text: string, pattern: RegExp, safeSpans: { start: number; end: number }[]): boolean {
  const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
  const matcher = new RegExp(pattern.source, flags);
  for (const match of text.matchAll(matcher)) {
    const start = match.index ?? 0;
    const end = start + match[0].length;
    if (!safeSpans.some((span) => start >= span.start && end <= span.end)) {
      return true;
    }
  }
  return false;
}

function getSafeDisclaimerSpans(text: string): { start: number; end: number }[] {
  const patterns = [
    /\bnot yet in production\b/gi,
    /\bnot for clients\b/gi,
    /\bno evidence of ROI yet\b/gi,
    /\b(?:does not|doesn't|do not|don't|will not|won't|should not|shouldn't)\s+replace\s+(?:staff|employees|your team|people|humans)\b/gi,
    /\bautonomy is earned\b/gi,
    /\bscaled back\b/gi,
  ];

  return patterns.flatMap((pattern) =>
    [...text.matchAll(pattern)].map((match) => ({
      start: match.index ?? 0,
      end: (match.index ?? 0) + match[0].length,
    }))
  );
}
