/** @import { Providers } from '#types.ts'; */

import { setCookieProvider } from "./cookies.js";
import { setUserEmailVerificationRequestProvider } from "./email-verification.js";
import { setIdsProvider } from "./ids.js";
import { setPasswordResetSessionProvider } from "./password-reset.js";
import { setSessionProvider } from "./sessions.js";
import { setUserProvider } from "./users.js";

/** @param {Partial<Providers>} providers */
export function setProviders(providers) {
	providers.cookies && setCookieProvider(providers.cookies);
	providers.user && setUserProvider(providers.user);
	providers.session && setSessionProvider(providers.session);
	providers.passwordResetSession && setPasswordResetSessionProvider(providers.passwordResetSession);
	providers.emailVerificationRequest &&
		setUserEmailVerificationRequestProvider(providers.emailVerificationRequest);
	providers.ids && setIdsProvider(providers.ids);
}
