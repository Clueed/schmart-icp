import OpenAI from "openai";
import z from "zod";
import type { OutputSchema } from "./prompts.ts";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface CallLLMArgs {
	prompt: string;
	response_schema: {
		name: string;
		schema: z.ZodTypeAny;
	};
}

export const callLLM = async (args: CallLLMArgs) => {
	const jsonSchema = z.toJSONSchema(args.response_schema.schema, {
		target: "draft-7",
	});

	const response = await openai.responses.create({
		model: "gpt-5-mini",
		tools: [{ type: "web_search_preview" }],
		input: args.prompt,
		text: {
			format: {
				name: args.response_schema.name,
				type: "json_schema",
				strict: true,
				schema: jsonSchema,
			},
		},
	});

	const json = JSON.parse(response.output_text);
	const parsedOutput = args.response_schema.schema.parse(json) as OutputSchema;

	return { response, parsedOutput };
};
