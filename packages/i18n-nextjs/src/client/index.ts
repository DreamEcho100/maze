"use client";

import type { NavigateOptions } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { usePathname as useNextPathname, useRouter as useNextRouter } from "next/navigation";

import { useI18n } from "@de100/i18n-reactjs";

import { parsePathname } from "#utils";

// import { parsePathname } from ".";

// import { defaultCountryCode, defaultLocale } from "../constants";

// Custom useRouter hook that maintains country code and locale
export function useRouter() {
	const nextRouter = useNextRouter();
	const pathname = useNextPathname();

	const { defaultLocale, allowedLocales } = useI18n();
	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
	} = parsePathname(pathname, {
		defaultLocale,
		allowedLocales,
	});

	return {
		...nextRouter,
		// Override push to maintain country code and locale
		push: (
			href: string,
			{
				locale,
				// countryCode,
				...options
			}: NavigateOptions & {
				locale?: string;
				// countryCode?: string;
			} = {},
		) => {
			const { defaultLocale, allowedLocales } = useI18n();

			if (href.startsWith("http") || /^\/[a-z]{2}\/[a-z]{2}($|\/)/i.exec(href)) {
				return nextRouter.push(href, options);
			}

			// const selectedCountryCode = countryCode || currentCountryCode;
			const selectedLocale = locale ?? currentLocale;

			if (href.startsWith("/")) {
				// return nextRouter.push(`/${selectedCountryCode}/${selectedLocale}${href}`, options);
				return nextRouter.push(`/${selectedLocale}${href}`, options);
			}

			// Handle relative paths
			const { restPath } = parsePathname(pathname, { defaultLocale, allowedLocales });

			const basePath = restPath ? `/${restPath}` : "";
			// let fullPath = `/${selectedCountryCode}/${selectedLocale}${basePath}/${href}`;
			let fullPath = `/${selectedLocale}${basePath}/${href}`;

			// Clean up any double slashes
			fullPath = fullPath.replace(/\/+/g, "/");

			return nextRouter.push(fullPath, options);
		},
		// Override replace to maintain country code and locale (similar logic to push)
		replace: (
			href: string,
			{
				locale,
				// countryCode,
				...options
			}: NavigateOptions & {
				locale?: string;
				// countryCode?: string;
			} = {},
		) => {
			const { defaultLocale, allowedLocales } = useI18n();

			if (href.startsWith("http") || /^\/[a-z]{2}\/[a-z]{2}($|\/)/i.exec(href)) {
				return nextRouter.replace(href, options);
			}

			// const selectedCountryCode = countryCode ?? currentCountryCode;
			const selectedLocale = locale ?? currentLocale;

			if (href.startsWith("/")) {
				// return nextRouter.replace(`/${selectedCountryCode}/${selectedLocale}${href}`, options);
				return nextRouter.replace(`/${selectedLocale}${href}`, options);
			}

			const { restPath } = parsePathname(pathname, { defaultLocale, allowedLocales });
			const basePath = restPath ? `/${restPath}` : "";
			// let fullPath = `/${selectedCountryCode}/${selectedLocale}${basePath}/${href}`;
			let fullPath = `/${selectedLocale}${basePath}/${href}`;

			fullPath = fullPath.replace(/\/+/g, "/");

			return nextRouter.replace(fullPath, options);
		},
	};
}

// Custom usePathname that returns path without country code and locale
export function usePathname() {
	const fullPath = useNextPathname();
	const { defaultLocale, allowedLocales } = useI18n();
	const { restPath } = parsePathname(fullPath, { defaultLocale, allowedLocales });

	return `/${restPath}`;
}

// export function useGetCountryCode() {
// 	const params = useParams();
// 	const countryCode = params.countryCode ?? defaultCountryCode;

// 	return typeof countryCode !== "string" ? defaultCountryCode : countryCode;
// }

// export function useGetLocale() {
// 	const params = useParams();
// 	const locale = params.locale ?? defaultLocale;

// 	return typeof locale !== "string" ? defaultLocale : locale;
// }
