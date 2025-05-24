/** @import { ActionResultBase } from "#types.ts"; */

// Standardize error shapes across all services
export class AuthError extends Error {
	/**
	 * @param {ActionResultBase<'error'>} shape
	 * @param {unknown} meta
	 */
  constructor(shape, meta = {}) {
    super(shape.message);
		this.statusCode = shape.statusCode;
    this.messageCode = shape.messageCode;
    this.meta = meta;
  }
}

/** 
 * Checks if the provided error is an instance of AuthError.
 *
 * @param {unknown} error - The error to check.
 * @returns {error is AuthError} True if the error is an AuthError, false otherwise.
 */
export function isAuthError(error) {
	return error instanceof AuthError;
}