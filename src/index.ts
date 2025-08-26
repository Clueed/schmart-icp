import "dotenv/config";
import OpenAI from "openai";

const openai = new OpenAI({
	apiKey: process.env.OPENAI_API_KEY,
});

const EAM_PROMPT = (company: string) =>
	`You are a research assistant. Find out which Enterprise Architecture Management (EAM) tool this company uses—choices include LeanIX, Ardoq, Alfabet, ADOIT, ArchiMate, LUY, Bee360, and others. Use real-time web search to locate the information, cite your sources, and reply concisely. If you can't find the information, say so clearly.
  `.trim();

const response = await openai.responses.create({
	model: "gpt-5",
	input: "Tell me a three sentence bedtime story about a unicorn.",
});

console.log(response);
