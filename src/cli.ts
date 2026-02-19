import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
	createAppConfig,
	createKeyMappingConfig,
	createWebSearchOptions,
	DEFAULT_KEY_MAPPING,
	DEFAULT_WEB_SEARCH_OPTIONS,
} from "./config.ts";
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
		.option("web-search", {
			type: "boolean",
			describe: "Enable web search for LLM calls (adds $0.02 per call)",
			default: DEFAULT_WEB_SEARCH_OPTIONS.enabled,
		})
		.option("web-max-results", {
			type: "number",
			describe:
				"Maximum web search results to return (costs $4 per 1000 results)",
			default: DEFAULT_WEB_SEARCH_OPTIONS.maxResults,
		})
		.option("web-engine", {
			type: "string",
			describe:
				"Web search engine: native (provider built-in), exa, or auto (default)",
			choices: ["native", "exa", "auto"],
			default: "auto",
		})
		.help()
		.alias("help", "h")
		.version(false)
		.parseAsync();

	const config = createKeyMappingConfig({
		nameKey: argv["name-key"],
		domainKey: argv["domain-key"],
	});

	const webSearchOptions = createWebSearchOptions({
		enabled: argv["web-search"],
		maxResults: argv["web-max-results"],
		engine:
			argv["web-engine"] === "auto"
				? undefined
				: (argv["web-engine"] as "native" | "exa" | undefined),
	});

	Logger.debug("Arguments received:", argv);
	Logger.debug("Key mapping config:", config);
	Logger.debug("Web search options:", webSearchOptions);

	const input = argv._.map(String).join(" ");

	if (input === "") {
		yargs(hideBin(process.argv)).showHelp();
		process.exit(0);
	}

	if (isJsonFile(input)) {
		Logger.section(`Batch Processing - ${input}`);

		let results: Array<Record<string, unknown>>;

		try {
			const companies = readJsonFile(input, config);
			const appConfig = createAppConfig(config, webSearchOptions);
			results = await processCompanyArray(companies, appConfig, 2);
		} catch (readOrProcessError) {
			Logger.section("❌ Batch processing failed ❌");
			Logger.error(readOrProcessError);
			process.exit(1);
		}

		try {
			writeResults(input, results);
		} catch (writeError) {
			Logger.error("❌ Failed to write results file");
			Logger.error(writeError);
			process.exit(1);
		}

		globalTokenTracker.logSummary();
	} else {
		Logger.section(`Research - ${input}`);

		try {
			const appConfig = createAppConfig(config, webSearchOptions);
			await researchCompany(input, undefined, appConfig);
			globalTokenTracker.logSummary();
		} catch (error) {
			Logger.section("❌ Research failed ❌");
			Logger.error(error);
			process.exit(1);
		}
	}
}
