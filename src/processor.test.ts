import { beforeEach, describe, expect, it, vi } from "vitest";
import { processCompanyArray } from "./processor.js";
import type { CompanyInputArray } from "./types.js";

vi.mock("./research.ts", () => ({
	researchCompany: vi.fn(),
}));

describe("processCompanyArray function", () => {
	let mockResearchCompany: ReturnType<typeof vi.fn>;

	beforeEach(async () => {
		vi.clearAllMocks();
		// Get the mocked function
		mockResearchCompany = vi.mocked(
			(await import("./research.ts")).researchCompany,
		);

		// Set up default mock implementation
		mockResearchCompany.mockImplementation(async (name, domain, tracker) => {
			const result: Record<string, unknown> = { name, domain, industry: "Tech" };
			if (name === "NoDomain") {
				delete result.domain;
			}
			if (name === "HasDomain") {
				result.industry = "Known";
			}
			if (name === "FailCompany") {
				result.industry = "Unknown";
			}
			if (name === "AnotherSuccess") {
				result.industry = "Healthcare";
			}
			// Add _usage field if tracker is provided
			if (tracker) {
				result._usage = {
					total_calls: 1,
					input_tokens: 1000,
					cached_tokens: 0,
					output_tokens: 500,
					reasoning_tokens: 0,
					total_tokens: 1500,
					web_search_calls: 0,
					web_search_cost: 0,
					input_cost: 0.001,
					output_cost: 0.002,
					total_cost: 0.003,
					model: "gpt-5.1",
					service_tier: "flex",
				};
			}
			return result;
		});
	});

	it("should process 2 companies and return array with 2 results", async () => {
		const companies: CompanyInputArray = [
			{ name: "Company1", domain: "company1.com" },
			{ name: "Company2", domain: "company2.com" },
		];

		const result = await processCompanyArray(companies);

		expect(mockResearchCompany).toHaveBeenCalledTimes(2);
		expect(mockResearchCompany).toHaveBeenNthCalledWith(
			1,
			"Company1",
			"company1.com",
			expect.any(Object), // PerCompanyTracker instance
		);
		expect(mockResearchCompany).toHaveBeenNthCalledWith(
			2,
			"Company2",
			"company2.com",
			expect.any(Object), // PerCompanyTracker instance
		);
		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			name: "Company1",
			domain: "company1.com",
			industry: "Tech",
			_usage: expect.any(Object), // Added tracking data
		});
		expect(result[1]).toMatchObject({
			name: "Company2",
			domain: "company2.com",
			industry: "Tech",
			_usage: expect.any(Object), // Added tracking data
		});
	});

	it("should preserve extra keys in input objects", async () => {
		const companies: CompanyInputArray = [
			{
				name: "Company1",
				domain: "company1.com",
				customField: "custom value",
				region: "US",
			},
			{ name: "Company2", domain: "company2.com", priority: 1 },
		];

		// Clear the default mock implementation for this test
		mockResearchCompany.mockClear();

		const mockResults = [
			{ name: "First", domain: "first.com", rank: 1 },
			{ name: "Second", domain: "second.com", rank: 2 },
		];
		// Use custom implementation that doesn't add default fields
		mockResearchCompany
			.mockImplementationOnce(async () => ({ ...mockResults[0], _usage: {} }))
			.mockImplementationOnce(async () => ({ ...mockResults[1], _usage: {} }));

		const result = await processCompanyArray(companies);

		expect(result).toHaveLength(2);
		expect(result[0]).toMatchObject({
			name: "First",
			domain: "first.com",
			rank: 1,
			customField: "custom value",
			region: "US",
			_usage: expect.any(Object),
		});
		expect(result[1]).toMatchObject({
			name: "Second",
			domain: "second.com",
			rank: 2,
			priority: 1,
			_usage: expect.any(Object),
		});
	});

	it("should maintain sequential order of companies", async () => {
		const companies: CompanyInputArray = [
			{ name: "First", domain: "first.com" },
			{ name: "Second", domain: "second.com" },
			{ name: "Third", domain: "third.com" },
		];

		// Clear the default mock implementation for this test
		mockResearchCompany.mockClear();

		const mockResults = [
			{ name: "First", domain: "first.com", rank: 1 },
			{ name: "Second", domain: "second.com", rank: 2 },
			{ name: "Third", domain: "third.com", rank: 3 },
		];
		mockResearchCompany
			.mockResolvedValueOnce(mockResults[0] as never)
			.mockResolvedValueOnce(mockResults[1] as never)
			.mockResolvedValueOnce(mockResults[2] as never);

		const result = await processCompanyArray(companies);

		expect(result).toHaveLength(3);
		expect(result[0].name).toBe("First");
		expect(result[1].name).toBe("Second");
		expect(result[2].name).toBe("Third");
		expect(result[0].rank).toBe(1);
		expect(result[1].rank).toBe(2);
		expect(result[2].rank).toBe(3);
	});

	it("should handle companies without domain", async () => {
		const companies: CompanyInputArray = [
			{ name: "NoDomain" },
			{ name: "HasDomain", domain: "example.com" },
		];

		const result = await processCompanyArray(companies);

		expect(mockResearchCompany).toHaveBeenNthCalledWith(
			1,
			"NoDomain",
			undefined,
			expect.any(Object), // PerCompanyTracker instance
		);
		expect(mockResearchCompany).toHaveBeenNthCalledWith(
			2,
			"HasDomain",
			"example.com",
			expect.any(Object), // PerCompanyTracker instance
		);
		expect(result[0].name).toBe("NoDomain");
		expect(result[0]).toHaveProperty("_usage"); // Has tracking data
		expect(result[1].name).toBe("HasDomain");
		expect(result[1]).toHaveProperty("_usage"); // Has tracking data
	});

	it("should continue processing when one company fails", async () => {
		const companies: CompanyInputArray = [
			{ name: "SuccessCompany", domain: "success.com" },
			{ name: "FailCompany", domain: "fail.com" },
			{ name: "AnotherSuccess", domain: "another.com" },
		];

		mockResearchCompany
			.mockImplementationOnce(async () => ({
				name: "SuccessCompany",
				domain: "success.com",
				industry: "Tech",
				_usage: {
					total_calls: 1,
					input_tokens: 1000,
					cached_tokens: 0,
					output_tokens: 500,
					reasoning_tokens: 0,
					total_tokens: 1500,
					web_search_calls: 0,
					web_search_cost: 0,
					input_cost: 0.001,
					output_cost: 0.002,
					total_cost: 0.003,
					model: "gpt-5.1",
					service_tier: "flex",
				},
			}))
			.mockRejectedValueOnce(new Error("API rate limit exceeded"))
			.mockImplementationOnce(async () => ({
				name: "AnotherSuccess",
				domain: "another.com",
				industry: "Healthcare",
				_usage: {
					total_calls: 1,
					input_tokens: 1000,
					cached_tokens: 0,
					output_tokens: 500,
					reasoning_tokens: 0,
					total_tokens: 1500,
					web_search_calls: 0,
					web_search_cost: 0,
					input_cost: 0.001,
					output_cost: 0.002,
					total_cost: 0.003,
					model: "gpt-5.1",
					service_tier: "flex",
				},
			}));

		const result = await processCompanyArray(companies);

		expect(mockResearchCompany).toHaveBeenCalledTimes(3);
		expect(result).toHaveLength(3);
		expect(result[0]).toMatchObject({
			name: "SuccessCompany",
			domain: "success.com",
			industry: "Tech",
			_usage: expect.any(Object),
		});
		expect(result[1]).toMatchObject({
			name: "FailCompany",
			domain: "fail.com",
			_researchError: "API rate limit exceeded",
			_usage: expect.any(Object),
		});
		expect(result[2]).toMatchObject({
			name: "AnotherSuccess",
			domain: "another.com",
			industry: "Healthcare",
			_usage: expect.any(Object),
		});
	});

	it("should throw when concurrency < 1", async () => {
		const companies: CompanyInputArray = [{ name: "Test" }];
		await expect(processCompanyArray(companies, undefined, 0)).rejects.toThrow(
			"concurrency must be at least 1",
		);
	});

	it("should handle concurrency = 1 correctly (sequential processing)", async () => {
		const companies: CompanyInputArray = [
			{ name: "First", domain: "first.com" },
			{ name: "Second", domain: "second.com" },
			{ name: "Third", domain: "third.com" },
		];

		// Clear the default mock implementation for this test
		mockResearchCompany.mockClear();

		const mockResults = [
			{ name: "First", domain: "first.com", rank: 1 },
			{ name: "Second", domain: "second.com", rank: 2 },
			{ name: "Third", domain: "third.com", rank: 3 },
		];
		mockResearchCompany
			.mockResolvedValueOnce(mockResults[0] as never)
			.mockResolvedValueOnce(mockResults[1] as never)
			.mockResolvedValueOnce(mockResults[2] as never);

		const result = await processCompanyArray(companies, undefined, 1);

		expect(mockResearchCompany).toHaveBeenCalledTimes(3);
		expect(result).toHaveLength(3);
		expect(result[0].name).toBe("First");
		expect(result[1].name).toBe("Second");
		expect(result[2].name).toBe("Third");
	});

	it("should handle array smaller than concurrency", async () => {
		const companies: CompanyInputArray = [{ name: "Single" }];

		// Clear the default mock implementation for this test
		mockResearchCompany.mockClear();

		mockResearchCompany.mockResolvedValueOnce({
			name: "Single",
			processed: true,
			_usage: {
				total_calls: 1,
				input_tokens: 1000,
				cached_tokens: 0,
				output_tokens: 500,
				reasoning_tokens: 0,
				total_tokens: 1500,
				web_search_calls: 0,
				web_search_cost: 0,
				input_cost: 0.001,
				output_cost: 0.002,
				total_cost: 0.003,
				model: "gpt-5.1",
				service_tier: "flex",
			},
		} as never);

		const result = await processCompanyArray(companies, undefined, 5);

		expect(mockResearchCompany).toHaveBeenCalledTimes(1);
		expect(result).toHaveLength(1);
	});
});
