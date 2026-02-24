import { researchFieldConfiguration } from "./prompts.ts";
import type { ResearchFieldKey } from "./schemas.ts";

const baseResponseKeys = new Set(["explanation", "certainty_score", "sources"]);
/**
 * Generates a human-readable summary of research results.
 * Only includes fields that are not "unknown" with their sources.
 * @param results - The research results object
 * @returns Formatted summary string with newlines
 */
export function generateResearchSummary(
	results: Record<string, unknown>,
): string {
	const fieldKeys = Object.keys(
		researchFieldConfiguration,
	) as ResearchFieldKey[];
	const knownFields: Array<{
		key: string;
		value: unknown;
		certainty: number;
		sources?: string[];
	}> = [];

	for (const fieldKey of fieldKeys) {
		const fieldResult = results[fieldKey];
		if (!fieldResult || typeof fieldResult !== "object") {
			continue;
		}

		const resultObj = fieldResult as Record<string, unknown>;
		const certainty = resultObj.certainty_score as number;
		const sources = resultObj.sources as string[] | undefined;

		// All schemas are objects: extract all non-base keys
		const nonBaseKeys = Object.keys(resultObj).filter(
			(k) => !baseResponseKeys.has(k),
		);
		if (nonBaseKeys.length === 0) {
			continue;
		}

		// Use the key that matches the field name as primary value
		const primaryKey = nonBaseKeys.find((k) => k === fieldKey) || nonBaseKeys[0];
		const fieldValue = resultObj[primaryKey];

		// Skip if primary value is "unknown"
		if (fieldValue === "unknown") {
			continue;
		}

		// Collect additional keys (excluding the primary key)
		const additionalKeys = nonBaseKeys.filter((k) => k !== primaryKey);

		knownFields.push({
			key: fieldKey,
			value: fieldValue,
			certainty,
			sources,
			// Store additional keys for multi-line display
			_additionalKeys: additionalKeys.map(
				(k) => `${k}: ${JSON.stringify(resultObj[k])}`,
			),
		} as { key: string; value: unknown; certainty: number; sources?: string[]; _additionalKeys?: string[] });
	}
	if (knownFields.length === 0) {
		return "No known research results available.";
	}

	const summaryLines: string[] = [];

	for (const field of knownFields) {
		const displayName = field.key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());

		// Format value based on type
		const additionalInfo = (field as { _additionalKeys?: string[] })
			._additionalKeys;

		let formattedValue: string;
		if (typeof field.value === "number") {
			formattedValue = field.value.toLocaleString();
		} else {
			formattedValue = String(field.value);
		}

		summaryLines.push(`${displayName}: ${formattedValue}`);

		// Add additional keys from object schemas
		if (additionalInfo && additionalInfo.length > 0) {
			for (const info of additionalInfo) {
				summaryLines.push(`  ${info}`);
			}
		}

		summaryLines.push(`Certainty: ${field.certainty}`);

		if (field.sources && field.sources.length > 0) {
			summaryLines.push("Sources:");
			for (const source of field.sources) {
				summaryLines.push(`  - ${source}`);
			}
		}

		summaryLines.push("");
	}

	return summaryLines.join("\n").trimEnd();
}
