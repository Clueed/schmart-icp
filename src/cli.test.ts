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
});
