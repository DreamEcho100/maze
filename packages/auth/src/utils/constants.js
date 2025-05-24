export const COOKIE_TOKEN_SESSION_KEY = "session";
export const COOKIE_TOKEN_SESSION_EXPIRES_DURATION = 1000 * 60 * 60 * 24 * 30; // 30 days

export const COOKIE_TOKEN_EMAIL_VERIFICATION_KEY = "email_verification";
export const COOKIE_TOKEN_EMAIL_VERIFICATION_EXPIRES_DURATION = 1000 * 60 * 10; // 10 minutes

export const COOKIE_TOKEN_PASSWORD_RESET_KEY = "password_reset_session";
export const COOKIE_TOKEN_PASSWORD_RESET_EXPIRES_DURATION = 1000 * 60 * 10; // 10 minutes

export const LOGIN_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_CREDENTIALS: {
    type: "error",
    statusCode: 400,
    message: "Invalid email or password",
    messageCode: "INVALID_LOGIN_CREDENTIALS",
  },
  // OLD: ACCOUNT_DOES_NOT_EXIST
  ACCOUNT_NOT_FOUND: {
    type: "error",
    statusCode: 404,
    message: "No account found with this email address",
    messageCode: "ACCOUNT_NOT_FOUND",
  },
  // OLD: EMAIL_NOT_VERIFIED
  EMAIL_VERIFICATION_REQUIRED: {
    type: "error",
    statusCode: 403,
    message: "Please verify your email address before logging in",
    messageCode: "EMAIL_VERIFICATION_REQUIRED",
  },
  // OLD: TWO_FA_NOT_SETUP
  TWO_FACTOR_SETUP_REQUIRED: {
    type: "error",
    statusCode: 403,
    message: "Two-factor authentication setup is required",
    messageCode: "TWO_FACTOR_SETUP_REQUIRED",
  },
  // OLD: TWO_FA_NOT_NEEDS_VERIFICATION
  TWO_FACTOR_VERIFICATION_REQUIRED: {
    type: "error",
    statusCode: 200, // Special case - prompts for 2FA input
    message: "Please enter your two-factor authentication code",
    messageCode: "TWO_FACTOR_VERIFICATION_REQUIRED",
  },
  USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET: {
    type: "error",
    statusCode: 404, // Not Found: User does not exist or password not set
    messageCode: "USER_DOES_NOT_EXIST_OR_PASSWORD_NOT_SET",
    message: "User does not exist or password not set",
  },
});
export const LOGIN_MESSAGES_SUCCESS = /** @type {const} */ ({
  LOGGED_IN_SUCCESSFULLY: {
    type: "success",
    statusCode: 200,
    message: "Successfully logged in",
    messageCode: "LOGIN_SUCCESSFUL",
  },
});

export const REGISTER_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  // OLD: EMAIL_ALREADY_USED
  EMAIL_ALREADY_REGISTERED: {
    type: "error",
    statusCode: 409,
    message: "An account with this email address already exists",
    messageCode: "EMAIL_ALREADY_REGISTERED",
  },
  // OLD: WEAK_PASSWORD
  PASSWORD_TOO_WEAK: {
    type: "error",
    statusCode: 400,
    message: "Password does not meet security requirements",
    messageCode: "PASSWORD_STRENGTH_INSUFFICIENT",
  },
  // OLD: NEEDS_2FA_VALIDATION
  TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED: {
    type: "error",
    statusCode: 403,
    message: "Two-factor authentication validation or setup is required",
    messageCode: "TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED",
  },
});
export const REGISTER_MESSAGES_SUCCESS = /** @type {const} */ ({
// OLD: REGISTER_SUCCESS
  REGISTRATION_SUCCESSFUL: {
    type: "success",
    statusCode: 201,
    message: "Account created successfully. Please verify your email.",
    messageCode: "REGISTRATION_SUCCESSFUL",
  },
});

