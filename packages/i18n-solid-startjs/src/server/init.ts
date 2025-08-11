import type { LanguageMessages } from "@de100/i18n";
import type { CustomResponse } from "@solidjs/router";
import {
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
		redirect,
		permanentRedirect,
	};
}

// https://stackoverflow.com/a/78111987/13961420
export interface InitI18nSolidStartReturn {
	getRequestLocale: () => Promise<string | undefined>;
	getCurrentRequestConfig: (
		loadLocaleMessages: (
			locale: string,
		) => Promise<Record<string, LanguageMessages>>,
	) => Promise<{
		locale: string;
		messages: Record<string, LanguageMessages>;
	}>;
	setRequestLocale: (locale: string, _headers?: Headers | undefined) => void;
	redirect: (
		path: string,
		init?: ResponseInit | undefined,
		props?:
			| {
					locale?: string | undefined;
			  }
			| undefined,
	) => Promise<CustomResponse<never> | undefined>;
	permanentRedirect: (
		path: string,
		init?: ResponseInit | undefined,
		props?:
			| {
					locale?: string | undefined;
			  }
			| undefined,
	) => Promise<CustomResponse<never> | undefined>;
}
