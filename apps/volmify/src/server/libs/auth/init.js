/**
 * @import { NextRequest } from 'next/server';
 * @import { AuthConfig } from "@de100/auth/init";
 */

import { and, eq, isNull, lt } from "drizzle-orm";
import { ulid } from "ulid";

import { authConfig, initAuth } from "@de100/auth/init";
import { dateLikeToDate } from "@de100/auth/utils/dates";
import { decrypt, decryptToString } from "@de100/auth/utils/encryption";

import { db, dbSchema } from "../db/index.js";

const userReturnTemplate = {
	name: dbSchema.user.name,
	id: dbSchema.user.id,
	createdAt: dbSchema.user.createdAt,
	updatedAt: dbSchema.user.updatedAt,
	email: dbSchema.user.email,
	emailVerifiedAt: dbSchema.user.emailVerifiedAt,
	twoFactorEnabledAt: dbSchema.user.twoFactorEnabledAt,
	twoFactorRegisteredAt: dbSchema.user.twoFactorRegisteredAt,
};
const userReturnSchema = /** @type {const} */ ({
	name: true,
	id: true,
	createdAt: true,
	updatedAt: true,
	email: true,
	emailVerifiedAt: true,
	twoFactorEnabledAt: true,
	twoFactorRegisteredAt: true,
});

const sessionReturnTemplate = {
	id: dbSchema.session.id,
	userId: dbSchema.session.userId,
	createdAt: dbSchema.session.createdAt,
	updatedAt: dbSchema.session.updatedAt,
	expiresAt: dbSchema.session.expiresAt,
	ipAddress: dbSchema.session.ipAddress,
	userAgent: dbSchema.session.userAgent,
	twoFactorVerifiedAt: dbSchema.session.twoFactorVerifiedAt,
	//
	sessionType: dbSchema.session.sessionType,
	revokedAt: dbSchema.session.revokedAt,
	lastUsedAt: dbSchema.session.lastUsedAt,
	metadata: dbSchema.session.metadata,
};
const sessionReturnSchema = /** @type {const} */ ({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
	expiresAt: true,
	ipAddress: true,
	userAgent: true,
	twoFactorVerifiedAt: true,
	//
	sessionType: true,
	revokedAt: true,
	lastUsedAt: true,
	metadata: true,
});

const emailVerificationRequestReturnTemplate = {
	id: dbSchema.emailVerificationRequest.id,
	code: dbSchema.emailVerificationRequest.code,
	userId: dbSchema.emailVerificationRequest.userId,
	expiresAt: dbSchema.emailVerificationRequest.expiresAt,
	createdAt: dbSchema.emailVerificationRequest.createdAt,
	email: dbSchema.emailVerificationRequest.email,
};
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const emailVerificationRequestReturnSchema = /** @type {const} */ ({
	id: true,
	code: true,
	userId: true,
	expiresAt: true,
	createdAt: true,
	email: true,
});

