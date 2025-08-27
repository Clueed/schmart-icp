// Response parsing utility
export interface APIResponse {
	value: string;
	certaintyScore: number;
	explanation: string;
	sources: string[];
}

export const parseAPIResponse = (responseText: string): APIResponse => {
	// Parse response
	const valueMatch = responseText.match(/Value:\s*(.+)/i);
	const scoreMatch = responseText.match(/Certainty Score:\s*([\d.]+)/i);
	const explanationMatch = responseText.match(/Explanation:\s*(.+)/i);
	const sourcesMatch = responseText.match(/Sources:\s*(.+)/i);
	
	return {
		value: valueMatch ? valueMatch[1].trim() : "Unknown",
		certaintyScore: scoreMatch ? parseFloat(scoreMatch[1]) : 0,
		explanation: explanationMatch ? explanationMatch[1].trim() : "No explanation provided",
		sources: sourcesMatch ? sourcesMatch[1].split(",").map(s => s.trim()) : []
	};
};