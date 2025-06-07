import { getUserEmailVerificationRequestFromRequest } from "@de100/auth/utils/email-verification";
import { redirect } from "@de100/i18n-nextjs/server";

import { Link } from "#client/components/link";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
import { getCookies } from "#server/libs/get-cookies";
import { EmailVerificationForm, ResendEmailVerificationCodeForm } from "./components";

export default async function AuthVerifyEmailPage() {
	const { user } = await getCurrentSession();
	if (user === null) {
		return redirect("/auth/login");
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = await getUserEmailVerificationRequestFromRequest(
		user.id,
		await getCookies(),
	);
	if (verificationRequest === null && user.emailVerifiedAt) {
		return redirect("/");
	}
	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {verificationRequest?.email ?? user.email}.</p>
			<EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
			<Link href="/settings">Change your email</Link>
		</>
	);
}
