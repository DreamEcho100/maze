import type { LanguageMessages } from "@de100/i18n";
import type { CustomResponse } from "@solidjs/router";
import {
	buildRedirectConfig,
	getCurrentRequestConfig,
	getRequestLocale,
	permanentRedirect,
	redirect,
	setRequestLocale,
} from ".";
import { updateLocaleConfigCache } from "./config";

export { I18N_HEADER_LOCALE_NAME } from ".";
export { updateLocaleConfigCache } from "./config";

export function initI18nSolidStart(
	_props: Parameters<typeof updateLocaleConfigCache>[0],
) {
	updateLocaleConfigCache(_props);
	return {
		getRequestLocale,
		getCurrentRequestConfig,
		setRequestLocale,
		buildRedirectConfig,
		redirect,
		permanentRedirect,
	};
}

// https://stackoverflow.com/a/78111987/13961420
export interface InitI18nSolidStartReturn {
	getRequestLocale: () => string | undefined;
	getCurrentRequestConfig: (
		loadLocaleMessages: (locale: string) => Record<string, LanguageMessages>,
	) => {
		locale: string;
		messages: Record<string, LanguageMessages>;
	};
	setRequestLocale: (locale: string, _headers?: Headers | undefined) => void;
	redirect: (
		path: string,
		init?: ResponseInit | undefined,
		props?:
			| {
					locale?: string | undefined;
			  }
			| undefined,
	) => CustomResponse<never> | undefined;
	permanentRedirect: (
		path: string,
		init?: ResponseInit | undefined,
		props?:
			| {
					locale?: string | undefined;
			  }
			| undefined,
	) => CustomResponse<never> | undefined;
}
