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
	const summaryLines: string[] = [];

	for (const fieldKey of fieldKeys) {
		const fieldResult = results[fieldKey];
		if (!fieldResult || typeof fieldResult !== "object") {
			continue;
		}

		const nestedObj = fieldResult as Record<string, unknown>;
		const nestedKeys = Object.keys(nestedObj);

		// Collect non-unknown values for this field
		const fieldLines: string[] = [];

		for (const nestedKey of nestedKeys) {
			if (
				nestedKey === "certainty_score" ||
				nestedKey === "sources" ||
				nestedKey === "explanation"
			) {
				continue;
			}

			const nestedValue = nestedObj[nestedKey];
			if (nestedValue === "unknown") {
				continue;
			}

			const displayName = nestedKey
				.replace(/_/g, " ")
				.replace(/\b\w/g, (l) => l.toUpperCase());

			let formattedValue: string;
			if (typeof nestedValue === "number") {
				formattedValue = nestedValue.toLocaleString();
			} else if (typeof nestedValue === "string") {
				formattedValue = nestedValue;
			} else {
				continue;
			}

			fieldLines.push(`${displayName}: ${formattedValue}`);
		}

		// Add collected values and sources (if any values exist)
		if (fieldLines.length > 0) {
			summaryLines.push(...fieldLines);

			const sources = nestedObj.sources as string[] | undefined;
			if (sources && sources.length > 0) {
				summaryLines.push("Sources:");
				for (const source of sources) {
					summaryLines.push(`  - ${source}`);
				}
			}

			summaryLines.push("");
		}
	}

	if (summaryLines.length === 0) {
		return "No known research results available.";
	}

	return summaryLines.join("\n").trimEnd();
}
