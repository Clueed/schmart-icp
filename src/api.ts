import OpenAI from "openai";
import z from "zod/v4";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

interface CallLLMArgs {
	prompt: string;
	response_schema: {
		name: string;
		schema: z.ZodObject;
	};
}

export const callLLM = async (args: CallLLMArgs) => {
	const response = await openai.chat.completions.create({
		model: "gpt-4o-search-preview",
		messages: [
			{
				role: "system",
				content: "You are a research assistant.",
			},
			{
				role: "user",
				content: args.prompt,
			},
		],
		response_format: {
			type: "json_schema",
			json_schema: {
				name: args.response_schema.name,
				strict: true,
				schema: z.toJSONSchema(args.response_schema.schema, {
					target: "draft-7",
				}),
			},
		},
		web_search_options: {
			search_context_size: "high",
		},
	});

	return response;
};
