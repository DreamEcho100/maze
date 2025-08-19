// Credit: <https://github.com/h-yon/vscode-ulid-hex-converter/blob/main/src/extension.ts>

/**
 * Crockford's Base32 encoding alphabet used for ULID encoding
 * @type {string}
 */
const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Length of the encoding alphabet
 * @type {number}
 */
const ENCODING_LEN = ENCODING.length;

/**
 * Length of the time portion in a ULID
 * @type {number}
 */
const TIME_LEN = 10;

/**
 * Decodes the random portion of a ULID string to bigint
 * @param {string} id - The ULID string to decode
 * @returns {bigint} The decoded random portion as bigint
 */
function decodeRandom(id) {
	const random = id
		.substring(TIME_LEN)
		.split("")
		.reverse()
		.reduce((carry, char, index) => {
			const encodingIndex = ENCODING.indexOf(char);
			return carry + BigInt(encodingIndex * ENCODING_LEN ** index);
		}, BigInt(0));

	return random;
}

/**
 * Decodes a ULID to a specified radix representation
 * @param {string} id - The ULID string to decode
 * @param {number} radix - The target radix (e.g., 16 for hex)
 * @returns {string} The decoded value in the specified radix
 */
function decodeUlid(id, radix) {
	// Extract and decode time portion
	let time = decodeTime(id).toString(radix);
	if (time === "0") {
		time = "";
	}

	// Extract and decode random portion
	const random = decodeRandom(id).toString(radix);

	// Combine time and random parts
	let result = time + random;

	// Ensure even length by padding with leading zero if needed
	if (result.length % 2 === 1) {
		result = "0" + result;
	}

	return result;
}

/**
 * Encodes a numeric part using the ULID encoding alphabet
 * @param {number} part - The numeric value to encode
 * @param {number} len - The target length of the encoded string
 * @returns {string} The encoded string
 */
function encodePart(part, len) {
	let mod;
	let str = "";

	for (; len > 0; len--) {
		mod = part % ENCODING_LEN;
		str = ENCODING.charAt(mod) + str;
		part = (part - mod) / ENCODING_LEN;
	}

	return str;
}

/**
 * Encodes a hexadecimal string to ULID format
 * @param {string} hexId - The hexadecimal string to encode (without '0x' prefix)
 * @returns {string} The encoded ULID string
 */
function encodeHexToUlid(hexId) {
	let str = "";
	let tail;
	let id = hexId;

	while (id.length > 0) {
		// Process in chunks of 5 hex characters (20 bits)
		tail = id.slice(-5);
		str = encodePart(parseInt("0x" + tail), Math.min(4, id.length)) + str;
		id = id.slice(0, -5);
	}

	return str;
}

/**
 * Validates and normalizes a hexadecimal input string
 * @param {string} input - The input string to validate
 * @returns {{ isValid: true, normalized: string }|{ isValid: false, error: string }} Validation result
 */
function validateHexInput(input) {
	let id = input.toLowerCase();

	// Remove '0x' prefix if present
	if (id.substring(0, 2) === "0x") {
		id = id.substring(2);
	}

	// Check length constraint
	if (id.length > 32) {
		return { isValid: false, error: "Input too long (max 32 hex characters)" };
	}

	// Validate hex format
	if (id.search(/^[0-9a-f]+$/) === -1) {
		return { isValid: false, error: "Invalid hexadecimal format" };
	}

	// Pad to 32 characters
	const normalized = id.padStart(32, "0");

	return { isValid: true, normalized };
}

/**
 * Validates if a string is a valid ULID format
 * @param {string} input - The string to validate as ULID
 * @returns {boolean} True if valid ULID format
 */
function isValidUlid(input) {
	// ULID regex: starts with 0-7, followed by 25 characters from encoding alphabet
	const ulidRegex = /^[0-7][0123456789ABCDEFGHJKMNPQRSTVWXYZ]{25}$/;
	return ulidRegex.test(input);
}

/**
 * Converts hexadecimal string to ULID
 * @param {string} hexInput - The hexadecimal input string
 * @returns {{ success: true, result: string }|{ success: false, error: string }} Conversion result
 */
function hexToUlid(hexInput) {
	const validation = validateHexInput(hexInput);

	if (!validation.isValid) {
		return { success: false, error: validation.error };
	}

	try {
		const result = encodeHexToUlid(validation.normalized);
		return { success: true, result };
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? (error.message ?? "Encoding failed")
					: String(error ?? "Encoding failed"),
		};
	}
}

/**
 * Converts ULID to hexadecimal string
 * @param {string} ulidInput - The ULID input string
 * @returns {{ success: true, result: string, timestamp?: Date }|{ success: false, error: string }} Conversion result
 */
function ulidToHex(ulidInput) {
	if (!isValidUlid(ulidInput)) {
		return { success: false, error: "Invalid ULID format" };
	}

	try {
		const hexResult = decodeUlid(ulidInput, 16);
		const timestamp = new Date(decodeTime(ulidInput));

		return {
			success: true,
			result: hexResult,
			timestamp,
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? (error.message ?? "Decoding failed")
					: String(error ?? "Decoding failed"),
		};
	}
}

/**
 * Decodes the timestamp from a ULID
 * @param {string} id - The ULID string
 * @returns {number} The timestamp in milliseconds
 */
function decodeTime(id) {
	const timeStr = id.substring(0, TIME_LEN);
	let time = 0;

	for (let i = 0; i < timeStr.length; i++) {
		const char = timeStr.charAt(i);
		const encodingIndex = ENCODING.indexOf(char);
		time = time * ENCODING_LEN + encodingIndex;
	}

	return time;
}

/**
 * Gets ULID information including timestamp and hex representation
 * @param {string} ulidInput - The ULID string to analyze
 * @returns {{ success: boolean, info?: { ulid: string, timestamp: Date, timestampMs: number, hex: string }, error?: string }} ULID information
 */
function getUlidInfo(ulidInput) {
	if (!isValidUlid(ulidInput)) {
		return { success: false, error: "Invalid ULID format" };
	}

	try {
		const timestampMs = decodeTime(ulidInput);
		const timestamp = new Date(timestampMs);
		const hex = decodeUlid(ulidInput, 16);

		return {
			success: true,
			info: {
				ulid: ulidInput,
				timestamp,
				timestampMs,
				hex,
			},
		};
	} catch (error) {
		return {
			success: false,
			error:
				error instanceof Error
					? (error.message ?? "Failed to decode ULID")
					: String(error ?? "Failed to decode ULID"),
		};
	}
}

// Export all functions for use
export {
	decodeRandom,
	decodeUlid,
	encodePart,
	encodeHexToUlid,
	validateHexInput,
	isValidUlid,
	hexToUlid,
	ulidToHex,
	decodeTime,
	getUlidInfo,
	ENCODING,
	ENCODING_LEN,
	TIME_LEN,
};
