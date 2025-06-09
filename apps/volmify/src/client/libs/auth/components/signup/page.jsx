import { Link } from "#client/components/link";
import { redirect } from "#i18n/server";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
import { SignUpForm } from "./components";

export default async function AuthSignUpPage() {
	const { session, user } = await getCurrentSession();

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
