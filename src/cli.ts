import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createKeyMappingConfig, DEFAULT_KEY_MAPPING } from "./config.ts";
import {
  filterUnprocessed,
  isJsonFile,
  loadExistingResults,
  readJsonFile,
  writeResults,
} from "./file-io.ts";
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
      const existingResults = loadExistingResults(input);
      const toProcess = filterUnprocessed(companies, existingResults, config);

      if (toProcess.length === 0) {
        // If there are companies in the input but all are already processed,
        // just write existing results
        if (companies.length > 0) {
          Logger.log("✅ All companies already processed!");
          writeResults(input, existingResults);
          globalTokenTracker.logSummary();
          return;
        }
        // Empty input array - write empty output file
        Logger.log("✅ All companies already processed!");
        writeResults(input, []);
        globalTokenTracker.logSummary();
        return;
      }

      Logger.log(
        `Processing ${toProcess.length} of ${companies.length} companies...`,
      );

      // Track partial results for graceful shutdown
      let partialNewResults: Array<Record<string, unknown>> = [];
      let shutdownHandlerRegistered = false;
      let handleShutdown: (() => void) | null = null;

      // Setup graceful shutdown handler
      const setupShutdownHandler = () => {
        if (shutdownHandlerRegistered) return;
        shutdownHandlerRegistered = true;

        handleShutdown = () => {
          // Merge existing results with partial new results
          const allResults = [...existingResults, ...partialNewResults];
          writeResults(input, allResults);
          Logger.warn("\n⚠️  Process interrupted - partial results saved");
          globalTokenTracker.logSummary();
          process.exit(0);
        };

        process.on("SIGINT", handleShutdown);
        process.on("SIGTERM", handleShutdown);
      };

      // Clean up shutdown handlers after successful completion
      const cleanupShutdownHandler = () => {
        if (!shutdownHandlerRegistered || !handleShutdown) return;
        process.off("SIGINT", handleShutdown);
        process.off("SIGTERM", handleShutdown);
        shutdownHandlerRegistered = false;
        handleShutdown = null;
      };

      // Setup shutdown handler before starting processing
      setupShutdownHandler();

      // Process with progress callback to track partial results
      const newResults = await processCompanyArray(
        toProcess,
        config,
        10,
        (partial) => {
          // Update partial results as each chunk completes
          partialNewResults = partial as Array<Record<string, unknown>>;
        },
      );

      // Clean up shutdown handlers since processing completed successfully
      cleanupShutdownHandler();

      // Merge and write all results
      const allResults = [...existingResults, ...newResults];
      writeResults(input, allResults);
    } catch (readOrProcessError) {
      Logger.section("❌ Batch processing failed ❌");
      Logger.error(readOrProcessError);
      process.exit(1);
    }

    globalTokenTracker.logSummary();
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
