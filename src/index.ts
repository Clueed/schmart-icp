import "dotenv/config";
import fs from "node:fs";
import { Logger } from "./logger.ts";
import { researchCompany } from "./research.ts";
import { CompanyInputArraySchema } from "./schemas.ts";
import { globalTokenTracker } from "./tokenTracker.ts";
import type { CompanyInputArray } from "./types.ts";

export function isJsonFile(filePath: string): boolean {
	if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
		return false;
	}

	if (!filePath.endsWith(".json")) {
		return false;
	}

	return fs.existsSync(filePath);
}

export function readJsonFile(filePath: string): CompanyInputArray {
	const fileContent = fs.readFileSync(filePath, "utf-8");
	const parsedData = JSON.parse(fileContent);
	return CompanyInputArraySchema.parse(parsedData) as CompanyInputArray;
}

export async function processCompanyArray(
	companies: CompanyInputArray,
): Promise<Array<CompanyInputArray[number]>> {
	const results: Array<CompanyInputArray[number]> = [];

	for (const company of companies) {
		const researchResult = await researchCompany(company.name, company.domain);
		results.push({ ...company, ...researchResult });
	}

	return results;
}

export function writeResults(
	inputPath: string,
	results: Array<Record<string, unknown>>,
): string {
	const outputPath = inputPath.replace(/\.json$/, "-researched.json");

	const jsonContent = JSON.stringify(results, null, 2);
	fs.writeFileSync(outputPath, jsonContent);

	Logger.log(`✅ Results written to ${outputPath}`);
	return outputPath;
}

export async function main() {
	Logger.debug("Starting main function...");
	const args = process.argv.slice(2);
	Logger.debug("Arguments received:", args);

	if (args.length === 0) {
		Logger.log("🔍 SG Company Research CLI");
		Logger.log('Usage: pnpm run dev "Company Name"');
		Logger.log('Example: pnpm run dev "Siemens Energy"');
		Logger.log("Usage: pnpm run dev companies.json");
		Logger.log("Example: pnpm run dev companies.json");
		process.exit(0);
	}

	const input = args.join(" ");

	if (isJsonFile(input)) {
		Logger.section(`Batch Processing - ${input}`);

		try {
			const companies = readJsonFile(input);
			const results = await processCompanyArray(companies);
			writeResults(input, results);
			globalTokenTracker.logSummary();
		} catch (error) {
			Logger.section("❌ Batch processing failed ❌");
			Logger.error(error);
			process.exit(1);
		}
	} else {
		Logger.section(`Research - ${input}`);

		try {
			await researchCompany(input);
			globalTokenTracker.logSummary();
		} catch (error) {
			Logger.section("❌ Research failed ❌");
			Logger.error(error);
			process.exit(1);
		}
	}
}

if (
	process.argv[1]?.includes("index.ts") ||
	process.argv[1]?.endsWith("index.js")
) {
	Logger.setDebug(false);
	Logger.debug("🔥 Script loaded successfully!");
	main();
}
