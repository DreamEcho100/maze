/**
 * @import { UsersProvider, SessionsProvider, PasswordResetSessionsProvider, UserEmailVerificationRequestsProvider, AuthStrategy, SessionValidationResult, AuthProvidersWithGetSessionUtils, AuthProvidersShape, AuthProvidersWithGetSessionProviders } from "@de100/auth-core/types";
 */

import { dateLikeToDate } from "@de100/auth-core/utils/dates";
import { decrypt, decryptToString } from "@de100/auth-core/utils/encryption";
import { and, eq, isNull, lt } from "drizzle-orm";
import { ulid } from "ulid";
import { db, dbSchema } from "../client.js";

// export * from "./def";

// import { db, dbSchema } from "../db/index.js";

const userReturnTemplate = {
	name: dbSchema.user.name,
	displayName: dbSchema.user.displayName,
	id: dbSchema.user.id,
	createdAt: dbSchema.user.createdAt,
	lastUpdatedAt: dbSchema.user.lastUpdatedAt,
	email: dbSchema.user.email,
	emailVerifiedAt: dbSchema.user.emailVerifiedAt,
	twoFactorEnabledAt: dbSchema.user.twoFactorEnabledAt,
	twoFactorRegisteredAt: dbSchema.user.twoFactorRegisteredAt,
};
const userReturnSchema = /** @type {const} */ ({
	name: true,
	displayName: true,
	id: true,
	createdAt: true,
	lastUpdatedAt: true,
	email: true,
	emailVerifiedAt: true,
	twoFactorEnabledAt: true,
	twoFactorRegisteredAt: true,
});

const sessionReturnTemplate = {
	id: dbSchema.userSession.id,
	userId: dbSchema.userSession.userId,
	createdAt: dbSchema.userSession.createdAt,
	lastUpdatedAt: dbSchema.userSession.lastUpdatedAt,
	expiresAt: dbSchema.userSession.expiresAt,
	ipAddress: dbSchema.userSession.ipAddress,
	userAgent: dbSchema.userSession.userAgent,
	twoFactorVerifiedAt: dbSchema.userSession.twoFactorVerifiedAt,
	//
	authStrategy: dbSchema.userSession.authStrategy,
	revokedAt: dbSchema.userSession.revokedAt,
	lastUsedAt: dbSchema.userSession.lastUsedAt,
	// metadata: dbSchema.userSession.metadata,
	lastVerifiedAt: dbSchema.userSession.lastVerifiedAt,
	lastExtendedAt: dbSchema.userSession.lastExtendedAt,
};
const sessionReturnSchema = /** @type {const} */ ({
	id: true,
	userId: true,
	createdAt: true,
	lastUpdatedAt: true,
	expiresAt: true,
	ipAddress: true,
	userAgent: true,
	twoFactorVerifiedAt: true,
	//
	authStrategy: true,
	revokedAt: true,
	lastUsedAt: true,
	metadata: true,
});

const emailVerificationRequestReturnTemplate = {
	id: dbSchema.userEmailVerificationRequest.id,
	code: dbSchema.userEmailVerificationRequest.code,
	userId: dbSchema.userEmailVerificationRequest.userId,
	expiresAt: dbSchema.userEmailVerificationRequest.expiresAt,
	createdAt: dbSchema.userEmailVerificationRequest.createdAt,
	email: dbSchema.userEmailVerificationRequest.email,
};
const _emailVerificationRequestReturnSchema = /** @type {const} */ ({
	id: true,
	code: true,
	userId: true,
	expiresAt: true,
	createdAt: true,
	email: true,
});

const passwordResetSessionReturnTemplate = {
	id: dbSchema.userPasswordResetSession.id,
	userId: dbSchema.userPasswordResetSession.userId,
	twoFactorVerifiedAt: dbSchema.userPasswordResetSession.twoFactorVerifiedAt,
	expiresAt: dbSchema.userPasswordResetSession.expiresAt,
	code: dbSchema.userPasswordResetSession.code,
	createdAt: dbSchema.userPasswordResetSession.createdAt,
	email: dbSchema.userPasswordResetSession.email,
	emailVerifiedAt: dbSchema.userPasswordResetSession.emailVerifiedAt,
};
const passwordResetSessionReturnSchema = /** @type {const} */ ({
	id: true,
	userId: true,
	twoFactorVerifiedAt: true,
	expiresAt: true,
	code: true,
	createdAt: true,
	email: true,
	emailVerifiedAt: true,
});

