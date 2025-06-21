import { validatePasswordResetSessionRequest } from "@de100/auth/utils/password-reset";

import { redirect } from "#i18n/server";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
} from "#server/libs/auth/init";
import { getCookies } from "#server/libs/get-cookies";
import { PasswordResetRecoveryCodeForm, PasswordResetTOTPForm } from "./components";

export default async function AuthPasswordReset2FAVerificationPage() {
	const { session, user } = await validatePasswordResetSessionRequest({
		cookies: await getCookies(),
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
			},
		},
	});

	if (session === null) {
		return redirect("/auth/forgot-password");
	}

	if (!session.emailVerifiedAt) {
		return redirect("/auth/reset-password/verify-email");
	}

	if (!user.twoFactorEnabledAt || !user.twoFactorRegisteredAt || session.twoFactorVerifiedAt) {
		return redirect("/auth/reset-password");
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
