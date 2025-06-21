"use server";

import { resolveAuthSessionService } from "@de100/auth/services/resolve-auth-session";

import { db } from "../db";
import { generateGetCurrentAuthSessionProps } from "./generate-get-current-auth-session-props";

export async function refreshCurrentSession() {
	return db.transaction(async (tx) =>
		resolveAuthSessionService(
			await generateGetCurrentAuthSessionProps({
				tx,
			}),
		),
	);
}