/*************** ***************/
/* ID */
/*************** ***************/
let counter = 0;
export const createOneIdSync = () => {
	const id = ulid();
	console.log(`___ id: ${id}, length: ${id.length}, counter: ${counter}`);
	counter++;
	return id;
};
/** @returns {Promise<string>} */
export const createOneIdAsync = async () =>
	new Promise((resolve) => resolve(ulid()));

/** @type {AuthStrategy} */
// @ts-expect-error
export const authStrategy = process.env.AUTH_STRATEGY ?? "jwt";

/*************** ***************/
/* Users */
/*************** ***************/

/** @type {UsersProvider['createOne']} */
export const createOneUser = async (values) => {
	const createdAt = new Date();
	console.log(
		"___ createOneUser values",
		values,
		"id:",
		values.id ?? createOneIdSync(),
	);
	return db
		.insert(dbSchema.user)
		.values({
			...values,
			id: values.id ?? createOneIdSync(),
			email: values.email,
			name: values.name,
			displayName: values.displayName, // Add displayName, fallback to name or empty string
			passwordHash: values.passwordHash,
			recoveryCode: values.encryptedRecoveryCode
				? Buffer.from(values.encryptedRecoveryCode)
				: null, // Buffer.from(encryptedRecoveryCode),
			emailVerifiedAt: null, // Default value as unverified
			createdAt,
			lastUpdatedAt: createdAt,
		})
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null)
		.catch((error) => {
			console.error("Error creating user:", error);
			throw new Error("Failed to create user");
		});
};
/** @type {UsersProvider['findOneById']} */
export const findOneUserById = async (id) => {
	return db
		.select(userReturnTemplate)
		.from(dbSchema.user)
		.where(eq(dbSchema.user.id, id))
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['findOneByEmail']} */
export const findOneUserByEmail = async (email) => {
	return db
		.select(userReturnTemplate)
		.from(dbSchema.user)
		.where(eq(dbSchema.user.email, email))
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['getOnePasswordHash']} */
export const getOneUserPasswordHash = async (userId) => {
	return db
		.select({ passwordHash: dbSchema.user.passwordHash })
		.from(dbSchema.user)
		.where(eq(dbSchema.user.id, userId))
		.then((result) => result[0]?.passwordHash ?? null);
};
/** @type {UsersProvider['getOneRecoveryCode']} */
export const getOneUserRecoveryCode = async (userId) => {
	return db
		.select({ recoveryCode: dbSchema.user.recoveryCode })
		.from(dbSchema.user)
		.where(eq(dbSchema.user.id, userId))
		.then((result) =>
			result[0]?.recoveryCode ? decryptToString(result[0].recoveryCode) : null,
		);
};
/** @type {UsersProvider['getOneRecoveryCodeRaw']} */
export const getOneUserRecoveryCodeRaw = async (userId, tx) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			tx
		) ?? db;
	return _db
		.select({ recoveryCode: dbSchema.user.recoveryCode })
		.from(dbSchema.user)
		.where(eq(dbSchema.user.id, userId))
		.then((result) => result[0]?.recoveryCode ?? null);
};
/** @type {UsersProvider['updateOneEmailAndVerify']} */
export const updateOneUserEmailAndVerify = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.user)
		.set({
			email: props.data.email,
			emailVerifiedAt: new Date(),
			lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.user.id, props.where.id))
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['updateOne2FAEnabled']} */
export const updateOneUser2FAEnabled = async (data, where) => {
	return db
		.update(dbSchema.user)
		.set({
			twoFactorEnabledAt:
				data.twoFactorEnabledAt == null
					? null
					: dateLikeToDate(data.twoFactorEnabledAt),
			recoveryCode: data.recoveryCode
				? Buffer.from(data.recoveryCode)
				: undefined,
			totpKey: !data.twoFactorEnabledAt ? null : undefined,
			// Is the following needed?
			// twoFactorRegisteredAt: data.twoFactorEnabledAt ? new Date() : null,
			lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.user.id, where.userId))
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['updateOnePassword']} */
export const updateOneUserPassword = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.user)
		.set({
			passwordHash: props.data.passwordHash,
			lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.user.id, props.where.id))
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['updateOneRecoveryCode']} */
export const updateOneUserRecoveryCode = async (
	userId,
	encryptedRecoveryCode,
) => {
	return db
		.update(dbSchema.user)
		.set({
			recoveryCode: Buffer.from(encryptedRecoveryCode),
			lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.user.id, userId))
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['updateOneRecoveryCodeById']} */
export const updateOneUserRecoveryCodeById = async (
	userId,
	encryptedNewRecoveryCode,
	userRecoveryCode,
	tx,
) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			tx
		) ?? db;
	return _db
		.update(dbSchema.user)
		.set({
			recoveryCode: Buffer.from(encryptedNewRecoveryCode),
			totpKey: null,
			lastUpdatedAt: new Date(),
		})
		.where(
			and(
				eq(dbSchema.user.id, userId),
				eq(dbSchema.user.recoveryCode, userRecoveryCode),
			),
		)
		.returning({ recoveryCode: dbSchema.user.recoveryCode })
		.then((result) => result[0]?.recoveryCode ?? null);
};
/** @type {UsersProvider['updateOneTOTPKey']} */
export const updateOneUserTOTPKey = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.user)
		.set({
			totpKey: props.data.totpKey ? Buffer.from(props.data.totpKey) : null,
			// Is the following needed?
			// twoFactorRegisteredAt: totpKey ? new Date() : null,
			// twoFactorEnabledAt: totpKey ? new Date() : null,
			lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.user.id, props.where.id))
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['verifyOneEmailIfMatches']} */
export const verifyOneUserEmailIfMatches = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.user)
		.set({
			emailVerifiedAt: new Date(),
			lastUpdatedAt: new Date(),
		})
		.where(
			and(
				eq(dbSchema.user.id, props.where.id),
				eq(dbSchema.user.email, props.where.email),
			),
		)
		.returning(userReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {UsersProvider['getOneTOTPKey']} */
export const getOneUserTOTPKey = async (userId) => {
	return db
		.select({ totpKey: dbSchema.user.totpKey })
		.from(dbSchema.user)
		.where(eq(dbSchema.user.id, userId))
		.then((result) => {
			if (!result[0]?.totpKey) {
				return null;
			}
			const encrypted = result[0].totpKey;
			return decrypt(encrypted);
		});
};

/*************** ***************/
/* Sessions */
/*************** ***************/

/** @type {SessionsProvider['createOne']} */
export const createOneSession = async (props) => {
	const createdAt = new Date();
	const [session, user] = await Promise.all([
		db
			.insert(dbSchema.userSession)
			.values({
				...props.data,
				expiresAt: dateLikeToDate(props.data.expiresAt),
				twoFactorVerifiedAt: props.data.twoFactorVerifiedAt
					? dateLikeToDate(props.data.twoFactorVerifiedAt)
					: null,
				revokedAt: props.data.revokedAt
					? dateLikeToDate(props.data.revokedAt)
					: null,
				lastUsedAt: props.data.lastUsedAt
					? dateLikeToDate(props.data.lastUsedAt)
					: null,
				createdAt,
				lastUpdatedAt: createdAt,
				lastVerifiedAt: createdAt,
				lastExtendedAt: createdAt, // null
			})
			.returning(sessionReturnTemplate)
			.then((result) => result[0] ?? null),
		db
			.select(userReturnTemplate)
			.from(dbSchema.user)
			.where(eq(dbSchema.user.id, props.data.userId))
			.then((result) => result[0] ?? null),
	]);

	if (!session || !user) {
		throw new Error("Failed to create session or find user.");
	}

	return { session, user };
};
/** @type {SessionsProvider['findOneWithUser']} */
export const findOneSessionWithUser = async (sessionId) => {
	return db.query.userSession
		.findFirst({
			with: { user: { columns: userReturnSchema } },
			columns: sessionReturnSchema,
			where: and(
				eq(dbSchema.userSession.id, sessionId),
				isNull(dbSchema.userSession.revokedAt),
			),
		})
		.then(async (result) => {
			if (!result) return null;
			// Check if token is expired
			if (Date.now() >= result.expiresAt.getTime()) {
				await revokeOneSessionById(result.id);
				return null;
			}
			const { user, ...session } = result;
			return { session, user };
		});
};
/** @type {SessionsProvider['extendOneExpirationDate']} */
export const extendOneSessionExpirationDate = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	const lastUpdatedAt = new Date();
	return db
		.update(dbSchema.userSession)
		.set({
			expiresAt: dateLikeToDate(props.data.expiresAt),
			lastExtendedAt: lastUpdatedAt,
			lastUpdatedAt,
		})
		.where(eq(dbSchema.userSession.id, props.where.id))
		.returning(sessionReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {SessionsProvider['deleteOneById']} */
export const deleteOneSessionById = async (sessionId) => {
	await db
		.delete(dbSchema.userSession)
		.where(eq(dbSchema.userSession.id, sessionId));
};
/** @type {SessionsProvider['deleteAllByUserId']} */
export const deleteAllSessionsByUserId = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	await _db
		.delete(dbSchema.userSession)
		.where(eq(dbSchema.userSession.userId, props.where.userId));
};
/** @type {SessionsProvider['revokeOneById']} */
export const revokeOneSessionById = async (id) => {
	await db
		.update(dbSchema.userSession)
		.set({ revokedAt: new Date(), lastUpdatedAt: new Date() })
		.where(eq(dbSchema.userSession.id, id));
	// RedisTokenBlacklist.revokeOneById(id);
};
/** @type {SessionsProvider['revokeAllByUserId']} */
export const revokeAllSessionsByUserId = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;

	// const result =
	await _db
		.update(dbSchema.userSession)
		.set({ revokedAt: new Date(), lastUpdatedAt: new Date() })
		.where(
			and(
				eq(dbSchema.userSession.userId, props.where.userId),
				isNull(dbSchema.userSession.revokedAt), // Not revoked // eq(dbSchema.session.revokedAt, null),
			),
		)
		.returning({ id: dbSchema.userSession.id });
	// RedisTokenBlacklist.revokeManyByIds(result.map((session) => session.id));
};
/** @type {SessionsProvider['isOneRevokedById']} */
// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
export const isOneSessionRevokedById = async (_props) => {
	// return RedisTokenBlacklist.isOneRevokedById(props.where.id);
	// For now, we don't use Redis for token revocation
	// return db
	// 	.select({ revokedAt: dbSchema.session.revokedAt })
	// 	.from(dbSchema.session)
	// 	.where(eq(dbSchema.session.id, props.where.id))
	// 	.then((result) => {
	// 		if (!result[0]) return true; // Token is revoked
	// 		return result[0].revokedAt === null; // Token is not revoked
	// 	});
	// We will not go with DB, so this is for testing for now
	return false;
};
/** @type {SessionsProvider['cleanupAllExpired']} */
export const cleanupAllSessionExpired = async () => {
	const result = await db
		.delete(dbSchema.userSession)
		.where(lt(dbSchema.userSession.expiresAt, new Date()));
	// RedisTokenBlacklist.cleanupExpired();

	return result.rowCount ?? 0;
};
/** @type {SessionsProvider['markOne2FAVerified']} */
export const markOneSession2FAVerified = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.userSession)
		.set({
			twoFactorVerifiedAt: new Date(),
			lastUpdatedAt: new Date(),
		})
		.where(
			and(
				eq(dbSchema.userSession.id, props.where.id),
				isNull(dbSchema.userSession.revokedAt),
			),
		)
		.returning(sessionReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {SessionsProvider['unMarkOne2FAForUser']} */
export const unMarkOneSession2FAForUser = async (userId, tx) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			tx
		) ?? db;
	return await _db
		.update(dbSchema.userSession)
		.set({
			twoFactorVerifiedAt: null,
			lastUpdatedAt: new Date(),
		})
		.where(
			and(
				eq(dbSchema.userSession.userId, userId),
				isNull(dbSchema.userSession.revokedAt),
			),
		)
		// .returning(sessionReturnTemplate)
		.then((result) => result.rowCount ?? 0);
};

