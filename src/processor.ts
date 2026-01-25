import { researchCompany } from "./research.ts";
import type { CompanyInputArray } from "./types.ts";

/**
 * Processes an array of companies by researching each one.
 * For each company, calls researchCompany and merges the results with the input.
 * @param companies - Array of company inputs to process
 * @returns Array of company results with research data merged
 */
export async function processCompanyArray(
	companies: CompanyInputArray,
): Promise<Array<CompanyInputArray[number]>> {
	const results: Array<CompanyInputArray[number]> = [];

	for (const company of companies) {
		const researchResult = await researchCompany(company.name, company.domain);
		results.push({ ...company, ...researchResult });
	}

	return results;
}
