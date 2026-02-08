import OpenAI from "openai";
import z from "zod";
import { Logger } from "./logger.ts";
import { SYSTEM_PROMPT } from "./prompts.ts";
import { parseResponse, type ResearchFieldKey } from "./schemas.ts";
import { globalTokenTracker } from "./tokenTracker.ts";

const openai = new OpenAI({
  baseURL: "https://api.moonshot.ai/v1",
  apiKey: process.env.MOONSHOT_API_KEY || process.env.OPENAI_API_KEY,
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
  const model = "kimi-k2.5";

  globalTokenTracker.setModel(model);
  globalTokenTracker.setServiceTier("moonshot");

  const jsonSchema = z.toJSONSchema(args.response_schema.schema, {
    target: "draft-7",
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `Please provide the following information in JSON format:\n\n${args.prompt}\n\nRespond with a JSON object matching this schema:\n${JSON.stringify(jsonSchema, null, 2)}`,
    },
  ];

  const response = await openai.chat.completions.create({
    model,
    messages,
    tools: [
      {
        type: "builtin_function",
        function: {
          name: "$web_search",
        },
      },
    ] as unknown as OpenAI.Chat.ChatCompletionTool[],
  });

  Logger.debug("Raw LLM response:", response);

  let responseContent = response.choices[0].message.content;

  if (response.choices[0].finish_reason === "tool_calls") {
    const toolCalls = response.choices[0].message.tool_calls;
    if (toolCalls) {
      const toolMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
        ...messages,
        response.choices[0].message,
      ];

      for (const toolCall of toolCalls) {
        if (
          toolCall.type === "function" &&
          toolCall.function.name === "$web_search"
        ) {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          toolMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            name: toolCall.function.name,
            content: JSON.stringify(toolArgs),
          } as OpenAI.Chat.ChatCompletionToolMessageParam);
        }
      }

      const finalResponse = await openai.chat.completions.create({
        model,
        messages: toolMessages,
        tools: [
          {
            type: "builtin_function",
            function: {
              name: "$web_search",
            },
          },
        ] as unknown as OpenAI.Chat.ChatCompletionTool[],
      });

      responseContent = finalResponse.choices[0].message.content;

      if (response.usage) {
        globalTokenTracker.addUsage({
          input_tokens: response.usage.prompt_tokens,
          cached_tokens: 0,
          output_tokens: response.usage.completion_tokens,
          reasoning_tokens: 0,
          total_tokens: response.usage.total_tokens,
        });
      }
      if (finalResponse.usage) {
        globalTokenTracker.addUsage({
          input_tokens: finalResponse.usage.prompt_tokens,
          cached_tokens: 0,
          output_tokens: finalResponse.usage.completion_tokens,
          reasoning_tokens: 0,
          total_tokens: finalResponse.usage.total_tokens,
        });
      }

      const json = JSON.parse(responseContent || "{}");
      const parsedOutput = parseResponse(
        args.response_schema.name as TKey,
        json,
      );

      return { response: finalResponse, parsedOutput };
    }
  }

  if (response.usage) {
    globalTokenTracker.addUsage({
      input_tokens: response.usage.prompt_tokens,
      cached_tokens: 0,
      output_tokens: response.usage.completion_tokens,
      reasoning_tokens: 0,
      total_tokens: response.usage.total_tokens,
    });
  }

  const json = JSON.parse(responseContent || "{}");
  const parsedOutput = parseResponse(args.response_schema.name as TKey, json);

  return { response, parsedOutput };
};
