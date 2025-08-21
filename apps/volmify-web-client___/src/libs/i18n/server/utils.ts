import { initI18nSolidStart } from "@de100/i18n-solid-startjs/server/init";
import { getEvent } from "vinxi/http";
import { allowedLocales, defaultLocale } from "../constants.ts";
import { getServerLocale } from "./get-server-locale.ts";

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
		const event = getEvent();
		if (!event) {
			throw new Error("No `requestEvent` found!");
		}
		const pathname = event.node.req.url;
		if (!pathname) {
			throw new Error("No `event.node.req.url` found!");
		}
		return getServerLocale({
			nativeEvent: event,
			headers: event.headers,
			pathname,
		}).foundLocale;
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
