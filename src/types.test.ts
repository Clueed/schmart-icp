import { describe, expect, it } from "vitest";
import type { CompanyInputArray } from "./types.js";

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
