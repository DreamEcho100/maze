import { sha1 } from "@oslojs/crypto/sha1";
import { sha256, sha512 } from "@oslojs/crypto/sha2";
import { encodeHexLowerCase } from "@oslojs/encoding";

/**
 * @param {string} token
 * @param {{
 * 	TextEncoder?: typeof TextEncoder
 *  algorithm?: "sha256" | "sha512" | "sha1"
 * }} [options]
 */
export function getSessionId(
	token,
	{ TextEncoder = globalThis.TextEncoder, algorithm = "sha256" } = {},
) {
	// return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
	switch (algorithm) {
		case "sha256":
			return encodeHexLowerCase(sha256(new TextEncoder().encode(token)));
		case "sha512":
			return encodeHexLowerCase(sha512(new TextEncoder().encode(token)));
		case "sha1":
			return encodeHexLowerCase(sha1(new TextEncoder().encode(token)));
		default:
			// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
			throw new Error(`Unsupported algorithm: ${algorithm}`);
	}
}
