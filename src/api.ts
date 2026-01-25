import OpenAI from "openai";
import z from "zod";
import { Logger } from "./logger.ts";
import { SYSTEM_PROMPT } from "./prompts.ts";
import { type ResearchFieldKey, parseResponse } from "./schemas.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface CallLLMArgs<_TKey extends ResearchFieldKey> {
  prompt: string;
  response_schema: {
    name: string;
    schema: z.ZodTypeAny;
  };
}

export const callLLM = async <TKey extends ResearchFieldKey>(
  args: CallLLMArgs<TKey>,
) => {
  const jsonSchema = z.toJSONSchema(args.response_schema.schema, {
    target: "draft-7",
  });

  const response = await openai.responses.create({
    model: "gpt-5.2",
    service_tier: "flex",
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
      effort: "low",
    },
  });

  Logger.debug("Raw LLM response:", response);

  const json = JSON.parse(response.output_text);
  const parsedOutput = parseResponse(args.response_schema.name as TKey, json);

  // Track token usage
  if (response.usage) {
    globalTokenTracker.addUsage({
      input_tokens: response.usage.input_tokens,
      cached_tokens: response.usage.input_tokens_details?.cached_tokens ?? 0,
      output_tokens: response.usage.output_tokens,
      reasoning_tokens:
        response.usage.output_tokens_details?.reasoning_tokens ?? 0,
      total_tokens: response.usage.total_tokens,
    });
  }

  return { response, parsedOutput };
};
