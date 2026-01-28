import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { isJsonFile, readJsonFile, writeResults } from "./file-io.js";

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
	});

	it("should return false for empty string", () => {
		const result = isJsonFile("");
		expect(result).toBe(false);
	});

	it("should return false for undefined", () => {
		const result = isJsonFile(undefined as unknown as string);
		expect(result).toBe(false);
	});

	it("should return false for argument without file extension", () => {
		const result = isJsonFile("companies");
		expect(result).toBe(false);
	});

	it("should return false for JSON extension with uppercase", () => {
		const result = isJsonFile("companies.JSON");
		expect(result).toBe(false);
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

	it("should parse JSON with custom nameKey configuration", () => {
		const customJson =
			'[{"Company Name": "Test Company"}, {"Company Name": "Another Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(customJson);

		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "domain",
		});

		expect(result).toHaveLength(2);
		expect(result[0]["Company Name"]).toBe("Test Company");
		expect(result[1]["Company Name"]).toBe("Another Company");
	});

	it("should parse JSON with custom domainKey configuration", () => {
		const customJson =
			'[{"name": "Company1", "Website": "company1.com"}, {"name": "Company2", "Website": "company2.com"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(customJson);

		const result = readJsonFile("companies.json", {
			nameKey: "name",
			domainKey: "Website",
		});

		expect(result).toHaveLength(2);
		expect(result[0].name).toBe("Company1");
		expect(result[0].Website).toBe("company1.com");
		expect(result[1].name).toBe("Company2");
		expect(result[1].Website).toBe("company2.com");
	});

	it("should parse JSON with both custom nameKey and domainKey", () => {
		const customJson =
			'[{"Company Name": "Test Company", "Website": "test.com"}, {"Company Name": "Another", "Website": "another.com"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(customJson);

		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "Website",
		});

		expect(result).toHaveLength(2);
		expect(result[0]["Company Name"]).toBe("Test Company");
		expect(result[0].Website).toBe("test.com");
		expect(result[1]["Company Name"]).toBe("Another");
		expect(result[1].Website).toBe("another.com");
	});

	it("should parse JSON without config (backward compatibility)", () => {
		const defaultJson = '[{"name": "Company1", "domain": "company1.com"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(defaultJson);

		const result = readJsonFile("companies.json");

		expect(result).toHaveLength(1);
		expect(result[0].name).toBe("Company1");
		expect(result[0].domain).toBe("company1.com");
	});

	it("should throw error for JSON missing custom nameKey field", () => {
		const missingNameJson =
			'[{"other": "value"}, {"Company Name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(missingNameJson);

		expect(() =>
			readJsonFile("companies.json", {
				nameKey: "Company Name",
				domainKey: "domain",
			}),
		).toThrow();
	});

	it("should handle empty custom domainKey field", () => {
		const emptyDomainJson =
			'[{"Company Name": "Test Company", "Website": ""}, {"Company Name": "Another Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(emptyDomainJson);

		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "Website",
		});

		expect(result[0].Website).toBe("");
		expect(result[1].Website).toBeUndefined();
	});

	it("should preserve extra keys with custom configuration", () => {
		const customJson =
			'[{"Company Name": "Test Company", "Website": "test.com", "Region": "US", "Rank": 1}]';
		vi.mocked(fs.readFileSync).mockReturnValue(customJson);

		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "Website",
		});

		expect(result[0]).toMatchObject({
			"Company Name": "Test Company",
			Website: "test.com",
			Region: "US",
			Rank: 1,
		});
	});

	it("should handle special characters in custom key names", () => {
		const specialKeysJson =
			'[{"Company Name": "Test Company", "Website": "test.com"}, {"Company Name": "O\'Connor Inc.", "Website": "oconnor.com"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(specialKeysJson);

		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "Website",
		});

		expect(result).toHaveLength(2);
		expect(result[0]["Company Name"]).toBe("Test Company");
		expect(result[1]["Company Name"]).toBe("O'Connor Inc.");
	});

	it("should throw error for null value in custom nameKey", () => {
		const nullNameJson =
			'[{"Company Name": null}, {"Company Name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(nullNameJson);

		expect(() =>
			readJsonFile("companies.json", {
				nameKey: "Company Name",
				domainKey: "domain",
			}),
		).toThrow();
	});

	it("should not throw error for empty string in custom nameKey (schema validation)", () => {
		const emptyNameJson =
			'[{"Company Name": ""}, {"Company Name": "Valid Company"}]';
		vi.mocked(fs.readFileSync).mockReturnValue(emptyNameJson);

		// Schema only checks for string type, not empty values
		const result = readJsonFile("companies.json", {
			nameKey: "Company Name",
			domainKey: "domain",
		});
		expect(result).toHaveLength(2);
		expect(result[0]["Company Name"]).toBe("");
		expect(result[1]["Company Name"]).toBe("Valid Company");
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
		const { Logger } = await import("./logger.ts");
		const results = [{ name: "Company" }];
		const inputPath = "test.json";

		writeResults(inputPath, results);

		expect(Logger.log).toHaveBeenCalled();
	});
});
