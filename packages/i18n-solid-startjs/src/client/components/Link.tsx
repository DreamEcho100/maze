import { useI18n } from "@de100/i18n-solidjs";
import { A, useLocation } from "@solidjs/router";
import type { ComponentProps } from "solid-js";
import { createMemo } from "solid-js";
import { setCookie } from "vinxi/http";
import { parsePathname } from "#utils";

type LinkProps = ComponentProps<typeof A>;

// Custom Link component that maintains locale
export function Link(
	props: LinkProps & {
		href: string;
		locale?: string;
	},
) {
	const location = useLocation();
	const { defaultLocale, allowedLocales } = useI18n();

	const currentLocale = createMemo(() => {
		const { locale } = parsePathname(location.pathname, {
			defaultLocale: defaultLocale(),
			allowedLocales: allowedLocales(),
		});
		return locale;
	});

	const linkType = createMemo(() => {
		const href = props.href;
		// If href is already absolute or external, pass it through
		if (href.startsWith("http") || href.startsWith("mailto:") || href.startsWith("tel:")) {
			return "absolute|external";
		}

		// If href already starts with locale, pass it through
		if (/^\/[a-z]{2}($|\/)/i.exec(href)) {
			return "locale";
		}

		return "relative";
	});

	const computedHref = createMemo(() => {
		if (linkType() === "absolute|external" || linkType() === "locale") {
			return {
				href: props.href,
				targetLocale: currentLocale(),
			};
		}

		// Determine which locale to use
		const targetLocale = props.locale ?? currentLocale() ?? defaultLocale();

		// If href starts with a slash, it's an absolute path
		if (props.href.startsWith("/")) {
			return {
				href: `/${targetLocale}${props.href}`,
				targetLocale,
			};
		}

		// Handle relative paths
		const { restPath } = parsePathname(location.pathname, {
			defaultLocale: defaultLocale(),
			allowedLocales: allowedLocales(),
		});

		let fullPath = `/${targetLocale}`;
		if (restPath) {
			fullPath += `/${restPath}`;
		}

		if (props.href && props.href !== ".") {
			// Handle relative paths properly
			if (props.href.startsWith("./")) {
				fullPath += `/${props.href.slice(2)}`;
			} else if (props.href.startsWith("../")) {
				// Handle parent directory references
				const segments = restPath?.split("/") || [];
				if (segments.length > 0) {
					segments.pop();
				}
				fullPath = `/${targetLocale}/${segments.join("/")}`;
				const remainingPath = props.href.replace(/^\.\.\//, "");
				if (remainingPath) {
					fullPath += `/${remainingPath}`;
				}
			} else {
				fullPath += `/${props.href}`;
			}
		}

		// Clean up any double slashes
		return {
			href: fullPath.replace(/\/+/g, "/"),
			targetLocale,
		};
	});

	return (
		<A
			{...props}
			href={computedHref().href}
			onClick={(e) => {
				// @ts-expect-error
				props.onClick?.(e);
				const targetLocale = computedHref().targetLocale;
				if (targetLocale && currentLocale() !== targetLocale) {
					// Update locale in context if it changes
					useI18n().setLocale(targetLocale);
				}
			}}
		/>
	);
}
