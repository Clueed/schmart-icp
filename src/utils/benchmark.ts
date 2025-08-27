// Benchmarking utilities
export const compareResult = (predictedValue: string, expectedValue: string): boolean => {
	return predictedValue.toLowerCase() === expectedValue.toLowerCase();
};

export const calculateAccuracy = (results: {match: boolean}[]): {total: number, matches: number, percentage: number} => {
	const total = results.length;
	const matches = results.filter(r => r.match).length;
	const percentage = total > 0 ? (matches/total) * 100 : 0;
	
	return {
		total,
		matches,
		percentage
	};
};