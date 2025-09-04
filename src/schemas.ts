import z from "zod";

export const baseResponseSchema = z
	.object({
		explanation: z.string(),
		certainty_score: z.number().min(0).max(1),
		sources: z.array(z.string()),
	})
	.strict();
