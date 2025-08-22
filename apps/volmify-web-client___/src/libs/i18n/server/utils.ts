import { initI18nSolidStart } from "@de100/i18n-solid-startjs/server/init";
import { getEvent } from "vinxi/http";
import { allowedLocales, defaultLocale } from "../constants.ts";
import { getServerLocale } from "./get-server-locale.ts";
import { getRequestEvent } from "solid-js/web";

// TODO: use the [`useSession`](https://docs.solidjs.com/solid-start/advanced/session)

const {
	getCurrentRequestConfig,
	getRequestLocale,
	buildRedirectConfig,
	permanentRedirect,
	redirect,
	setRequestLocale,
} = initI18nSolidStart({
	allowedLocales: allowedLocales,
	defaultLocale: defaultLocale,
	getServerLocale: () => {
		// throw new Error("Function not implemented.");
		try {
			const event = getRequestEvent();
			if (!event) {
				throw new Error("No `event` found!");
			}
			const nativeEvent = event.nativeEvent;
			const pathname = nativeEvent.node.req.url;
			if (!pathname) {
				throw new Error("No `event.node.req.url` found!");
			}
			return getServerLocale({
				nativeEvent: nativeEvent,
				headers: nativeEvent.headers,
				pathname,
			}).foundLocale;
		} catch (error) {
			console.error("Error in getServerLocale:", error);
			return defaultLocale;
			
		}
	},
});

export {
	getCurrentRequestConfig,
	getRequestLocale,
	buildRedirectConfig,
	permanentRedirect,
	redirect,
	setRequestLocale,
};
