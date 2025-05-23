import { userProvider } from "#providers/users.js";
import {
  createEmailVerificationRequest,
  sendVerificationEmail,
  setEmailVerificationRequestCookie,
} from "#utils/email-verification.js";
import { getCurrentSession } from "#utils/sessions.js";
import { z } from "zod";

export const UPDATE_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  NOT_AUTHENTICATED: {
    type: "error",
    statusCode: 401,
    message: "Not authenticated",
    messageCode: "NOT_AUTHENTICATED",
  },
  FORBIDDEN: { type: "error", statusCode: 403, message: "Forbidden" },
  EMAIL_ALREADY_USED: {
    type: "error",
    statusCode: 400,
    message: "This email is already used",
    messageCode: "EMAIL_ALREADY_USED",
  },
});

export const UPDATE_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  EMAIL_UPDATE_INITIATED: {
    type: "success",
    statusCode: 200,
    message: "Verification email sent",
    messageCode: "EMAIL_UPDATE_INITIATED",
  },
});

/**
 * @typedef {typeof UPDATE_EMAIL_MESSAGES_ERRORS[keyof typeof UPDATE_EMAIL_MESSAGES_ERRORS]} ActionResultError
 * @typedef {typeof UPDATE_EMAIL_MESSAGES_SUCCESS[keyof typeof UPDATE_EMAIL_MESSAGES_SUCCESS]} ActionResultSuccess
 * @typedef {ActionResultError | ActionResultSuccess} ActionResult
 *
 * Handles updating a user's email by validating input and creating a verification request.
 *
 * @param {string} email New email address to set for the user
 * @returns {Promise<ActionResult>}
 */
export async function updateEmailService(email) {
  const input = z.string().email().safeParse(email);
  if (!input.success) return UPDATE_EMAIL_MESSAGES_ERRORS.INVALID_OR_MISSING_FIELDS;

  const validatedEmail = input.data;

  const { session, user } = await getCurrentSession();
  if (!session) return UPDATE_EMAIL_MESSAGES_ERRORS.NOT_AUTHENTICATED;

  if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
    return UPDATE_EMAIL_MESSAGES_ERRORS.FORBIDDEN;
  }

  // const emailAvailable = await getUserByEmailRepository(validatedEmail);
  const emailAvailable = await userProvider.getOneByEmail(validatedEmail);
  if (emailAvailable) return UPDATE_EMAIL_MESSAGES_ERRORS.EMAIL_ALREADY_USED;

  const verificationRequest = await createEmailVerificationRequest(user.id, validatedEmail);
  await sendVerificationEmail(verificationRequest.email, verificationRequest.code);
  setEmailVerificationRequestCookie(verificationRequest);

  return UPDATE_EMAIL_MESSAGES_SUCCESS.EMAIL_UPDATE_INITIATED;
}
