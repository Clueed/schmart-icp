import { describe, expect, it } from "vitest";
import {
	createKeyMappingConfig,
	DEFAULT_KEY_MAPPING,
	type KeyMappingConfig,
} from "./config.js";

describe("DEFAULT_KEY_MAPPING constant", () => {
	it("should have 'name' as default nameKey", () => {
		expect(DEFAULT_KEY_MAPPING.nameKey).toBe("name");
	});

	it("should have 'domain' as default domainKey", () => {
		expect(DEFAULT_KEY_MAPPING.domainKey).toBe("domain");
	});

	it("should be a complete KeyMappingConfig object", () => {
		expect(DEFAULT_KEY_MAPPING).toEqual({
			nameKey: "name",
			domainKey: "domain",
		});
	});
});

describe("createKeyMappingConfig function", () => {
	it("should return complete config when both keys are provided", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "Company Name",
			domainKey: "Website",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "Company Name",
			domainKey: "Website",
		});
	});

	it("should use default for nameKey when only domainKey is provided", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			domainKey: "Website",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "name",
			domainKey: "Website",
		});
	});

	it("should use default for domainKey when only nameKey is provided", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "Company Name",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "Company Name",
			domainKey: "domain",
		});
	});

	it("should use defaults when empty object is provided", () => {
		const partialConfig: Partial<KeyMappingConfig> = {};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "name",
			domainKey: "domain",
		});
	});

	it("should use defaults when undefined values are provided", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: undefined,
			domainKey: undefined,
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "name",
			domainKey: "domain",
		});
	});

	it("should handle null values by using defaults", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: null as unknown as string,
			domainKey: null as unknown as string,
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "name",
			domainKey: "domain",
		});
	});

	it("should return a new object and not modify input", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "Custom Name",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).not.toBe(partialConfig);
		expect(partialConfig.nameKey).toBe("Custom Name");
		expect(partialConfig.domainKey).toBeUndefined();
	});

	it("should handle custom keys with special characters", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "Company Name",
			domainKey: "Web-Site",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "Company Name",
			domainKey: "Web-Site",
		});
	});

	it("should handle keys with spaces", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "Company Name Field",
			domainKey: "Domain Name Field",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "Company Name Field",
			domainKey: "Domain Name Field",
		});
	});

	it("should handle keys with underscores", () => {
		const partialConfig: Partial<KeyMappingConfig> = {
			nameKey: "company_name",
			domainKey: "company_domain",
		};

		const result = createKeyMappingConfig(partialConfig);

		expect(result).toEqual({
			nameKey: "company_name",
			domainKey: "company_domain",
		});
	});

	it("should return KeyMappingConfig type", () => {
		const result = createKeyMappingConfig({});

		// Type check - this should compile without errors
		const typed: KeyMappingConfig = result;
		expect(typed).toBeDefined();
	});
});
