import { validatePasswordResetSessionRequest } from "@de100/auth/utils/password-reset";

import { redirect } from "~/libs/i18n/navigation/custom";
import { PasswordResetEmailVerificationForm } from "./components";

export default async function AuthPasswordResetEmailVerificationPage() {
	const { session } = await validatePasswordResetSessionRequest();

	if (session === null) {
		return redirect("/auth/forgot-password");
	}
	if (session.emailVerifiedAt) {
		if (!session.twoFactorVerifiedAt) {
			return redirect("/auth/reset-password/2fa");
		}
		return redirect("/auth/reset-password");
	}

	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {session.email}.</p>
			<PasswordResetEmailVerificationForm />
		</>
	);
}
