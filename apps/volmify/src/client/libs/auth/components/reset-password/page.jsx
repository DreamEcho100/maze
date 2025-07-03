import { validatePasswordResetSessionRequest } from "@de100/auth/utils/password-reset";

import { redirect } from "#i18n/server";
import {
	deleteOnePasswordResetSession,
	findOnePasswordResetSessionWithUser,
} from "#server/libs/auth/init";
import { getCookies } from "#server/libs/get-cookies";
import { PasswordResetForm } from "./components";

export default async function AuthPasswordResetPage() {
	const { session, user } = await validatePasswordResetSessionRequest({
		cookies: await getCookies(),
		authProviders: {
			passwordResetSession: {
				deleteOne: deleteOnePasswordResetSession,
				findOneWithUser: findOnePasswordResetSessionWithUser,
			},
		},
	});

	if (!session) {
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
