import { cookies } from "next/headers";

import { getUserEmailVerificationRequestFromRequest } from "@de100/auth/utils/email-verification";

import { getCurrentSession } from "#client/libs/auth/get-current-session";
import CustomLink from "~/components/common/CustomLink";
import { redirect } from "~/libs/i18n/navigation/custom";
import { EmailVerificationForm, ResendEmailVerificationCodeForm } from "./components";

export default async function AuthVerifyEmailPage() {
	const { user, session } = await getCurrentSession();
	if (user === null) {
		return redirect("/auth/login");
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = await getUserEmailVerificationRequestFromRequest(() => ({
		user,
		session,
	}));
	if (verificationRequest === null && user.emailVerifiedAt) {
		return redirect("/");
	}
	return (
		<>
			<h1>Verify your email address</h1>
			<p>We sent an 8-digit code to {verificationRequest?.email ?? user.email}.</p>
			<EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
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
				href="/settings"
			>
				Change your email
			</CustomLink>
		</>
	);
}
