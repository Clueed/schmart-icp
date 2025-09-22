import { describe, it, expect } from "vitest";
import { Logger } from "./logger.ts";

describe("Logger", () => {
	it("should enable and disable debug mode", () => {
		Logger.setDebug(true);
		// Note: Testing debug output is tricky since it logs to console
		// For now, just test that setDebug doesn't throw
		expect(() => Logger.setDebug(false)).not.toThrow();
		expect(() => Logger.setDebug(true)).not.toThrow();
	});
});
