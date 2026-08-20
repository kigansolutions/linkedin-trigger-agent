import { describe, expect, it } from "vitest";
import {
  assessClaimRisk,
  buildClickUpDescription,
  buildClickUpTaskName,
  buildSystemPrompt,
  buildUserPrompt,
  CONTENT_LANES,
  detectRiskyClaims,
  enforceDraftSafety,
  parseDraftOutput,
  summarizeLaneCounts,
  type DraftOutput,
} from "./voice-v2.js";

const SAMPLE_DRAFTS: DraftOutput[] = [
  {
    topic: "The handoff is usually where the system breaks",
    angleType: "Founder/operator observations",
    source: "operator experience",
    claimRisk: "LOW",
    reviewNotes: "Fits the operator lens; source is first-party operating experience.",
    post: "The boring handoff is usually where the automation breaks.\n\nNot the model.\nNot the prompt.\nThe handoff.\n\nSomeone changes a spreadsheet column.\nA manager approves work in WhatsApp.\nA supplier sends half the information in a photo.\n\nThat is where the system has to meet the business as it actually runs.",
  },
  {
    topic: "Why Kigan is choosing narrow proof-led engagements",
    angleType: "Kigan-building-in-public",
    source: "Kigan first-party evidence",
    claimRisk: "LOW",
    reviewNotes: "Build-in-public angle; no client outcome claimed.",
    post: "I am deliberately keeping Kigan's first offers narrow.\n\nNot because the ambition is small.\nBecause broad AI claims are cheap.\n\nA narrow workflow can be inspected.\nA messy input can be tested.\nA review gate can be shown.\n\nThat is better proof than pretending the platform is already bigger than it is.",
  },
  {
    topic: "Brand clarity starts before the logo",
    angleType: "Brand clarity",
    source: "Kigan first-party evidence",
    claimRisk: "LOW",
    reviewNotes: "Matches Brand Clarity Foundation; no unsupported result.",
    post: "Branding starts before design.\n\nIf the audience is fuzzy, the logo gets blamed for a strategy problem.\nIf the offer is unclear, the colour palette cannot rescue it.\n\nThe useful work is often less glamorous:\nWho is this for?\nWhat are they already trying to solve?\nWhy should they trust this specific offer?",
  },
  {
    topic: "Some workflows need a better process before AI",
    angleType: "Workflow improvement",
    source: "operator experience",
    claimRisk: "LOW",
    reviewNotes: "Workflow Proof Plan angle; source is operator experience.",
    post: "Not every workflow needs AI first.\n\nSome need a named owner.\nSome need one less approval step.\nSome need the spreadsheet to stop being three versions of the truth.\n\nAI can make a bad process faster.\nThat is not the same as making the business better.",
  },
  {
    topic: "Review gates are not bureaucracy",
    angleType: "Human-governed AI",
    source: "Kigan first-party evidence",
    claimRisk: "LOW",
    reviewNotes: "Fits governed AI positioning; source is Kigan first-party evidence.",
    post: "A review gate is not bureaucracy when the system touches a business decision.\n\nIt is the point where speed meets accountability.\n\nThe question is not whether AI can draft, sort, summarise, or recommend.\nThe question is where the human still needs to own the call.",
  },
  {
    topic: "Architecture only matters when it changes the operating decision",
    angleType: "Technical proof",
    source: "operator experience",
    claimRisk: "LOW",
    reviewNotes: "Technical details support the operator lesson.",
    post: "MCP, agents, RAG, n8n, APIs, local models.\n\nAll useful.\nNone of them are the point.\n\nThe point is whether the system gives the operator a clearer decision, a cleaner handoff, or a better stop path.\n\nOtherwise it is just architecture enjoying its own reflection.",
  },
  {
    topic: "Evidence beats a confident AI roadmap",
    angleType: "Human-governed AI",
    source: "Kigan first-party evidence",
    claimRisk: "LOW",
    reviewNotes: "Governance angle; no live deployment claim.",
    post: "The safest AI roadmap starts with proof.\n\nOne input.\nOne workflow.\nOne review point.\nOne thing that can be checked before the next step earns trust.\n\nThat sounds slower than promising the machine can run ahead.\nIt is usually how you avoid building expensive theatre.",
  },
  {
    topic: "An unclear offer creates messy delivery",
    angleType: "Brand clarity",
    source: "operator experience",
    claimRisk: "LOW",
    reviewNotes: "Brand clarity tied to operations.",
    post: "An unclear offer does not only hurt marketing.\n\nIt leaks into delivery.\nScope gets vague.\nHandoffs get awkward.\nThe client asks for everything because the business never named the actual promise.\n\nClear positioning is operational discipline, not decoration.",
  },
  {
    topic: "The work that should stay human",
    angleType: "Workflow improvement",
    source: "operator experience",
    claimRisk: "LOW",
    reviewNotes: "Practical workflow angle; explicitly preserves human ownership.",
    post: "A useful automation plan should name what stays human.\n\nApprovals.\nMoney decisions.\nSensitive judgment.\nAnything where being fast and wrong is worse than being slow and careful.\n\nThat boundary is not a weakness in the system.\nIt is part of the design.",
  },
  {
    topic: "Building the AI-native organisation without making it theatre",
    angleType: "Kigan-building-in-public",
    source: "Kigan first-party evidence",
    claimRisk: "LOW",
    reviewNotes: "Build-in-public angle; avoids inflated platform claims.",
    post: "Building an AI-native organisation can easily become theatre.\n\nMore agents.\nMore dashboards.\nMore clever internal plumbing.\n\nThe harder question is simpler:\nDid this help me find the customer, clarify the offer, ship the work, or make a better decision?\n\nIf not, it waits.",
  },
];

