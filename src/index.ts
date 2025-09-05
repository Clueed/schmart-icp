import "dotenv/config";
import { Logger } from "./logger.ts";
import { researchCompany } from "./research.ts";

async function main() {
	Logger.debug("Starting main function...");
	const args = process.argv.slice(2);
	Logger.debug("Arguments received:", args);

	if (args.length === 0) {
		Logger.log("🔍 SG Company Research CLI");
		Logger.log('Usage: pnpm run dev "Company Name"');
		Logger.log('Example: pnpm run dev "Siemens Energy"');
		process.exit(0);
	}

	const companyName = args.join(" ");

	Logger.section(`Research - ${companyName}`);

	try {
		await researchCompany(companyName);
	} catch (error) {
		Logger.section("❌ Research failed ❌");
		Logger.error(error);
		process.exit(1);
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
