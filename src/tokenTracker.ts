import { Logger } from "./logger.ts";

/**
 * Represents pricing for a specific model and service tier combination.
 */
export interface ModelPricing {
	/** Price per 1M input tokens in USD */
	inputPrice: number;
	/** Price per 1M cached input tokens in USD (undefined if not applicable) */
	cachedPrice?: number;
	/** Price per 1M output tokens in USD */
	outputPrice: number;
}

/**
 * Supported OpenAI service tiers.
 */
export type ServiceTier = "batch" | "flex" | "standard" | "priority";

/**
 * OpenAI model pricing across all service tiers.
 * Prices are per 1M tokens in USD.
 * Source: https://platform.openai.com/docs/pricing
 */
export const MODEL_PRICING: Record<
	string,
	Record<ServiceTier, ModelPricing>
> = {
	"gpt-5.2": {
		batch: { inputPrice: 0.875, cachedPrice: 0.0875, outputPrice: 7.0 },
		flex: { inputPrice: 0.875, cachedPrice: 0.0875, outputPrice: 7.0 },
		standard: { inputPrice: 1.75, cachedPrice: 0.175, outputPrice: 14.0 },
		priority: { inputPrice: 3.5, cachedPrice: 0.35, outputPrice: 28.0 },
	},
	"gpt-5.1": {
		batch: {
			inputPrice: 0.625,
			cachedPrice: 0.0625,
			outputPrice: 5.0,
		},
		flex: {
			inputPrice: 0.625,
			cachedPrice: 0.0625,
			outputPrice: 5.0,
		},
		standard: {
			inputPrice: 1.25,
			cachedPrice: 0.125,
			outputPrice: 10.0,
		},
		priority: {
			inputPrice: 2.5,
			cachedPrice: 0.25,
			outputPrice: 20.0,
		},
	},
	"gpt-5": {
		batch: {
			inputPrice: 0.625,
			cachedPrice: 0.0625,
			outputPrice: 5.0,
		},
		flex: {
			inputPrice: 0.625,
			cachedPrice: 0.0625,
			outputPrice: 5.0,
		},
		standard: {
			inputPrice: 1.25,
			cachedPrice: 0.125,
			outputPrice: 10.0,
		},
		priority: {
			inputPrice: 2.5,
			cachedPrice: 0.25,
			outputPrice: 20.0,
		},
	},
	"gpt-5-mini": {
		batch: {
			inputPrice: 0.125,
			cachedPrice: 0.0125,
			outputPrice: 1.0,
		},
		flex: {
			inputPrice: 0.125,
			cachedPrice: 0.0125,
			outputPrice: 1.0,
		},
		standard: {
			inputPrice: 0.25,
			cachedPrice: 0.025,
			outputPrice: 2.0,
		},
		priority: {
			inputPrice: 0.45,
			cachedPrice: 0.045,
			outputPrice: 3.6,
		},
	},
	"gpt-5-nano": {
		batch: { inputPrice: 0.025, cachedPrice: 0.0025, outputPrice: 0.2 },
		flex: { inputPrice: 0.025, cachedPrice: 0.0025, outputPrice: 0.2 },
		standard: { inputPrice: 0.05, cachedPrice: 0.005, outputPrice: 0.4 },
		priority: { inputPrice: 0.2, cachedPrice: 0.05, outputPrice: 0.8 },
	},
	"gpt-5.2-pro": {
		batch: { inputPrice: 10.5, outputPrice: 84.0 },
		flex: { inputPrice: 10.5, outputPrice: 84.0 },
		standard: { inputPrice: 21.0, outputPrice: 168.0 },
		priority: { inputPrice: 42.0, outputPrice: 336.0 },
	},
	"gpt-5-pro": {
		batch: {
			inputPrice: 7.5,
			outputPrice: 60.0,
		},
		flex: {
			inputPrice: 7.5,
			outputPrice: 60.0,
		},
		standard: {
			inputPrice: 15.0,
			outputPrice: 120.0,
		},
		priority: {
			inputPrice: 30.0,
			outputPrice: 240.0,
		},
	},
	"gpt-4.1": {
		batch: {
			inputPrice: 1.0,
			outputPrice: 4.0,
		},
		flex: {
			inputPrice: 1.5,
			outputPrice: 6.0,
		},
		standard: {
			inputPrice: 2.0,
			outputPrice: 8.0,
		},
		priority: {
			inputPrice: 3.5,
			cachedPrice: 0.875,
			outputPrice: 14.0,
		},
	},
	"gpt-4.1-mini": {
		batch: {
			inputPrice: 0.2,
			outputPrice: 0.8,
		},
		flex: {
			inputPrice: 0.3,
			outputPrice: 1.2,
		},
		standard: {
			inputPrice: 0.4,
			cachedPrice: 0.1,
			outputPrice: 1.6,
		},
		priority: {
			inputPrice: 0.7,
			cachedPrice: 0.175,
			outputPrice: 2.8,
		},
	},
	"gpt-4.1-nano": {
		batch: {
			inputPrice: 0.05,
			outputPrice: 0.2,
		},
		flex: {
			inputPrice: 0.075,
			outputPrice: 0.3,
		},
		standard: {
			inputPrice: 0.1,
			cachedPrice: 0.025,
			outputPrice: 0.4,
		},
		priority: {
			inputPrice: 0.2,
			cachedPrice: 0.05,
			outputPrice: 0.8,
		},
	},
	"gpt-4o": {
		batch: {
			inputPrice: 1.25,
			outputPrice: 5.0,
		},
		flex: {
			inputPrice: 1.875,
			outputPrice: 7.5,
		},
		standard: {
			inputPrice: 2.5,
			cachedPrice: 1.25,
			outputPrice: 10.0,
		},
		priority: {
			inputPrice: 4.25,
			cachedPrice: 2.125,
			outputPrice: 17.0,
		},
	},
	"gpt-4o-mini": {
		batch: {
			inputPrice: 0.075,
			outputPrice: 0.3,
		},
		flex: {
			inputPrice: 0.1125,
			outputPrice: 0.45,
		},
		standard: {
			inputPrice: 0.15,
			cachedPrice: 0.075,
			outputPrice: 0.6,
		},
		priority: {
			inputPrice: 0.25,
			cachedPrice: 0.125,
			outputPrice: 1.0,
		},
	},
};

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
	private totalInputCost = 0;
	private totalOutputCost = 0;
	private totalCost = 0;
	private currentModel: string | null = null;
	private currentTier: ServiceTier | null = null;

	/**
	 * Sets the model name for cost calculation.
	 * @param model - The OpenAI model name (e.g., "gpt-5.2")
	 */
	setModel(model: string) {
		this.currentModel = model;
	}

	/**
	 * Sets the service tier for cost calculation.
	 * @param tier - The OpenAI service tier (batch, flex, standard, priority)
	 */
	setServiceTier(tier: ServiceTier) {
		this.currentTier = tier;
	}

	/**
	 * Calculates cost for a specific token type based on current model and tier.
	 * @param tokens - Number of tokens
	 * @param tokenType - Type of token ('input', 'cached', 'output', 'reasoning')
	 * @returns Cost in USD
	 */
	private calculateCost(
		tokens: number,
		tokenType: "input" | "cached" | "output" | "reasoning",
	): number {
		if (!this.currentModel || !this.currentTier) {
			return 0;
		}

		const modelPricing = MODEL_PRICING[this.currentModel];
		if (!modelPricing) {
			return 0;
		}

		const tierPricing = modelPricing[this.currentTier];
		if (!tierPricing) {
			return 0;
		}

		const pricePerToken = this.getPricePerToken(tierPricing, tokenType);

		return (tokens * pricePerToken) / 1_000_000;
	}

	/**
	 * Gets price per token for a specific token type from tier pricing.
	 * @param pricing - The pricing for a specific tier
	 * @param tokenType - Type of token
	 * @returns Price per token in USD
	 */
	private getPricePerToken(
		pricing: ModelPricing,
		tokenType: "input" | "cached" | "output" | "reasoning",
	): number {
		switch (tokenType) {
			case "input":
				return pricing.inputPrice;
			case "cached":
				return pricing.cachedPrice ?? pricing.inputPrice;
			case "output":
				return pricing.outputPrice;
			case "reasoning":
				return pricing.outputPrice;
			default:
				return 0;
		}
	}

	addUsage(usage: TokenUsage) {
		this.totalInput += usage.input_tokens;
		this.totalCached += usage.cached_tokens;
		this.totalOutput += usage.output_tokens;
		this.totalReasoning += usage.reasoning_tokens;
		this.totalTokens += usage.total_tokens;
		this.callCount++;

		this.totalInputCost += this.calculateCost(usage.input_tokens, "input");
		this.totalInputCost += this.calculateCost(usage.cached_tokens, "cached");
		this.totalOutputCost += this.calculateCost(usage.output_tokens, "output");
		this.totalOutputCost += this.calculateCost(
			usage.reasoning_tokens,
			"reasoning",
		);
		this.totalCost = this.totalInputCost + this.totalOutputCost;
	}

	getSummary() {
		return {
			total_calls: this.callCount,
			input_tokens: this.totalInput,
			cached_tokens: this.totalCached,
			output_tokens: this.totalOutput,
			reasoning_tokens: this.totalReasoning,
			total_tokens: this.totalTokens,
			input_cost: this.totalInputCost,
			output_cost: this.totalOutputCost,
			total_cost: this.totalCost,
			model: this.currentModel,
			service_tier: this.currentTier,
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

		if (summary.model) {
			Logger.log(`Model: ${summary.model}`);
		}
		if (summary.service_tier) {
			Logger.log(`Service tier: ${summary.service_tier}`);
		}

		if (summary.total_cost > 0) {
			Logger.log(`Input cost: $${summary.input_cost.toFixed(4)}`);
			Logger.log(`Output cost: $${summary.output_cost.toFixed(4)}`);
			Logger.log(`Total cost: $${summary.total_cost.toFixed(4)}`);
		}
	}

	reset() {
		this.totalInput = 0;
		this.totalCached = 0;
		this.totalOutput = 0;
		this.totalReasoning = 0;
		this.totalTokens = 0;
		this.callCount = 0;
		this.totalInputCost = 0;
		this.totalOutputCost = 0;
		this.totalCost = 0;
		this.currentModel = null;
		this.currentTier = null;
	}
}

export const globalTokenTracker = new TokenTracker();
