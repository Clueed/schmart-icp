import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createKeyMappingConfig, DEFAULT_KEY_MAPPING } from "./config.ts";
import { isJsonFile, readJsonFile, writeResults } from "./file-io.ts";
import { Logger } from "./logger.ts";
import { processCompanyArray } from "./processor.ts";
import { researchCompany } from "./research.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

export async function main() {
	Logger.debug("Starting main function...");

	const argv = await yargs(hideBin(process.argv))
		.usage("Usage: pnpm run dev [input] [options]")
		.example('pnpm run dev "Siemens Energy"', "Research a single company")
		.example(
			'pnpm run dev companies.json --name-key="Company Name" --domain-key="Website"',
			"Batch process with custom field names",
		)
		.option("name-key", {
			type: "string",
			describe: "Key name in JSON file for company name",
			default: DEFAULT_KEY_MAPPING.nameKey,
		})
		.option("domain-key", {
			type: "string",
			describe: "Key name in JSON file for company domain",
			default: DEFAULT_KEY_MAPPING.domainKey,
		})
		.help()
		.alias("help", "h")
		.version(false)
		.parseAsync();

	const config = createKeyMappingConfig({
		nameKey: argv["name-key"],
		domainKey: argv["domain-key"],
	});

	Logger.debug("Arguments received:", argv);
	Logger.debug("Key mapping config:", config);

	const input = argv._.map(String).join(" ");

	if (input === "") {
		yargs(hideBin(process.argv)).showHelp();
		process.exit(0);
	}

	if (isJsonFile(input)) {
		Logger.section(`Batch Processing - ${input}`);

		try {
			const companies = readJsonFile(input, config);
			const results = await processCompanyArray(companies, config);
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
