import { customType } from "drizzle-orm/pg-core";
import { Ulid } from "id128"; // `id128` for binary conversion

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
				throw new Error(`Expected a Uint8Array, but received ${typeof val} instead.`);
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
				throw new Error(`Expected a Buffer, but received ${typeof val} instead.`);
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

export const byteaUlid =
	/** @type {typeof customType<{ data: string|null; driverData: Buffer }>} */ (customType)({
		dataType() {
			return "bytea";
		},
		toDriver(val) {
			if (val == null) {
				throw new Error("Value cannot be null or undefined for byteaUlid.");
			}

			if (typeof val !== "string") {
				throw new Error(`Expected a string, but received ${typeof val} instead.`);
			}

			return Buffer.from(Ulid.fromCanonical(val).toRaw(), "hex");
		},
		fromDriver(val) {
			if (val == null) {
				// If the value is null, return null
				return null;
			}

			if (!(val instanceof Buffer)) {
				throw new Error(`Expected a Buffer, but received ${typeof val} instead.`);
			}

			return Ulid.fromRawTrusted(val.toString("hex")).toCanonical();
		},
	});
