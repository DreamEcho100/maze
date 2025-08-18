import { validatePasswordResetSessionRequest } from "@de100/auth-core/utils/password-reset";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
} from "@de100/db/auth/init";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { PasswordResetEmailVerificationForm } from "./components";

export default async function AuthPasswordResetEmailVerificationPage() {
	const { session } = await validatePasswordResetSessionRequest({
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
	if (session.emailVerifiedAt) {
		if (!session.twoFactorVerifiedAt) {
			throw redirect("/auth/reset-password/2fa");
		}
		throw redirect("/auth/reset-password");
	}

	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {session.email}.</p>
			<PasswordResetEmailVerificationForm />
		</>
	);
}
