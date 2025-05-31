"use server";

import { resetPasswordService } from "@de100/auth/services/reset-password";
import { redirect } from "@de100/i18n-nextjs/server";

import { db } from "#server/libs/db";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function resetPasswordAction(_prev, formData) {
	const password = formData.get("password");

	if (typeof password !== "string" || !password.trim()) {
		return {
			message: "Invalid or missing fields",
			type: "error",
			statusCode: 400,
		};
	}

	const result = await db.transaction((tx) => resetPasswordService(password, { tx }));

	if (result.type === "success") {
		return redirect("/");
	}

	return result;
}
