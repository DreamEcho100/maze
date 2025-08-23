import { useI18n } from "@de100/i18n-solidjs";
import { A as SolidA, useLocation } from "@solidjs/router";
import type { ComponentProps } from "solid-js";
import { createMemo, splitProps } from "solid-js";
import { parsePathname } from "#utils";

type LinkProps = ComponentProps<typeof SolidA>;

function parseLinkType(href: string) {
	// If href is already absolute or external, pass it through
	if (
		href.startsWith("http") ||
		href.startsWith("mailto:") ||
		href.startsWith("tel:")
	) {
		return "absolute|external";
	}

	// If href already starts with locale, pass it through
	if (/^\/[a-z]{2}($|\/)/i.exec(href)) {
		return "locale";
	}

	return "relative";
}

function getLinkConfig(props: {
	href: string;
	locale?: string;
	pathname: string;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	currentLocale: string;
}): {
	href: string;
	targetLocale: string;
} {
	const linkType = parseLinkType(props.href);
	if (linkType === "absolute|external" || linkType === "locale") {
		return {
			href: props.href,
			targetLocale: props.currentLocale,
		};
	}

	// Determine which locale to use
	const targetLocale =
		props.locale ?? props.currentLocale ?? props.defaultLocale;

	// If href starts with a slash, it's an absolute path
	if (props.href.startsWith("/")) {
		return {
			href: `/${targetLocale}${props.href}`,
			targetLocale,
		};
	}

	// Handle relative paths
	const { restPath } = parsePathname(location.pathname, {
		defaultLocale: props.defaultLocale,
		allowedLocales: props.allowedLocales,
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
}

export function I18nA(
	_props: LinkProps & {
		href: string;
		locale?: string;
	},
) {
	const [outerConfig, otherProps] = splitProps(_props, ["locale", "href"]);
	const location = useLocation();
	const pathname = createMemo(() => location.pathname);
	const i18n = useI18n();

	const config = createMemo(() => {
		// 	href: props.href,
		// 	locale: props.locale,
		// 	pathname: pathname(),
		// 	defaultLocale: i18n.defaultLocale,
		// 	allowedLocales: i18n.allowedLocales,
		// 	currentLocale: i18n.locale,
		// });
		return getLinkConfig({
			href: outerConfig.href,
			locale: outerConfig.locale,
			pathname: pathname(),
			defaultLocale: i18n.defaultLocale,
			allowedLocales: i18n.allowedLocales,
			currentLocale: i18n.locale,
		});
	});

	return (
		<SolidA
			{...otherProps}
			href={config().href}
			onClick={(e) => {
				// @ts-expect-error
				otherProps.onClick?.(e);
				// const targetLocale = computedHref().targetLocale;

				if (config().targetLocale && i18n.locale !== config().targetLocale) {
					// Update locale in context if it changes
					i18n.setLocale(config().targetLocale);
				}
			}}
		/>
	);
}
