"use server";

import { logoutService } from "@de100/auth/services/logout";
import { AUTH_URLS } from "@de100/auth/utils/constants";

import { redirect } from "#i18n/server";
import { generateAuthSessionProps } from "#server/libs/auth/generate-get-current-auth-session-props";

export async function logoutAction() {
	const authProps = await generateAuthSessionProps({});

	if (!authProps?.session) {
		return redirect(AUTH_URLS.LOGIN);
	}

	const result = await logoutService({
		...authProps,
		shouldDeleteCookie: authProps.canMutateCookies,
	});

	if (result.type === "success") {
		return redirect(AUTH_URLS.SUCCESS_LOGOUT);
	}

	return result;
}
