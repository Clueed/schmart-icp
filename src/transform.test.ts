import { describe, expect, it } from "vitest";
import { DEFAULT_KEY_MAPPING } from "./config.js";
import { normalizeCompanyInput } from "./transform.js";

describe("normalizeCompanyInput function", () => {
	it("should normalize with default key mappings", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "test.com",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result).toEqual({
			name: "Test Company",
			domain: "test.com",
		});
	});

	it("should normalize with custom nameKey and domainKey", () => {
		const rawCompany = {
			"Company Name": "Test Company",
			Website: "test.com",
		};

		const result = normalizeCompanyInput(rawCompany, {
			nameKey: "Company Name",
			domainKey: "Website",
		});

		expect(result).toEqual({
			name: "Test Company",
			domain: "test.com",
		});
	});

	it("should normalize with custom nameKey and default domainKey", () => {
		const rawCompany = {
			"Company Name": "Test Company",
			domain: "test.com",
		};

		const result = normalizeCompanyInput(rawCompany, {
			nameKey: "Company Name",
			domainKey: "domain",
		});

		expect(result).toEqual({
			name: "Test Company",
			domain: "test.com",
		});
	});

	it("should handle missing optional domain field", () => {
		const rawCompany = {
			name: "Test Company",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result).toEqual({
			name: "Test Company",
			domain: undefined,
		});
	});

	it("should handle undefined domain field", () => {
		const rawCompany = {
			name: "Test Company",
			domain: undefined,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result).toEqual({
			name: "Test Company",
			domain: undefined,
		});
	});

	it("should handle null domain field", () => {
		const rawCompany = {
			name: "Test Company",
			domain: null,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result).toEqual({
			name: "Test Company",
			domain: undefined,
		});
	});

	it("should not trim whitespace from name field", () => {
		const rawCompany = {
			name: "  Test Company  ",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.name).toBe("  Test Company  ");
	});

	it("should trim whitespace from domain field", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "  test.com  ",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBe("test.com");
	});

	it("should convert empty domain string to undefined", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBeUndefined();
	});

	it("should convert whitespace-only domain to undefined", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "   ",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBeUndefined();
	});

	it("should convert numeric name to string", () => {
		const rawCompany = {
			name: 12345,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.name).toBe("12345");
	});

	it("should convert numeric domain to string", () => {
		const rawCompany = {
			name: "Test Company",
			domain: 123,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBe("123");
	});

	it("should throw error when required name field is missing", () => {
		const rawCompany = {
			domain: "test.com",
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING),
		).toThrow("Missing required field 'name' in company input");
	});

	it("should throw error when custom name field is missing", () => {
		const rawCompany = {
			Website: "test.com",
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, {
				nameKey: "Company Name",
				domainKey: "Website",
			}),
		).toThrow("Missing required field 'Company Name' in company input");
	});

	it("should throw error when name field is null", () => {
		const rawCompany = {
			name: null,
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING),
		).toThrow("Missing required field 'name' in company input");
	});

	it("should throw error when name field is undefined", () => {
		const rawCompany = {
			name: undefined,
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING),
		).toThrow("Missing required field 'name' in company input");
	});

	it("should throw error when name field is empty string", () => {
		const rawCompany = {
			name: "",
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING),
		).toThrow("Field 'name' cannot be empty in company input");
	});

	it("should throw error when name field is only whitespace", () => {
		const rawCompany = {
			name: "   ",
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING),
		).toThrow("Field 'name' cannot be empty in company input");
	});

	it("should throw error with custom name key when empty", () => {
		const rawCompany = {
			"Company Name": "",
		};

		expect(() =>
			normalizeCompanyInput(rawCompany, {
				nameKey: "Company Name",
				domainKey: "Website",
			}),
		).toThrow("Field 'Company Name' cannot be empty in company input");
	});

	it("should preserve other fields in the input object", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "test.com",
			customField: "custom value",
			rank: 1,
			active: true,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result).toEqual({
			name: "Test Company",
			domain: "test.com",
		});
	});

	it("should handle name with special characters", () => {
		const rawCompany = {
			name: "O'Connor & Sons",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.name).toBe("O'Connor & Sons");
	});

	it("should handle name with unicode characters", () => {
		const rawCompany = {
			name: "株式会社",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.name).toBe("株式会社");
	});

	it("should handle domain with subdomains", () => {
		const rawCompany = {
			name: "Test Company",
			domain: "sub.domain.example.com",
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBe("sub.domain.example.com");
	});

	it("should handle boolean domain value by converting to string", () => {
		const rawCompany = {
			name: "Test Company",
			domain: true,
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBe("true");
	});

	it("should handle object domain value by converting to string", () => {
		const rawCompany = {
			name: "Test Company",
			domain: { value: "test.com" },
		};

		const result = normalizeCompanyInput(rawCompany, DEFAULT_KEY_MAPPING);

		expect(result.domain).toBe("[object Object]");
	});
});
