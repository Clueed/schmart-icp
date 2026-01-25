import { callLLM } from "./api.ts";
import { Logger } from "./logger.ts";
import { researchFieldConfiguration } from "./prompts.ts";
import { generateResearchSummary } from "./research-summary.ts";
import { createExtendedSchema, type ResearchFieldKey } from "./schemas.ts";
import type { CompanyInput } from "./types.ts";

export async function researchCompany(companyName: string, domain?: string) {
	Logger.log(`🔍 Starting research for ${companyName}`);
	Logger.log(`Domain: ${domain}`);

	const companyInput: CompanyInput = {
		name: companyName,
		domain: domain,
	};

	const results = await researchAllFields(companyName);
	const companyOutput = {
		...companyInput,
		...results,
		"icp research summary": generateResearchSummary(results),
	};

	Logger.section("Research Results");
	Logger.log(companyOutput);

	return companyOutput;
}

export async function researchAllFields(company: string) {
	const results = Object.fromEntries(
		await Promise.all(
			Object.entries(researchFieldConfiguration).map(async ([field]) => [
				field,
				await researchCompanyField(company, field as ResearchFieldKey),
			]),
		),
	);

	return results;
}

export async function researchCompanyField<TKey extends ResearchFieldKey>(
	company: string,
	field: TKey,
) {
	const prompt = researchFieldConfiguration[field].prompt(company);

	const schema = createExtendedSchema<TKey>(field);

	const { response, parsedOutput } = await callLLM({
		prompt,
		response_schema: {
			name: field,
			schema: schema,
		},
	});

	Logger.debug(`LLM response for ${field}:`, response);

	return parsedOutput;
}
