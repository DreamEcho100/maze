import { encodeBase32LowerCaseNoPadding } from "@oslojs/encoding";

/**
 * Generates a random token.
 *
 * The token is generated using 20 random bytes encoded in base32.
 * Base32 is used because it's case-insensitive and more compact than hex encoding.
 *
 * @returns {string} A random token encoded as a base32 string.
 */
export function generateRandomToken() {
	const bytes = new Uint8Array(20);
	crypto.getRandomValues(bytes);
	const token = encodeBase32LowerCaseNoPadding(bytes);
	return token;
}
