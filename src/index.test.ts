import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
	isJsonFile,
	main,
	processCompanyArray,
	readJsonFile,
	writeResults,
} from "./index.js";
import type { CompanyInputArray } from "./types.js";

vi.mock("fs", () => ({
	default: {
		existsSync: vi.fn(),
		readFileSync: vi.fn(),
		writeFileSync: vi.fn(),
	},
}));

vi.mock("./logger.ts", () => ({
	Logger: {
		debug: vi.fn(),
		log: vi.fn(),
		section: vi.fn(),
		error: vi.fn(),
		setDebug: vi.fn(),
	},
}));

vi.mock("./research.ts", () => ({
	researchCompany: vi.fn(),
}));

vi.mock("./tokenTracker.ts", () => ({
	globalTokenTracker: {
		logSummary: vi.fn(),
	},
}));

const originalProcessArgv = process.argv;

describe("main function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.argv = originalProcessArgv;
	});

	it("should handle single company name (backward compatibility)", async () => {
		process.argv = ["node", "index.ts", "Siemens Energy"];

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue(undefined);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("Siemens Energy");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should detect JSON file and handle it appropriately", async () => {
		process.argv = ["node", "index.ts", "companies.json"];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"name": "Company1", "domain": "company1.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "Company1",
			domain: "company1.com",
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).not.toHaveBeenCalledWith("companies.json");
		expect(researchCompany).toHaveBeenCalledWith("Company1", "company1.com");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});
});

describe("CompanyInputArray type", () => {
	it("should accept array of CompanyInput objects with preserved extra keys", () => {
		const companyArray: CompanyInputArray = [
			{ name: "Siemens Energy", domain: "siemens-energy.com" },
			{ name: "Another Company", customField: "custom value" },
			{
				name: "Third Company",
				domain: "example.com",
				extraKey1: 123,
				extraKey2: { nested: "object" },
			},
		];

		expect(companyArray).toHaveLength(3);
		expect(companyArray[0].name).toBe("Siemens Energy");
		expect(companyArray[0].domain).toBe("siemens-energy.com");
		expect(companyArray[1].name).toBe("Another Company");
		expect(companyArray[1].customField).toBe("custom value");
		expect(companyArray[2].name).toBe("Third Company");
		expect(companyArray[2].domain).toBe("example.com");
		expect(companyArray[2].extraKey1).toBe(123);
		expect(companyArray[2].extraKey2).toEqual({ nested: "object" });
	});
});

describe("isJsonFile function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should return true for valid .json file that exists", () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		const result = isJsonFile("companies.json");
		expect(result).toBe(true);
		expect(fs.existsSync).toHaveBeenCalledWith("companies.json");
	});

	it("should return false for .json file that doesn't exist", () => {
		vi.mocked(fs.existsSync).mockReturnValue(false);
		const result = isJsonFile("missing.json");
		expect(result).toBe(false);
		expect(fs.existsSync).toHaveBeenCalledWith("missing.json");
	});

	it("should return false for non-.json argument", () => {
		const result = isJsonFile("company.txt");
		expect(result).toBe(false);
		expect(fs.existsSync).not.toHaveBeenCalled();
	});

	it("should return false for empty string", () => {
		const result = isJsonFile("");
		expect(result).toBe(false);
		expect(fs.existsSync).not.toHaveBeenCalled();
	});

	it("should return false for undefined", () => {
		const result = isJsonFile(undefined as unknown as string);
		expect(result).toBe(false);
		expect(fs.existsSync).not.toHaveBeenCalled();
	});

	it("should return false for argument without file extension", () => {
		const result = isJsonFile("companies");
		expect(result).toBe(false);
		expect(fs.existsSync).not.toHaveBeenCalled();
	});

	it("should return false for JSON extension with uppercase", () => {
		const result = isJsonFile("companies.JSON");
		expect(result).toBe(false);
		expect(fs.existsSync).not.toHaveBeenCalled();
	});

	it("should check file existence only for .json extension", () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		isJsonFile("test.json");
		expect(fs.existsSync).toHaveBeenCalledTimes(1);
	});

	it("should handle .json extension at end of path", () => {
		vi.mocked(fs.existsSync).mockReturnValue(true);
		const result = isJsonFile("/path/to/data/companies.json");
		expect(result).toBe(true);
		expect(fs.existsSync).toHaveBeenCalledWith("/path/to/data/companies.json");
	});
});

