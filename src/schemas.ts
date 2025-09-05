import z from "zod";
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

// Create extended schema type for a specific field
export type ExtendedResponseSchema<K extends ResearchFieldKey> = z.ZodObject<
	z.infer<typeof baseResponseSchema> & {
		[P in K]: ResearchFieldConfig[P]["valueSchema"];
	}
>;

// Create extended response type for a specific field
export type ExtendedResponse<K extends ResearchFieldKey> = z.infer<
	typeof baseResponseSchema
> & {
	[P in K]: ExtractZodType<ResearchFieldConfig[P]["valueSchema"]>;
};

// Runtime helper function to create extended schema
export function createExtendedSchema<K extends ResearchFieldKey>(
	fieldKey: K,
): ExtendedResponseSchema<K> {
	const fieldConfig = researchFieldConfiguration[fieldKey];

	return baseResponseSchema.extend({
		[fieldKey]: fieldConfig.valueSchema,
	}) as ExtendedResponseSchema<K>;
}

export function parseResponse<K extends ResearchFieldKey>(
	fieldKey: K,
	data: unknown,
): ExtendedResponse<K> {
	const schema = createExtendedSchema(fieldKey);
	return schema.parse(data) as ExtendedResponse<K>;
}
