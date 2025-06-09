import { headers } from "next/headers";

import {
	getCurrentRequestConfig,
	getLocale,
	getRequestLocale,
	permanentRedirect,
	redirect,
	setRequestLocale,
} from ".";
import { updateLocaleConfigCache } from "./config";

let hasInitialized = false;
let props: Parameters<typeof updateLocaleConfigCache>[0] = {};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const prox = <Fn extends (...props: any[]) => any>(fn: Fn) => {
	return new Proxy(fn, {
		async apply(target, thisArg, args) {
			if (!hasInitialized) {
				const _headers = new Headers(await headers());
				const locale = await getLocale(_headers); // Initialize locale from headers
				await setRequestLocale(locale, _headers);
				updateLocaleConfigCache({ locale, ...props });
				hasInitialized = true;
			}

			// eslint-disable-next-line @typescript-eslint/no-unsafe-return
			return Reflect.apply(target, thisArg, args);
		},
	});
};

export function initI18nNextjs(_props: Parameters<typeof updateLocaleConfigCache>[0]) {
	// const _headers = new Headers(await headers());
	// const locale = await getLocale(_headers); // Initialize locale from headers
	// updateLocaleConfigCache({ locale, ...props });
	// // This function can be used to initialize any global state or configuration
	// // related to the i18n-nextjs package.
	// // Currently, it does not perform any actions but can be extended in the future.

	props = _props;

	return {
		getRequestLocale: prox(getRequestLocale),
		getCurrentRequestConfig: prox(getCurrentRequestConfig),
		setRequestLocale: prox(setRequestLocale),
		redirect: prox(redirect),
		permanentRedirect: prox(permanentRedirect),
	};
}
