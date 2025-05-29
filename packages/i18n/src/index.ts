export const name = "i18n";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TObj = Record<string, any>;

/**
 * Configuration options for different parameter types in translations
 * Each parameter type (date, number, plural, etc.) can have specific formatting options
 */
interface ParamOptions {
	date?: Record<string, Intl.DateTimeFormatOptions>;
	number?: Record<string, Intl.NumberFormatOptions>;
	plural?: Record<
		string,
		Partial<Record<Exclude<Intl.LDMLPluralRule, "other">, string>> & {
			other: string;
			formatter?: Intl.NumberFormatOptions;
			type?: Intl.PluralRuleType;
		}
	>;
	enum?: Record<string, Record<string, string>>;
	list?: Record<string, Intl.ListFormatOptions>;
	relativeTime?: Record<string, Intl.RelativeTimeFormatOptions>;
}

/**
 * Helper type for defining translations with their parameters
 * Returns a tuple of [translation string, parameter options]
 */
type DefineTranslation<TranslationKey extends string, TranslationOptions extends ParamOptions> = (
	string: TranslationKey,
	options: TranslationOptions,
) => [TranslationKey, TranslationOptions];

/**
 * A translation message can be either a simple string or a defined translation with parameters
 */
type I18nMessage = string | ReturnType<DefineTranslation<string, ParamOptions>>;

/**
 * Structure for language message files - nested object with string keys
 * Values can be translation messages or nested message objects
 */
interface LanguageMessages {
	[key: string]: I18nMessage | LanguageMessages;
}

/**
 * Module augmentation interface for registering translation types
 * Users can extend this to get type safety for their specific translations
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface Register {}

/**
 * Extract registered translations from the Register interface
 * Falls back to generic LanguageMessages if no specific translations are registered
 */
type RegisteredTranslations = Register extends { translations: infer T }
	? T extends infer Translations
		? Translations
		: never
	: LanguageMessages;

/**
 * Utility type to join two string keys with a dot
 * Used for creating nested translation key paths like "user.profile.name"
 */
type Join<Key, Part> = Key extends string
	? Part extends string
		? `${Key}.${Part}`
		: never
	: never;

/**
 * Parse parameter type definitions and return the corresponding TypeScript interface
 * Each parameter type has specific requirements for the options object
 */
type ParseOptionType<
	ParamType extends string,
	ParamName extends string,
> = ParamType extends "number"
	? { number?: Partial<Record<ParamName, Intl.NumberFormatOptions>> }
	: ParamType extends "plural"
		? {
				plural: Record<
					ParamName,
					Partial<Record<Exclude<Intl.LDMLPluralRule, "other">, string>> & {
						other: string;
						formatter?: Intl.NumberFormatOptions;
						type?: Intl.PluralRuleType;
					}
				>;
			}
		: ParamType extends "date"
			? { date?: Partial<Record<ParamName, Intl.DateTimeFormatOptions>> }
			: ParamType extends "list"
				? { list?: Partial<Record<ParamName, Intl.ListFormatOptions>> }
				: ParamType extends "enum"
					? { enum: Record<ParamName, Record<string, string>> }
					: ParamType extends "relativeTime"
						? { relativeTime?: Partial<Record<ParamName, Intl.RelativeTimeFormatOptions>> }
						: never;

/**
 * Extract parameter options from a translation string by parsing {param:type} patterns
 * Recursively processes the string to find all parameters and their types
 */
type ExtractParamOptions<S extends string> = S extends `${string}{${infer Param}}${infer Rest}`
	? Param extends `${infer Name}:${infer Type}` // If the parameter has a type specification
		? ParseOptionType<Type, Name> & ExtractParamOptions<Rest> // Parse the type and continue with the rest
		: ExtractParamOptions<Rest> // Skip parameters without types and continue
	: unknown; // Base case: no more parameters found

/**
 * Generate all possible dot-notation paths for accessing nested translation objects
 * Recursively traverses the translation structure to create paths like "user.profile.name"
 */
type DotPathsFor<TranslationRegistry extends TObj = RegisteredTranslations> = {
	[Key in keyof TranslationRegistry]: TranslationRegistry[Key] extends I18nMessage
		? Key // If it's a translation message, use the key as-is
		: TranslationRegistry[Key] extends TObj
			? Join<Key, DotPathsFor<TranslationRegistry[Key]>> // If it's nested, join with child paths
			: never;
}[keyof TranslationRegistry];

/**
 * Map for enum parameter types - used for type-safe enum value validation
 */
type EnumMap = Record<string, Record<string, string>>;

/**
 * Parse the expected argument type for a parameter based on its type specification
 * Returns the TypeScript type that should be passed for each parameter type
 */
type ParseArgType<
	ParamType extends string,
	ParamName extends string,
	Enums extends EnumMap,
