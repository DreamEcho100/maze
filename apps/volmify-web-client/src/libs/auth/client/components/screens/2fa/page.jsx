import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { TwoFactorVerificationForm } from "./components";

export default async function AuthTwoFactorVerificationPage() {
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
			<h1>Two-factor authentication</h1>
			<p>Enter the code from your authenticator app.</p>
			<TwoFactorVerificationForm />
			<Link href="/auth/2fa/reset">Use recovery code</Link>
		</>
	);
}
