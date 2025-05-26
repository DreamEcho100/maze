import { cookies } from "next/headers";
import { validatePasswordResetSessionRequest } from "@acme/auth/utils/password-reset";

import { redirect } from "~/libs/i18n/navigation/custom";
import { PasswordResetRecoveryCodeForm, PasswordResetTOTPForm } from "./components";

export default async function AuthPasswordReset2FAVerificationPage() {
	const cookiesManager = await cookies();
	const { session, user } = await validatePasswordResetSessionRequest(
		(name) => cookiesManager.get(name)?.value,
		cookiesManager.set,
	);

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
