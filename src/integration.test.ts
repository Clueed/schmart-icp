import fs from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { main } from "./cli.js";

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

describe("Integration - JSON file batch processing", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		process.argv = originalProcessArgv;
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

	it("should treat nonexistent JSON file as company name", async () => {
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

	it("should process JSON file with custom key names in end-to-end flow", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
			"--domain-key",
			"Websites",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"Company Name": "Company1", "Websites": "company1.com"}, {"Company Name": "Company2", "Websites": "company2.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany)
			.mockResolvedValueOnce({
				industry: "Tech",
			} as never)
			.mockResolvedValueOnce({
				industry: "Finance",
			} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

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
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"companies-researched.json",
			JSON.stringify(
				[
					{
						"Company Name": "Company1",
						Websites: "company1.com",
						industry: "Tech",
					},
					{
						"Company Name": "Company2",
						Websites: "company2.com",
						industry: "Finance",
					},
				],
				null,
				2,
			),
		);
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should process JSON file with custom name key and default domain key", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"Company Name": "Company1", "domain": "company1.com"}, {"Company Name": "Company2", "domain": "company2.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany)
			.mockResolvedValueOnce({
				industry: "Tech",
			} as never)
			.mockResolvedValueOnce({
				industry: "Finance",
			} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

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
		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"companies-researched.json",
			JSON.stringify(
				[
					{
						"Company Name": "Company1",
						domain: "company1.com",
						industry: "Tech",
					},
					{
						"Company Name": "Company2",
						domain: "company2.com",
						industry: "Finance",
					},
				],
				null,
				2,
			),
		);
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should handle missing custom key field in end-to-end flow", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"name": "Company1", "domain": "company1.com"}]',
		);

		const exitSpy = vi.spyOn(process, "exit").mockImplementation((code) => {
			throw new Error(`process.exit(${code})`);
		});

		const { Logger } = await import("./logger.ts");

		await expect(main()).rejects.toThrow("process.exit(1)");
		expect(exitSpy).toHaveBeenCalledWith(1);
		expect(Logger.error).toHaveBeenCalled();

		exitSpy.mockRestore();
	});

	it("should preserve extra fields when processing with custom keys", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
			"--domain-key",
			"Websites",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"Company Name": "Company1", "Websites": "company1.com", "Region": "US", "Priority": 1}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(fs.writeFileSync).toHaveBeenCalledWith(
			"companies-researched.json",
			JSON.stringify(
				[
					{
						"Company Name": "Company1",
						Websites: "company1.com",
						Region: "US",
						Priority: 1,
						industry: "Tech",
					},
				],
				null,
				2,
			),
		);
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});
});
