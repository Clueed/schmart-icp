import type { KeyMappingConfig } from "./config.ts";
import type { CompanyInput } from "./types.ts";

/**
 * Normalizes a raw company input object (with potentially different key names)
 * to the standard CompanyInput format.
 * @param rawCompany - The raw company object from the JSON input
 * @param config - Key mapping configuration specifying which keys to read
 * @returns A normalized CompanyInput object with standard 'name' and 'domain' keys
 * @throws Error if the required name field is missing or empty
 */
export function normalizeCompanyInput(
	rawCompany: Record<string, unknown>,
	config: KeyMappingConfig,
): CompanyInput {
	const nameValue = rawCompany[config.nameKey];
	const domainValue = rawCompany[config.domainKey];

	if (nameValue === null || nameValue === undefined) {
		throw new Error(
			`Missing required field '${config.nameKey}' in company input`,
		);
	}

	const name = String(nameValue);
	if (name.trim() === "") {
		throw new Error(
			`Field '${config.nameKey}' cannot be empty in company input`,
		);
	}

	const domain =
		domainValue !== null && domainValue !== undefined
			? String(domainValue).trim() || undefined
			: undefined;

	return {
		name,
		domain,
	};
}
