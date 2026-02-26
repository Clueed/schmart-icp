import z from "zod";

type DataField = {
  prompt: (company: string) => string;
  valueSchema: z.ZodTypeAny;
};

const EVIDANCE_THRESHOLD_PROMPT = `
*Evidence Threshold:*
Any concrete connection is sufficient. You do not need formal case studies. Valid evidence includes:
- Job postings mentioning activities/roles/jobs.
- Parent group technology stacks.
- Vendor client lists or success stories (for any part of the group).
- Developer documentation or conference talks.
`.trim();

export const SYSTEM_PROMPT = `
You are a meticulous research assistant.

Given a company name, return the most accurate and recent information you can find.

*Verification Protocol:*
**Never rely on search summaries, snippets, or metadata.** You must access and assess the actual content of the website. Only cite a source if the page text explicitly answers the question.

*Entity Strategy - The "Single Entity" Rule:*
Treat the requested company and its entire corporate hierarchy (Parent Group, Holding, Subsidiaries) as **one single entity**.
- Do not differentiate between "Group level" and "Subsidiary level" data.
- If you find data for the parent group (e.g., revenue, tools, employees), attribute it directly to the requested company.
- You do not need to explain that the data comes from the parent. Just return the value.

*Source Formatting:*
Return sources as plain URLs only, without any markdown formatting, descriptions, or additional text.
Format: "https://example.com", "https://example.com/page"
Do not include: [link text](url), brackets, quotes, labels, or any other formatting.

When a field cannot be determined for *any* part of the corporate group, return "unknown".
`.trim();

export const researchFieldConfiguration = {
  employees: {
    prompt: (company) =>
      `What is the most recent figure of the employees and revenue of ${company} and what broad industry does it operate it? Prefer Wikipedia as source if available.`,
    valueSchema: z.object({
      employees: z.number().int().min(0),
      revenue: z.number().int().min(0),
      industry: z.string().min(0),
    }),
  },
  eam_research: {
    prompt: (company) =>
      `${EVIDANCE_THRESHOLD_PROMPT}

Determine if ${company} has an Enterprise Architecture (EA) department (Enterprise (Data/Security) Architect, Business Architecture, Group EA, Unternehmensarchitektur) AND identify which, if any, EAM tool they use.`,
    valueSchema: z.object({
      eam_practice: z.enum(["established", "unknown"]),
      eam_tool: z.enum([
        "LeanIX",
        "Ardoq",
        "Alfabet",
        "ADOIT",
        "ArchiMate",
        "LUY",
        "Bee360",
        "ServiceNow Enterprise Architecture",
        "GBTEC BIC",
        "Bizzdesign",
        "MEGA HOPEX",
        "Planview",
        "other",
        "unknown",
      ]),
    }),
  },
  sam_research: {
    prompt: (company) =>
      `${EVIDANCE_THRESHOLD_PROMPT}

Determine if ${company} has a Software Asset Management (SAM) (Software Asset Manager, IT License Manager, IT Asset Manager, ITAM, IT Contract Manager) AND identify which, if any, SAM tool they use.`,
    valueSchema: z.object({
      sam_practice: z.enum(["established", "unknown"]),
      sam_tool: z.enum([
        "Flexera",
        "ServiceNow Software Asset Management (SAM)",
        "ManageEngine AssetExplorer",
        "Atera",
        "Ivanti",
        "USU Software Asset Management",
        "Zluri",
        "other",
        "unknown",
      ]),
    }),
  },
  itsm_tool: {
    prompt: (company) =>
      `${EVIDANCE_THRESHOLD_PROMPT}
    
Which, if any, IT Service Management (ITSM) tool does the company ${company} use?`,
    valueSchema: z.object({
      itsm_tool: z.enum([
        "Jira Service Management",
        "ServiceNow ITSM",
        "Ivanti",
        "Matrix42",
        "Freshworks Freshservice",
        "USU ITSM",
        "BMC Helix ITSM",
        "Omnitracker",
        "other",
        "unknown",
      ]),
    }),
  },
  itBp_practice: {
    prompt: (company) =>
      `${EVIDANCE_THRESHOLD_PROMPT}
    
Does ${company} have the role of IT Business Partner or IT Demand Manager? They are also referred to as IT Business Relation(s)/Relationship(s) Manager, IT Coordinator, Requirements Engineer, or IT Business Analyst.`,
    valueSchema: z.object({
      itBp_practice: z.enum(["established", "unknown"]),
    }),
  },
} as const satisfies Record<string, DataField>;
