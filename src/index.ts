import "dotenv/config";
import { main } from "./cli.ts";
import { Logger } from "./logger.ts";

export { main } from "./cli.ts";
export { isJsonFile, readJsonFile, writeResults } from "./file-io.ts";
export { processCompanyArray } from "./processor.ts";

if (
	process.argv[1]?.includes("index.ts") ||
	process.argv[1]?.endsWith("index.js")
) {
	Logger.setDebug(false);
	Logger.debug("🔥 Script loaded successfully!");
	main();
}
