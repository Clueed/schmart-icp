import { describe, expect, it } from "vitest";
import { extractJSONFromResponse } from "../src/api.ts";

describe("extractJSONFromResponse", () => {
	it("should extract JSON from markdown code blocks", () => {
		const response = `Here's the data:
\`\`\`json
{"name": "Test", "value": 123}
\`\`\`
`;
		const result = extractJSONFromResponse(response);
		expect(result).toEqual({ name: "Test", value: 123 });
	});

	it("should extract bare JSON objects", () => {
		const response = `{"name": "Test", "value": 123}`;
		const result = extractJSONFromResponse(response);
		expect(result).toEqual({ name: "Test", value: 123 });
	});

	it("should extract JSON from mixed text", () => {
		const response = `The answer is: {"name": "Test", "value": 123} - that's it!`;
		const result = extractJSONFromResponse(response);
		expect(result).toEqual({ name: "Test", value: 123 });
	});

	it("should throw helpful error for plain text responses", () => {
		const response = "I couldn't find any information about this company.";
		expect(() => extractJSONFromResponse(response)).toThrow(
			/plain text instead of JSON/,
		);
	});

	it("should include response preview in error message", () => {
		const longResponse =
			"I couldn't find any information about this company. ".repeat(10);
		expect(() => extractJSONFromResponse(longResponse)).toThrow();
		try {
			extractJSONFromResponse(longResponse);
		} catch (error) {
			expect(String(error)).toContain("I couldn't find");
			expect(String(error)).toContain("...");
		}
	});

	it("should throw on invalid JSON syntax", () => {
		const response = `{"name": "Test", "value":}`;
		expect(() => extractJSONFromResponse(response)).toThrow(
			/JSON-like content but failed to parse/,
		);
	});
});
