interface CookieOptions {
	maxAge?: number;
	expires?: Date | string;
	domain?: string;
	secure?: boolean;
	sameSite?: "strict" | "lax" | "none";
	path?: string;
	httpOnly?: boolean; // Note: Only works server-side
}

interface CookieError {
	type: "SIZE_EXCEEDED" | "INVALID_NAME" | "SETTING_FAILED" | "PARSING_FAILED";
	message: string;
	cookieName?: string;
}

class CookieManagerError extends Error {
	public readonly cookieError: CookieError;

	constructor(error: CookieError) {
		super(error.message);
		this.name = "CookieManagerError";
		this.cookieError = error;
	}
}

export const cookieManager = {
	/**
	 * Get a cookie value by name
	 * @param name Cookie name
	 * @returns Cookie value or undefined if not found
	 * @throws CookieManagerError if parsing fails
	 */
	getCookie(name: string): string | undefined {
		if (typeof document === "undefined") return undefined;

		try {
			// Validate cookie name
			if (!this._isValidCookieName(name)) {
				throw new CookieManagerError({
					type: "INVALID_NAME",
					message: `Invalid cookie name: ${name}`,
					cookieName: name,
				});
			}

			const cookies = document.cookie ? document.cookie.split("; ") : [];

			for (const cookie of cookies) {
				const [key, ...val] = cookie.split("=");
				if (key === encodeURIComponent(name)) {
					const value = val.join("=");
					return decodeURIComponent(value);
				}
			}

			return undefined;
		} catch (error) {
			if (error instanceof CookieManagerError) throw error;

			throw new CookieManagerError({
				type: "PARSING_FAILED",
				message: `Failed to parse cookie "${name}": ${error instanceof Error ? error.message : String(error)}`,
				cookieName: name,
			});
		}
	},

	/**
	 * Set a cookie with comprehensive options and error handling
	 * @param name Cookie name
	 * @param value Cookie value
	 * @param options Cookie options
	 * @throws CookieManagerError if setting fails
	 */
	setCookie(name: string, value: string, options: CookieOptions = {}): void {
		if (typeof document === "undefined") return;

		try {
			// Validate inputs
			if (!this._isValidCookieName(name)) {
				throw new CookieManagerError({
					type: "INVALID_NAME",
					message: `Invalid cookie name: ${name}`,
					cookieName: name,
				});
			}

			const encodedName = encodeURIComponent(name);
			const encodedValue = encodeURIComponent(value);

			// Check size limit (4KB total cookie string)
			const estimatedSize = encodedName.length + encodedValue.length;
			if (estimatedSize > 3800) {
				// Leave room for attributes
				throw new CookieManagerError({
					type: "SIZE_EXCEEDED",
					message: `Cookie "${name}" exceeds size limit (${estimatedSize} bytes). Maximum recommended size is 3800 bytes.`,
					cookieName: name,
				});
			}

			// Build cookie string
			let cookieString = `${encodedName}=${encodedValue}`;

			// Add path
			cookieString += `; path=${options.path || "/"}`;

			// Add expiration - prioritize expires over maxAge
			if (options.expires) {
				const expiresDate =
					typeof options.expires === "string" ? new Date(options.expires) : options.expires;

				if (Number.isNaN(expiresDate.getTime())) {
					throw new CookieManagerError({
						type: "SETTING_FAILED",
						message: `Invalid expires date for cookie "${name}"`,
						cookieName: name,
					});
				}

				cookieString += `; expires=${expiresDate.toUTCString()}`;
			} else if (options.maxAge !== undefined) {
				if (options.maxAge < 0) {
					throw new CookieManagerError({
						type: "SETTING_FAILED",
						message: `Invalid maxAge for cookie "${name}": must be non-negative`,
						cookieName: name,
					});
				}
				cookieString += `; max-age=${options.maxAge}`;
			} else {
				// Default to 1 year
				cookieString += "; max-age=31536000";
			}

			// Add SameSite
			const sameSite = options.sameSite || "Lax";
			cookieString += `; SameSite=${sameSite}`;

			// Add domain if specified
			if (options.domain) {
				cookieString += `; domain=${options.domain}`;
			}

			// Add Secure flag
			const isProduction = process.env.NODE_ENV === "production";
			const isHttps = typeof location !== "undefined" && location.protocol === "https:";
			const shouldBeSecure = options.secure ?? (isProduction && isHttps);

			if (shouldBeSecure) {
				cookieString += "; Secure";
			}

			// Validate SameSite=None requires Secure
			if (sameSite === "none" && !shouldBeSecure) {
				throw new CookieManagerError({
					type: "SETTING_FAILED",
					message: `Cookie "${name}" with SameSite=None requires Secure flag`,
					cookieName: name,
				});
			}

			// HttpOnly can only be set server-side, warn if attempted client-side
			if (options.httpOnly) {
				console.warn(
					`HttpOnly flag for cookie "${name}" ignored on client-side. Use server-side cookie utilities instead.`,
				);
			}

			// Store previous cookie value for rollback
			const _previousValue = this.getCookie(name);

			// Set the cookie
			document.cookie = cookieString;

			// Verify the cookie was set (basic check)
			// Small delay to allow browser to process
			setTimeout(() => {
				const newValue = this.getCookie(name);
				if (newValue !== value) {
					console.warn(
						`Cookie "${name}" may not have been set correctly. Expected: "${value}", Got: "${newValue}"`,
					);
				}
			}, 10);
		} catch (error) {
			if (error instanceof CookieManagerError) throw error;

			throw new CookieManagerError({
				type: "SETTING_FAILED",
				message: `Failed to set cookie "${name}": ${error instanceof Error ? error.message : String(error)}`,
				cookieName: name,
			});
		}
	},

	/**
	 * Delete a cookie by setting it to expire immediately
	 * @param name Cookie name
	 * @param options Options (should match original cookie's domain/path)
	 * @throws CookieManagerError if deletion fails
	 */
	deleteCookie(name: string, options: CookieOptions = {}): void {
		if (typeof document === "undefined") return;

		try {
			if (!this._isValidCookieName(name)) {
				throw new CookieManagerError({
					type: "INVALID_NAME",
					message: `Invalid cookie name: ${name}`,
					cookieName: name,
				});
			}

			// Set cookie with past expiration date
			const pastDate = new Date(0); // January 1, 1970

			let cookieString = `${encodeURIComponent(name)}=; path=${options.path || "/"}; expires=${pastDate.toUTCString()}; SameSite=${options.sameSite || "Lax"}`;

			if (options.domain) cookieString += `; domain=${options.domain}`;
			if (options.secure) cookieString += "; Secure";

			document.cookie = cookieString;

			// Verify deletion
			setTimeout(() => {
				const stillExists = this.getCookie(name);
				if (stillExists !== undefined) {
					console.warn(`Cookie "${name}" may not have been deleted. Check domain/path options.`);
				}
			}, 10);
		} catch (error) {
			if (error instanceof CookieManagerError) throw error;

			throw new CookieManagerError({
				type: "SETTING_FAILED",
				message: `Failed to delete cookie "${name}": ${error instanceof Error ? error.message : String(error)}`,
				cookieName: name,
			});
		}
	},

	/**
	 * Get all cookies as an object
	 * @returns Object with cookie names as keys and values
	 */
	getAllCookies(): Record<string, string> {
		if (typeof document === "undefined") return {};

		try {
			const cookies: Record<string, string> = {};
			const cookieString = document.cookie;

			if (!cookieString) return cookies;

			const cookieArray = cookieString.split("; ");

			for (const cookie of cookieArray) {
				const [key, ...val] = cookie.split("=");
				if (key) {
					try {
						const decodedKey = decodeURIComponent(key);
						const decodedValue = decodeURIComponent(val.join("="));
						cookies[decodedKey] = decodedValue;
					} catch (_decodeError) {
						// Skip malformed cookies
						console.warn(`Skipping malformed cookie: ${key}`);
					}
				}
			}

			return cookies;
		} catch (error) {
			throw new CookieManagerError({
				type: "PARSING_FAILED",
				message: `Failed to parse all cookies: ${error instanceof Error ? error.message : String(error)}`,
			});
		}
	},

	/**
	 * Check if a cookie exists
	 * @param name Cookie name
	 * @returns Boolean indicating if cookie exists
	 */
	hasCookie(name: string): boolean {
		try {
			return this.getCookie(name) !== undefined;
		} catch {
			return false;
		}
	},

	/**
	 * Clear all cookies (best effort - requires knowing domain/path for each)
	 * @param options Common options for all cookies being cleared
	 */
	clearAllCookies(options: CookieOptions = {}): void {
		if (typeof document === "undefined") return;

		try {
			const allCookies = this.getAllCookies();

			for (const cookieName of Object.keys(allCookies)) {
				try {
					this.deleteCookie(cookieName, options);
				} catch (error) {
					console.warn(`Failed to delete cookie "${cookieName}":`, error);
				}
			}
		} catch (error) {
			console.warn("Failed to clear all cookies:", error);
		}
	},

	/**
	 * Validate cookie name according to RFC 6265
	 * @private
	 */
	_isValidCookieName(name: string): boolean {
		if (!name || typeof name !== "string") return false;

		// Cookie names cannot contain these characters
		const invalidChars = /[()<>@,;:\\"/[\]?={}\s\t]/;
		return !invalidChars.test(name) && name.length > 0;
	},

	/**
	 * Safe wrapper for cookie operations with error handling
	 * @param operation Function to execute
	 * @param fallbackValue Value to return on error (for get operations)
	 */
	safely<T>(operation: () => T, fallbackValue?: T): T | undefined {
		try {
			return operation();
		} catch (error) {
			if (error instanceof CookieManagerError) {
				console.error("Cookie operation failed:", error.cookieError);
			} else {
				console.error("Unexpected cookie error:", error);
			}
			return fallbackValue;
		}
	},
};

// Convenience wrapper for common operations
export const safeCookieManager = {
	get: (name: string, fallback?: string) =>
		cookieManager.safely(() => cookieManager.getCookie(name), fallback),

	set: (name: string, value: string, options?: CookieOptions) =>
		cookieManager.safely(() => cookieManager.setCookie(name, value, options)),

	delete: (name: string, options?: CookieOptions) =>
		cookieManager.safely(() => cookieManager.deleteCookie(name, options)),

	has: (name: string) => cookieManager.safely(() => cookieManager.hasCookie(name), false),
};

// Example usage with error handling:
/*
try {
  cookieManager.setCookie('user-pref', 'dark-theme', {
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    secure: true,
    sameSite: 'Strict'
  });
} catch (error) {
  if (error instanceof CookieManagerError) {
    console.error('Cookie error:', error.cookieError.type, error.cookieError.message);
  }
}

// Or use the safe wrapper:
safeCookieManager.set('user-pref', 'dark-theme', {
  expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  secure: true
});
*/
