import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { SignUpForm } from "./components";

export default async function AuthSignUpPage() {
	const { session, user } = await getCurrentSession({ canMutateCookies: false });

	if (session !== null) {
		if (!user.emailVerifiedAt) {
			return redirect("/auth/verify-email");
		}

		if (user.twoFactorEnabledAt) {
			if (!user.twoFactorRegisteredAt) {
				return redirect("/auth/2fa/setup");
			}
			if (!session.twoFactorVerifiedAt) {
				return redirect("/auth/2fa");
			}
		}

		return redirect("/");
	}

	return (
		<>
			<h1>Create an account</h1>
			<p>
				Your name must be at least 3 characters long and your password must be at least 8 characters
				long.
			</p>
			<SignUpForm />
			<Link href="/auth/login">Sign in</Link>
		</>
	);
}
