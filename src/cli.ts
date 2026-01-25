import { isJsonFile, readJsonFile, writeResults } from "./file-io.ts";
import { Logger } from "./logger.ts";
import { processCompanyArray } from "./processor.ts";
import { researchCompany } from "./research.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

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
