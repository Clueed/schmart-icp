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

	it("should process JSON file with custom --name-key and --domain-key flags", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
			"--domain-key",
			"Website",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"Company Name": "Test Company", "Website": "test.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "Test Company",
			domain: "test.com",
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("Test Company", "test.com");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should process JSON file with only --name-key flag (default domain)", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"Company Name": "Test Company", "domain": "test.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "Test Company",
			domain: "test.com",
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("Test Company", "test.com");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should process JSON file without flags (backward compatibility)", async () => {
		process.argv = ["node", "index.ts", "companies.json"];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"name": "Test Company", "domain": "test.com"}]',
		);

		const { researchCompany } = await import("./research.ts");
		vi.mocked(researchCompany).mockResolvedValue({
			name: "Test Company",
			domain: "test.com",
			industry: "Tech",
		} as never);

		const { globalTokenTracker } = await import("./tokenTracker.ts");
		vi.mocked(globalTokenTracker.logSummary).mockImplementation(() => {});

		await main();

		expect(researchCompany).toHaveBeenCalledWith("Test Company", "test.com");
		expect(globalTokenTracker.logSummary).toHaveBeenCalled();
	});

	it("should handle invalid JSON with custom keys and exit with code 1", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
		];
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

	it("should handle missing required custom key field and exit with code 1", async () => {
		process.argv = [
			"node",
			"index.ts",
			"companies.json",
			"--name-key",
			"Company Name",
		];
		vi.mocked(fs.existsSync).mockReturnValue(true);
		vi.mocked(fs.readFileSync).mockReturnValue(
			'[{"name": "Test Company", "domain": "test.com"}]',
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
});
