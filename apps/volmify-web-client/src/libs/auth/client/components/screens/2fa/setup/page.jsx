import { createTOTPKeyURI, encodeBase64 } from "@de100/auth-core/utils";
import { renderSVG } from "uqr";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

import { TwoFactorSetUpForm } from "./components.jsx";

export default async function AuthTwoFactorSetUpPage() {
	const { session, user } = await getCurrentSession({
		canMutateCookies: false,
	});

	if (!session) {
		throw redirect("/auth/login");
	}

	if (!user.emailVerifiedAt) {
		throw redirect("/auth/verify-email");
	}

	if (!user.twoFactorEnabledAt) {
		throw redirect("/");
	}
	if (user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		throw redirect("/auth/2fa");
	}

	const totpKey = new Uint8Array(20);
	crypto.getRandomValues(totpKey);
	const encodedTOTPKey = encodeBase64(totpKey);
	// Q: Should `DOMPurify` be used here to sanitize the URI?
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
				innerHTML={qrcode}
			/>
			<TwoFactorSetUpForm encodedTOTPKey={encodedTOTPKey} />
		</>
	);
}
