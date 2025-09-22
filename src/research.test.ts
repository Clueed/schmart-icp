import { describe, it, expect, vi, beforeEach } from "vitest";
import { researchCompany } from "./research.ts";
import { Logger } from "./logger.ts";
import { callLLM } from "./api.ts";

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
	});

	it("should research a company and return structured data", async () => {
		// Mock the callLLM to return different parsedOutput based on the field
		// biome-ignore lint/suspicious/noExplicitAny: Mock function args
		vi.mocked(callLLM).mockImplementation(async (args: any) => {
			const field = args.response_schema.name;
			const mockData: Record<string, unknown> = {
				explanation: `Mock explanation for ${field}`,
				certainty_score: 0.9,
				sources: ["https://example.com"],
			};

			switch (field) {
				case "employees":
					mockData.employees = 5000;
					break;
				case "revenue":
					mockData.revenue = 1000000000;
					break;
				case "eam_tool":
					mockData.eam_tool = "LeanIX";
					break;
				case "eam_practice":
					mockData.eam_practice = "established";
					break;
				case "itBp_practice":
					mockData.itBp_practice = "established";
					break;
				case "itsm_tool":
					mockData.itsm_tool = "ServiceNow ITSM";
					break;
				case "sam_practice":
					mockData.sam_practice = "established";
					break;
				case "sam_tool":
					mockData.sam_tool = "Flexera";
					break;
				default:
					throw new Error(`Unexpected field: ${field}`);
			}

			return {
				// biome-ignore lint/suspicious/noExplicitAny: Mock return types
				response: { output_text: JSON.stringify(mockData) } as any,
				// biome-ignore lint/suspicious/noExplicitAny: Mock return types
				parsedOutput: mockData as any,
			};
		});

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
	});
});
