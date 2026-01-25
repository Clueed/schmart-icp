#!/usr/bin/env node
/**
 * Creates a sample of 100 companies from the CSV file in ./data
 * and saves it as a JSON file in the same folder.
 */

import fs from "node:fs";
import { Logger } from "../logger.ts";

interface CompanyRow {
  "HitHorizons ID": string;
  "Company Name": string;
  "Secondary Name"?: string;
  "Street Address"?: string;
  "Post Code"?: string;
  Town?: string;
  "State / Province"?: string;
  Country: string;
  Region: string;
  "National ID"?: string;
  "National ID Type Code"?: string;
  "National ID Type Text"?: string;
  "SIC Code"?: string;
  "SIC Text"?: string;
  Industry?: string;
  "Local Activity Code"?: string;
  "Local Activity Text"?: string;
  "Local Activity Code Type"?: string;
  "Local Activity Code Type Text"?: string;
  "TOP Product Keywords"?: string;
  "Establishment of Ownership"?: string;
  "Sales in EUR"?: string;
  "Sales Accuracy Indicator"?: string;
  "Sales Size Ranking"?: string;
  "Employees Number"?: string;
  "Employees Number Accuracy Indicator"?: string;
  "Employees Size Ranking"?: string;
  "Company Type"?: string;
  "Location Type"?: string;
  "Company Profile"?: string;
  Websites?: string;
  "Email Domains"?: string;
  "LinkedIn Profile"?: string;
  "Facebook Profile"?: string;
  "Instagram Profile"?: string;
  "TikTok Profile"?: string;
  "X Profile"?: string;
  "YouTube Channel"?: string;
  "GitHub Profile"?: string;
}

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

/**
 * Converts a CSV company record to a simplified format.
 */
function simplifyCompanyRecord(record: CompanyRow): Record<string, unknown> {
  return {
    id: record["HitHorizons ID"],
    name: record["Company Name"],
    secondaryName: record["Secondary Name"] || null,
    address: record["Street Address"] || null,
    postCode: record["Post Code"] || null,
    town: record["Town"] || null,
    stateProvince: record["State / Province"] || null,
    country: record.Country,
    region: record.Region,
    nationalId: record["National ID"] || null,
    nationalIdType: record["National ID Type Text"] || null,
    sicCode: record["SIC Code"] || null,
    sicText: record["SIC Text"] || null,
    industry: record.Industry || null,
    topProductKeywords: record["TOP Product Keywords"] || null,
    establishmentYear: record["Establishment of Ownership"] || null,
    salesEUR: record["Sales in EUR"] || null,
    salesAccuracy: record["Sales Accuracy Indicator"] || null,
    salesRanking: record["Sales Size Ranking"] || null,
    employeesNumber: record["Employees Number"] || null,
    employeesAccuracy: record["Employees Number Accuracy Indicator"] || null,
    employeesRanking: record["Employees Size Ranking"] || null,
    companyType: record["Company Type"] || null,
    locationType: record["Location Type"] || null,
    companyProfile: record["Company Profile"] || null,
    websites: record["Websites"] || null,
    emailDomains: record["Email Domains"] || null,
    linkedin: record["LinkedIn Profile"] || null,
    facebook: record["Facebook Profile"] || null,
    instagram: record["Instagram Profile"] || null,
    tiktok: record["TikTok Profile"] || null,
    xProfile: record["X Profile"] || null,
    youtube: record["YouTube Channel"] || null,
    github: record["GitHub Profile"] || null,
  };
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
  const records = readCSV(csvPath) as unknown as CompanyRow[];
  Logger.log(`Found ${records.length} companies in CSV`);

  if (records.length < 100) {
    Logger.warn(
      `CSV file contains only ${records.length} companies (less than 100)`,
    );
  }

  // Shuffle and take first 100
  const shuffled = shuffleArray(records);
  const sample = shuffled.slice(0, 100).map(simplifyCompanyRecord);

  // Write to JSON file
  Logger.log(`Writing ${sample.length} companies to JSON file: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(sample, null, 2));

  Logger.log(`✅ Sample created successfully: ${outputPath}`);
}

main().catch((error) => {
  Logger.error("Failed to create sample:", error);
  process.exit(1);
});
