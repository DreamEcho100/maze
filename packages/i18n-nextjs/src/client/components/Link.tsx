"use client";

// import type { ReactNode } from "react";
import { useMemo } from "react";
import NextLink from "next/link";
import { usePathname as useNextPathname } from "next/navigation";

// import { env } from "@/lib/env";

import { useI18n } from "@de100/i18n-reactjs";

import { parsePathname } from "#utils";

// import { parsePathname } from "../utils";
// import { defaultLocale } from "../constants";

type NextLinkProps = React.ComponentProps<typeof NextLink>;

// Custom Link component that maintains country code and locale
export function Link({
	href,
	// countryCode,
	locale,
	...props
}: NextLinkProps & {
	href: string;
	// countryCode?: string;
	locale?: string;
}) {
	const pathname = useNextPathname();
	const { defaultLocale, allowedLocales } = useI18n();
	const {
		// countryCode: currentCountryCode,
		locale: currentLocale,
	} = parsePathname(pathname, { defaultLocale, allowedLocales });
	const LINK_TYPE: "absolute|external" | "country&locale" | "relative" = useMemo(() => {
		// If href is already absolute or external, pass it through
		if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
			return "absolute|external";
		}

		// If href already starts with country and locale, pass it through
		if (/^\/[a-z]{2}\/[a-z]{2}($|\/)/i.exec(href)) {
			return "country&locale";
		}

		return "relative";
	}, [pathname]);

	if (LINK_TYPE === "absolute|external") {
		return <NextLink href={href} {...props} />;
	}

	if (LINK_TYPE === "country&locale") {
		return <NextLink href={href} {...props} />;
	}

	// Determine which country code and locale to use
	// const targetCountryCode = countryCode ?? currentCountryCode ?? env.DEFAULT_REGION;
	const targetLocale = locale ?? currentLocale ?? defaultLocale;

	// If href starts with a slash, it's an absolute path
	if (href.startsWith("/")) {
		// return <NextLink href={`/${targetCountryCode}/${targetLocale}${href}`} {...props} />;
		return <NextLink href={`/${targetLocale}${href}`} {...props} />;
	}

	return (
		<RelativePathsLink
			href={href}
			pathname={pathname}
			// targetCountryCode={targetCountryCode}
			targetLocale={targetLocale}
			{...props}
		/>
	);
}

function RelativePathsLink({
	href,
	pathname,
	// targetCountryCode,
	targetLocale,

	...props
}: NextLinkProps & {
	href: string;
	pathname: string;
	// targetCountryCode: string;
	targetLocale: string;
}) {
	const fullPath = useMemo(() => {
		const { defaultLocale, allowedLocales } = useI18n();
		// For relative paths, need current path context
		const { restPath } = parsePathname(pathname, { defaultLocale, allowedLocales });

		// Build complete URL
		// let fullPath = `/${targetCountryCode}/${targetLocale}`;
		let fullPath = `/${targetLocale}`;
		if (restPath) {
			fullPath += `/${restPath}`;
		}
		if (href && href !== ".") {
			// Handle relative paths properly
			if (href.startsWith("./")) {
				fullPath += `/${href.slice(2)}`;
			} else if (href.startsWith("../")) {
				// Handle parent directory references
				const segments = restPath.split("/");
				if (segments.length > 0) {
					segments.pop();
				}
				// fullPath = `/${targetCountryCode}/${targetLocale}/${segments.join("/")}`;
				fullPath = `/${targetLocale}/${segments.join("/")}`;
				const remainingPath = href.replace(/^\.\.\//, "");
				if (remainingPath) {
					fullPath += `/${remainingPath}`;
				}
			} else {
				fullPath += `/${href}`;
			}
		}
		return fullPath;
	}, [pathname]);

	return <NextLink href={fullPath} {...props} />;
}
