/**
 * Configuration for mapping input file keys to internal field names.
 * This allows users to specify custom key names for company name and domain
 * when their JSON files use different field names.
 */

export interface KeyMappingConfig {
	/** Key name in input JSON file that contains the company name */
	nameKey: string;
	/** Key name in input JSON file that contains the company domain (optional) */
	domainKey: string;
}

/**
 * Default key mappings for backward compatibility.
 * When CLI flags are not provided, these defaults are used.
 */
export const DEFAULT_KEY_MAPPING: KeyMappingConfig = {
	nameKey: "name",
	domainKey: "domain",
};

/**
 * Creates a KeyMappingConfig with defaults for any unspecified keys.
 * @param partialConfig - Partial configuration (values may be undefined)
 * @returns Complete KeyMappingConfig with defaults filled in
 */
export function createKeyMappingConfig(
	partialConfig: Partial<KeyMappingConfig>,
): KeyMappingConfig {
	return {
		nameKey: partialConfig.nameKey ?? DEFAULT_KEY_MAPPING.nameKey,
		domainKey: partialConfig.domainKey ?? DEFAULT_KEY_MAPPING.domainKey,
	};
}
