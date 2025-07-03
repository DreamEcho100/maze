"use server";

import { redirect } from "#i18n/server";
import { resolveAuthSessionService } from "@de100/auth/services/resolve-auth-session";
import { AUTH_URLS } from "@de100/auth/utils/constants";
import { db } from "../db";
import { generateAuthSessionProps } from "./generate-get-current-auth-session-props";

export async function extendCurrentSession() {
	const authProps = await generateAuthSessionProps({});
	if (!authProps) {
		redirect(AUTH_URLS.LOGIN);
		return;
	}

	return db.transaction(async (tx) => resolveAuthSessionService({ ...authProps, tx }));
}
