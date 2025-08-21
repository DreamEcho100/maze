import type enMessages from "./messages/en.ts";

declare module "@de100/i18n" {
	export interface Register {
		translations: typeof enMessages;
	}
}
