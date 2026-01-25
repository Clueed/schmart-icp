import type { KeyMappingConfig } from "./config.ts";
import { Logger } from "./logger.ts";
import { researchCompany } from "./research.ts";
import { normalizeCompanyInput } from "./transform.ts";
import type { CompanyInputArray } from "./types.ts";

/**
 * Processes an array of companies by researching each one.
 * For each company, calls researchCompany and merges the results with the input.
 * If an error occurs while researching a company, the error is saved to that company's result
 * and processing continues with the remaining companies.
 * @param companies - Array of company inputs to process
 * @param config - Key mapping configuration for normalizing inputs
 * @returns Array of company results with research data merged (or error info if failed)
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

		try {
			const researchResult = await researchCompany(
				normalized.name,
				normalized.domain,
			);
			results.push({ ...company, ...researchResult });
		} catch (error) {
			Logger.warn(`⚠️  Failed to research company: ${normalized.name}`);
			Logger.warn(error);

			results.push({
				...company,
				_researchError: error instanceof Error ? error.message : String(error),
			});
		}
	}

	return results;
}
