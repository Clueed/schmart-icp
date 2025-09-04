import "dotenv/config";
import { researchAllFields } from "./research.ts";
import type { CompanyInput } from "./types.ts";

console.log("🔥 Script loaded successfully!");

/**
 * Main function to research a company using AI-powered tools
 * @param companyName - The name of the company to research
 * @param domain - Optional domain of the company
 */
async function researchCompany(companyName: string, domain?: string) {
	console.log(`🔍 Starting research for ${companyName}`);
	console.log(`Domain: ${domain}`);

	const companyInput: CompanyInput = {
		name: companyName,
		domain: domain,
	};

	try {
		const results = await researchAllFields(companyName);
		const companyOutput = { ...companyInput, ...results };

		console.log("=".repeat(20), " Research Results ", "=".repeat(20));
		console.log(companyOutput);

		return companyOutput;
	} catch (error) {
		console.error("❌ Error researching company:", error);
		throw error;
	}
}

/**
 * Simple CLI for company research
 * Usage: pnpm run dev "Company Name"
 */
function main() {
	console.log("Starting main function...");
	const args = process.argv.slice(2);
	console.log("Arguments received:", args);

	if (args.length === 0) {
		console.log("🔍 Company Research CLI");
		console.log('Usage: pnpm run dev "Company Name"');
		console.log('Example: pnpm run dev "Siemens Energy"');
		process.exit(0);
	}

	const companyName = args.join(" ");

	console.log(`🚀 Starting research for: ${companyName}`);
	console.log("=".repeat(50));

	researchCompany(companyName)
		.then(() => {
			console.log("\n✅ Research completed successfully!");
		})
		.catch((error) => {
			console.error("\n❌ Research failed:", error.message);
			process.exit(1);
		});
}

// Check if this module is being run directly
if (
	process.argv[1]?.includes("index.ts") ||
	process.argv[1]?.endsWith("index.js")
) {
	main();
}
