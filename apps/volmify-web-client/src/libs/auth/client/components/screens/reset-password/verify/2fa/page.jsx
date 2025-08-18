import { validatePasswordResetSessionRequest } from "@de100/auth-core/utils/password-reset";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
} from "@de100/db/auth/init";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import {
	PasswordResetRecoveryCodeForm,
	PasswordResetTOTPForm,
} from "./components";

export default async function AuthPasswordReset2FAVerificationPage() {
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
		!user.twoFactorEnabledAt ||
		!user.twoFactorRegisteredAt ||
		session.twoFactorVerifiedAt
	) {
		throw redirect("/auth/reset-password");
	}

	return (
		<>
			<h1>Two-factor authentication</h1>
			<p>Enter the code from your authenticator app.</p>
			<PasswordResetTOTPForm />
			<section>
				<h2>Use your recovery code instead</h2>
				<PasswordResetRecoveryCodeForm />
			</section>
		</>
	);
}
