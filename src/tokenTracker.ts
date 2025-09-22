import { Logger } from "./logger.ts";

export interface TokenUsage {
	input_tokens: number;
	cached_tokens: number;
	output_tokens: number;
	reasoning_tokens: number;
	total_tokens: number;
}

export class TokenTracker {
	private totalInput = 0;
	private totalCached = 0;
	private totalOutput = 0;
	private totalReasoning = 0;
	private totalTokens = 0;
	private callCount = 0;

	addUsage(usage: TokenUsage) {
		this.totalInput += usage.input_tokens;
		this.totalCached += usage.cached_tokens;
		this.totalOutput += usage.output_tokens;
		this.totalReasoning += usage.reasoning_tokens;
		this.totalTokens += usage.total_tokens;
		this.callCount++;
	}

	getSummary() {
		return {
			total_calls: this.callCount,
			input_tokens: this.totalInput,
			cached_tokens: this.totalCached,
			output_tokens: this.totalOutput,
			reasoning_tokens: this.totalReasoning,
			total_tokens: this.totalTokens,
		};
	}

	logSummary() {
		Logger.section("Token Usage Summary");
		const summary = this.getSummary();
		Logger.log(`Total API calls: ${summary.total_calls}`);
		Logger.log(`Input tokens: ${summary.input_tokens}`);
		Logger.log(`Cached tokens: ${summary.cached_tokens}`);
		Logger.log(`Output tokens: ${summary.output_tokens}`);
		Logger.log(`Reasoning tokens: ${summary.reasoning_tokens}`);
		Logger.log(`Total tokens: ${summary.total_tokens}`);
	}

	reset() {
		this.totalInput = 0;
		this.totalCached = 0;
		this.totalOutput = 0;
		this.totalReasoning = 0;
		this.totalTokens = 0;
		this.callCount = 0;
	}
}

export const globalTokenTracker = new TokenTracker();
