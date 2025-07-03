import { createTOTPKeyURI, encodeBase64 } from "@de100/auth/utils";
import { renderSVG } from "uqr";

import { redirect } from "#i18n/server";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
import { TwoFactorSetUpForm } from "./components";

export default async function AuthTwoFactorSetUpPage() {
	const { session, user } = await getCurrentSession({ canMutateCookies: false });

	if (!session) {
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
				// biome-ignore lint/security/noDangerouslySetInnerHtml: <explanation>
				dangerouslySetInnerHTML={{ __html: qrcode }}
			/>
			<TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
		</>
	);
}