> = ParamType extends "number" | "plural"
	? number
	: ParamType extends "date"
		? Date
		: ParamType extends "list"
			? string[]
			: ParamType extends "relativeTime"
				? { value: number; unit: Intl.RelativeTimeFormatUnit }
				: ParamType extends "enum"
					? ParamName extends keyof Enums
						? keyof Enums[ParamName]
						: never
					: never;

/**
 * Extract all parameter arguments required for a translation string
 * Creates a record type with parameter names as keys and their expected types as values
 */
type ExtractParamArgs<
	S extends string,
	Enums extends EnumMap,
> = S extends `${string}{${infer Param}}${infer Rest}`
	? Param extends `${infer Name}:${infer Type}` // Parameter with type specification
		? Record<Name, ParseArgType<Type, Name, Enums>> & ExtractParamArgs<Rest, Enums>
		: Record<Param, string> & ExtractParamArgs<Rest, Enums> // Parameter without type (defaults to string)
	: unknown; // No more parameters

/**
 * Navigate through nested translation objects using dot-notation paths
 * Returns the translation value at the specified path
 */
type TranslationAtKeyWithParams<
	Translations,
	Key extends string,
> = Key extends `${infer First}.${infer Rest}`
	? First extends keyof Translations
		? TranslationAtKeyWithParams<Translations[First], Rest> // Continue navigation
		: never
	: Key extends keyof Translations
		? Translations[Key] // Found the final key
		: never;

/**
 * Normalize translation values to a consistent tuple format
 * Converts simple strings to [string, {}] format for uniform processing
 */
type NormalizedTranslationAtKey<T> =
	T extends ReturnType<typeof defineTranslation>
		? T
		: [T extends string ? T : never, ReturnType<typeof defineTranslation>[1]];

/**
 * Get normalized translation at a specific key path
 */
type NormalizedTranslationAtKeyWithParams<Key extends string> = NormalizedTranslationAtKey<
	TranslationAtKeyWithParams<RegisteredTranslations, Key>
>;

/**
 * Extract parameter types for a specific translation path
 * Used to enforce type safety when calling translation functions
 */
type Params<S extends DotPathsFor> = ExtractParamArgs<
	NormalizedTranslationAtKeyWithParams<S>[0],
	NormalizedTranslationAtKeyWithParams<S>[1] extends {
		enum: infer E;
	}
		? keyof E extends never
			? EnumMap
			: E
		: EnumMap
>;

/**
 * Translation paths that don't require any parameters
 */
type PathsWithNoParams = {
	[K in DotPathsFor]: keyof Params<K> extends never ? K : never;
}[DotPathsFor];

/**
 * Translation paths that require parameters
 */
type PathsWithParams = {
	[K in DotPathsFor]: keyof Params<K> extends never ? never : K;
}[DotPathsFor];

/**
 * Define a translation with its parameter options
 * This function provides type safety for translation definitions
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
function defineTranslation<
	TranslationKey extends string,
	TranslationOptions extends ExtractParamOptions<TranslationKey>,
>(string: TranslationKey, options: TranslationOptions): [TranslationKey, TranslationOptions] {
	return [string, options];
}

/**
 * Error class for i18n-related errors with enhanced debugging information
 */
class I18nError extends Error {
	constructor(
		message: string,
		public readonly locale: string,
		public readonly key?: string,
		public readonly argKey?: string,
	) {
		super(
			`[i18n] ${message} (locale: ${locale}${key ? `, key: ${key}` : ""}${argKey ? `, arg: ${argKey}` : ""})`,
		);
		this.name = "I18nError";
	}
}

/**
 * Cache for storing formatted instances to avoid recreation
 * Key format: "locale-type-optionsHash"
 */
const formatterCache = new Map<
	string,
	Intl.NumberFormat | Intl.DateTimeFormat | Intl.ListFormat | Intl.RelativeTimeFormat
>();

/**
 * Create a cache key for formatter instances
 */
function createCacheKey(locale: string, type: string, options?: object): string {
	const optionsHash = options ? JSON.stringify(options) : "";
	return `${locale}-${type}-${optionsHash}`;
}

/**
 * Get or create a cached NumberFormat instance
 */
function getNumberFormatter(locale: string, options?: Intl.NumberFormatOptions): Intl.NumberFormat {
	const key = createCacheKey(locale, "number", options);
	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.NumberFormat(locale, options));
	}
	return formatterCache.get(key) as Intl.NumberFormat;
}

/**
 * Get or create a cached DateTimeFormat instance
 */
function getDateTimeFormatter(
	locale: string,
	options?: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
	const key = createCacheKey(locale, "date", options);
	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.DateTimeFormat(locale, options));
	}
	return formatterCache.get(key) as Intl.DateTimeFormat;
}

/**
 * Get or create a cached ListFormat instance
 */