const passwordResetSessionReturnTemplate = {
	id: dbSchema.passwordResetSession.id,
	userId: dbSchema.passwordResetSession.userId,
	twoFactorVerifiedAt: dbSchema.passwordResetSession.twoFactorVerifiedAt,
	expiresAt: dbSchema.passwordResetSession.expiresAt,
	code: dbSchema.passwordResetSession.code,
	createdAt: dbSchema.passwordResetSession.createdAt,
	email: dbSchema.passwordResetSession.email,
	emailVerifiedAt: dbSchema.passwordResetSession.emailVerifiedAt,
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

/** @param {{ req?: NextRequest }} props */
export async function setDrizzlePgAuthProviders(props) {
	const _global = /** @type {{ ___authConfig?: AuthConfig }} */ (globalThis);

	if (_global.___authConfig?.hasInitialized) {
		// If authConfig is already initialized, we can skip re-initialization
		return _global.___authConfig;
	}

	_global.___authConfig = await initAuth({
		// The following is for testing purposes, it can be removed in production
		strategy: process.env.AUTH_STRATEGY ?? "jwt",
		cookies: async () => {
			const jar =
				props.req?.cookies ??
				(await import("next/headers").then(async (mod) => await mod.cookies()));

			if (!jar) {
				throw new Error("Cookies are not available in this context.");
			}

			return {
				get: (name) => jar.get(name)?.value ?? null,
				set: (name, value, options) => {
					jar.set(
						name,
						value,
						options
							? {
									...options,
									expires: options.expires ? dateLikeToDate(options.expires) : undefined,
								}
							: undefined,
					);
				},
				delete: (name, options) => {
					jar.set(
						name,
						"",
						options
							? {
									...options,
									expires: options.expires ? dateLikeToDate(options.expires) : undefined,
								}
							: undefined,
					);
				},
			};
		},
		headers: async () => {
			const headers =
				props.req?.headers ??
				(await import("next/headers").then(async (mod) => await mod.headers()));

			if (!headers) {
				throw new Error("Cookies are not available in this context.");
			}

			return headers;
		},
		ids: {
			createOneSync: ulid,
			createOneAsync: async () => new Promise((resolve) => resolve(ulid())),
		},
		providers: {
			users: {
				createOne: async (values) => {
					const createdAt = new Date();
					return db
						.insert(dbSchema.user)
						.values({
							...values,
							id: values.id ?? (await authConfig.ids.createOneAsync()),
							email: values.email,
							name: values.name,
							passwordHash: values.passwordHash,
							recoveryCode: values.encryptedRecoveryCode
								? Buffer.from(values.encryptedRecoveryCode)
								: null, // Buffer.from(encryptedRecoveryCode),
							emailVerifiedAt: null, // Default value as unverified
							createdAt,
							updatedAt: createdAt,
						})
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				findOneById: async (id) => {
					return db
						.select(userReturnTemplate)
						.from(dbSchema.user)
						.where(eq(dbSchema.user.id, id))
						.then((result) => result[0] ?? null);
				},
				findOneByEmail: async (email) => {
					return db
						.select(userReturnTemplate)
						.from(dbSchema.user)
						.where(eq(dbSchema.user.email, email))
						.then((result) => result[0] ?? null);
				},
				getOnePasswordHash: async (userId) => {
					return db
						.select({ passwordHash: dbSchema.user.passwordHash })
						.from(dbSchema.user)
						.where(eq(dbSchema.user.id, userId))
						.then((result) => result[0]?.passwordHash ?? null);
				},
				getOneRecoveryCode: async (userId) => {
					return db
						.select({ recoveryCode: dbSchema.user.recoveryCode })
						.from(dbSchema.user)
						.where(eq(dbSchema.user.id, userId))
						.then((result) =>
							result[0]?.recoveryCode ? decryptToString(result[0].recoveryCode) : null,
						);
				},
				getOneRecoveryCodeRaw: async (userId, tx) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (tx) ?? db;
					return _db
						.select({ recoveryCode: dbSchema.user.recoveryCode })
						.from(dbSchema.user)
						.where(eq(dbSchema.user.id, userId))
						.then((result) => result[0]?.recoveryCode ?? null);
				},
				updateEmailAndVerify: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					return _db
						.update(dbSchema.user)
						.set({
							email: props.data.email,
							emailVerifiedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.user.id, props.where.id))
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				updateOne2FAEnabled: async (data, where) => {
					return db
						.update(dbSchema.user)
						.set({
							twoFactorEnabledAt:
								data.twoFactorEnabledAt == null ? null : dateLikeToDate(data.twoFactorEnabledAt),
							recoveryCode: data.recoveryCode ? Buffer.from(data.recoveryCode) : undefined,
							totpKey: !data.twoFactorEnabledAt ? null : undefined,
							// Is the following needed?
							// twoFactorRegisteredAt: data.twoFactorEnabledAt ? new Date() : null,
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.user.id, where.userId))
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				updateOnePassword: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					return _db
						.update(dbSchema.user)
						.set({
							passwordHash: props.data.passwordHash,
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.user.id, props.where.id))
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				updateOneRecoveryCode: async (userId, encryptedRecoveryCode) => {
					return db
						.update(dbSchema.user)
						.set({
							recoveryCode: Buffer.from(encryptedRecoveryCode),
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.user.id, userId))
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				updateOneRecoveryCodeByUserId: async (
					userId,
					encryptedNewRecoveryCode,
					userRecoveryCode,
					tx,
				) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (tx) ?? db;
					return _db
						.update(dbSchema.user)
						.set({
							recoveryCode: Buffer.from(encryptedNewRecoveryCode),
							totpKey: null,
							updatedAt: new Date(),
						})
						.where(
							and(eq(dbSchema.user.id, userId), eq(dbSchema.user.recoveryCode, userRecoveryCode)),
						)
						.returning({ recoveryCode: dbSchema.user.recoveryCode })
						.then((result) => result[0]?.recoveryCode ?? null);
				},
				updateOneTOTPKey: async (props, options) => {
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
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.user.id, props.where.id))
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				verifyOneEmailIfMatches: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					return _db
						.update(dbSchema.user)
						.set({
							emailVerifiedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(
							and(eq(dbSchema.user.id, props.where.id), eq(dbSchema.user.email, props.where.email)),
						)
						.returning(userReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				getOneTOTPKey: async (userId) => {
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
				},
			},
			sessions: {
				createOne: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					const createdAt = new Date();
					const [session, user] = await Promise.all([
						_db
							.insert(dbSchema.session)
							.values({
								...props.data,
								// id: props.data.id ?? (await authConfig.ids.createOneAsync()),
								expiresAt: dateLikeToDate(props.data.expiresAt),
								twoFactorVerifiedAt: props.data.twoFactorVerifiedAt
									? dateLikeToDate(props.data.twoFactorVerifiedAt)
									: null,
								revokedAt: props.data.revokedAt ? dateLikeToDate(props.data.revokedAt) : null,
								lastUsedAt: props.data.lastUsedAt ? dateLikeToDate(props.data.lastUsedAt) : null,
								createdAt,
								updatedAt: createdAt,
							})
							.returning(sessionReturnTemplate)
							.then((result) => result[0] ?? null),
						_db
							.select(userReturnTemplate)
							.from(dbSchema.user)
							.where(eq(dbSchema.user.id, props.data.userId))
							.then((result) => result[0] ?? null),
					]);

					if (!session || !user) {
						throw new Error("Failed to create session or find user.");
					}

					return { session, user };
				},
				findOneWithUser: async (sessionId) => {
					return db.query.session
						.findFirst({
							with: { user: { columns: userReturnSchema } },
							columns: sessionReturnSchema,
							where: and(eq(dbSchema.session.id, sessionId), isNull(dbSchema.session.revokedAt)),
						})
						.then(async (result) => {
							if (!result) return null;
							// Check if token is expired
							if (Date.now() >= result.expiresAt.getTime()) {
								await authConfig.providers.session.revokeOneById(result.id);
								return null;
							}
							const { user, ...session } = result;
							return { session, user };
						});
				},
				extendOneExpirationDate: async (sessionId, expiresAt) => {
					return db
						.update(dbSchema.session)
						.set({
							expiresAt: dateLikeToDate(expiresAt),
							updatedAt: new Date(),
						})
						.where(eq(dbSchema.session.id, sessionId))
						.returning(sessionReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				deleteOneById: async (sessionId) => {
					await db.delete(dbSchema.session).where(eq(dbSchema.session.id, sessionId));
				},
				deleteAllByUserId: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					await _db.delete(dbSchema.session).where(eq(dbSchema.session.userId, props.where.userId));
				},
				revokeOneById: async (id) => {
					await db
						.update(dbSchema.session)
						.set({ revokedAt: new Date(), updatedAt: new Date() })
						.where(eq(dbSchema.session.id, id));
					// authConfig.RedisTokenBlacklist.revokeOneById(id);
				},
				revokeAllByUserId: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;

					// const result =
					await _db
						.update(dbSchema.session)
						.set({ revokedAt: new Date(), updatedAt: new Date() })
						.where(
							and(
								eq(dbSchema.session.userId, props.where.userId),
								isNull(dbSchema.session.revokedAt), // Not revoked // eq(dbSchema.session.revokedAt, null),
							),
						)
						.returning({ id: dbSchema.session.id });
					// authConfig.RedisTokenBlacklist.revokeManyByIds(result.map((session) => session.id));
				},
				// eslint-disable-next-line @typescript-eslint/require-await, @typescript-eslint/no-unused-vars
				isOneRevokedById: async (props) => {
					// return authConfig.RedisTokenBlacklist.isOneRevokedById(props.where.id);
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
				},
				cleanupExpired: async () => {
					const result = await db
						.delete(dbSchema.session)
						.where(lt(dbSchema.session.expiresAt, new Date()));
					// authConfig.RedisTokenBlacklist.cleanupExpired();

					return result.rowCount ?? 0;
				},
				markOne2FAVerified: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					return _db
						.update(dbSchema.session)
						.set({
							twoFactorVerifiedAt: new Date(),
							updatedAt: new Date(),
						})
						.where(and(eq(dbSchema.session.id, props.where.id), isNull(dbSchema.session.revokedAt)))
						.returning(sessionReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				unMarkOne2FAForUser: async (userId, tx) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (tx) ?? db;
					return await _db
						.update(dbSchema.session)
						.set({
							twoFactorVerifiedAt: null,
							updatedAt: new Date(),
						})
						.where(and(eq(dbSchema.session.userId, userId), isNull(dbSchema.session.revokedAt)))
						.returning(sessionReturnTemplate)
						.then((result) => result[0] ?? null);
				},
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

				// deleteAllByUserIdExcept: async (userId, exceptSessionId) => {
				// 	await db.delete(dbSchema.session)
				// 		.where(
				// 			and(
				// 				eq(dbSchema.session.userId, userId),
				// 				ne(dbSchema.session.id, exceptSessionId)
				// 			)
				// 		);
				// },
			},
			passwordResetSessions: {
				createOne: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					const createdAt = new Date();
					return _db
						.insert(dbSchema.passwordResetSession)
						.values({
							...props.data,
							id: props.data.id ?? (await authConfig.ids.createOneAsync()),
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
				},
				findOneWithUser: async (sessionId) => {
					return db.query.passwordResetSession
						.findFirst({
							with: { user: { columns: userReturnSchema } },
							columns: passwordResetSessionReturnSchema,
							where: eq(dbSchema.passwordResetSession.id, sessionId),
						})
						.then((result) => {
							if (!result) return { session: null, user: null };
							const { user, ...session } = result;
							return { session, user };
						});
				},
				markOneEmailAsVerified: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					return _db
						.update(dbSchema.passwordResetSession)
						.set({
							emailVerifiedAt: new Date(),
							// updatedAt: new Date(),
						})
						.where(eq(dbSchema.passwordResetSession.id, props.where.id))
						.returning(passwordResetSessionReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				deleteOne: async (sessionId) => {
					await db
						.delete(dbSchema.passwordResetSession)
						.where(eq(dbSchema.passwordResetSession.id, sessionId));
				},
				markOneTwoFactorAsVerified: async (sessionId) => {
					return db
						.update(dbSchema.passwordResetSession)
						.set({
							twoFactorVerifiedAt: new Date(),
							// updatedAt: new Date(),
						})
						.where(eq(dbSchema.passwordResetSession.id, sessionId))
						.returning(passwordResetSessionReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				deleteAllByUserId: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					await _db
						.delete(dbSchema.passwordResetSession)
						.where(eq(dbSchema.passwordResetSession.userId, props.where.userId));
					// .returning(passwordResetSessionReturnTemplate)
					// .then((result) => result[0] ?? null);
				},
			},
			emailVerificationRequests: {
				createOne: async (values) => {
					const createdAt = new Date();
					return db
						.insert(dbSchema.emailVerificationRequest)
						.values({
							...values,
							id: values.id ?? (await authConfig.ids.createOneAsync()),
							expiresAt: dateLikeToDate(values.expiresAt),
							createdAt,
						})
						.returning(emailVerificationRequestReturnTemplate)
						.then((result) => result[0] ?? null);
				},
				deleteOneByUserId: async (props, options) => {
					const _db =
						/** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */ (
							options?.tx
						) ?? db;
					await _db
						.delete(dbSchema.emailVerificationRequest)
						.where(eq(dbSchema.emailVerificationRequest.userId, props.where.userId));
				},
				findOneByIdAndUserId: async (userId, id) => {
					return db
						.select(emailVerificationRequestReturnTemplate)
						.from(dbSchema.emailVerificationRequest)
						.where(
							and(
								eq(dbSchema.emailVerificationRequest.userId, userId),
								eq(dbSchema.emailVerificationRequest.id, id),
							),
						)
						.then((result) => result[0] ?? null);
				},
			},
		},
	});
}
