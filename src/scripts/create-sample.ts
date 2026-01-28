#!/usr/bin/env node
/**
 * Creates a sample of 100 companies from the CSV file in ./data
 * and saves it as a JSON file in the same folder.
 */

import fs from "node:fs";
import { Logger } from "../logger.ts";

/**
 * Parses a CSV line, handling quoted fields properly.
 */
function parseCSVLine(line: string): string[] {
	const result: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const char = line[i];
		const nextChar = line[i + 1];

		if (inQuotes) {
			if (char === '"' && nextChar === '"') {
				current += '"';
				i++; // Skip next quote
			} else if (char === '"') {
				inQuotes = false;
			} else {
				current += char;
			}
		} else {
			if (char === '"') {
				inQuotes = true;
			} else if (char === ",") {
				result.push(current);
				current = "";
			} else {
				current += char;
			}
		}
	}
	result.push(current);
	return result;
}

/**
 * Reads and parses a CSV file, returning an array of objects.
 */
function readCSV(filePath: string): Array<Record<string, string>> {
	const content = fs.readFileSync(filePath, "utf-8");
	const lines = content.split("\n").filter((line) => line.trim() !== "");

	if (lines.length === 0) {
		throw new Error(`CSV file ${filePath} is empty`);
	}

	const headers = parseCSVLine(lines[0]);
	const records: Array<Record<string, string>> = [];

	for (let i = 1; i < lines.length; i++) {
		const values = parseCSVLine(lines[i]);
		const record: Record<string, string> = {};

		headers.forEach((header, index) => {
			record[header] = values[index] || "";
		});

		records.push(record);
	}

	return records;
}

function convertEmptyStringsToNull(
	record: Record<string, string>,
): Record<string, string | null> {
	const result: Record<string, string | null> = {};
	for (const [key, value] of Object.entries(record)) {
		result[key] = value === "" ? null : value;
	}
	return result;
}

/**
 * Shuffles an array using Fisher-Yates algorithm.
 */
function shuffleArray<T>(array: T[]): T[] {
	const shuffled = [...array];
	for (let i = shuffled.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
	}
	return shuffled;
}

/**
 * Main function to create the sample.
 */
async function main() {
	const csvPath =
		"./data/export-26q1dachexport18741companies-2026-01-22-10-32-42.csv";
	const outputPath =
		"./data/companies-sample-100-" +
		new Date().toISOString().slice(0, 10).replace(/-/g, "-") +
		".json";

	Logger.section("Creating 100-company sample from CSV");

	// Check if CSV file exists
	if (!fs.existsSync(csvPath)) {
		Logger.error(`CSV file not found: ${csvPath}`);
		process.exit(1);
	}

	Logger.log(`Reading CSV file: ${csvPath}`);
	const records = readCSV(csvPath);
	Logger.log(`Found ${records.length} companies in CSV`);

	if (records.length < 100) {
		Logger.warn(
			`CSV file contains only ${records.length} companies (less than 100)`,
		);
	}

	// Shuffle and take first 100
	const shuffled = shuffleArray(records);
	const sample = shuffled.slice(0, 100).map(convertEmptyStringsToNull);

	// Write to JSON file
	Logger.log(`Writing ${sample.length} companies to JSON file: ${outputPath}`);
	fs.writeFileSync(outputPath, JSON.stringify(sample, null, 2));

	Logger.log(`✅ Sample created successfully: ${outputPath}`);
}

main().catch((error) => {
	Logger.error("Failed to create sample:", error);
	process.exit(1);
});
