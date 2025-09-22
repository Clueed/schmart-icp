import OpenAI from "openai";
import z from "zod";
import { Logger } from "./logger.ts";
import {
	parseResponse,
	type ExtendedResponseSchema,
	type ResearchFieldKey,
} from "./schemas.ts";
import { SYSTEM_PROMPT } from "./prompts.ts";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

export interface CallLLMArgs<TKey extends ResearchFieldKey> {
	prompt: string;
	response_schema: {
		name: string;
		schema: ExtendedResponseSchema<TKey>;
	};
}

export const callLLM = async <TKey extends ResearchFieldKey>(
	args: CallLLMArgs<TKey>,
) => {
	const jsonSchema = z.toJSONSchema(args.response_schema.schema, {
		target: "draft-7",
	});

	const response = await openai.responses.create({
		model: "gpt-5-mini",
		tools: [{ type: "web_search_preview" }],
		input: [
			{ role: "system", content: SYSTEM_PROMPT },
			{ role: "user", content: args.prompt },
		],
		text: {
			format: {
				name: args.response_schema.name,
				type: "json_schema",
				strict: true,
				schema: jsonSchema,
			},
		},
		reasoning: {
			effort: "minimal",
		},
	});

	Logger.debug("Raw LLM response:", response);

	const json = JSON.parse(response.output_text);
	const parsedOutput = parseResponse(args.response_schema.name as TKey, json);

	return { response, parsedOutput };
};
