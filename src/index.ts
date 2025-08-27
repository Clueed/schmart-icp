import "dotenv/config";
import { createGroundTruth } from "./config/groundTruth.js";
import { openai } from "./config/openai.js";
import { createPrompt } from "./utils/prompt.js";
import { parseAPIResponse, type APIResponse } from "./utils/responseParser.js";
import { compareResult, calculateAccuracy } from "./utils/benchmark.js";

// Query OpenAI function
const queryOpenAI = async (companyName: string, key: string, possibleValues: string[]): Promise<APIResponse> => {
	const prompt = createPrompt(companyName, key, possibleValues);
	
	try {
		const completion = await openai.chat.completions.create({
			model: "gpt-4o",
			messages: [{ role: "user", content: prompt }],
			max_tokens: 200,
		});

		const responseText = completion.choices[0]?.message?.content || "";
		return parseAPIResponse(responseText);
	} catch (error) {
		console.error(`Error querying OpenAI for ${key}:`, error);
		return {
			value: "Error",
			certaintyScore: 0,
			explanation: "API error occurred",
			sources: []
		};
	}
};

// Run benchmark function
const runBenchmark = async (companyName: string) => {
	const groundTruth = createGroundTruth(companyName);
	const results: {
		key: string;
		expected: string;
		predicted: string;
		match: boolean;
		certaintyScore: number;
		explanation: string;
		sources: string[];
	}[] = [];
	
	const companyData = groundTruth[companyName];
	for (const [key, groundTruthKey] of Object.entries(companyData)) {
		console.log(`Querying for ${key}...`);
		const response = await queryOpenAI(companyName, key, groundTruthKey.possibleValues);
		
		const isMatch = compareResult(response.value, groundTruthKey.expectedValue);
		
		results.push({
			key,
			expected: groundTruthKey.expectedValue,
			predicted: response.value,
			match: isMatch,
			certaintyScore: response.certaintyScore,
			explanation: response.explanation,
			sources: response.sources
		});
		
		console.log(`Result for ${key}: ${isMatch ? 'MATCH' : 'MISMATCH'}`);
		console.log(`Expected: ${groundTruthKey.expectedValue}, Predicted: ${response.value}`);
		console.log(`Certainty Score: ${response.certaintyScore}`);
		console.log(`Explanation: ${response.explanation}`);
		console.log(`Sources: ${response.sources.join(', ')}`);
		console.log('---');
	}
	
	// Summary
	const { total, matches, percentage } = calculateAccuracy(results);
	console.log(`\nBenchmark Summary: ${matches}/${total} matches (${percentage.toFixed(1)}%)`);
};

// CLI interface
const companyName = process.argv[2];
if (!companyName) {
	console.error("Please provide a company name as an argument");
	process.exit(1);
}

runBenchmark(companyName);