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

// Extract shape from ZodObject (all valueSchema are now objects)
type ExtractObjectShape<T> = T extends z.ZodObject<infer S> ? S : never;

// Create extended response type for a specific field
// All valueSchema are objects, so we flatten their keys into baseResponseSchema
export type ExtendedResponse<K extends ResearchFieldKey> = z.infer<typeof baseResponseSchema> &
	ExtractObjectShape<ResearchFieldConfig[K]["valueSchema"]>;
// Runtime helper function to create extended schema
// All valueSchema are ZodObjects, so we always flatten their shape
export function createExtendedSchema<K extends ResearchFieldKey>(
	fieldKey: K,
): z.ZodType<any> {
	const fieldConfig = researchFieldConfiguration[fieldKey];

	// Flatten: merge object shape into baseResponseSchema
	return baseResponseSchema.extend(
		(fieldConfig.valueSchema as z.ZodObject<any>).shape,
	);
}

export function parseResponse<K extends ResearchFieldKey>(
	fieldKey: K,
	data: unknown,
): ExtendedResponse<K> {
	const schema = createExtendedSchema(fieldKey);
	return schema.parse(data) as ExtendedResponse<K>;
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
