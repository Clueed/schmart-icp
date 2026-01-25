import { beforeEach, describe, expect, it, vi } from "vitest";
import { processCompanyArray } from "./processor.js";
import type { CompanyInputArray } from "./types.js";

vi.mock("./research.ts", () => ({
	researchCompany: vi.fn(),
}));

describe("processCompanyArray function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should process 2 companies and return array with 2 results", async () => {
		const companies: CompanyInputArray = [
			{ name: "Company1", domain: "company1.com" },
			{ name: "Company2", domain: "company2.com" },
		];

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany)
			.mockResolvedValueOnce({
				name: "Company1",
				domain: "company1.com",
				industry: "Tech",
			} as never)
			.mockResolvedValueOnce({
				name: "Company2",
				domain: "company2.com",
				industry: "Finance",
			} as never);

		const result = await processCompanyArray(companies);

		expect(researchCompany).toHaveBeenCalledTimes(2);
		expect(researchCompany).toHaveBeenNthCalledWith(
			1,
			"Company1",
			"company1.com",
		);
		expect(researchCompany).toHaveBeenNthCalledWith(
			2,
			"Company2",
			"company2.com",
		);
		expect(result).toHaveLength(2);
		expect(result[0]).toEqual({
			name: "Company1",
			domain: "company1.com",
			industry: "Tech",
		});
		expect(result[1]).toEqual({
			name: "Company2",
			domain: "company2.com",
			industry: "Finance",
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

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany)
			.mockResolvedValueOnce({
				name: "Company1",
				domain: "company1.com",
				industry: "Tech",
			} as never)
			.mockResolvedValueOnce({
				name: "Company2",
				domain: "company2.com",
				industry: "Finance",
			} as never);

		const result = await processCompanyArray(companies);

		expect(result[0]).toEqual({
			name: "Company1",
			domain: "company1.com",
			customField: "custom value",
			region: "US",
			industry: "Tech",
		});
		expect(result[1]).toEqual({
			name: "Company2",
			domain: "company2.com",
			priority: 1,
			industry: "Finance",
		});
	});

	it("should maintain sequential order of companies", async () => {
		const companies: CompanyInputArray = [
			{ name: "First", domain: "first.com" },
			{ name: "Second", domain: "second.com" },
			{ name: "Third", domain: "third.com" },
		];

		const { researchCompany } = await import("./research.ts");
		const mockResults = [
			{ name: "First", domain: "first.com", rank: 1 },
			{ name: "Second", domain: "second.com", rank: 2 },
			{ name: "Third", domain: "third.com", rank: 3 },
		];
		vi.mocked(researchCompany)
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

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany)
			.mockResolvedValueOnce({
				name: "NoDomain",
				industry: "Unknown",
			} as never)
			.mockResolvedValueOnce({
				name: "HasDomain",
				domain: "example.com",
				industry: "Known",
			} as never);

		const result = await processCompanyArray(companies);

		expect(researchCompany).toHaveBeenNthCalledWith(1, "NoDomain", undefined);
		expect(researchCompany).toHaveBeenNthCalledWith(
			2,
			"HasDomain",
			"example.com",
		);
		expect(result[0].name).toBe("NoDomain");
		expect(result[1].name).toBe("HasDomain");
	});
});
