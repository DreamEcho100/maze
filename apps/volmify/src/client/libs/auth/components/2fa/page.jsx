import { getCurrentSession } from "#client/libs/auth/get-current-session";
import CustomLink from "~/components/common/CustomLink";
import { redirect } from "~/libs/i18n/navigation/custom";
import { TwoFactorVerificationForm } from "./components";

export default async function AuthTwoFactorVerificationPage() {
	const { session, user } = await getCurrentSession();

	if (session === null) {
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
				href="/auth/2fa/reset">
				Use recovery code
			</CustomLink>
		</>
	);
}
