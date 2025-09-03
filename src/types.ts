import z from "zod";

export type CompanyInput = {
	name: string;
	domain: string;
};

export type CompanyResearchFields = {
	employees: number;
	revenue: number;
	eam_practice: EstablishedOrUnknown;
	eam_tool: EamTool;
	sam_practice: EstablishedOrUnknown;
	sam_tool: SamTool;
	itBp_practice: EstablishedOrUnknown;
	itsm_tool: ItsmTool;
};

export type CompanyOutput = CompanyInput & CompanyResearchFields;

const establishedOrUnknownSchema = z.enum(["established", "unknown"]);
type EstablishedOrUnknown = z.infer<typeof establishedOrUnknownSchema>;

const eamToolSchema = z.enum([
	"LeanIX",
	"Ardoq",
	"Alfabet",
	"ADOIT",
	"ArchiMate",
	"LUY",
	"Bee360",
	"other",
]);
type EamTool = z.infer<typeof eamToolSchema>;

const samToolSchema = z.enum(["Flexera", "ServiceNow"]);
type SamTool = z.infer<typeof samToolSchema>;

const itsmToolSchema = z.enum(["Jira", "ServiceNow"]);
type ItsmTool = z.infer<typeof itsmToolSchema>;
