/** @import { Providers } from '#types.ts'; */

import { setCookieProvider } from './cookies.js';
import { setUserEmailVerificationRequestProvider } from './email-verification.js';
import { setIdsProvider } from './ids.js';
import { setPasswordResetSessionProvider } from './password-reset.js';
import { setSessionProvider } from './sessions.js';
import { setUserProvider } from './users.js';

/** @param {Providers} providers */
export function setProviders(providers) {
	setCookieProvider(providers.cookies);
	setUserProvider(providers.user);
	setSessionProvider(providers.session);
	setPasswordResetSessionProvider(providers.passwordResetSession);
	setUserEmailVerificationRequestProvider(providers.emailVerificationRequest);
	setIdsProvider(providers.ids);
}