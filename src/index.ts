import "dotenv/config";
import { z } from "zod/v4";
import { callLLM } from "./api.ts";

const EAM_TOOLS = [
	"LeanIX",
	"Ardoq",
	"Alfabet",
	"ADOIT",
	"ArchiMate",
	"LUY",
	"Bee360",
	"other",
	"unknown",
];

const eamToolSchema = z.object({
	eam_tool: z.enum(EAM_TOOLS).describe("The EAM tool used by the company."),
	confidence_level: z
		.number()
		.min(0)
		.max(1)
		.describe("Confidence level of the answer from 0 to 1."),
	explanation: z.string().describe("Explain of the answer."),
});

async function researchCompany(company: string) {
	const response = await callLLM({
		prompt: `Find out which Enterprise Architecture Management (EAM) tool the company ${company} uses — choices include LeanIX, Ardoq, Alfabet, ADOIT, ArchiMate, LUY, Bee360, and others. Use web search to locate the information, cite your sources, and reply concisely. If you can't find the information, say so clearly.`,
		response_schema: {
			name: "eam_tool_research",
			schema: eamToolSchema,
		},
	});

	console.log(response);
	console.log(response.choices[0].message);
}

researchCompany("Siemens Energy");
