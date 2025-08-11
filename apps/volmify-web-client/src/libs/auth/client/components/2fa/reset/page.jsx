import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { TwoFactorResetForm } from "./components";

export default async function AuthTwoFactorResetPage() {
	const { session, user } = await getCurrentSession({ canMutateCookies: false });

	if (!session) {
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
	if (session.twoFactorVerifiedAt) {
		return redirect("/");
	}

	return (
		<>
			<h1>Recover your account</h1>
			<TwoFactorResetForm />
		</>
	);
}
