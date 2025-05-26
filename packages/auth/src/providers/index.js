/** @import { Providers } from '#types.ts'; */

import { setCookieProvider } from "./cookies.js";
import { setUserEmailVerificationRequestProvider } from "./email-verification.js";
import { setIdsProvider } from "./ids.js";
import { setPasswordResetSessionProvider } from "./password-reset.js";
import { setSessionProvider } from "./sessions.js";
import { setUserProvider } from "./users.js";

/** @param {Partial<Providers>} providers */
export async function setProviders(providers) {
	await Promise.all([
		providers.cookies &&
			(async () => {
				if (!providers.cookies) return;
				if (typeof providers.cookies === "function") {
					const res = await providers.cookies();
					setCookieProvider(res);
					return;
				}
				setCookieProvider(providers.cookies);
			})(),
		providers.users &&
			(async () => {
				if (!providers.users) return;
				if (typeof providers.users === "function") {
					const res = await providers.users();
					setUserProvider(res);
					return;
				}
				setUserProvider(providers.users);
			})(),
		providers.sessions &&
			(async () => {
				if (!providers.sessions) return;
				if (typeof providers.sessions === "function") {
					const res = await providers.sessions();
					setSessionProvider(res);
					return;
				}
				setSessionProvider(providers.sessions);
			})(),
		providers.passwordResetSessions &&
			(async () => {
				if (!providers.passwordResetSessions) return;
				if (typeof providers.passwordResetSessions === "function") {
					const res = await providers.passwordResetSessions();
					setPasswordResetSessionProvider(res);
					return;
				}
				setPasswordResetSessionProvider(providers.passwordResetSessions);
			})(),
		providers.emailVerificationRequests &&
			(async () => {
				if (!providers.emailVerificationRequests) return;
				if (typeof providers.emailVerificationRequests === "function") {
					const res = await providers.emailVerificationRequests();
					setUserEmailVerificationRequestProvider(res);
					return;
				}
				setUserEmailVerificationRequestProvider(providers.emailVerificationRequests);
			})(),
		providers.ids &&
			(async () => {
				if (!providers.ids) return;
				if (typeof providers.ids === "function") {
					const res = await providers.ids();
					setIdsProvider(res);
					return;
				}
				setIdsProvider(providers.ids);
			})(),
	]);
}