function getListFormatter(locale: string, options?: Intl.ListFormatOptions): Intl.ListFormat {
	const key = createCacheKey(locale, "list", options);
	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.ListFormat(locale, options));
	}
	return formatterCache.get(key) as Intl.ListFormat;
}

/**
 * Get or create a cached RelativeTimeFormat instance
 */
function getRelativeTimeFormatter(
	locale: string,
	options?: Intl.RelativeTimeFormatOptions,
): Intl.RelativeTimeFormat {
	const key = createCacheKey(locale, "relativeTime", options);
	if (!formatterCache.has(key)) {
		formatterCache.set(key, new Intl.RelativeTimeFormat(locale, options));
	}
	return formatterCache.get(key) as Intl.RelativeTimeFormat;
}

/**
 * Get or create a cached PluralRules instance
 */
const pluralRulesCache = new Map<string, Intl.PluralRules>();
function getPluralRules(locale: string, type?: Intl.PluralRuleType): Intl.PluralRules {
	const key = `${locale}-${type ?? "cardinal"}`;
	if (!pluralRulesCache.has(key)) {
		pluralRulesCache.set(key, new Intl.PluralRules(locale, { type }));
	}
	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
	return pluralRulesCache.get(key)!;
}

/**
 * Pre-compiled regex patterns for better performance
 */
const PARAM_REGEX = /\{([^:}]+)(?::([^}]*))?\}/g;

/**
 * Initialize the i18n system with locale configuration and translations
 */
export function initI18n({
	locale,
	fallbackLocale,
	translations,
	onError,
}: {
	locale: string;
	fallbackLocale: string | string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
	onError?: (error: I18nError) => void;
}) {
	// Convert fallback locale to array for uniform processing
	const fallbackLocales = Array.isArray(fallbackLocale) ? fallbackLocale : [fallbackLocale];

	// Create ordered list of locales to try (current locale + parents + fallbacks)
	const orderedLocales = new Set([
		...getOrderedLocaleAndParentLocales(locale),
		...fallbackLocales.flatMap(getOrderedLocaleAndParentLocales),
	]);

	/**
	 * Translation function overloads:
	 * - For keys without parameters: t(key) => string
	 * - For keys with parameters: t(key, args) => string
	 */
	function t<S extends PathsWithNoParams>(key: S): string;
	function t<S extends PathsWithParams, A extends Params<S>>(key: S, args: A): string;
	function t<S extends DotPathsFor, A extends Params<S>>(key: S, args?: A) {
		// Try each locale in order until we find a translation
		for (const locale of orderedLocales) {
			const translationFile = translations[locale.toLowerCase() as Lowercase<string>];
			if (translationFile == null) continue;

			try {
				const translation = getTranslation(locale, translationFile, key, args);
				if (translation) return translation;
			} catch (error) {
				// Log error but continue trying other locales
				if (onError && error instanceof I18nError) {
					onError(error);
				}
			}
		}

		// Return the key as fallback if no translation found
		return key;
	}

	return {
		t,
		// Expose current locale for external use
		locale,
		// Method to clear formatter cache if needed
		clearCache: () => {
			formatterCache.clear();
			pluralRulesCache.clear();
		},
	};
}

/**
 * Generate ordered list of locale and its parent locales
 * Example: "en-US-CA" => ["en-US-CA", "en-US", "en"]
 */
function getOrderedLocaleAndParentLocales(locale: string) {
	const locales = [];
	let parentLocale = locale;
	while (parentLocale !== "") {
		locales.push(parentLocale);
		// Remove the last segment after hyphen to get parent locale
		parentLocale = parentLocale.replace(/-?[^-]+$/, "");
	}
	return locales;
}

/**
 * Get and process a translation for a specific key and arguments
 */
function getTranslation<S extends DotPathsFor, A extends Params<S>>(
	locale: string,
	translations: LanguageMessages,
	key: S,
	args?: A,
) {
	// Find the translation value by key path
	const translation = getTranslationByKey(translations, key);
	const argObj = args ?? {};

	// Process simple string translations
	if (typeof translation === "string") {
		return performSubstitution(locale, translation, argObj, {}, key);
	}

	// Process defined translations with parameter options
	if (Array.isArray(translation)) {
		const [str, translationParams] = translation;
		return performSubstitution(locale, str, argObj, translationParams, key);
	}

	return undefined;
}

/**
 * Navigate through nested translation object using dot-notation key
 * Example: getTranslationByKey(obj, "user.profile.name")
 */
