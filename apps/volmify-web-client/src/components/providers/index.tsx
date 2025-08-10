import { I18nProvider } from "@de100/i18n-solidjs";
import { createAsync } from "@solidjs/router";
import type { ParentProps } from "solid-js";
import { Show, Suspense } from "solid-js";
import {
	type AllowedLocale,
	allowedLocales,
	defaultLocale,
	fallbackLocale,
} from "#libs/i18n/constants.ts";
import { isAllowedLocale } from "#libs/i18n/is-allowed-locale.ts";
import { getTranslationQuery } from "#libs/i18n/server.ts";
import { cookieManager } from "#libs/js-cookies/index.ts";

export default function Providers(props: ParentProps<{ locale?: AllowedLocale }>) {
	const localeTranslationsRecourse = createAsync(() => getTranslationQuery({ direct: true }));

	return (
		<Suspense fallback={<div>Loading...</div>}>
			<Show when={localeTranslationsRecourse()}>
				{(localeTranslation) => {
					const translation = localeTranslation().translation;
					const locale = localeTranslation().locale;

					return (
						<I18nProvider
							allowedLocales={allowedLocales}
							defaultLocale={defaultLocale}
							fallbackLocale={fallbackLocale}
							translations={{ [locale]: translation }}
							locale={locale}
							loadTranslations={async (props) => {
								if (!isAllowedLocale(props.locale)) {
									throw new Error(`props \`props.locale\` "${props.locale}" is not allowed.`);
								}

								const result = await getTranslationQuery({ locale: props.locale, direct: true });

								if (!result) {
									throw new Error("Failed to get the `getTranslationQuery` result");
								}
								// set cookie on the client
								cookieManager.setCookie("locale", props.locale, {
									path: "/",
									maxAge: 31536000, // 1 year
									sameSite: "lax",
								});
								cookieManager.setCookie("x-locale", props.locale, {
									path: "/",
									maxAge: 31536000, // 1 year
									sameSite: "lax",
								});

								return { [props.locale]: result.translation };
							}}
						>
							{props.children}
						</I18nProvider>
					);
				}}
			</Show>
		</Suspense>
	);
}
