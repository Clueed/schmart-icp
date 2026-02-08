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
  const model = "kimi-k2-turbo-preview";

  globalTokenTracker.setModel(model);
  globalTokenTracker.setServiceTier("moonshot");

  const jsonSchema = z.toJSONSchema(args.response_schema.schema, {
    target: "draft-7",
  });

  const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
    { role: "system", content: SYSTEM_PROMPT },
    {
      role: "user",
      content: `${args.prompt}\n\nUse the submit_result tool to submit your answer.`,
    },
  ];

  const response = await openai.chat.completions.create({
    model,
    messages,
    tools: [
      {
        type: "function",
        function: {
          name: "submit_result",
          description: "Submit the research result",
          parameters: jsonSchema,
        },
      },
      {
        type: "builtin_function",
        function: {
          name: "$web_search",
        },
      },
    ] as unknown as OpenAI.Chat.ChatCompletionTool[],
  });

  Logger.debug("Raw LLM response:", response);

  if (response.usage) {
    globalTokenTracker.addUsage({
      input_tokens: response.usage.prompt_tokens,
      cached_tokens: 0,
      output_tokens: response.usage.completion_tokens,
      reasoning_tokens: 0,
      total_tokens: response.usage.total_tokens,
    });
  }

  let currentResponse = response;
  const currentMessages = [...messages];

  const maxIterations = 10;
  let iteration = 0;

  while (
    currentResponse.choices[0].finish_reason === "tool_calls" &&
    iteration < maxIterations
  ) {
    iteration++;
    const assistantMessage = currentResponse.choices[0].message;
    currentMessages.push(assistantMessage);

    const toolCalls = currentResponse.choices[0].message.tool_calls;
    if (!toolCalls) break;

    let foundSubmitResult = false;
    let submitResultArgs: unknown = null;

    for (const toolCall of toolCalls) {
      if (toolCall.type === "function" && "function" in toolCall) {
        if (toolCall.function.name === "submit_result") {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          Logger.debug("submit_result tool arguments:", toolArgs);

          foundSubmitResult = true;
          submitResultArgs = toolArgs;

          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify({ success: true }),
          } as OpenAI.Chat.ChatCompletionToolMessageParam);
        } else if (toolCall.function.name === "$web_search") {
          const toolArgs = JSON.parse(toolCall.function.arguments);
          Logger.debug("$web_search tool arguments:", toolArgs);

          currentMessages.push({
            role: "tool",
            tool_call_id: toolCall.id,
            content: JSON.stringify(toolArgs),
          } as OpenAI.Chat.ChatCompletionToolMessageParam);
        }
      }
    }

    if (foundSubmitResult && submitResultArgs) {
      const parsedOutput = parseResponse(
        args.response_schema.name as TKey,
        submitResultArgs,
      );

      return { response: currentResponse, parsedOutput };
    }

    currentResponse = await openai.chat.completions.create({
      model,
      messages: currentMessages,
      tools: [
        {
          type: "function",
          function: {
            name: "submit_result",
            description: "Submit the research result",
            parameters: jsonSchema,
          },
        },
        {
          type: "builtin_function",
          function: {
            name: "$web_search",
          },
        },
      ] as unknown as OpenAI.Chat.ChatCompletionTool[],
    });

    Logger.debug("Iteration", iteration, "response:", currentResponse);

    if (currentResponse.usage) {
      globalTokenTracker.addUsage({
        input_tokens: currentResponse.usage.prompt_tokens,
        cached_tokens: 0,
        output_tokens: currentResponse.usage.completion_tokens,
        reasoning_tokens: 0,
        total_tokens: currentResponse.usage.total_tokens,
      });
    }
  }

  Logger.error("LLM did not call submit_result tool");
  throw new Error("LLM did not call submit_result tool");
};
