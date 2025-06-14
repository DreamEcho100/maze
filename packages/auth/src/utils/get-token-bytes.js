import { sha256 } from "@oslojs/crypto/sha2";

/**
 * Get token hash as Uint8Array
 * @param {string} token
 * @returns {Uint8Array}
 */
export function getTokenBytes(token) {
	return sha256(new TextEncoder().encode(token));
}
