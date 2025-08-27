// Prompt creation utility
export const createPrompt = (companyName: string, key: string, possibleValues: string[]): string => {
	return `You are a research assistant. For the company "${companyName}", determine their ${key}. 
The possible values are: ${possibleValues.join(", ")}.
Use real-time web search to locate the information, cite your sources, and reply with only the value, a certainty score (0-1), and a brief explanation. Format your response as:
Value: [value]
Certainty Score: [score]
Explanation: [brief explanation]
Sources: [comma-separated URLs]`;
};