import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { TwoFactorResetForm } from "./components";

export default async function AuthTwoFactorResetPage() {
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
	if (session.twoFactorVerifiedAt) {
		throw redirect("/");
	}

	return (
		<>
			<h1>Recover your account</h1>
			<TwoFactorResetForm />
		</>
	);
}
