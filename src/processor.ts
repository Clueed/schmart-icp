import type { KeyMappingConfig } from "./config.ts";
import { Logger } from "./logger.ts";
import { researchCompany } from "./research.ts";
import { normalizeCompanyInput } from "./transform.ts";
import type { CompanyInputArray } from "./types.ts";

/**
 * Processes an array of companies by researching each one with concurrency control.
 * For each company, calls researchCompany and merges the results with the input.
 * If an error occurs while researching a company, the error is saved to that company's result
 * and processing continues with the remaining companies.
 * @param companies - Array of company inputs to process
 * @param config - Key mapping configuration for normalizing inputs
 * @param concurrency - Maximum number of companies to process simultaneously (default: 5).
 *                      Note: Each company makes 8 parallel API calls internally, so total
 *                      concurrent API calls = concurrency × 8.
 * @returns Array of company results with research data merged (or error info if failed)
 */
export async function processCompanyArray(
  companies: CompanyInputArray,
  config?: KeyMappingConfig,
  concurrency = 2,
): Promise<Array<CompanyInputArray[number]>> {
  if (concurrency < 1) {
    throw new Error("concurrency must be at least 1");
  }

  function chunk<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  const chunks = chunk(companies, concurrency);
  const allResults: Array<{
    index: number;
    result: CompanyInputArray[number];
  }> = [];

  for (const chunk of chunks) {
    const chunkPromises = chunk.map(async (company, chunkIndex) => {
      const index = allResults.length + chunkIndex;
      const normalized = config
        ? normalizeCompanyInput(company, config)
        : company;

      try {
        const researchResult = await researchCompany(
          normalized.name,
          normalized.domain,
        );
        return { index, result: { ...company, ...researchResult } };
      } catch (error) {
        Logger.warn(`⚠️  Failed to research company: ${normalized.name}`);
        Logger.warn(error);
        return {
          index,
          result: {
            ...company,
            _researchError:
              error instanceof Error ? error.message : String(error),
          },
        };
      }
    });

    const chunkResults = await Promise.all(chunkPromises);
    allResults.push(...chunkResults);
  }

  const results = allResults
    .sort((a, b) => a.index - b.index)
    .map((item) => item.result);

  return results;
}
