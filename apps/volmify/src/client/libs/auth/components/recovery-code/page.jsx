import { authConfig } from "@de100/auth/init";

import { Link } from "#client/components/link";
import { redirect } from "#i18n/server";
// import { getUserRecoveryCodeRepository } from "@de100/auth/repositories/users";

import { getCurrentSession } from "#server/libs/auth/get-current-session";

// import { userProvider } from "@de100/auth/src/providers";

export default async function AuthRecoveryCodePage() {
	const { session, user } = await getCurrentSession();

	if (session === null) {
		return redirect("/auth/login");
	}

	if (!user.emailVerifiedAt) {
		return redirect("/auth/verify-email");
	}

	if (!user.twoFactorEnabledAt) {
		return redirect("/");
	}
	if (!user.twoFactorRegisteredAt) {
		return redirect("/auth/2fa/setup");
	}
	if (!session.twoFactorVerifiedAt) {
		return redirect("/auth/2fa");
	}
	const recoveryCode = await authConfig.providers.users.getOneRecoveryCode(user.id);

	return (
		<>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<p>You can use this recovery code if you lose access to your second factors.</p>
			<Link href="/">Next</Link>
		</>
	);
}
