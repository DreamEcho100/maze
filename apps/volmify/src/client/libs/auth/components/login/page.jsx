import { Link } from "#client/components/link";
import { redirect } from "#i18n/server";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
import { LoginForm } from "./components";

export default async function AuthLoginPage() {
	const { session, user } = await getCurrentSession();

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
