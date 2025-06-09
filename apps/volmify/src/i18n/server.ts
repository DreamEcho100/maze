import { initI18nNextjs } from "@de100/i18n-nextjs/server/init";

import { allowedLocales, defaultLocale } from "./constants";

const { getCurrentRequestConfig, getRequestLocale, permanentRedirect, redirect, setRequestLocale } =
	initI18nNextjs({
		allowedLocales: allowedLocales,
		defaultLocale: defaultLocale,
	});

export { getCurrentRequestConfig, getRequestLocale, permanentRedirect, redirect, setRequestLocale };
