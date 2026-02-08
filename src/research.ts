import { callLLM } from "./api.ts";
import { Logger } from "./logger.ts";
import { researchFieldConfiguration } from "./prompts.ts";
import { generateResearchSummary } from "./research-summary.ts";
import { createExtendedSchema, type ResearchFieldKey } from "./schemas.ts";
import type { CompanyInput } from "./types.ts";

function extractFieldValues(
  results: Record<string, unknown>,
): Record<string, unknown> {
  const fieldKeys = Object.keys(
    researchFieldConfiguration,
  ) as ResearchFieldKey[];
  const flattened: Record<string, unknown> = {};

  for (const fieldKey of fieldKeys) {
    const fieldResult = results[fieldKey];
    if (fieldResult && typeof fieldResult === "object") {
      flattened[fieldKey] = (fieldResult as Record<string, unknown>)[fieldKey];
    }
  }

  return flattened;
}

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
    ...extractFieldValues(results),
    "icp research summary": generateResearchSummary(results),
  };

  Logger.section("Research Results");
  Logger.log(companyOutput);

  return companyOutput;
}

export async function researchAllFields(company: string) {
  const fields = Object.entries(researchFieldConfiguration);
  const batchSize = 3;
  const results: Record<string, unknown> = {};

  for (let i = 0; i < fields.length; i += batchSize) {
    const batch = fields.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async ([field]) => ({
        field,
        value: await researchCompanyField(company, field as ResearchFieldKey),
      })),
    );
    for (const { field, value } of batchResults) {
      results[field] = value;
    }
  }

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
