import { redirect } from "@de100/i18n-nextjs/server";

import { Link } from "#client/components/link";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
// import CustomLink from "~/components/common/CustomLink";
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
			<Link href="/auth/2fa/reset">Use recovery code</Link>
		</>
	);
}
