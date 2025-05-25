import { and, eq } from "drizzle-orm";
import { db, dbSchema } from ".";
import { setProviders } from "../../providers";
import { idsProvider } from "../../providers/ids";
import { dateLikeToDate } from "../../utils/dates";
import { decrypt, decryptToString } from "../../utils/encryption";

const defaultUserReturn = {
		name: dbSchema.user.name,
		id: dbSchema.user.id,
		createdAt: dbSchema.user.createdAt,
		updatedAt: dbSchema.user.updatedAt,
		email: dbSchema.user.email,
		emailVerifiedAt: dbSchema.user.emailVerifiedAt,
		twoFactorEnabledAt: dbSchema.user.twoFactorEnabledAt,
		twoFactorRegisteredAt: dbSchema.user.twoFactorRegisteredAt,
}
const defaultUserReturn2 = /** @type {const} */({
		name: true,
		id: true,
		createdAt: true,
		updatedAt: true,
		email: true,
		emailVerifiedAt: true,
		twoFactorEnabledAt: true,
		twoFactorRegisteredAt: true,
})

const defaultSessionReturn = {
	id: dbSchema.session.id,
	userId: dbSchema.session.userId,
	createdAt: dbSchema.session.createdAt,
	updatedAt: dbSchema.session.updatedAt,
	expiresAt: dbSchema.session.expiresAt,
	ipAddress: dbSchema.session.ipAddress,
	userAgent: dbSchema.session.userAgent,
	twoFactorVerifiedAt: dbSchema.session.twoFactorVerifiedAt,
}
const defaultSessionReturn2 = /** @type {const} */({
	id: true,
	userId: true,
	createdAt: true,
	updatedAt: true,
	expiresAt: true,
	ipAddress: true,
	userAgent: true,
	twoFactorVerifiedAt: true,
})

