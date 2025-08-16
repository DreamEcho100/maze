import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import { LoginForm } from "./components";

export default async function AuthLoginPage() {
	const { session, user } = await getCurrentSession({
		canMutateCookies: false,
	});

	if (session) {
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
			<h1>Sign in</h1>
			<LoginForm />
			<Link href="/auth/signup">Create an account</Link>
			<Link href="/auth/forgot-password">Forgot password?</Link>
		</>
	);
}
