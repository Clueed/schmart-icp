import { researchFieldConfiguration } from "./prompts.ts";
import type { ResearchFieldKey } from "./schemas.ts";

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

		const fieldValue = (fieldResult as Record<string, unknown>)[fieldKey];
		if (fieldValue === "unknown") {
			continue;
		}

		knownFields.push({
			key: fieldKey,
			value: fieldValue,
			certainty: (fieldResult as Record<string, unknown>)
				.certainty_score as number,
			sources: (fieldResult as Record<string, unknown>).sources as
				| string[]
				| undefined,
		});
	}

	if (knownFields.length === 0) {
		return "No known research results available.";
	}

	const summaryLines: string[] = [];

	for (const field of knownFields) {
		const displayName = field.key
			.replace(/_/g, " ")
			.replace(/\b\w/g, (l) => l.toUpperCase());

		let formattedValue: string;
		if (typeof field.value === "number") {
			if (field.key === "revenue") {
				formattedValue = `€${field.value.toLocaleString()}`;
			} else {
				formattedValue = field.value.toLocaleString();
			}
		} else {
			formattedValue = String(field.value);
		}

		summaryLines.push(`${displayName}: ${formattedValue}`);
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