export function setDrizzlePgAuthProviders() {
	setProviders({
		// cookies: {
		// 	delete: () => { },
		// 	set: () => { },
		// 	get: () => {
		// 		return ''
		// 	}
		// },
		user: {
			createOne: async (values) => {
				const createdAt = new Date();
				return db.insert(dbSchema.user).values({
					...values,
					id: values.id ?? (await idsProvider.createOneAsync()),
					email: values.email,
					name: values.name,
					passwordHash: values.passwordHash,
					recoveryCode: values.encryptedRecoveryCode ? Buffer.from(values.encryptedRecoveryCode) : null, // Buffer.from(encryptedRecoveryCode),
					emailVerifiedAt: null, // Default value as unverified
					createdAt,
					updatedAt: createdAt,
				})
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			findOneByEmail: async (email) => {
				return db.select(defaultUserReturn).from(dbSchema.user)
					.where(eq(dbSchema.user.email, email))
					.then((result) => result[0] ?? null);
			},
			getOnePasswordHash: async (userId) => {
				return db.select({ passwordHash: dbSchema.user.passwordHash })
					.from(dbSchema.user)
					.where(eq(dbSchema.user.id, userId))
					.then((result) => result[0]?.passwordHash ?? null);
			},
			getOneRecoveryCode: async (userId) => {
				return db.select({ recoveryCode: dbSchema.user.recoveryCode })
					.from(dbSchema.user)
					.where(eq(dbSchema.user.id, userId))
					.then((result) => result[0]?.recoveryCode ? decryptToString(result[0].recoveryCode) : null);
			},
			getOneRecoveryCodeRaw: async (userId, tx) => {
				const _db = /** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */(tx) ?? db;
				return _db.select({ recoveryCode: dbSchema.user.recoveryCode })
					.from(dbSchema.user)
					.where(eq(dbSchema.user.id, userId))
					.then((result) => result[0]?.recoveryCode ?? null);
			},
			updateEmailAndVerify: async (userId, email) => {
				return db.update(dbSchema.user)
					.set({
						email: email,
						emailVerifiedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.user.id, userId))
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			updateOne2FAEnabled: async (data, where) => {
				return db.update(dbSchema.user)
					.set({
						twoFactorEnabledAt: data.twoFactorEnabledAt == null ? null : dateLikeToDate(data.twoFactorEnabledAt),
						recoveryCode: data.recoveryCode ? Buffer.from(data.recoveryCode) : undefined,
						totpKey: !data.twoFactorEnabledAt ? null : undefined,
						// Is the following needed?
						// twoFactorRegisteredAt: data.twoFactorEnabledAt ? new Date() : null,
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.user.id, where.userId))
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			updateOnePassword: async (userId, passwordHash) => {
				return db.update(dbSchema.user)
					.set({
						passwordHash: passwordHash,
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.user.id, userId))
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			updateOneRecoveryCode: async (userId, encryptedRecoveryCode) => {
				return db.update(dbSchema.user)
					.set({
						recoveryCode: Buffer.from(encryptedRecoveryCode),
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.user.id, userId))
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			updateOneRecoveryCodeByUserId: async (userId, encryptedNewRecoveryCode, userRecoveryCode, tx) => {
				const _db = /** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */(tx) ?? db;
				return _db.update(dbSchema.user)
					.set({
						recoveryCode: Buffer.from(encryptedNewRecoveryCode),
						totpKey: null,
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(dbSchema.user.id, userId),
							eq(dbSchema.user.recoveryCode, userRecoveryCode)
						)
					)
					.returning({ recoveryCode: dbSchema.user.recoveryCode })
					.then((result) => result[0]?.recoveryCode ?? null);
			},
			updateOneTOTPKey: async (userId, totpKey) => {
				return db.update(dbSchema.user)
					.set({
						totpKey: totpKey ? Buffer.from(totpKey) : null,
						// Is the following needed?
						// twoFactorRegisteredAt: totpKey ? new Date() : null,
						// twoFactorEnabledAt: totpKey ? new Date() : null,
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.user.id, userId))
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			verifyOneEmailIfMatches: async (userId, email) => {
				return db.update(dbSchema.user)
					.set({
						emailVerifiedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(
						and(
							eq(dbSchema.user.id, userId),
							eq(dbSchema.user.email, email)
						)
					)
					.returning(defaultUserReturn)
					.then((result) => result[0] ?? null);
			},
			getOneTOTPKey: async (userId) => {
				return db.select({ totpKey: dbSchema.user.totpKey })
					.from(dbSchema.user)
					.where(eq(dbSchema.user.id, userId))
					.then((result) => {
						  if (!result[0]?.totpKey) {
						    return null;
						  }
						  const encrypted = result[0].totpKey;
						  return decrypt(encrypted);
					});
			}
		},
		session: {
			createOne: async (values) => {
				const createdAt = new Date();
				return db.insert(dbSchema.session).values({
					...values,
					// id: values.id ?? (await idsProvider.createOneAsync()),
					expiresAt: dateLikeToDate(values.expiresAt),
					twoFactorVerifiedAt: values.twoFactorVerifiedAt ? dateLikeToDate(values.twoFactorVerifiedAt) : null,
					createdAt,
					updatedAt: createdAt,
				})
					.returning(defaultSessionReturn)
					.then((result) => result[0] ?? null);
			},
			findOneWithUser: async (sessionId) => {
				return db.query.session.findFirst({
					with: { user: { columns: defaultUserReturn2 } },
					columns: defaultSessionReturn2,
					where: eq(dbSchema.session.id, sessionId),
				})
					.then((result) => {
						if (!result) return null;
						const { user, ...session } = result;
						return { session, user };
					});
			},
			extendOneExpirationDate: async (sessionId, expiresAt) => {
				return db.update(dbSchema.session)
					.set({
						expiresAt: dateLikeToDate(expiresAt),
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.session.id, sessionId))
					.returning(defaultSessionReturn)
					.then((result) => result[0] ?? null);
			},
			deleteOneById: async (sessionId) => {
				await db.delete(dbSchema.session)
					.where(eq(dbSchema.session.id, sessionId));
			},
			invalidateAllByUserId: async (userId) => {
				await db.delete(dbSchema.session)
					.where(eq(dbSchema.session.userId, userId));
			},
			markOne2FAVerified: async (sessionId) => {
				return db.update(dbSchema.session)
					.set({
						twoFactorVerifiedAt: new Date(),
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.session.id, sessionId))
					.returning(defaultSessionReturn)
					.then((result) => result[0] ?? null);
			},
			unMarkOne2FAForUser: async (userId, tx) => {
				const _db = /** @type {Parameters<Parameters<typeof db.transaction>[0]>[0]|undefined} */(tx) ?? db;
				return await _db.update(dbSchema.session)
					.set({
						twoFactorVerifiedAt: null,
						updatedAt: new Date(),
					})
					.where(eq(dbSchema.session.userId, userId))
					.returning(defaultSessionReturn)
					.then((result) => result[0] ?? null);
			},
			// The following methods are commented out as they are not currently used.
			// They could be useful for session management in the future, so they are kept here for reference.
			// findManyExpired: async () => {
			// 	return db.select(defaultSessionReturn)
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
		passwordResetSession: {},
		emailVerificationRequest: {},
		// ids: {
		// 	createOneSync: () => crypto.randomUUID(),
		// 	createOneAsync: async () => crypto.randomUUID(),
		// }
	})
}