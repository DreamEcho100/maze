import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { TwoFactorVerificationForm } from "./components";

export default async function AuthTwoFactorVerificationPage() {
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
			<h1>Two-factor authentication</h1>
			<p>Enter the code from your authenticator app.</p>
			<TwoFactorVerificationForm />
			<Link href="/auth/2fa/reset">Use recovery code</Link>
		</>
	);
}