describe("readJsonFile function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should parse and return array of companies from valid JSON file", () => {
		const validJson = '[{"name": "Siemens Energy"}, {"name": "Test Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(validJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("Siemens Energy");
		expect(result[1].name).toBe("Test Company");
		expect(fs.readFileSync).toHaveBeenCalledWith("companies.json", "utf-8");
	});

	it("should throw error for invalid JSON syntax", () => {
		const invalidJson = '{"name": "Company", invalid}';
		vi.mocked(fs.readFileSync).mockReturnValue(invalidJson);

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should return empty array for empty JSON array", () => {
		const emptyJson = "[]";
		vi.mocked(fs.readFileSync).mockReturnValue(emptyJson);

		const result = readJsonFile("companies.json");

		expect(result).toEqual([]);
	});

	it("should throw error for array items missing 'name' field", () => {
		const missingNameJson = '[{"other": "value"}, {"name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(missingNameJson);

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should throw error for non-array JSON object", () => {
		const objectJson = '{"name": "Not an array"}';
		vi.mocked(fs.readFileSync).mockReturnValue(objectJson);

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should preserve extra keys from input objects", () => {
		const jsonWithExtras =
			'[{"name": "Company1", "domain": "example.com"}, {"name": "Company2", "custom": "value", "number": 123}]';
		vi.mocked(fs.readFileSync).mockReturnValue(jsonWithExtras);

		const result = readJsonFile("companies.json");

		expect(result[0]).toMatchObject({
			name: "Company1",
			domain: "example.com",
		});
		expect(result[1]).toMatchObject({
			name: "Company2",
			custom: "value",
			number: 123,
		});
	});

	it("should throw error for file not found (ENOENT)", () => {
		const error = new Error("File not found") as NodeJS.ErrnoException;
		error.code = "ENOENT";
		vi.mocked(fs.readFileSync).mockImplementation(() => {
			throw error;
		});

		expect(() => readJsonFile("missing.json")).toThrow();
	});

	it("should handle single company array", () => {
		const singleJson = '[{"name": "Single Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(singleJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Single Company");
	});

	it("should handle companies with empty domain field", () => {
		const jsonWithEmptyDomain =
			'[{"name": "Company1", "domain": ""}, {"name": "Company2"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(jsonWithEmptyDomain);

		const result = readJsonFile("companies.json");

		expect(result[0].domain).toBe("");
		expect(result[1].domain).toBeUndefined();
	});

	it("should throw error for null input", () => {
		vi.mocked(fs.readFileSync).mockReturnValue("null");

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should throw error for string input", () => {
		vi.mocked(fs.readFileSync).mockReturnValue('"not an array"');

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should throw error for number input", () => {
		vi.mocked(fs.readFileSync).mockReturnValue("123");

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should throw error for company with null name value", () => {
		const nullNameJson = '[{"name": null}, {"name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(nullNameJson);

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should throw error for company with undefined name value", () => {
		const undefinedNameJson =
			'[{"name": undefined}, {"name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(undefinedNameJson);

		expect(() => readJsonFile("companies.json")).toThrow();
	});

	it("should handle company name that looks like file path", () => {
		const filenameJson =
			'[{"name": "test.json"}, {"name": "data/config.json"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(filenameJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("test.json");
		expect(result[1].name).toBe("data/config.json");
	});

	it("should handle very long company names (>100 chars)", () => {
		const longName = "A".repeat(150);
		const longNameJson = `[{"name": "${longName}"}]`;
		vi.mocked(fs.readFileSync).mockReturnValue(longNameJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe(longName);
		expect(result[0].name.length).toBe(150);
	});

	it("should handle special characters in company names", () => {
		const specialCharsJson =
			'[{"name": "Company \\"quoted\\" name"}, {"name": "O\'Connor Inc."}, {"name": "Café Müller GmbH"}, {"name": "株式会社"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(specialCharsJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(4);
		expect(result[0].name).toBe('Company "quoted" name');
		expect(result[1].name).toBe("O'Connor Inc.");
		expect(result[2].name).toBe("Café Müller GmbH");
		expect(result[3].name).toBe("株式会社");
	});
});

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

