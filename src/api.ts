import { OpenRouter, tool } from "@openrouter/sdk";
import z from "zod";
import { Logger } from "./logger.ts";
import { SYSTEM_PROMPT } from "./prompts.ts";
import { parseResponse, type ResearchFieldKey } from "./schemas.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

const openrouter = new OpenRouter({
	apiKey: process.env.OPENROUTER_API_KEY,
});

const webSearchTool = tool({
	name: "web_search",
	description: "Search the web for current information about companies",
	inputSchema: z.object({
		query: z.string().describe("Search query to execute"),
	}),
	execute: async ({ query }) => {
		return {
			query,
			results: "Search results will be provided by OpenRouter",
		};
	},
});

export interface CallLLMArgs<_TKey extends ResearchFieldKey> {
	prompt: string;
	response_schema: {
		name: string;
		schema: z.ZodTypeAny;
	};
}

function extractJSONFromResponse(responseText: string): unknown {
	const jsonMatch =
		responseText.match(/```json\s*([\s\S]*?)\s*```/) ||
		responseText.match(/\{[\s\S]*\}/);

	if (jsonMatch) {
		return JSON.parse(jsonMatch[1] || jsonMatch[0]);
	}

	return JSON.parse(responseText);
}

export const callLLM = async <TKey extends ResearchFieldKey>(
	args: CallLLMArgs<TKey>,
) => {
	const model = "openrouter/auto";
	globalTokenTracker.setModel(model);
	globalTokenTracker.setServiceTier("flex");

	z.toJSONSchema(args.response_schema.schema, {
		target: "draft-7",
	});

	Logger.debug("Calling OpenRouter with model:", model);
	Logger.debug("Request prompt:", args.prompt);

	const result = openrouter.callModel({
		model,
		instructions: SYSTEM_PROMPT,
		input: [{ role: "user", content: args.prompt }],
		tools: [webSearchTool],
	});

	const responseText = await result.getText();
	Logger.debug("Raw OpenRouter response:", responseText);

	let json: unknown;
	try {
		json = extractJSONFromResponse(responseText);
	} catch (parseError) {
		Logger.error("Failed to parse JSON from response:", responseText);
		throw new Error(
			`Failed to parse JSON from OpenRouter response: ${parseError}`,
		);
	}

	const parsedOutput = parseResponse(args.response_schema.name as TKey, json);

	Logger.warn(
		"Token tracking not yet fully implemented for OpenRouter - " +
			"please update tokenTracker.ts with OpenRouter pricing",
	);

	return { response: { output_text: responseText }, parsedOutput };
};
