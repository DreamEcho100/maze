import { cookies } from "next/headers";

import { validatePasswordResetSessionRequest } from "@de100/auth/utils/password-reset";

import { redirect } from "~/libs/i18n/navigation/custom";
import { PasswordResetForm } from "./components";

export default async function AuthPasswordResetPage() {
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

	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return redirect("/auth/reset-password/2fa");
	}

	return (
		<>
			<h1>Enter your new password</h1>
			<PasswordResetForm />
		</>
	);
}
