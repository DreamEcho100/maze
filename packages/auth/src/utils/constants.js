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


export const LOGOUT_MESSAGES_ERRORS = /** @type {const} */ ({
  AUTHENTICATION_REQUIRED: {
    type: "error",
    message: "Please log in first",
    messageCode: "AUTHENTICATION_REQUIRED",
    statusCode: 401,
  },
});
export const LOGOUT_MESSAGES_SUCCESS = /** @type {const} */ ({
  LOGOUT_SUCCESS: {
    type: "success",
    message: "Logged out successfully",
    messageCode: "LOGOUT_SUCCESSFUL",
    statusCode: 200,
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

export const RESEND_EMAIL_MESSAGES_ERRORS = /** @type {const} */ ({
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
});
export const RESEND_EMAIL_MESSAGES_SUCCESS = /** @type {const} */ ({
  // OLD: EMAIL_SENT
  VERIFICATION_EMAIL_SENT: {
    type: "success",
    statusCode: 200,
    message: "email reset instructions sent to your email",
    messageCode: "VERIFICATION_EMAIL_SENT",
  },
});

export const RESET_PASSWORD_MESSAGES_ERRORS = /** @type {const} */ ({
  // OLD: NOT_AUTHENTICATED
  AUTHENTICATION_REQUIRED: {
    type: "error",
    statusCode: 401,
    message: "Please complete the password reset verification process",
    messageCode: "AUTHENTICATION_REQUIRED",
  },
  // OLD: ACCESS_DENIED
  ACCESS_DENIED: {
    type: "error",
    statusCode: 403,
    message: "Access denied",
    messageCode: "ACCESS_DENIED",
  },
  // OLD: EMAIL_NOT_VERIFIED
  EMAIL_VERIFICATION_REQUIRED: {
    type: "error",
    statusCode: 403,
    message: "Email verification required",
    messageCode: "EMAIL_VERIFICATION_REQUIRED",
  },
  // OLD: PASSWORD_TOO_WEAK
  PASSWORD_TOO_WEAK: {
    type: "error",
    statusCode: 400,
    message: "Password does not meet security requirements",
    messageCode: "PASSWORD_STRENGTH_INSUFFICIENT",
  },
});
export const RESET_PASSWORD_MESSAGES_SUCCESS = /** @type {const} */ ({
  PASSWORD_RESET_SUCCESSFUL: {
    type: "success",
    statusCode: 200,
    message: "Password reset successfully",
    messageCode: "PASSWORD_RESET_SUCCESSFUL",
  },
});

export const RESET_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
  // OLD: NOT_AUTHENTICATED
  AUTHENTICATION_REQUIRED: {
    type: "error",
    statusCode: 401,
    message: "Please log in first",
    messageCode: "AUTHENTICATION_REQUIRED",
  },
  // OLD: FORBIDDEN
  ACCESS_DENIED: {
    type: "error",
    statusCode: 403,
    message: "Access denied",
    messageCode: "ACCESS_DENIED",
  },
  // OLD: INVALID_RECOVERY_CODE
  RECOVERY_CODE_INVALID: {
    type: "error",
    statusCode: 400,
    message: "Invalid recovery code",
    messageCode: "RECOVERY_CODE_INVALID",
  },
  // OLD: INVALID_OR_MISSING_FIELDS
  RECOVERY_CODE_REQUIRED: {
    type: "error",
    statusCode: 400,
    message: "Recovery code is required",
    messageCode: "RECOVERY_CODE_REQUIRED",
  },
  // OLD: TWO_FA_NOT_ENABLED
  TWO_FACTOR_NOT_ENABLED: {
    type: "error",
    statusCode: 403,
    message: "Two-factor authentication is not enabled",
    messageCode: "TWO_FACTOR_NOT_ENABLED",
  },
});
export const RESET_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  TWO_FACTOR_RESET_SUCCESSFUL: {
    type: "success",
    statusCode: 200,
    message: "Two-factor authentication reset successfully",
    messageCode: "TWO_FACTOR_RESET_SUCCESSFUL",
  },
});

export const SETUP_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  // OLD: NOT_AUTHENTICATED
  AUTHENTICATION_REQUIRED: {
    type: "error",
    statusCode: 401,
    message: "Please log in first",
    messageCode: "AUTHENTICATION_REQUIRED",
  },
  // OLD: FORBIDDEN
  ACCESS_DENIED: {
    type: "error",
    statusCode: 403,
    message: "Access denied",
    messageCode: "ACCESS_DENIED",
  },
  // OLD: INVALID_KEY
  TOTP_KEY_INVALID: {
    type: "error",
    statusCode: 400,
    message: "Invalid TOTP key",
    messageCode: "TOTP_KEY_INVALID",
  },
  // OLD: INVALID_CODE
  VERIFICATION_CODE_INVALID: {
    type: "error",
    statusCode: 400,
    message: "Invalid verification code",
    messageCode: "VERIFICATION_CODE_INVALID",
  },
  // OLD: TWO_FACTOR_NOT_ENABLED
  TWO_FACTOR_NOT_ENABLED: {
    type: "error",
    statusCode: 403,
    message: "Two-factor authentication is not enabled",
    messageCode: "TWO_FACTOR_NOT_ENABLED",
  },
});
export const SETUP_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  TWO_FACTOR_RESET_SUCCESSFUL: {
    type: "success",
    statusCode: 200,
    message: "Two-factor authentication reset successfully",
    messageCode: "TWO_FACTOR_RESET_SUCCESSFUL",
  },
});

export const VERIFY_2FA_MESSAGES_ERRORS = /** @type {const} */ ({
  // OLD: AUTHENTICATION_REQUIRED
  ACCESS_DENIED: {
    type: "error",
    statusCode: 403,
    message: "Access denied",
    messageCode: "ACCESS_DENIED",
  },
  // OLD: NOT_AUTHENTICATED
  AUTHENTICATION_REQUIRED: {
    type: "error",
    statusCode: 401,
    message: "Please log in first",
    messageCode: "AUTHENTICATION_REQUIRED",
  },
  // OLD: INVALID_CODE
  VERIFICATION_CODE_INVALID: {
    type: "error",
    statusCode: 400,
    message: "Invalid two-factor authentication code",
    messageCode: "TWO_FACTOR_CODE_INVALID",
  },
  INVALID_OR_MISSING_FIELDS: {
    type: "error",
    statusCode: 400,
    message: "Invalid or missing fields",
    messageCode: "INVALID_OR_MISSING_FIELDS",
  },
  TWO_FACTOR_NOT_ENABLED: {
    type: "error",
    statusCode: 403,
    message: "Two-factor authentication is not enabled",
    messageCode: "TWO_FACTOR_NOT_ENABLED",
  },
});
export const VERIFY_2FA_MESSAGES_SUCCESS = /** @type {const} */ ({
  // OLD: TWO_FA_VERIFIED_SUCCESS
  TWO_FACTOR_VERIFIED: {
    type: "success",
    statusCode: 200,
    message: "Two-factor authentication verified successfully",
    messageCode: "TWO_FACTOR_VERIFIED_SUCCESSFULLY",
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
