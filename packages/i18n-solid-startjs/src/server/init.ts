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

export function initI18nSolidStart(_props: Parameters<typeof updateLocaleConfigCache>[0]) {
	updateLocaleConfigCache(_props);
	return {
		getRequestLocale,
		getCurrentRequestConfig,
		setRequestLocale,
		redirect,
		permanentRedirect,
	};
}
