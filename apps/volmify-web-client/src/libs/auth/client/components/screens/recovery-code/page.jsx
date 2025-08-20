import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { redirect } from "#libs/i18n/server/utils.ts";

// import { getUserRecoveryCodeRepository } from "@de100/auth-core/repositories/users";

import { getOneUserRecoveryCode } from "@de100/db/auth/init";
import { getCurrentSession } from "#libs/auth/server/queries.js";

// import { userProvider } from "@de100/auth-core/src/providers";

export default async function AuthRecoveryCodePage() {
	"use server";

	const { session, user } = await getCurrentSession({
		canMutateCookies: false,
	});

	if (!session) {
		throw redirect("/auth/login");
	}

	if (!user.emailVerifiedAt) {
		throw redirect("/auth/verify-email");
	}

	if (!user.twoFactorEnabledAt) {
		throw redirect("/");
	}
	if (!user.twoFactorRegisteredAt) {
		throw redirect("/auth/2fa/setup");
	}
	if (!session.twoFactorVerifiedAt) {
		throw redirect("/auth/2fa");
	}
	const recoveryCode = await getOneUserRecoveryCode(user.id);

	return (
		<>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<p>
				You can use this recovery code if you lose access to your second
				factors.
			</p>
			<Link href="/">Next</Link>
		</>
	);
}
