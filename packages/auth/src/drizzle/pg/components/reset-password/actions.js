"use server";

import { cookies } from "next/headers";

import { resetPasswordService } from "@de100/auth/services/reset-password";

import { redirect } from "~/libs/i18n/navigation/custom";

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

	const cookiesManager = await cookies();
	const result = await resetPasswordService(password, {
		getCookie: (name) => cookiesManager.get(name)?.value,
		setCookie: cookiesManager.set,
	});

	if (result.type === "success") {
		return redirect("/");
	}

	return result;
}
