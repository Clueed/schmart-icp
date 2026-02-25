import { describe, expect, it } from "vitest";
import { generateResearchSummary } from "./research-summary.js";

describe("generateResearchSummary function", () => {
	it("should return empty message when no results provided", () => {
		const results = {};
		const summary = generateResearchSummary(results);
		expect(summary).toBe("No known research results available.");
	});

	it("should skip fields with unknown values", () => {
		const results = {
			employees: {
				employees: 100,
				certainty_score: 0.5,
				sources: ["https://example.com"],
			},
			eam_research: {
				eam_practice: "unknown",
				eam_tool: "LeanIX",
				certainty_score: 0.5,
				sources: [],
			},
		};
		const summary = generateResearchSummary(results);
		expect(summary).toContain("Employees: 100");
		expect(summary).toContain("Eam Tool: LeanIX");
		expect(summary).not.toContain("Eam Practice");
	});

	it("should format revenue without euro symbol", () => {
		const results = {
			employees: {
				revenue: 500000,
				certainty_score: 0.5,
				sources: ["https://example.com"],
			},
		};
		const summary = generateResearchSummary(results);
		expect(summary).toContain("Revenue: 500,000");
	});

	it("should handle nested object structure with multiple keys", () => {
		const results = {
			employees: {
				employees: 1000,
				revenue: 500000,
				certainty_score: 0.5,
				sources: ["https://example.com"],
			},
			eam_research: {
				eam_practice: "established",
				eam_tool: "LeanIX",
				certainty_score: 0.7,
				sources: ["https://example.com"],
			},
			sam_research: {
				sam_practice: "unknown",
				sam_tool: "Flexera",
				certainty_score: 0.3,
				sources: ["https://example.com"],
			},
		};
		const summary = generateResearchSummary(results);

		expect(summary).toContain("Employees: 1,000");
		expect(summary).toContain("Revenue: 500,000");
		expect(summary).toContain("Eam Practice: established");
		expect(summary).toContain("Eam Tool: LeanIX");
		expect(summary).toContain("Sam Tool: Flexera");
		expect(summary).not.toContain("Sam Practice: unknown");
	});

	it("should skip explanation fields from LLM response", () => {
		const results = {
			employees: {
				employees: 100,
				explanation: "Some explanation text",
				certainty_score: 0.5,
				sources: ["https://example.com"],
			},
		};
		const summary = generateResearchSummary(results);
		expect(summary).toContain("Employees: 100");
		expect(summary).not.toContain("Explanation");
	});

	it("should format sources correctly", () => {
		const results = {
			employees: {
				employees: 100,
				certainty_score: 0.5,
				sources: ["https://source1.com", "https://source2.com"],
			},
		};
		const summary = generateResearchSummary(results);
		expect(summary).toContain("Sources:");
		expect(summary).toContain("  - https://source1.com");
		expect(summary).toContain("  - https://source2.com");
	});

	it("should handle string values that are not unknown", () => {
		const results = {
			itsm_tool: {
				itsm_tool: "ServiceNow ITSM",
				certainty_score: 0.6,
				sources: ["https://example.com"],
			},
		};
		const summary = generateResearchSummary(results);
		expect(summary).toContain("Itsm Tool: ServiceNow ITSM");
	});
});
