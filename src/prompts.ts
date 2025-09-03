import type { CompanyResearchFields } from "./types.ts";

type Prompts = Record<keyof CompanyResearchFields, (company: string) => string>;

const prompts = {
	employees: (company) =>
		`What is the most recent figure of the employees of ${company}?`,
	revenue: (company) =>
		`What is the most recent figure of the revenue of ${company}?`,
	eam_tool: (company) =>
		`Which, if any, Enterprise Architecture Management (EAM) tool does the company ${company}.`,
	eam_practice: (company) =>
		`Does ${company} has an enterprise architecture (EA) department? Often also called Business Architecture, something IT-Enterprise-Architecture or Unternehmensarchitektur.`,
	itBp_practice: (company) =>
		`Does ${company} have the role of IT Business Partner or IT Demand Manager? Something they are also referred to as IT Business Relation(s)/Relationship(s) Manager or Requirements Engineer.`,
	itsm_tool: (company) =>
		`Which, if any, IT Service Management (ITSM) tool does the company ${company}.`,
	sam_practice: (company) =>
		`Does ${company} have an Software Asset Management (SAM) department? Often also called IT License Management.`,
} satisfies Prompts;
