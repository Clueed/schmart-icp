import { callLLM } from "./api.ts";
import { researchFieldConfiguration } from "./prompts.ts";
import { baseResponseSchema } from "./schemas.ts";

/**
 * Research all fields for a company
 * @param company - The company name to research
 * @returns Object containing all research results for the company
 */
export async function researchAllFields(company: string) {
	console.log(`Starting research for ${company}...`);

	const results = await Promise.all(
		Object.entries(researchFieldConfiguration).map(
			async ([field]) =>
				await researchCompanyField(
					company,
					field as keyof typeof researchFieldConfiguration,
				),
		),
	);

	console.log(`Research completed for ${company}`);
	return results;
}

/**
 * Generic function to research a specific field for a company
 * @param company - The company name to research
 * @param field - The field to research (e.g., 'employees', 'eam_tool', etc.)
 * @returns The research result with value, certainty_score, explanation, and sources
 */
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

	console.debug(`LLM response for ${field}:`, response);

	return parsedOutput;
}
