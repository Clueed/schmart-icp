import z from "zod";
import type { KeyMappingConfig } from "./config.ts";
import { researchFieldConfiguration } from "./prompts.ts";

export const baseResponseSchema = z.object({
	explanation: z.string(),
	certainty_score: z.number().min(0).max(1),
	sources: z.array(z.string()),
});

// Type helpers
export type ResearchFieldConfig = typeof researchFieldConfiguration;
export type ResearchFieldKey = keyof ResearchFieldConfig;

// Extract the Zod type from a valueSchema
export type ExtractZodType<T> = T extends z.ZodType<infer U> ? U : never;

// Create extended response type - merges base fields with value schema fields
export type ExtendedResponse<K extends ResearchFieldKey> = z.infer<
	typeof baseResponseSchema
> &
	ExtractZodType<ResearchFieldConfig[K]["valueSchema"]>;

// Runtime helper function to create extended schema
export function createExtendedSchema<K extends ResearchFieldKey>(
	fieldKey: K,
) {
	const fieldConfig = researchFieldConfiguration[fieldKey];

	// Merge valueSchema properties directly with base response
	return baseResponseSchema.merge(fieldConfig.valueSchema);
}

export function parseResponse<K extends ResearchFieldKey>(
	fieldKey: K,
	data: unknown,
): ExtendedResponse<K> {
	const schema = createExtendedSchema(fieldKey);
	return schema.parse(data) as unknown as ExtendedResponse<K>;
}

export const CompanyInputArraySchema = z.array(
	z
		.object({
			name: z.string(),
		})
		.passthrough(),
);

export function createCompanyInputArraySchema(
	config: KeyMappingConfig,
): z.ZodType<Array<Record<string, unknown>>> {
	return z.array(
		z
			.object({
				[config.nameKey]: z.string(),
			})
			.passthrough(),
	);
}
