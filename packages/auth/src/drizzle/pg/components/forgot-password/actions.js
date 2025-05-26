"use server";

import { cookies } from "next/headers";

import { forgotPasswordService } from "@acme/auth/services/forgot-password";
import { AUTH_URLS } from "@acme/auth/utils/constants";

import { redirect } from "~/libs/i18n/navigation/custom";

/**
 * @typedef {{ type: 'idle'; statusCode?: number; message?: string; } | { type: 'error' | 'success'; statusCode: number; message: string; }} ActionResult
 *
 * @param {ActionResult} _prev
 * @param {FormData} formData
 * @returns {Promise<ActionResult>}
 */
export async function forgotPasswordAction(_prev, formData) {
  const data = { email: formData.get("email") };

  const cookiesManager = await cookies();
  const result = await forgotPasswordService(data, {
    setCookie: cookiesManager.set,
  });

  if (result.type === "success") {
    // Redirect for successful password reset email sending
    return redirect(AUTH_URLS.VERIFY_EMAIL_FOR_PASSWORD_RESET);
  }

  // If there is an error, return it directly from the service's response
  return result;
}
