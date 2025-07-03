import { redirect } from "#i18n/server";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
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
