import { DynamicBuffer } from "@oslojs/binary";
import { decodeBase64 } from "@oslojs/encoding";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
	throw new Error("ENCRYPTION_KEY is not set in the environment");
}

const keyData = decodeBase64(ENCRYPTION_KEY);

// Import the key for Web Crypto API
const cryptoKey = await crypto.subtle.importKey("raw", keyData, { name: "AES-GCM" }, false, [
	"encrypt",
	"decrypt",
]);

/**
 * @param {Uint8Array} data - The data to be encrypted.
 * @returns {Promise<Uint8Array>} The encrypted data.
 */
export async function encrypt(data) {
	const iv = new Uint8Array(16);
	crypto.getRandomValues(iv);

	const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv: iv }, cryptoKey, data);

	const encryptedArray = new Uint8Array(encrypted);
	const authTag = encryptedArray.slice(-16); // Last 16 bytes are the auth tag
	const ciphertext = encryptedArray.slice(0, -16); // Everything except the last 16 bytes

	const result = new DynamicBuffer(0);
	result.write(iv);
	result.write(ciphertext);
	result.write(authTag);
	return result.bytes();
}

/**
 * @param {string} data - The string to be encrypted.
 * @returns {Promise<Uint8Array>} The encrypted data.
 */
export async function encryptString(data) {
	return await encrypt(new TextEncoder().encode(data));
}

/**
 * @param {Uint8Array} encrypted - The encrypted data.
 * @returns {Promise<Uint8Array>} The decrypted data.
 */
export async function decrypt(encrypted) {
	if (encrypted.byteLength < 33) {
		throw new Error("Invalid data");
	}

	const iv = encrypted.slice(0, 16);
	const authTag = encrypted.slice(encrypted.byteLength - 16);
	const ciphertext = encrypted.slice(16, encrypted.byteLength - 16);

	// Combine ciphertext and auth tag for Web Crypto API
	const encryptedData = new Uint8Array(ciphertext.length + authTag.length);
	encryptedData.set(ciphertext);
	encryptedData.set(authTag, ciphertext.length);

	try {
		const decrypted = await crypto.subtle.decrypt(
			{ name: "AES-GCM", iv: iv },
			cryptoKey,
			encryptedData,
		);

		return new Uint8Array(decrypted);
	} catch (error) {
		console.error("Decryption error:", error);
		throw new Error("Decryption failed");
	}
}

/**
 * @param {Uint8Array} data - The data to be decrypted.
 * @returns {Promise<string>} The decrypted data.
 */
export async function decryptToString(data) {
	const decrypted = await decrypt(data);
	return new TextDecoder().decode(decrypted);
}