export const RESEND_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
  NOT_AUTHENTICATED: {
    code: "NOT_AUTHENTICATED",
    statusCode: 401, // Unauthorized: The user is not authenticated.
  },
  FORBIDDEN: {
    code: "FORBIDDEN",
    statusCode: 403, // Forbidden: The user does not have permission to resend the email.
  },
});
export const RESEND_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  EMAIL_SENT: {
    code: "EMAIL_SENT",
    statusCode: 200, // OK: Email sent successfully.
  },
});

export const VERIFY_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
  // OLD: INVALID_CREDENTIALS_OR_MISSING_FIELDS
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  // OLD: INCORRECT_CODE
  VERIFICATION_CODE_INVALID: {
    type: "error",
    statusCode: 400,
    message: "Invalid verification code",
    messageCode: "VERIFICATION_CODE_INVALID",
  },
  VERIFICATION_CODE_EXPIRED: {
    type: "error",
    statusCode: 410,
    message: "Verification code has expired. A new code has been sent.",
    messageCode: "VERIFICATION_CODE_EXPIRED",
  },
  // OLD: NOT_AUTHENTICATED
  AUTHENTICATION_REQUIRED: {
    type: "error",
    statusCode: 401,
    message: "Please log in to verify your email",
    messageCode: "AUTHENTICATION_REQUIRED",
  },
  // OLD: FORBIDDEN
  ACCESS_DENIED: {
    type: "error",
    statusCode: 403,
    message: "Access denied",
    messageCode: "ACCESS_DENIED",
  },
  // OLD: TWO_FA_NOT_SETUP
  TWO_FACTOR_SETUP_INCOMPLETE: {
    type: "error",
    statusCode: 303,
    message: "Please complete two-factor authentication setup",
    messageCode: "TWO_FACTOR_SETUP_INCOMPLETE",
  },
});
export const VERIFY_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  // OLD: EMAIL_VERIFIED
  EMAIL_VERIFIED_SUCCESSFULLY: {
    type: "success",
    statusCode: 200,
    message: "Email verified successfully",
    messageCode: "EMAIL_VERIFIED_SUCCESSFULLY",
  },
});

export const FORGET_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
  // OLD: INVALID_CREDENTIALS_OR_MISSING_FIELDS
  EMAIL_REQUIRED: {
    type: "error",
    statusCode: 400,
    message: "Email address is required",
    messageCode: "EMAIL_ADDRESS_REQUIRED",
  },
  // OLD: ACCOUNT_DOES_NOT_EXIST
  ACCOUNT_NOT_FOUND: {
    type: "error",
    statusCode: 404,
    message: "No account found with this email address",
    messageCode: "ACCOUNT_NOT_FOUND",
  },
});

export const FORGET_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_EMAIL_SENT: {
    type: "success",
    statusCode: 200,
    message: "Password reset instructions sent to your email",
    messageCode: "PASSWORD_RESET_EMAIL_SENT",
  },
});

// /** @constant */
// export const LOGIN_MESSAGES = /** @type {const} */ ({
//   ...LOGIN_MESSAGES_ERRORS,
//   ...LOGIN_MESSAGES_SUCCESS,
// });

/** @constant */
export const AUTH_URLS = /** @type {const} */ ({
  VERIFY_EMAIL: "/auth/verify-email",
  SETUP_2FA: "/auth/2fa/setup",
  TWO_FA: "/auth/2fa",
  REGISTER: "/auth/signup",
  LOGIN: "/auth/login",
  VERIFY_EMAIL_FOR_PASSWORD_RESET: "/auth/reset-password/verify-email",
  //
  SUCCESS_LOGIN: "/",
  SUCCESS_VERIFY_EMAIL: "/",
  SUCCESS_VERIFY_2FA: "/",
  SUCCESS_SETUP_2FA: "/auth/recovery-code",
  SUCCESS_RESET_2FA: "/auth/2fa/setup",
  SUCCESS_LOGOUT: "/auth/login",
  SUCCESS_UPDATE_EMAIL: "/auth/verify-email",
  SUCCESS_UPDATE_2FA: "/auth/2fa",
});
