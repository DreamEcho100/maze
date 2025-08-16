"use server";

import { logoutService } from "@de100/auth-core/services/logout";
import {
	AUTH_URLS,
	AUTHENTICATION_REQUIRED,
} from "@de100/auth-core/utils/constants";
import { generateAuthSessionProps } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";

export async function logoutAction() {
	const authProps = await generateAuthSessionProps({});

	if (!authProps?.session) {
		await redirect(AUTH_URLS.LOGIN);
		return AUTHENTICATION_REQUIRED;
	}

	const result = await logoutService({
		...authProps,
		shouldDeleteCookie: authProps.canMutateCookies,
	});

	if (result.type === "success") {
		await redirect(AUTH_URLS.SUCCESS_LOGOUT);
		return result;
	}

	return result;
}
