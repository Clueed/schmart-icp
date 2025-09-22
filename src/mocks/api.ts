import type { CallLLMArgs } from "../api.ts";
import type { ResearchFieldKey } from "../schemas.ts";
import type { ExtendedResponse } from "../schemas.ts";
import type OpenAI from "openai";
import type z from "zod";

type BaseResponse = z.infer<typeof import("../schemas.ts").baseResponseSchema>;

export const createCallLLMMock = <TKey extends ResearchFieldKey>() => {
	return async (args: CallLLMArgs<TKey>) => {
		const field = args.response_schema.name as ResearchFieldKey;
		const mockData: BaseResponse & { [K in ResearchFieldKey]?: unknown } = {
			explanation: `Mock explanation for ${field}`,
			certainty_score: 0.9,
			sources: ["https://example.com"],
		};

		switch (field) {
			case "employees":
				mockData[field] = 5000;
				break;
			case "revenue":
				mockData[field] = 1000000000;
				break;
			case "eam_tool":
				mockData[field] = "LeanIX";
				break;
			case "eam_practice":
				mockData[field] = "established";
				break;
			case "itBp_practice":
				mockData[field] = "established";
				break;
			case "itsm_tool":
				mockData[field] = "ServiceNow ITSM";
				break;
			case "sam_practice":
				mockData[field] = "established";
				break;
			case "sam_tool":
				mockData[field] = "Flexera";
				break;
			default:
				throw new Error(`Unexpected field: ${field}`);
		}

		return {
			response: {
				output_text: JSON.stringify(mockData),
			} as OpenAI.Responses.Response,
			parsedOutput: mockData as ExtendedResponse<ResearchFieldKey>,
		};
	};
};
