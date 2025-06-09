// import { defaultLocale } from "../constants";
// import { env } from "@/lib/env";

type ParamKey = `[${string}]` | `[[...${string}]]` | (string & {});
type ParamValue = string | string[] | undefined;

export function buildUrl({
	pathname = "",
	query = {},
	params = {},
	baseUrl = "",
}: {
	pathname: string;
	query?: string | URLSearchParams | Record<string, string> | string[][] | undefined;
	params?: Record<ParamKey, ParamValue>;
	baseUrl?: string;
}) {
	// Handle dynamic Next.js params (e.g., "/posts/[id]" => "/posts/123")
	let constructedPath = pathname;

	// Handle all params including Next.js specific ones
	for (const [key, value] of Object.entries(params)) {
		if (value === undefined) continue;

		// Handle regular params [param]
		const paramPattern = new RegExp(`\\[${key}\\]`, "g");
		if (typeof value === "string") {
			constructedPath = constructedPath.replace(paramPattern, value);
		}

		// Handle [...param] (catch-all routes)
		const catchAllPattern = new RegExp(`\\[\\.\\.\\.${key}\\]`, "g");
		if (Array.isArray(value)) {
			constructedPath = constructedPath.replace(catchAllPattern, value.join("/"));
		} else if (typeof value === "string") {
			constructedPath = constructedPath.replace(catchAllPattern, value);
		}

		// Handle [[...param]] (optional catch-all routes)
		const optionalCatchAllPattern = new RegExp(`\\[\\[\\.\\.\\.${key}\\]\\]`, "g");
		if (Array.isArray(value)) {
			constructedPath = constructedPath.replace(
				optionalCatchAllPattern,
				value.length > 0 ? value.join("/") : "",
			);
		} else if (typeof value === "string") {
			constructedPath = constructedPath.replace(optionalCatchAllPattern, value);
		}
	}

	// Build the query string from the query object
	const queryString = new URLSearchParams(query).toString();

	// Combine the base URL, constructed path, and query string
	const fullUrl = baseUrl
		? `${baseUrl}${constructedPath}${queryString ? "?" + queryString : ""}`
		: `${constructedPath}${queryString ? "?" + queryString : ""}`;

	return fullUrl;
}

// Helper to parse path and extract country code and locale
export function parsePathname(
	pathname: string,
	config: {
		defaultLocale?: string;
		allowedLocales?: string[] | readonly string[];
		locale?: string;
	},
) {
	const segments = pathname.split("/").filter(Boolean);

	const defaultLocaleIndex = 0;

	let guessedLocale = segments[defaultLocaleIndex];
	let restPath = "";
	if (guessedLocale && config.allowedLocales?.includes(guessedLocale)) {
		guessedLocale ??= config.locale ?? config.defaultLocale;
		if (segments[defaultLocaleIndex + 1]) {
			restPath = `/${segments.slice(defaultLocaleIndex + 1).join("/")}`;
		}
	} else {
		guessedLocale = config.locale ?? config.defaultLocale;
		restPath = `/${segments.slice(defaultLocaleIndex).join("/")}`;
	}

	return {
		// countryCode: segments[0] ?? env.DEFAULT_REGION,
		// locale: segments[1] ?? config.defaultLocale,
		// locale: segments[0] ?? config.defaultLocale,
		// restPath: segments.slice(2).join("/"),
		locale: guessedLocale,
		restPath,
	};
}

// Get the complete pathname with country code and locale
export function getPathname(
	props: {
		path: string;
		countryCode?: string;
		locale?: string;
	},
	config: {
		defaultLocale?: string;
		allowedLocales?: string[] | readonly string[];
		locale?: string;
	},
) {
	const currentPath = typeof window !== "undefined" ? window.location.pathname : "";
	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
	} = parsePathname(currentPath, config);

	// const targetCountryCode = countryCode ?? currentCountryCode ?? env.DEFAULT_REGION;
	const targetLocale = props.locale ?? currentLocale;

	if (props.path.startsWith("/")) {
		// return `/${targetCountryCode}/${targetLocale}${path}`;
		return `/${targetLocale}${props.path}`;
	}

	// return `/${targetCountryCode}/${targetLocale}/${path}`;
	return `/${targetLocale}/${props.path}`;
}

export function normalizePath(props: {
	path: string;
	targetLocale: string;
	allowedLocales?: string[];
}) {
	if (props.path.startsWith("/")) {
		return `/${props.targetLocale}${props.path}`;
	}

	return `/${props.targetLocale}/${props.path}`;
}
