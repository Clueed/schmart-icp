// Ground truth specification
export interface GroundTruthKey {
	expectedValue: string;
	possibleValues: string[];
}

export interface GroundTruthObject {
	[key: string]: GroundTruthKey;
}

// Example ground truth for a company
export const createGroundTruth = (companyName: string): Record<string, GroundTruthObject> => ({
	[companyName]: {
		industry: {
			expectedValue: "Technology",
			possibleValues: ["Technology", "Finance", "Healthcare", "Retail", "Manufacturing", "Other"]
		},
		hqLocation: {
			expectedValue: "San Francisco, CA",
			possibleValues: ["San Francisco, CA", "New York, NY", "London, UK", "Berlin, Germany", "Other"]
		},
		employees: {
			expectedValue: "1000-5000",
			possibleValues: ["1-10", "11-50", "51-200", "201-1000", "1000-5000", "5000+"]
		}
	}
});