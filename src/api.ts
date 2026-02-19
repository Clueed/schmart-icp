import { OpenRouter, tool } from "@openrouter/sdk";
import z from "zod";
import { Logger } from "./logger.ts";
import { SYSTEM_PROMPT } from "./prompts.ts";
import { parseResponse, type ResearchFieldKey } from "./schemas.ts";
import { globalTokenTracker } from "./tokenTracker.ts";
import type { WebSearchConfig } from "./types.ts";

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
  model?: string;
  useStructuredOutput?: boolean;
  webSearchConfig?: WebSearchConfig;
}

export function extractJSONFromResponse(responseText: string): unknown {
  const trimmed = responseText.trim();

  const jsonMatch =
    trimmed.match(/```json\s*([\s\S]*?)\s*```/) || trimmed.match(/\{[\s\S]*\}/);

  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[1] || jsonMatch[0]);
    } catch (parseError) {
      throw new Error(
        `Found JSON-like content but failed to parse: ${parseError}`,
      );
    }
  }

  if (!trimmed.includes("{") && !trimmed.includes("[")) {
    throw new Error(
      `LLM returned plain text instead of JSON. Response: "${trimmed.substring(0, 200)}${trimmed.length > 200 ? "..." : ""}"`,
    );
  }

  try {
    return JSON.parse(trimmed);
  } catch (parseError) {
    throw new Error(
      `Failed to parse response as JSON: ${parseError}. Response: "${trimmed.substring(0, 200)}${trimmed.length > 200 ? "..." : ""}"`,
    );
  }
}

function zodToJsonSchema(zodSchema: z.ZodTypeAny): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(zodSchema, {
    target: "draft-7",
  });

  if (typeof jsonSchema === "boolean" || !jsonSchema) {
    return {
      type: "object",
      properties: {},
      required: [],
    };
  }

  return jsonSchema as Record<string, unknown>;
}

async function callLLMStructured(args: {
  prompt: string;
  responseSchema: {
    name: string;
    schema: Record<string, unknown>;
  };
  model: string;
  webSearchConfig?: WebSearchConfig;
}): Promise<{ response: { output_text: string }; json: unknown }> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new Error("OPENROUTER_API_KEY environment variable is not set");
  }

  if (args.webSearchConfig?.enabled) {
    globalTokenTracker.addWebSearchCost(args.webSearchConfig.maxResults);
  }

  const requestBody = {
    model: args.model,
    messages: [
      {
        role: "user",
        content: args.prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: args.responseSchema.name,
        schema: args.responseSchema.schema,
      },
    },
    plugins: buildPlugins(args.webSearchConfig),
  };

  Logger.debug("Calling OpenRouter with structured output:", {
    model: args.model,
    schemaName: args.responseSchema.name,
  });

  const response = await fetch(
    "https://openrouter.ai/api/v1/chat/completions",
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": "https://schmart-icp.com",
        "X-Title": "Schmart ICP",
      },
      body: JSON.stringify(requestBody),
    },
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();

  const content = data.choices[0]?.message?.content;
  if (!content) {
    throw new Error("No content in OpenRouter response");
  }

  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(content);
  } catch (parseError) {
    Logger.error("Failed to parse JSON from structured response:", content);
    throw new Error(
      `Failed to parse JSON from structured response: ${parseError}`,
    );
  }

  return { response: { output_text: content }, json: parsedJson };
}

/**
 * Builds the plugins array for OpenRouter API calls.
 * @param webSearchConfig - Web search configuration
 * @returns Array of plugins to include in the API request
 */
function buildPlugins(
  webSearchConfig?: WebSearchConfig,
): Array<{ id: string; max_results?: number; engine?: string }> {
  const plugins: Array<{ id: string; max_results?: number; engine?: string }> =
    [{ id: "response-healing" }];

  if (webSearchConfig?.enabled) {
    const webPlugin: { id: string; max_results?: number; engine?: string } = {
      id: "web",
      max_results: webSearchConfig.maxResults,
    };

    // Only add engine if explicitly set to "native" or "exa" (undefined = auto)
    if (
      webSearchConfig.engine === "native" ||
      webSearchConfig.engine === "exa"
    ) {
      webPlugin.engine = webSearchConfig.engine;
    }

    plugins.push(webPlugin);
  }

  return plugins;
}

export const callLLM = async <TKey extends ResearchFieldKey>(
  args: CallLLMArgs<TKey>,
) => {
  const model = args.model;
  globalTokenTracker.setModel(model);
  globalTokenTracker.setServiceTier("flex");

  if (args.webSearchConfig?.enabled && !args.useStructuredOutput) {
    globalTokenTracker.addWebSearchCost(args.webSearchConfig.maxResults);
  }

  Logger.debug("Calling OpenRouter with model:", model);
  Logger.debug("Request prompt:", args.prompt);

  if (args.useStructuredOutput) {
    const jsonSchema = zodToJsonSchema(args.response_schema.schema);

    const { response, json } = await callLLMStructured({
      prompt: `${SYSTEM_PROMPT}\n\n${args.prompt}`,
      responseSchema: {
        name: args.response_schema.name,
        schema: jsonSchema,
      },
      model,
      webSearchConfig: args.webSearchConfig,
    });

    const parsedOutput = parseResponse(args.response_schema.name as TKey, json);

    return { response, parsedOutput };
  }

  const tools = args.webSearchConfig?.enabled ? [webSearchTool] : [];

  const result = openrouter.callModel({
    model,
    instructions: SYSTEM_PROMPT,
    input: [{ role: "user", content: args.prompt }],
    tools,
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
