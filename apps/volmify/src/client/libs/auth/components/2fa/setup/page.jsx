import { renderSVG } from "uqr";

import { createTOTPKeyURI, encodeBase64 } from "@de100/auth/utils";

import { getCurrentSession } from "#server/libs/auth/get-current-session";
import { redirect } from "~/libs/i18n/navigation/custom";
import { TwoFactorSetUpForm } from "./components";

export default async function AuthTwoFactorSetUpPage() {
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
	if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return redirect("/auth/2fa");
	}

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	const keyURI = createTOTPKeyURI("Demo", user.name, totpKey, 30, 6);
	const qrcode = renderSVG(keyURI);
	return (
		<>
			<h1>Set up two-factor authentication</h1>
			<div
				style={{
					width: "200px",
					height: "200px",
				}}
				dangerouslySetInnerHTML={{ __html: qrcode }}
			></div>
			<TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
		</>
	);
}
