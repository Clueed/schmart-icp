import z from "zod";

type DataField = {
	prompt: (company: string) => string;
	valueSchema: z.ZodTypeAny;
};

export const SYSTEM_PROMPT = `
You are a meticulous research assistant.

Given a company name, return the most accurate and recent information you can find.

*Entity Strategy - The "Single Entity" Rule:*
Treat the requested company and its entire corporate hierarchy (Parent Group, Holding, Subsidiaries) as **one single entity**.
- Do not differentiate between "Group level" and "Subsidiary level" data.
- If you find data for the parent group (e.g., revenue, tools, employees), attribute it directly to the requested company.
- You do not need to explain that the data comes from the parent. Just return the value.

*Evidence Threshold:*
Any concrete connection is sufficient. You do not need formal case studies. Valid evidence includes:
- Job postings mentioning tools.
- Parent group technology stacks.
- Vendor client lists or success stories (for any part of the group).
- Developer documentation or conference talks.

*Source Formatting:*
Return sources as plain URLs only, without any markdown formatting, descriptions, or additional text.
Format: "https://example.com", "https://example.com/page"
Do not include: [link text](url), brackets, quotes, labels, or any other formatting.

When a field cannot be determined for *any* part of the corporate group, return "unknown".
`.trim();

export const researchFieldConfiguration = {
	employees: {
		prompt: (company) =>
			`What is the most recent figure of the employees of ${company}?`,
		valueSchema: z.number().int().min(0),
	},
	revenue: {
		prompt: (company) =>
			`What is the most recent figure of the revenue of ${company}?`,
		valueSchema: z.number().int().min(0),
	},
	eam_tool: {
		prompt: (company) =>
			`Which, if any, Enterprise Architecture Management (EAM) tool does the company ${company}.`,
		valueSchema: z.enum([
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
	},
	eam_practice: {
		prompt: (company) =>
			`Does ${company} have an enterprise architecture (EA) department? Often also called Business Architecture, something IT-Enterprise-Architecture, Group EA, Unternehmensarchitektur.`,
		valueSchema: z.enum(["established", "unknown"]),
	},
	itBp_practice: {
		prompt: (company) =>
			`Does ${company} have the role of IT Business Partner or IT Demand Manager? Something they are also referred to as IT Business Relation(s)/Relationship(s) Manager, IT Coordinator, Requirements Engineer, or IT Business Analyst.`,
		valueSchema: z.enum(["established", "unknown"]),
	},
	itsm_tool: {
		prompt: (company) =>
			`Which, if any, IT Service Management (ITSM) tool does the company ${company}.`,
		valueSchema: z.enum([
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
	},
	sam_practice: {
		prompt: (company) =>
			`Does ${company} have a Software Asset Management (SAM), IT License Management, or IT Asset Management department?.`,
		valueSchema: z.enum(["established", "unknown"]),
	},
	sam_tool: {
		prompt: (company) =>
			`Which, if any, Software Asset Management (SAM)/IT License Management Tools tool does the company ${company} use?`,
		valueSchema: z.enum([
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
	},
} as const satisfies Record<string, DataField>;
