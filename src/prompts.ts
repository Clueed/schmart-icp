import z from "zod";
import type { baseResponseSchema } from "./schemas.ts";

type DataField = {
	prompt: (company: string) => string;
	valueSchema: z.ZodTypeAny;
};

export type OutputSchema = z.infer<typeof baseResponseSchema> & {
	[key in keyof typeof researchFieldConfiguration]: z.infer<
		(typeof researchFieldConfiguration)[key]["valueSchema"]
	>;
};

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
			`Does ${company} has an enterprise architecture (EA) department? Often also called Business Architecture, something IT-Enterprise-Architecture or Unternehmensarchitektur.`,
		valueSchema: z.object({ value: z.enum(["established", "unknown"]) }),
	},
	itBp_practice: {
		prompt: (company) =>
			`Does ${company} have the role of IT Business Partner or IT Demand Manager? Something they are also referred to as IT Business Relation(s)/Relationship(s) Manager or Requirements Engineer.`,
		valueSchema: z.object({ value: z.enum(["established", "unknown"]) }),
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
			`Does ${company} have a Software Asset Management (SAM) or IT License Management department?.`,
		valueSchema: z.object({ value: z.enum(["established", "unknown"]) }),
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
