import { getUserEmailVerificationRequestFromRequest } from "@de100/auth-core/utils/email-verification";
import { findOneEmailVerificationRequestsByIdAndUserId } from "@de100/db/auth/init";
import { query } from "@solidjs/router";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";

export const routeData = query(async () => {
	"use server";
	const currentSession = await getCurrentSession({ canMutateCookies: false });
	if (!currentSession.user) {
		throw redirect("/auth/login");
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = await getUserEmailVerificationRequestFromRequest({
		userId: currentSession.user.id,
		cookies: getCookiesManager(),
		cookiesOptions: {},
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
			},
		},
	});
	if (!verificationRequest && currentSession.user.emailVerifiedAt) {
		throw redirect("/");
	}

	return {
		verificationRequest,
		currentSession,
	};
}, "auth-verify-email-route-data");