// The following methods are commented out as they are not currently used.
// They could be useful for session management in the future, so they are kept here for reference.
// findManyExpired: async () => {
// 	return db.select(sessionReturnTemplate)
// 		.from(dbSchema.session)
// 		.where(lt(dbSchema.session.expiresAt, new Date()));
// },

// deleteAllExpired: async () => {
// 	await db.delete(dbSchema.session)
// 		.where(lt(dbSchema.session.expiresAt, new Date()));
// },

export const defaultSessionsHandlers = {
	deleteOneById: deleteOneSessionById,
	extendOneExpirationDate: extendOneSessionExpirationDate,
	findOneWithUser: findOneSessionWithUser,
	revokeOneById: revokeOneSessionById,
	createOne: createOneSession,
};

/*************** ***************/
/* Password Reset Sessions */
/*************** ***************/

/** @type {PasswordResetSessionsProvider['createOne']} */
export const createOnePasswordResetSession = async (props, options) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	const createdAt = new Date();
	return _db
		.insert(dbSchema.userPasswordResetSession)
		.values({
			...props.data,
			id: props.data.id ?? createOneIdSync(),
			emailVerifiedAt: props.data.emailVerifiedAt
				? dateLikeToDate(props.data.emailVerifiedAt)
				: null,
			twoFactorVerifiedAt: props.data.twoFactorVerifiedAt
				? dateLikeToDate(props.data.twoFactorVerifiedAt)
				: null,
			expiresAt: dateLikeToDate(props.data.expiresAt),
			createdAt,
		})
		.returning(passwordResetSessionReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {PasswordResetSessionsProvider['findOneWithUser']} */
export const findOnePasswordResetSessionWithUser = async (sessionId) => {
	return db.query.userPasswordResetSession
		.findFirst({
			with: { user: { columns: userReturnSchema } },
			columns: passwordResetSessionReturnSchema,
			where: eq(dbSchema.userPasswordResetSession.id, sessionId),
		})
		.then((result) => {
			if (!result) return { session: null, user: null };
			const { user, ...session } = result;
			return { session, user };
		});
};
/** @type {PasswordResetSessionsProvider['markOneEmailAsVerified']} */
export const markOnePasswordResetSessionEmailAsVerified = async (
	props,
	options,
) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	return _db
		.update(dbSchema.userPasswordResetSession)
		.set({
			emailVerifiedAt: new Date(),
			// lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.userPasswordResetSession.id, props.where.id))
		.returning(passwordResetSessionReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {PasswordResetSessionsProvider['deleteOne']} */
export const deleteOnePasswordResetSession = async (sessionId) => {
	await db
		.delete(dbSchema.userPasswordResetSession)
		.where(eq(dbSchema.userPasswordResetSession.id, sessionId));
};
/** @type {PasswordResetSessionsProvider['markOneTwoFactorAsVerified']} */
export const markOnePasswordResetSessionTwoFactorAsVerified = async (
	sessionId,
) => {
	return db
		.update(dbSchema.userPasswordResetSession)
		.set({
			twoFactorVerifiedAt: new Date(),
			// lastUpdatedAt: new Date(),
		})
		.where(eq(dbSchema.userPasswordResetSession.id, sessionId))
		.returning(passwordResetSessionReturnTemplate)
		.then((result) => result[0] ?? null);
};
/** @type {PasswordResetSessionsProvider['deleteAllByUserId']} */
export const deleteAllPasswordResetSessionsByUserId = async (
	props,
	options,
) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	await _db
		.delete(dbSchema.userPasswordResetSession)
		.where(eq(dbSchema.userPasswordResetSession.userId, props.where.userId));
	// .returning(passwordResetSessionReturnTemplate)
	// .then((result) => result[0] ?? null);
};

/*************** ***************/
/* Email Verification Requests */
/*************** ***************/

/** @type {UserEmailVerificationRequestsProvider['createOne']} */
export const createOneEmailVerificationRequests = async (values) => {
	console.log("___ createOneEmailVerificationRequests values", values);
	const createdAt = new Date();
	return db
		.insert(dbSchema.userEmailVerificationRequest)
		.values({
			...values,
			id: values.id ?? createOneIdSync(),
			expiresAt: dateLikeToDate(values.expiresAt),
			createdAt,
		})
		.returning(emailVerificationRequestReturnTemplate)
		.then((result) => result[0] ?? null);
};

/** @type {UserEmailVerificationRequestsProvider['deleteOneByUserId']} */
export const deleteOneEmailVerificationRequestsByUserId = async (
	props,
	options,
) => {
	const _db =
		/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
			options?.tx
		) ?? db;
	await _db
		.delete(dbSchema.userEmailVerificationRequest)
		.where(
			eq(dbSchema.userEmailVerificationRequest.userId, props.where.userId),
		);
};

/** @type {UserEmailVerificationRequestsProvider['findOneByIdAndUserId']} */
export const findOneEmailVerificationRequestsByIdAndUserId = async (
	userId,
	id,
) => {
	return db
		.select(emailVerificationRequestReturnTemplate)
		.from(dbSchema.userEmailVerificationRequest)
		.where(
			and(
				eq(dbSchema.userEmailVerificationRequest.userId, userId),
				eq(dbSchema.userEmailVerificationRequest.id, id),
			),
		)
		.then((result) => result[0] ?? null);
};
