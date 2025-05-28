import Link from "next/link";

import { usersProvider } from "@de100/auth/providers";

// import { getUserRecoveryCodeRepository } from "@de100/auth/repositories/users";

import { getCurrentSession } from "#client/libs/auth/get-current-session";
import CustomLink from "~/components/common/CustomLink";
import { redirect } from "~/libs/i18n/navigation/custom";

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
	const recoveryCode = await usersProvider.getOneRecoveryCode(user.id);

	return (
		<>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<p>You can use this recovery code if you lose access to your second factors.</p>
			<CustomLink href="/">Next</CustomLink>
		</>
	);
}
