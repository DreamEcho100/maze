import { getUserEmailVerificationRequestFromRequest } from "@de100/auth-core/utils/email-verification";
import { findOneEmailVerificationRequestsByIdAndUserId } from "@de100/db/auth/init";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { getCookiesManager } from "#libs/auth/server/utils.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import {
	EmailVerificationForm,
	ResendEmailVerificationCodeForm,
} from "./components";

export default async function AuthVerifyEmailPage() {
	const { user } = await getCurrentSession({ canMutateCookies: false });
	if (!user) {
		return redirect("/auth/login");
	}

	// TODO: Ideally we'd sent a new verification email automatically if the previous one is expired,
	// but we can't set cookies inside server components.
	const verificationRequest = await getUserEmailVerificationRequestFromRequest({
		userId: user.id,
		cookies: getCookiesManager(),
		cookiesOptions: {},
		authProviders: {
			userEmailVerificationRequests: {
				findOneByIdAndUserId: findOneEmailVerificationRequestsByIdAndUserId,
			},
		},
	});
	if (!verificationRequest && user.emailVerifiedAt) {
		return redirect("/");
	}
	return (
		<>
			<h1>Verify your email address</h1>
			<p>
				We sent an 8-digit code to {verificationRequest?.email ?? user.email}.
			</p>
			<EmailVerificationForm />
			<ResendEmailVerificationCodeForm />
			<Link href="/settings">Change your email</Link>
		</>
	);
}
