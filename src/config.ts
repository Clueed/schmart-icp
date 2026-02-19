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

/**
 * Configuration for web search functionality.
 */
export interface WebSearchOptions {
	/** Whether to enable web search for API calls */
	enabled: boolean;
	/** Maximum number of search results to return */
	maxResults?: number;
	/** Search engine to use (native, exa, or undefined for auto) */
	engine?: "native" | "exa";
}

/**
 * Default web search options.
 */
export const DEFAULT_WEB_SEARCH_OPTIONS: WebSearchOptions = {
	enabled: false,
	maxResults: 5,
	engine: undefined,
};

/**
 * Creates a WebSearchOptions with defaults for any unspecified keys.
 * @param partialOptions - Partial web search options
 * @returns Complete WebSearchOptions with defaults filled in
 */
export function createWebSearchOptions(
	partialOptions: Partial<WebSearchOptions>,
): WebSearchOptions {
	return {
		enabled: partialOptions.enabled ?? DEFAULT_WEB_SEARCH_OPTIONS.enabled,
		maxResults:
			partialOptions.maxResults ?? DEFAULT_WEB_SEARCH_OPTIONS.maxResults,
		engine: partialOptions.engine ?? DEFAULT_WEB_SEARCH_OPTIONS.engine,
	};
}

/**
 * Extended app configuration that includes web search options.
 */
export interface AppConfig extends KeyMappingConfig {
	webSearch?: WebSearchOptions;
}

/**
 * Creates an AppConfig with web search options included.
 * @param keyMappingConfig - Key mapping configuration
 * @param webSearchOptions - Optional web search configuration
 * @returns Complete AppConfig
 */
export function createAppConfig(
	keyMappingConfig: KeyMappingConfig,
	webSearchOptions?: WebSearchOptions,
): AppConfig {
	return {
		...keyMappingConfig,
		webSearch: webSearchOptions,
	};
}
