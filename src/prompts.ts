import z from "zod";

type DataField = {
	prompt: (company: string) => string;
	valueSchema: z.ZodTypeAny;
};

export const SYSTEM_PROMPT = `
You are a meticulous research assistant.

Given a company name, return the most accurate and recent information you can find using both your existing knowledge and current web search results. 

*Scope & Entity Strategy:* Consider all relevant legal entities and brands under the company, but prioritize the group/holding. Job titles often blur legal boundaries—generalize sensibly to the group.

When any required field cannot be determined with high confidence, return "unknown" as appropriate—do not guess.

Always respond in valid JSON format according to the provided schema.
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