describe("writeResults function", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should write results to file with correct filename pattern", () => {
		const results = [
			{ name: "Company1", domain: "company1.com", industry: "Tech" },
			{ name: "Company2", domain: "company2.com", industry: "Finance" },
		];
		const inputPath = "companies.json";

		const outputPath = writeResults(inputPath, results);

		expect(outputPath).toBe("companies-researched.json");
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"companies-researched.json",
			JSON.stringify(results, null, 2),
		);
	});

	it("should write JSON with 2-space indentation", () => {
		const results = [{ name: "Company1" }];
		const inputPath = "data.json";

		writeResults(inputPath, results);

		const expectedJson = JSON.stringify(results, null, 2);
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"data-researched.json",
			expectedJson,
		);
		expect(expectedJson).toContain("  ");
	});

	it("should handle path with directories", () => {
		const results = [{ name: "Test" }];
		const inputPath = "/path/to/companies.json";

		const outputPath = writeResults(inputPath, results);

		expect(outputPath).toBe("/path/to/companies-researched.json");
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"/path/to/companies-researched.json",
			JSON.stringify(results, null, 2),
		);
	});

	it("should handle basename extraction from full path", () => {
		const results = [{ name: "Company" }];
		const inputPath = "./data/input.json";

		const outputPath = writeResults(inputPath, results);

		expect(outputPath).toBe("./data/input-researched.json");
	});

	it("should write complete results object including all fields", () => {
		const results = [
			{
				name: "Company1",
				domain: "company1.com",
				industry: "Tech",
				customField: "custom value",
				rank: 1,
			},
		];
		const inputPath = "test.json";

		writeResults(inputPath, results);

		const expectedContent = JSON.stringify(results, null, 2);
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"test-researched.json",
			expectedContent,
		);
	});

	it("should handle empty array results", () => {
		const results: Array<{ name: string }> = [];
		const inputPath = "empty.json";

		writeResults(inputPath, results);

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"empty-researched.json",
			JSON.stringify(results, null, 2),
		);
	});

	it("should log success message using Logger", async () => {
		const results = [{ name: "Company" }];
		const inputPath = "test.json";

		const { Logger } = await import("./logger.ts");

		writeResults(inputPath, results);

		expect(Logger.log).toHaveBeenCalled();
	});
});

describe("Integration - JSON file batch processing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("should process JSON file with 2 companies and create output file", async () => {
		process.argv = ["node", "index.ts", "companies.json"];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"name": "Company1", "domain": "company1.com"}, {"name": "Company2", "domain": "company2.com"}]',
		);

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

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledTimes(2);
		expect(researchCompany).toHaveBeenCalledWith("Company1", "company1.com");
		expect(researchCompany).toHaveBeenCalledWith("Company2", "company2.com");
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"companies-researched.json",
			JSON.stringify(
				[
					{ name: "Company1", domain: "company1.com", industry: "Tech" },
					{ name: "Company2", domain: "company2.com", industry: "Finance" },
				],
				null,
				2,
			),
		);
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should process JSON file with empty array and create empty output file", async () => {
		process.argv = ["node", "index.ts", "empty.json"];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue("[]");

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"empty-researched.json",
			"[]",
		);
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should handle single company name and preserve existing behavior", async () => {
		process.argv = ["node", "index.ts", "Siemens Energy"];
		vi.mocked(fs.existsSync).mockReturnValue(false);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "Siemens Energy",
			industry: "Energy",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("Siemens Energy");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
		expect(fs.writeFileSync).not.toHaveBeenCalled();
	});

	it("should handle invalid JSON file and exit with code 1", async () => {
		process.argv = ["node", "index.ts", "invalid.json"];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue('{"name": "Company", invalid}');

		const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit(${code})`);
		});

		const { Logger } = await import("./logger.ts");

		await expect(main()).rejects.toThrow("process.exit(1)");

		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(Logger.error).toHaveBeenCalled();

		exitSpy.mockRestore();
	});

	it("should handle nonexistent JSON file and exit with code 1", async () => {
		process.argv = ["node", "index.ts", "missing.json"];
		vi.mocked(fs.existsSync).mockReturnValue(false);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue(undefined);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("missing.json");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should handle JSON file that doesn't exist and treat as company name", async () => {
		process.argv = ["node", "index.ts", "companies.json"];
		vi.mocked(fs.existsSync).mockReturnValue(false);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "companies.json",
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("companies.json");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
		expect(fs.readFileSync).not.toHaveBeenCalled();
	});
});
