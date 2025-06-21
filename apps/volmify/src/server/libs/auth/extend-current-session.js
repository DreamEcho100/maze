"use server";

import { resolveAuthSessionService } from "@de100/auth/services/resolve-auth-session";

import { db } from "../db";
import { generateGetCurrentAuthSessionProps } from "./generate-get-current-auth-session-props";

export async function extendCurrentSession() {
	return db.transaction(async (tx) =>
		resolveAuthSessionService(
			await generateGetCurrentAuthSessionProps({
				tx,
				input: { shouldExtendRefreshAuthTokensOnNeed: true },
			}),
		),
	);
}
