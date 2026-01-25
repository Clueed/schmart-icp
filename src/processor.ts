import type { KeyMappingConfig } from "./config.ts";
import { researchCompany } from "./research.ts";
import { normalizeCompanyInput } from "./transform.ts";
import type { CompanyInputArray } from "./types.ts";

/**
 * Processes an array of companies by researching each one.
 * For each company, calls researchCompany and merges the results with the input.
 * @param companies - Array of company inputs to process
 * @param config - Key mapping configuration for normalizing inputs
 * @returns Array of company results with research data merged
 */
export async function processCompanyArray(
	companies: CompanyInputArray,
	config?: KeyMappingConfig,
): Promise<Array<CompanyInputArray[number]>> {
	const results: Array<CompanyInputArray[number]> = [];

	for (const company of companies) {
		const normalized = config
			? normalizeCompanyInput(company, config)
			: company;
		const researchResult = await researchCompany(
			normalized.name,
			normalized.domain,
		);
		results.push({ ...company, ...researchResult });
	}

	return results;
}
