import { useI18n } from "@de100/i18n-solidjs";
import { useLocation, useNavigate } from "@solidjs/router";
import { createMemo } from "solid-js";
import { parsePathname } from "#utils";

interface NavigateOptions {
	replace?: boolean;
	resolve?: boolean;
	scroll?: boolean;
	state?: any;
}

// Custom useRouter hook that maintains locale
export function useRouter() {
	const navigate = useNavigate();
	const location = useLocation();

	const { defaultLocale, allowedLocales } = useI18n();

	const currentLocale = createMemo(() => {
		const { locale } = parsePathname(location.pathname, {
			defaultLocale: defaultLocale(),
			allowedLocales: allowedLocales(),
		});
		return locale;
	});

	return {
		// Navigation methods
		push: (
			href: string,
			options: NavigateOptions & {
				locale?: string;
			} = {},
		) => {
			const { locale, ...navigateOptions } = options;

			if (href.startsWith("http") || /^\/[a-z]{2}($|\/)/i.exec(href)) {
				return navigate(href, navigateOptions);
			}

			const selectedLocale = locale ?? currentLocale() ?? defaultLocale();

			if (href.startsWith("/")) {
				return navigate(`/${selectedLocale}${href}`, navigateOptions);
			}

			// Handle relative paths
			const { restPath } = parsePathname(location.pathname, {
				defaultLocale: defaultLocale(),
				allowedLocales: allowedLocales(),
			});

			const basePath = restPath ? `/${restPath}` : "";
			let fullPath = `/${selectedLocale}${basePath}/${href}`;

			// Clean up any double slashes
			fullPath = fullPath.replace(/\/+/g, "/");

			return navigate(fullPath, navigateOptions);
		},

		replace: (
			href: string,
			options: NavigateOptions & {
				locale?: string;
			} = {},
		) => {
			const { locale, ...navigateOptions } = options;

			if (href.startsWith("http") || /^\/[a-z]{2}($|\/)/i.exec(href)) {
				return navigate(href, { ...navigateOptions, replace: true });
			}

			const selectedLocale = locale ?? currentLocale() ?? defaultLocale();

			if (href.startsWith("/")) {
				return navigate(`/${selectedLocale}${href}`, { ...navigateOptions, replace: true });
			}

			const { restPath } = parsePathname(location.pathname, {
				defaultLocale: defaultLocale(),
				allowedLocales: allowedLocales(),
			});

			const basePath = restPath ? `/${restPath}` : "";
			let fullPath = `/${selectedLocale}${basePath}/${href}`;

			fullPath = fullPath.replace(/\/+/g, "/");

			return navigate(fullPath, { ...navigateOptions, replace: true });
		},

		back: () => history.back(),
		forward: () => history.forward(),
		go: (delta: number) => history.go(delta),

		// State getters
		get pathname() {
			return location.pathname;
		},
		get search() {
			return location.search;
		},
		get hash() {
			return location.hash;
		},
		get state() {
			return location.state;
		},
	};
}

// Custom usePathname that returns path without locale
export function usePathname() {
	const location = useLocation();
	const { defaultLocale, allowedLocales } = useI18n();

	return createMemo(() => {
		const { restPath } = parsePathname(location.pathname, {
			defaultLocale: defaultLocale(),
			allowedLocales: allowedLocales(),
		});
		return `/${restPath || ""}`.replace(/\/+/g, "/");
	});
}

// Get current locale from URL
export function useGetLocale() {
	const location = useLocation();
	const { defaultLocale, allowedLocales } = useI18n();

	return createMemo(() => {
		const { locale } = parsePathname(location.pathname, {
			defaultLocale: defaultLocale(),
			allowedLocales: allowedLocales(),
		});
		return locale ?? defaultLocale();
	});
}

// Get search params
export function useSearchParams() {
	const location = useLocation();

	return createMemo(() => {
		return new URLSearchParams(location.search);
	});
}
