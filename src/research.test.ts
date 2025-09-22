import { describe, it, expect, vi, beforeEach } from "vitest";
import { researchCompany } from "./research.ts";
import { Logger } from "./logger.ts";
import { callLLM } from "./api.ts";
import { createCallLLMMock } from "./mocks/api.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

// Mock OpenAI to prevent instantiation error
vi.mock("openai", () => ({
	default: vi.fn(() => ({
		responses: { create: vi.fn() },
	})),
}));

// Mock the api module
vi.mock("./api.ts");

describe("researchCompany", () => {
	beforeEach(() => {
		Logger.setDebug(false);
		vi.clearAllMocks();
		globalTokenTracker.reset();
	});

	it("should research a company and return structured data", async () => {
		// Mock the callLLM to return different parsedOutput based on the field
		vi.mocked(callLLM).mockImplementation(createCallLLMMock());

		const result = await researchCompany("Test Company");

		expect(result).toEqual({
			name: "Test Company",
			domain: undefined,
			employees: {
				explanation: "Mock explanation for employees",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				employees: 5000,
			},
			revenue: {
				explanation: "Mock explanation for revenue",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				revenue: 1000000000,
			},
			eam_tool: {
				explanation: "Mock explanation for eam_tool",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				eam_tool: "LeanIX",
			},
			eam_practice: {
				explanation: "Mock explanation for eam_practice",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				eam_practice: "established",
			},
			itBp_practice: {
				explanation: "Mock explanation for itBp_practice",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				itBp_practice: "established",
			},
			itsm_tool: {
				explanation: "Mock explanation for itsm_tool",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				itsm_tool: "ServiceNow ITSM",
			},
			sam_practice: {
				explanation: "Mock explanation for sam_practice",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				sam_practice: "established",
			},
			sam_tool: {
				explanation: "Mock explanation for sam_tool",
				certainty_score: 0.9,
				sources: ["https://example.com"],
				sam_tool: "Flexera",
			},
		});

		// Verify that callLLM was called 8 times (once for each field)
		expect(callLLM).toHaveBeenCalledTimes(8);

		// Verify token usage accumulation
		const summary = globalTokenTracker.getSummary();
		expect(summary.total_calls).toBe(8);
		expect(summary.input_tokens).toBe(400); // 8 * 50
		expect(summary.cached_tokens).toBe(80); // 8 * 10
		expect(summary.output_tokens).toBe(800); // 8 * 100
		expect(summary.reasoning_tokens).toBe(160); // 8 * 20
		expect(summary.total_tokens).toBe(1200); // 8 * 150

		// Log the summary for visibility in test output
		globalTokenTracker.logSummary();
	});
});
