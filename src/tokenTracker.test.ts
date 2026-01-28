import { beforeEach, describe, expect, it } from "vitest";
import type { TokenUsage } from "./tokenTracker.js";
import { MODEL_PRICING, TokenTracker } from "./tokenTracker.js";

describe("TokenTracker", () => {
	let tracker: TokenTracker;

	beforeEach(() => {
		tracker = new TokenTracker();
	});

	describe("MODEL_PRICING", () => {
		it("should have pricing for gpt-5.2 across all tiers", () => {
			expect(MODEL_PRICING["gpt-5.2"]).toBeDefined();
			expect(MODEL_PRICING["gpt-5.2"].batch).toBeDefined();
			expect(MODEL_PRICING["gpt-5.2"].flex).toBeDefined();
			expect(MODEL_PRICING["gpt-5.2"].standard).toBeDefined();
			expect(MODEL_PRICING["gpt-5.2"].priority).toBeDefined();
		});

		it("should have correct gpt-5.2 flex pricing", () => {
			expect(MODEL_PRICING["gpt-5.2"].flex.inputPrice).toBe(0.875);
			expect(MODEL_PRICING["gpt-5.2"].flex.cachedPrice).toBe(0.0875);
			expect(MODEL_PRICING["gpt-5.2"].flex.outputPrice).toBe(7.0);
		});

		it("should have correct gpt-5.2 standard pricing", () => {
			expect(MODEL_PRICING["gpt-5.2"].standard.inputPrice).toBe(1.75);
			expect(MODEL_PRICING["gpt-5.2"].standard.cachedPrice).toBe(0.175);
			expect(MODEL_PRICING["gpt-5.2"].standard.outputPrice).toBe(14.0);
		});

		it("should have pricing for gpt-5-mini across all tiers", () => {
			expect(MODEL_PRICING["gpt-5-mini"]).toBeDefined();
			expect(MODEL_PRICING["gpt-5-mini"].batch).toBeDefined();
			expect(MODEL_PRICING["gpt-5-mini"].flex).toBeDefined();
			expect(MODEL_PRICING["gpt-5-mini"].standard).toBeDefined();
			expect(MODEL_PRICING["gpt-5-mini"].priority).toBeDefined();
		});

		it("should handle models without cached pricing", () => {
			expect(MODEL_PRICING["gpt-5.2-pro"]).toBeDefined();
			expect(MODEL_PRICING["gpt-5.2-pro"].batch.cachedPrice).toBeUndefined();
		});
	});

	describe("setModel and setServiceTier", () => {
		it("should set current model and tier", () => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
			const summary = tracker.getSummary();
			expect(summary.model).toBe("gpt-5.2");
			expect(summary.service_tier).toBe("flex");
		});

		it("should allow model change", () => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
			tracker.setModel("gpt-5.1");
			const summary = tracker.getSummary();
			expect(summary.model).toBe("gpt-5.1");
		});

		it("should allow tier change", () => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
			tracker.setServiceTier("standard");
			const summary = tracker.getSummary();
			expect(summary.service_tier).toBe("standard");
		});
	});

	describe("cost calculation", () => {
		beforeEach(() => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
		});

		it("should calculate cost for input tokens", () => {
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.input_cost).toBeCloseTo(0.875, 4);
		});

		it("should calculate cost for cached tokens", () => {
			const usage: TokenUsage = {
				input_tokens: 0,
				cached_tokens: 1_000_000,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.input_cost).toBeCloseTo(0.0875, 4);
		});

		it("should calculate cost for output tokens", () => {
			const usage: TokenUsage = {
				input_tokens: 0,
				cached_tokens: 0,
				output_tokens: 1_000_000,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.output_cost).toBeCloseTo(7.0, 4);
		});

		it("should calculate cost for reasoning tokens as output", () => {
			const usage: TokenUsage = {
				input_tokens: 0,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 1_000_000,
				total_tokens: 1_000_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.output_cost).toBeCloseTo(7.0, 4);
		});

		it("should calculate total cost correctly", () => {
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 500_000,
				output_tokens: 250_000,
				reasoning_tokens: 100_000,
				total_tokens: 1_850_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.total_cost).toBeCloseTo(0.875 + 0.04375 + 1.75 + 0.7, 4);
		});

		it("should handle multiple API calls", () => {
			const usage1: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 500_000,
				reasoning_tokens: 0,
				total_tokens: 1_500_000,
			};
			const usage2: TokenUsage = {
				input_tokens: 2_000_000,
				cached_tokens: 0,
				output_tokens: 1_000_000,
				reasoning_tokens: 0,
				total_tokens: 3_000_000,
			};
			tracker.addUsage(usage1);
			tracker.addUsage(usage2);
			const summary = tracker.getSummary();
			expect(summary.total_cost).toBeCloseTo(0.875 + 3.5 + 1.75 + 7.0, 4);
		});

		it("should return zero cost when model not set", () => {
			const newTracker = new TokenTracker();
			newTracker.setModel("unknown-model");
			newTracker.setServiceTier("flex");
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			newTracker.addUsage(usage);
			const summary = newTracker.getSummary();
			expect(summary.total_cost).toBe(0);
		});

		it("should return zero cost when tier not set", () => {
			const newTracker = new TokenTracker();
			newTracker.setModel("gpt-5.2");
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			newTracker.addUsage(usage);
			const summary = newTracker.getSummary();
			expect(summary.total_cost).toBe(0);
		});

		it("should calculate different costs for different tiers", () => {
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};

			tracker.setServiceTier("batch");
			tracker.addUsage(usage);
			const batchSummary = tracker.getSummary();
			expect(batchSummary.input_cost).toBeCloseTo(0.875, 4);
			tracker.reset();
			tracker.setModel("gpt-5.2");

			tracker.setServiceTier("standard");
			tracker.addUsage(usage);
			const standardSummary = tracker.getSummary();
			expect(standardSummary.input_cost).toBeCloseTo(1.75, 4);
		});
	});

	describe("getSummary", () => {
		beforeEach(() => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
		});

		it("should include cost fields in summary", () => {
			const usage: TokenUsage = {
				input_tokens: 100_000,
				cached_tokens: 10_000,
				output_tokens: 50_000,
				reasoning_tokens: 5_000,
				total_tokens: 165_000,
			};
			tracker.addUsage(usage);
			const summary = tracker.getSummary();
			expect(summary.input_cost).toBeDefined();
			expect(summary.output_cost).toBeDefined();
			expect(summary.total_cost).toBeDefined();
			expect(summary.model).toBe("gpt-5.2");
			expect(summary.service_tier).toBe("flex");
		});
	});

	describe("reset", () => {
		it("should reset cost tracking", () => {
			tracker.setModel("gpt-5.2");
			tracker.setServiceTier("flex");
			const usage: TokenUsage = {
				input_tokens: 1_000_000,
				cached_tokens: 0,
				output_tokens: 0,
				reasoning_tokens: 0,
				total_tokens: 1_000_000,
			};
			tracker.addUsage(usage);
			tracker.reset();
			const summary = tracker.getSummary();
			expect(summary.input_cost).toBe(0);
			expect(summary.output_cost).toBe(0);
			expect(summary.total_cost).toBe(0);
			expect(summary.model).toBeNull();
			expect(summary.service_tier).toBeNull();
		});
	});
});
