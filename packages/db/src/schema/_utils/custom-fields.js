import { customType } from "drizzle-orm/pg-core";
import { hexToUlid, ulidToHex } from "./ulid.js";
// // import { Ulid } from "id128"; // `id128` for binary conversion
// import pkg from "id128";

// const { Ulid } = pkg;

export const bytea =
	/** @type {typeof customType<{ data: Uint8Array<ArrayBufferLike> | null | undefined; notNull: false; default: false }>} */ (
		customType
	)({
		dataType() {
			return "bytea";
		},
		toDriver(val) {
			if (val == null) {
				// If the value is null, return null
				return null;
			}

			if (val instanceof Buffer) {
				// If the value is already a Buffer, return it directly
				return val;
			}

			if (!(val instanceof Uint8Array)) {
				throw new Error(
					`Expected a Uint8Array, but received ${typeof val} instead.`,
				);
			}

			// wrap your Uint8Array in a Buffer so pg always gets a Buffer
			return Buffer.from(val);
		},
		fromDriver(val) {
			// if (val !== null && !(val instanceof Buffer)) {
			// 	throw new Error(
			// 		`Expected a Buffer, but received ${typeof val} instead.`,
			// 	);
			// }

			if (val == null) {
				// If the value is null, return null
				return null;
			}

			if (!(val instanceof Buffer)) {
				throw new Error(
					`Expected a Buffer, but received ${typeof val} instead.`,
				);
			}

			// return val;

			// pg will give you a Buffer.
			// If you don't care about sharing the same underlying memory,
			// you can just return it (Buffer IS a Uint8Array):
			//    return val;
			//
			// But if you want a clean, standalone Uint8Array copy,
			// use the underlying ArrayBuffer and offsets:
			return /** @type {Uint8Array<ArrayBufferLike>} */ (
				new Uint8Array(val.buffer, val.byteOffset, val.byteLength)
			);
		},
	});

// export const byteaUlid =
// 	/** @type {typeof customType<{ data: string; driverData: Buffer }>} */ (
// 		customType
// 	)({
// 		dataType() {
// 			return "bytea";
// 		},
// 		toDriver(val) {
// 			if (val == null) {
// 				throw new Error("Value cannot be null or undefined for byteaUlid.");
// 			}

// 			if (typeof val !== "string") {
// 				throw new Error(
// 					`Expected a string, but received ${typeof val} instead.`,
// 				);
// 			}

// 			return Buffer.from(Ulid.fromCanonical(val).toRaw(), "hex");
// 		},
// 		fromDriver(val) {
// 			// if (val == null) {
// 			// 	// If the value is null, return null
// 			// 	return null;
// 			// }

// 			if (!(val instanceof Buffer)) {
// 				throw new Error(
// 					`Expected a Buffer, but received ${typeof val} instead.`,
// 				);
// 			}

// 			return Ulid.fromRawTrusted(val.toString("hex")).toCanonical();
// 		},
// 	});

// // Helper function to convert ULID string to hex
// /** @param {string} ulid - The ULID string to convert. */
// function ulidToHex(ulid) {
// 	// console.log("___ ulid", ulid);
// 	// if (typeof ulid !== "string" || ulid.length !== 26) {
// 	// 	throw new Error("Invalid ULID string format");
// 	// }

// 	// const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
// 	// let bits = "";

// 	// for (const char of ulid.toUpperCase()) {
// 	// 	const val = base32Chars.indexOf(char);
// 	// 	if (val === -1) throw new Error("Invalid ULID character");
// 	// 	bits += val.toString(2).padStart(5, "0");
// 	// }

// 	// console.log("___ b bits", bits);
// 	// // 130 bits → take the first 128 bits (last 2 are padding)
// 	// bits = bits.slice(0, 128);
// 	// console.log("___ a bits", bits);

// 	// // Convert bits to hex (16 bytes = 32 hex chars)
// 	// let hex = "";
// 	// for (let i = 0; i < 128; i += 8) {
// 	// 	const byte = bits.slice(i, i + 8);
// 	// 	hex += parseInt(byte, 2).toString(16).padStart(2, "0");
// 	// }

// 	// return hex;

// 	console.log("___ ulid", ulid);
// 	// Base32 characters used in ULID
// 	const base32chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// 	// Ensure the input is uppercase and 26 characters long
// 	ulid = ulid.toUpperCase();
// 	if (ulid.length !== 26) {
// 		throw new Error("ULID must be exactly 26 characters long.");
// 	}

// 	// Convert Base32 to 128-bit (16 bytes) binary
// 	let binaryString = "";
// 	for (const char of ulid) {
// 		const index = base32chars.indexOf(char);
// 		if (index === -1) {
// 			throw new Error(`Invalid character found in ULID: ${char}`);
// 		}
// 		// Each Base32 character represents 5 bits
// 		binaryString += index.toString(2).padStart(5, "0");
// 	}

// 	// Trim binary string to 128 bits (16 bytes)
// 	binaryString = binaryString.substring(0, 128);

// 	// Convert binary string to hexadecimal (16 bytes long)
// 	let hex = "";
// 	for (let i = 0; i < binaryString.length; i += 4) {
// 		const chunk = binaryString.substring(i, i + 4);
// 		hex += parseInt(chunk, 2).toString(16);
// 	}

// 	// Pad to 32 characters (16 bytes) and convert to uppercase
// 	hex = hex.padEnd(32, "0").toUpperCase();

// 	return hex;
// }