function getTranslationByKey(obj: LanguageMessages, key: string) {
	const keys = key.split(".");
	let currentObj = obj;

	// Navigate through each key segment
	for (let i = 0; i <= keys.length - 1; i++) {
		const k = keys[i];
		const newObj = currentObj[k as keyof typeof currentObj];

		// Return undefined if key doesn't exist
		if (newObj == null) return undefined;

		// If we found a translation message and we're at the end of the path
		if (typeof newObj === "string" || Array.isArray(newObj)) {
			if (i < keys.length - 1) return undefined; // Path continues but we hit a leaf
			return newObj;
		}

		// Continue navigation for nested objects
		currentObj = newObj;
	}

	return undefined;
}

/**
 * Perform parameter substitution in translation strings
 * Handles all parameter types: plural, enum, number, list, date, relativeTime
 */
function performSubstitution(
	locale: string,
	str: string,
	args: Record<string, unknown>,
	translationParams: ParamOptions,
	key: string,
): string {
	return Object.entries(args).reduce((result, [argKey, argValue]) => {
		try {
			// Use pre-compiled regex to find parameter pattern
			const match = new RegExp(`\\{${argKey}:?([^}]*)?\\}`).exec(result);
			// const match = result.match(new RegExp(`\\{${argKey}:?([^}]*)?\\}`));
			const [replaceKey, argType] = match ?? [`{${argKey}}`, undefined];

			switch (argType) {
				case "plural": {
					if (typeof argValue !== "number") {
						throw new I18nError(
							`Expected number for plural parameter '${argKey}', got ${typeof argValue}`,
							locale,
							key,
							argKey,
						);
					}

					const pluralMap = translationParams.plural?.[argKey];
					if (!pluralMap) {
						throw new I18nError(
							`Missing plural configuration for parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					const pluralRules = getPluralRules(locale, pluralMap.type);
					const replacement = pluralMap[pluralRules.select(argValue)] ?? pluralMap.other;

					// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
					if (replacement == null) {
						throw new I18nError(
							`Missing plural replacement for parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					const numberFormatter = getNumberFormatter(locale, pluralMap.formatter);
					return result.replace(
						replaceKey,
						replacement.replace(`{?}`, numberFormatter.format(argValue)),
					);
				}

				case "enum": {
					if (typeof argValue !== "string") {
						throw new I18nError(
							`Expected string for enum parameter '${argKey}', got ${typeof argValue}`,
							locale,
							key,
							argKey,
						);
					}

					const enumMap = translationParams.enum?.[argKey];
					if (!enumMap) {
						throw new I18nError(
							`Missing enum configuration for parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					const replacement = enumMap[argValue];
					if (replacement == null) {
						throw new I18nError(
							`Missing enum value '${argValue}' for parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					return result.replace(replaceKey, replacement);
				}

				case "number": {
					if (typeof argValue !== "number") {
						throw new I18nError(
							`Expected number for number parameter '${argKey}', got ${typeof argValue}`,
							locale,
							key,
							argKey,
						);
					}

					const numberFormatter = getNumberFormatter(locale, translationParams.number?.[argKey]);
					return result.replace(replaceKey, numberFormatter.format(argValue));
				}

				case "list": {
					if (!Array.isArray(argValue)) {
						throw new I18nError(
							`Expected array for list parameter '${argKey}', got ${typeof argValue}`,
							locale,
							key,
							argKey,
						);
					}

					const listFormatter = getListFormatter(locale, translationParams.list?.[argKey]);
					return result.replace(replaceKey, listFormatter.format(argValue));
				}

				case "date": {
					if (!(argValue instanceof Date)) {
						throw new I18nError(
							`Expected Date for date parameter '${argKey}', got ${typeof argValue}`,
							locale,
							key,
							argKey,
						);
					}

					const dateFormatter = getDateTimeFormatter(locale, translationParams.date?.[argKey]);
					return result.replace(replaceKey, dateFormatter.format(argValue));
				}

				case "relativeTime": {
					if (
						typeof argValue !== "object" ||
						argValue === null ||
						!("value" in argValue) ||
						!("unit" in argValue)
					) {
						throw new I18nError(
							`Expected {value: number, unit: string} for relativeTime parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					const { value, unit } = argValue as { value: number; unit: Intl.RelativeTimeFormatUnit };
					if (typeof value !== "number" || typeof unit !== "string") {
						throw new I18nError(
							`Invalid relativeTime format for parameter '${argKey}'`,
							locale,
							key,
							argKey,
						);
					}

					const relativeTimeFormatter = getRelativeTimeFormatter(
						locale,
						translationParams.relativeTime?.[argKey],
					);
					return result.replace(replaceKey, relativeTimeFormatter.format(value, unit));
				}

				default:
					// Default to string conversion for untyped parameters
					return result.replace(replaceKey, String(argValue));
			}
		} catch (error) {
			// Re-throw I18nError, wrap other errors
			if (error instanceof I18nError) {
				throw error;
			}
			throw new I18nError(`Failed to process parameter '${argKey}': ${error}`, locale, key, argKey);
		}
	}, str);
}
