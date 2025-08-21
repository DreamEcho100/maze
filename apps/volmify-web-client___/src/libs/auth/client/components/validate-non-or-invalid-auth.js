import { authRoutesConfig } from "#libs/auth/client/components/routes-config.js";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

export const validateNonOrInvalidAuth = async () => {
	"use server";

	const { session, user } = await getCurrentSession({
		canMutateCookies: false,
	});

	if (session) {
		if (!user.emailVerifiedAt) {
			throw redirect(authRoutesConfig.verifyEmail.path);
		}

		if (user.twoFactorEnabledAt) {
			if (!user.twoFactorRegisteredAt) {
				throw redirect(authRoutesConfig.twoFactorSetup.path);
			}
			if (!session.twoFactorVerifiedAt) {
				throw redirect(authRoutesConfig.twoFactor.path);
			}
		}

		throw redirect("/");
	}

	return { session, user };
};
