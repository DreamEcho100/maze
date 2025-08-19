import { validatePasswordResetSessionRequest } from "@de100/auth-core/utils/password-reset";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
} from "@de100/db/auth/init";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { PasswordResetForm } from "./components.jsx";

export default async function AuthPasswordResetPage() {
	const { session, user } = await validatePasswordResetSessionRequest({
		cookies: getCookiesManager(),
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
			},
		},
	});

	if (!session) {
		throw redirect("/auth/forgot-password");
	}
	if (!session.emailVerifiedAt) {
		throw redirect("/auth/reset-password/verify-email");
	}

	if (
		user.twoFactorEnabledAt &&
		user.twoFactorRegisteredAt &&
		!session.twoFactorVerifiedAt
	) {
		throw redirect("/auth/reset-password/2fa");
	}

	return (
		<>
			<h1>Enter your new password</h1>
			<PasswordResetForm />
		</>
	);
}