// // Helper function to convert hex back to ULID string
// /** @param {string} hex - The hex string to convert. */
// function hexToUlid(hex) {
// 	// if (typeof hex !== "string" || hex.length !== 32) {
// 	// 	throw new Error("Invalid hex string format for ULID");
// 	// }

// 	// // Convert hex to bits
// 	// let bits = "";
// 	// for (let i = 0; i < hex.length; i += 2) {
// 	// 	const byte = parseInt(hex.slice(i, i + 2), 16);
// 	// 	bits += byte.toString(2).padStart(8, "0");
// 	// }

// 	// // Convert bits back to ULID base32
// 	// const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
// 	// let ulid = "";

// 	// for (let i = 0; i < 130; i += 5) {
// 	// 	const chunk = bits.slice(i, i + 5);
// 	// 	if (chunk.length === 5) {
// 	// 		const val = parseInt(chunk, 2);
// 	// 		ulid += base32Chars[val];
// 	// 	}
// 	// }

// 	// return ulid.slice(0, 26);

// 	// if (typeof hex !== "string" || hex.length !== 32) {
// 	// 	throw new Error("Invalid hex string format for ULID");
// 	// }
// 	// // Convert hex to bits
// 	// let bits = "";
// 	// for (let i = 0; i < hex.length; i += 2) {
// 	// 	const byte = parseInt(hex.slice(i, i + 2), 16);
// 	// 	bits += byte.toString(2).padStart(8, "0");
// 	// }

// 	// // Convert bits back to ULID base32
// 	// const base32Chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
// 	// let ulid = "";

// 	// let i = 0;
// 	// console.log("___ i", i, hex.length);
// 	// // Process first 25 complete 5-bit chunks (125 bits)
// 	// for (; i < 125; i += 5) {
// 	// 	const chunk = bits.slice(i, i + 5);
// 	// 	const val = parseInt(chunk, 2);
// 	// 	ulid += base32Chars[val];
// 	// }
// 	// console.log("___ i", i, hex.length);
// 	// console.log("___ bits.slice(125)", bits.slice(125), bits.slice(125).length);

// 	// // Handle the last 3 bits (128 - 125 = 3 remaining bits)
// 	// const lastChunk = bits.slice(125, 128);
// 	// if (lastChunk.length > 0) {
// 	// 	// Pad the last 3 bits to 5 bits for base32 conversion
// 	// 	const paddedChunk = lastChunk.padEnd(5, "0");
// 	// 	const val = parseInt(paddedChunk, 2);
// 	// 	ulid += base32Chars[val];
// 	// }

// 	// return ulid;

// 	// Base32 characters used in ULID
// 	const base32chars = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

// 	// Ensure the input is uppercase and 32 characters long (16 bytes)
// 	hex = hex.toUpperCase();
// 	if (hex.length !== 32) {
// 		throw new Error(
// 			"Hex string must be exactly 32 characters long (16 bytes).",
// 		);
// 	}

// 	// Validate hex characters
// 	if (!/^[0-9A-F]+$/.test(hex)) {
// 		throw new Error("Invalid hex characters found.");
// 	}

// 	// Convert hex to binary string
// 	let binaryString = "";
// 	for (let i = 0; i < hex.length; i += 2) {
// 		const hexByte = hex.substring(i, i + 2);
// 		const byte = parseInt(hexByte, 16);
// 		binaryString += byte.toString(2).padStart(8, "0");
// 	}

// 	// Ensure we have exactly 128 bits
// 	binaryString = binaryString.substring(0, 128);

// 	// Convert binary to ULID Base32
// 	let ulid = "";

// 	// Process first 25 complete 5-bit chunks (125 bits)
// 	for (let i = 0; i < 125; i += 5) {
// 		const chunk = binaryString.substring(i, i + 5);
// 		const val = parseInt(chunk, 2);
// 		ulid += base32chars[val];
// 	}

// 	// Handle the last 3 bits (128 - 125 = 3 remaining bits)
// 	const lastChunk = binaryString.substring(125, 128);
// 	if (lastChunk.length > 0) {
// 		// Pad the last 3 bits to 5 bits for base32 conversion
// 		const paddedChunk = lastChunk.padEnd(5, "0");
// 		const val = parseInt(paddedChunk, 2);
// 		ulid += base32chars[val];
// 	}

// 	return ulid;
// }

export const ulidBytea =
	/** @type {typeof customType<{ data: string; driverData: Buffer }>} */ (
		customType
	)({
		dataType() {
			return "bytea";
		},
		toDriver(val) {
			if (val == null || typeof val !== "string") {
				throw new Error(
					`Expected a string, but received ${typeof val} instead.`,
				);
			}

			const hexResult = ulidToHex(val);
			if (!hexResult.success) {
				throw new Error(`Invalid ULID format: ${hexResult.error}`);
			}

			return Buffer.from(hexResult.result, "hex");
		},
		fromDriver(val) {
			if (val == null || !(val instanceof Buffer)) {
				throw new Error(
					`Expected a Buffer, but received ${typeof val} instead.`,
				);
			}

			const hex = val.toString("hex");
			const ulidResult = hexToUlid(hex);

			if (!ulidResult.success) {
				throw new Error(`Invalid hex format: ${ulidResult.error}`);
			}

			console.log("___ ulidResult.result", ulidResult.result);
			return ulidResult.result;
		},
	});

// const ulidStrTest = "0066311bf3e2ae5a4dd8250368297de9"
// const ulidHexExpected = "0066311bf3e2ae5a4dd8250368297de9"
// 01K326ZKWAQ5MKER4M1PGABXX
