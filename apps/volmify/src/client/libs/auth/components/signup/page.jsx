import { getCurrentSession } from "#server/libs/auth/get-current-session";
import CustomLink from "~/components/common/CustomLink";
import { redirect } from "~/libs/i18n/navigation/custom";
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
			<CustomLink
				classVariants={{
					px: null,
					py: null,
					theme: null,
					rounded: null,
					size: null,
					layout: null,
					w: null,
				}}
				href="/auth/login"
			>
				Sign in
			</CustomLink>
		</>
	);
}
