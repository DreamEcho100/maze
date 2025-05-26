// File: `constants.ts`

// Research constants
export const MAX_ITERATIONS = 3; // Maximum number of iterations
export const MAX_SEARCH_RESULTS = 5; // Maximum number of search results
export const MAX_CONTENT_CHARS = 20000; // Maximum number of characters in the content
export const MAX_RETRY_ATTEMPTS = 3; // It is the number of times the model will try to call LLMs if it fails
export const RETRY_DELAY_MS = 1000; // It is the delay in milliseconds between retries for the model to call LLMs

// https://openrouter.ai/models?context=1000000&fmt=cards&max_price=0&order=top-weekly&supported_parameters=structured_outputs
// Model names
export const MODELS = {
	PLANNING: "openrouter/quasar-alpha", // "google/gemini-2.5-pro-exp-03-25:free", // "openai/gpt-4o",
	EXTRACTION: "openrouter/quasar-alpha", // "google/gemini-2.5-pro-exp-03-25:free", // "openai/gpt-4o-mini",
	ANALYSIS: "openrouter/quasar-alpha", // "google/gemini-2.5-pro-exp-03-25:free", // "openai/gpt-4o",
	REPORT: "openrouter/quasar-alpha", // "anthropic/claude-3.7-sonnet:thinking"
};
