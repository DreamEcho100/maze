import Link from "next/link";
import { getUserRecoveryCodeRepository } from "@acme/auth/repositories/users";

import CustomLink from "~/components/common/CustomLink";
import { getCurrentSession } from "~/libs/auth/utils/get-current-session";
import { redirect } from "~/libs/i18n/navigation/custom";

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
	const recoveryCode = await getUserRecoveryCodeRepository(user.id);

	return (
		<>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<p>You can use this recovery code if you lose access to your second factors.</p>
			<CustomLink href="/">Next</CustomLink>
		</>
	);
}
