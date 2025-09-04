import { callLLM } from "./api.ts";
import { Logger } from "./logger.ts";
import { researchFieldConfiguration } from "./prompts.ts";
import { baseResponseSchema } from "./schemas.ts";
import type { CompanyInput } from "./types.ts";

export async function researchCompany(companyName: string, domain?: string) {
	Logger.log(`🔍 Starting research for ${companyName}`);
	Logger.log(`Domain: ${domain}`);

	const companyInput: CompanyInput = {
		name: companyName,
		domain: domain,
	};

	const results = await researchAllFields(companyName);
	const companyOutput = { ...companyInput, ...results };

	Logger.section("Research Results");
	Logger.log(companyOutput);

	return companyOutput;
}

export async function researchAllFields(company: string) {
	const results = await Promise.all(
		Object.entries(researchFieldConfiguration).map(
			async ([field]) =>
				await researchCompanyField(
					company,
					field as keyof typeof researchFieldConfiguration,
				),
		),
	);

	return results;
}

export async function researchCompanyField<
	TKey extends keyof typeof researchFieldConfiguration,
>(company: string, field: TKey) {
	const prompt = researchFieldConfiguration[field].prompt(company);

	const valueSchema = researchFieldConfiguration[field].valueSchema;
	const schema = baseResponseSchema.extend({ [field]: valueSchema });

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
