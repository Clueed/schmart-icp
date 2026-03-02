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

/**
 * Gets the output path for a given input file.
 * @param inputPath - Original input file path
 * @returns Path to the output file
 */
export function getOutputPath(inputPath: string): string {
	return inputPath.replace(/\.json$/, "-researched.json");
}

/**
 * Loads existing results from the output file if it exists.
 * @param inputPath - Original input file path
 * @returns Array of existing results, or empty array if file doesn't exist
 */
export function loadExistingResults(
	inputPath: string,
): Array<Record<string, unknown>> {
	const outputPath = getOutputPath(inputPath);

	try {
		const fileContent = fs.readFileSync(outputPath, "utf-8");
		const parsedData = JSON.parse(fileContent);

		if (!Array.isArray(parsedData)) {
			Logger.warn(
				`Output file ${outputPath} does not contain an array, starting fresh`,
			);
			return [];
		}

		return parsedData;
	} catch {
		// File doesn't exist or is invalid JSON - return empty array
		return [];
	}
}

/**
 * Filters out companies that have already been processed.
 * Uses the configured name field as the unique identifier.
 * @param companies - Array of company inputs to process
 * @param existingResults - Array of already processed results
 * @param config - Optional key mapping config for custom name field
 * @returns Array of companies that haven't been processed yet
 */
export function filterUnprocessed(
	companies: CompanyInputArray,
	existingResults: Array<Record<string, unknown>>,
	config?: KeyMappingConfig,
): CompanyInputArray {
	const nameKey = config?.nameKey ?? "name";
	const processedNames = new Set<string>();

	for (const result of existingResults) {
		const name = result[nameKey];
		if (typeof name === "string") {
			processedNames.add(name);
		}
	}

	const unprocessed = companies.filter((company) => {
		const name = company[nameKey] as string | undefined;
		if (name && processedNames.has(name)) {
			Logger.debug(`Skipping already processed: ${name}`);
			return false;
		}
		return true;
	});

	if (processedNames.size > 0) {
		Logger.log(
			`📋 Found ${processedNames.size} already processed, ${unprocessed.length} remaining`,
		);
	}

	return unprocessed;
}
