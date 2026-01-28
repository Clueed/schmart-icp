import fs from "node:fs";
import type { KeyMappingConfig } from "./config.ts";
import { Logger } from "./logger.ts";
import {
	CompanyInputArraySchema,
	createCompanyInputArraySchema,
} from "./schemas.ts";
import type { CompanyInputArray } from "./types.ts";

/**
 * Validates if the given path is a valid JSON file that exists.
 * @param filePath - The file path to validate
 * @returns true if the path is a valid .json file and exists
 */
export function isJsonFile(filePath: string): boolean {
	if (!filePath || typeof filePath !== "string" || filePath.trim() === "") {
		return false;
	}

	if (!filePath.endsWith(".json")) {
		return false;
	}

	return fs.existsSync(filePath);
}

/**
 * Reads and parses a JSON file containing company data.
 * Validates the parsed data against the CompanyInputArraySchema.
 * @param filePath - Path to the JSON file
 * @param config - Key mapping configuration for dynamic schema validation
 * @returns Parsed and validated array of company inputs
 * @throws Error if file doesn't exist, contains invalid JSON, or fails schema validation
 */
export function readJsonFile(
	filePath: string,
	config?: KeyMappingConfig,
): CompanyInputArray {
	const fileContent = fs.readFileSync(filePath, "utf-8");
	const parsedData = JSON.parse(fileContent);

	const schema = config
		? createCompanyInputArraySchema(config)
		: CompanyInputArraySchema;

	return schema.parse(parsedData) as CompanyInputArray;
}

/**
 * Writes research results to a JSON file.
 * The output filename is derived from the input filename by replacing the extension
 * with "-researched.json".
 * @param inputPath - Original input file path
 * @param results - Array of company results to write
 * @returns Path to the output file that was created
 */
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
