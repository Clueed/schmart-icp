export type CompanyInput = {
	name: string;
	domain?: string;
};

export type CompanyInputArray = Array<CompanyInput & Record<string, unknown>>;

/**
 * Web search engine type for OpenRouter plugin.
 * - "native": Uses the model provider's built-in web search (OpenAI, Anthropic, Perplexity, xAI)
 * - "exa": Uses Exa's search API
 * - undefined: Auto-select (native if available, otherwise Exa)
 */
export type WebSearchEngine = "native" | "exa" | undefined;

/**
 * Configuration for web search plugin in OpenRouter API calls.
 */
export interface WebSearchConfig {
	/** Whether to enable web search for this API call */
	enabled: boolean;
	/** Maximum number of search results (default: 5, costs $4 per 1000 results) */
	maxResults?: number;
	/** Search engine to use (native, exa, or auto) */
	engine?: WebSearchEngine;
	/** Custom prompt for attaching search results (optional) */
	searchPrompt?: string;
}

/**
 * Default web search configuration.
 */
export const DEFAULT_WEB_SEARCH_CONFIG: WebSearchConfig = {
	enabled: false,
	maxResults: 5,
	engine: undefined, // Auto-select
};
