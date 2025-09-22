import { vi } from "vitest";

export default () => ({
	default: vi.fn(() => ({
		responses: { create: vi.fn() },
	})),
});