describe("LinkedIn Content Engine v2 voice", () => {
  it("assembles the canonical prompt with v2 identity, lanes, and output fields", () => {
    const prompt = buildSystemPrompt();

    expect(prompt).toContain("LinkedIn Content Engine v2");
    expect(prompt).toContain("founder/operator");
    expect(prompt).toContain("Brand Clarity Foundation");
    expect(prompt).toContain("Workflow Proof Plan");
    expect(prompt).toContain("ANGLE_TYPE:");
    expect(prompt).toContain("CLAIM_RISK:");
    expect(prompt).toContain("REVIEW_NOTES:");
  });

  it("assembles fallback user context when no live source material is available", () => {
    const prompt = buildUserPrompt(
      ["Process before automation"],
      "(no live external source material found this run)",
      "Last 3 tagged drafts:\n- Brand clarity: 3\nRecent drafts lean toward \"Brand clarity\"."
    );

    expect(prompt).toContain("Already used topics/angles");
    expect(prompt).toContain("- Process before automation");
    expect(prompt).toContain("anti-clustering guidance, not rigid rotation");
    expect(prompt).toContain("Brand clarity: 3");
    expect(prompt).toContain("Pick this week's angle");
  });

  it("parses the new model output contract", () => {
    const parsed = parseDraftOutput(`TOPIC: Review gates before autonomy
ANGLE_TYPE: Human-governed AI
SOURCE: operator experience
CLAIM_RISK: Low
REVIEW_NOTES: Fits governed AI; source is first-party operator judgment.
POST:
Review gates are where speed meets accountability.`);

    expect(parsed.angleType).toBe("Human-governed AI");
    expect(parsed.claimRisk).toBe("LOW");
    expect(parsed.post).toContain("accountability");
  });

  it("rejects invalid claim risk values while tolerating valid casing", () => {
    expect(() =>
      parseDraftOutput(`TOPIC: Review gates
ANGLE_TYPE: Human-governed AI
SOURCE: operator experience
CLAIM_RISK: uncertain
REVIEW_NOTES: none
POST:
Draft.`)
    ).toThrow(/Unsupported CLAIM_RISK/);
  });

  it("rejects unsupported angle types", () => {
    expect(() =>
      parseDraftOutput(`TOPIC: Generic startup hacks
ANGLE_TYPE: Entrepreneurship tips
SOURCE: external opinion
CLAIM_RISK: LOW
REVIEW_NOTES: none
POST:
Generic advice.`)
    ).toThrow(/Unsupported ANGLE_TYPE/);
  });

  it("detects risky claim wording", () => {
    const findings = detectRiskyClaims("We helped a client save 40% in production with a fully automated workflow.");

    expect(findings).toContain("production claim");
    expect(findings).toContain("full automation claim");
    expect(findings).toContain("ROI or savings percentage");
    expect(findings).toContain("case-study phrasing");
  });

  it("keeps realistic safe disclaimers low risk", () => {
    const safePhrases = [
      "This workflow is not yet in production.",
      "This is not for clients until there is evidence.",
      "The workflow is not fully automated.",
      "We aren't fully automated because approval should stay human.",
      "Autonomy is earned after review gates and stop paths are proven.",
      "I scaled back the workflow because the approval step was still messy.",
      "The system does not replace staff; it keeps the handoff visible.",
      "There is no evidence of ROI yet, so I would not claim it.",
    ];

    for (const phrase of safePhrases) {
      expect(detectRiskyClaims(phrase)).toEqual([]);
      expect(assessClaimRisk(phrase)).toBe("LOW");
    }
  });

  it("still flags realistic dangerous assertions", () => {
    const dangerousClaims = [
      "This workflow is in production for clients.",
      "The system is fully automated and autonomous.",
      "We guarantee results.",
      "The workflow saved 40% and increased revenue.",
      "This is POPIA compliant at scale.",
      "The agent replaces staff.",
      "The workflow is replacing employees.",
      "AI is revolutionising how businesses operate.",
    ];

    for (const claim of dangerousClaims) {
      expect(assessClaimRisk(claim)).toBe("HIGH");
    }
  });

  it("allows a full Human-governed AI post that uses autonomy safely", () => {
    const post = `Autonomy is earned.

Not announced.
Not assumed.
Not sold as a magic switch.

I want the system to prove the boring parts first:
the input is clear,
the review point is visible,
the stop path works,
and a human still owns the decision.

That is slower than the usual AI pitch.
It is also closer to how a real business should adopt the work.`;

    expect(detectRiskyClaims(post)).toEqual([]);
    expect(assessClaimRisk(post)).toBe("LOW");
  });

  it("marks risky drafts high risk before ClickUp creation", () => {
    const draft = enforceDraftSafety({
      ...SAMPLE_DRAFTS[0],
      post: "AI is revolutionising operations. We helped a client save 40% in production.",
    });

    expect(draft.claimRisk).toBe("HIGH");
    expect(draft.reviewNotes).toContain("Automated guardrail flagged");
  });

  it("shapes the ClickUp review payload with the human approval gate", () => {
    const description = buildClickUpDescription(SAMPLE_DRAFTS[4]);

    expect(description).toContain("Draft — requires Cameron's human review and approval");
    expect(description).toContain("**Angle type:** Human-governed AI");
    expect(description).toContain("**Claim risk:** LOW");
    expect(description).toContain("**Post body:**");
  });

  it("prefixes high-risk ClickUp titles only", () => {
    expect(buildClickUpTaskName("2026-08-20", SAMPLE_DRAFTS[4])).toBe("LinkedIn Draft — 2026-08-20 — Review gates are not bureaucracy");

    expect(buildClickUpTaskName("2026-08-20", { ...SAMPLE_DRAFTS[4], claimRisk: "HIGH" })).toBe(
      "⚠️ HIGH RISK — LinkedIn Draft — 2026-08-20 — Review gates are not bureaucracy"
    );
  });

  it("summarizes recent lane counts as anti-clustering guidance", () => {
    const summary = summarizeLaneCounts([
      "Brand clarity",
      "Brand clarity",
      "Workflow improvement",
      "Human-governed AI",
      "Brand clarity",
    ]);

    expect(summary).toContain("Last 5 tagged drafts");
    expect(summary).toContain("- Brand clarity: 3");
    expect(summary).toContain("Prefer a different lane");
  });

  it("keeps representative sample drafts within approved content lanes", () => {
    expect(SAMPLE_DRAFTS).toHaveLength(10);
    for (const draft of SAMPLE_DRAFTS) {
      expect(CONTENT_LANES).toContain(draft.angleType);
      expect(assessClaimRisk(draft.post)).toBe("LOW");
    }
  });
});
