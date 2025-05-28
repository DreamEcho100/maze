/** @import { ProvidersInit, AuthStrategy, IdsProvider, CookiesProvider, HeadersProvider, JWTProvider, UserEmailVerificationRequestsProvider, PasswordResetSessionsProvider, SessionsProvider, UsersProvider, } from '#types.ts'; */

import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export let headersProvider = /** @type {HeadersProvider} */ ({});

/** @param {HeadersProvider} newHeadersProvider */
function setHeadersProvider(newHeadersProvider) {
	headersProvider = { ...headersProvider, ...newHeadersProvider };
}

export let cookiesProvider = /** @type {CookiesProvider} */ ({});

/** @param {CookiesProvider} newCookiesProvider */
function setCookiesProvider(newCookiesProvider) {
	cookiesProvider = { ...cookiesProvider, ...newCookiesProvider };
}

export let jwtProvider = /** @type {JWTProvider} */ ({
	getAccessToken() {
		const authHeader = headersProvider.get("authorization");

		if (!authHeader?.startsWith("Bearer ")) {
			return null;
		}

		return authHeader.slice(7); // Remove "Bearer " prefix
	},
	getRefreshToken: () => headersProvider.get("x-refresh-token") ?? null,
	createAccessToken: (props, options = {}) => {
		const { userId, sessionId, customClaims = {} } = props.data;

		const payload = {
			userId,
			type: "access",
			...(sessionId && { sessionId }),
			...customClaims,
		};

		const secret = options.secret ?? JWT_SECRET;

		if (!secret) {
			throw new Error("JWT secret is not set. Please configure JWT_SECRET environment variable.");
		}

		return jwt.sign(payload, secret, {
			expiresIn: options.expiresIn ?? "15m",
			audience: options.audience,
			issuer: options.issuer ?? "volmify.com",
			algorithm: "HS256",
		});
	},
	createRefreshToken: (props, options = {}) => {
		const { userId, sessionId, tokenId } = props.data;

		const payload = {
			userId,
			type: "jwt_refresh_token",
			tokenId: tokenId ?? idsProvider.createOneSync(),
			...(sessionId && { sessionId }),
		};

		const secret = options.secret ?? JWT_SECRET;

		if (!secret) {
			throw new Error("JWT secret is not set. Please configure JWT_SECRET environment variable.");
		}

		return jwt.sign(payload, secret, {
			expiresIn: options.expiresIn ?? "30d",
			audience: options.audience,
			issuer: options.issuer ?? "volmify.com",
			algorithm: "HS256",
		});
	},
	verifyToken: (token, options = {}) => {
		const secret = options.secret ?? JWT_SECRET;

		if (!secret) {
			throw new Error("JWT secret is not set. Please configure JWT_SECRET environment variable.");
		}
		try {
			return jwt.verify(token, secret, {
				audience: options.audience,
				issuer: options.issuer ?? "volmify.com",
				ignoreExpiration: options.ignoreExpiration ?? false,
				algorithms: ["HS256"],
			});
		} catch (error) {
			console.warn(
				"JWT verification failed:",
				error instanceof Error ? error.message : JSON.stringify(error),
			);
			return null;
		}
	},
	extractFromRequest: () => {
		// 1. Authorization header (Bearer token)
		const authHeader = headersProvider.get("authorization");
		if (authHeader?.startsWith("Bearer ")) {
			return authHeader.slice(7);
		}

		// 2. Cookie (for web apps)
		const cookieToken = cookiesProvider.get("auth_token") ?? cookiesProvider.get("access_token");
		if (cookieToken) {
			return cookieToken;
		}

		// // 3. Query parameter (for webhooks, API callbacks)
		// const queryToken = req.query?.token ?? req.query?.access_token;
		// if (queryToken) {
		// 	return queryToken;
		// }

		// 4. Custom header (for mobile apps)
		const customHeader = headersProvider.get("x-auth-token");
		if (customHeader) {
			return customHeader;
		}

		return null;
	},
	createTokenPair: (props, options = {}) => {
		// const tokenId = idsProvider.createOneSync();

		// Create access token
		const accessToken = jwtProvider.createAccessToken(props, {
			// "15m"
			expiresIn: options.accessTokenExpiry ?? 1000 * 60 * 15, // 15 minutes in milliseconds
			audience: options.audience,
			issuer: options.issuer,
		});

		// Create refresh token with the generated tokenId
		const refreshToken = jwtProvider.createRefreshToken(
			{
				data: {
					userId: props.data.userId,
					sessionId: props.data.sessionId,
				},
			},
			{
				// "30d"
				expiresIn: options.refreshTokenExpiry ?? 1000 * 60 * 60 * 24 * 30, // 30 days in milliseconds
				audience: options.audience,
				issuer: options.issuer,
			},
		);

		return { accessToken, refreshToken };
	},
});

/** @param {JWTProvider} newJWTProvider */
function setJWTProvider(newJWTProvider) {
	jwtProvider = { ...jwtProvider, ...newJWTProvider };
}

export let idsProvider = /** @type {IdsProvider} */ ({});

/** @param {IdsProvider} newIdsProvider */
function setIdsProvider(newIdsProvider) {
	idsProvider = { ...idsProvider, ...newIdsProvider };
}

export let userEmailVerificationRequestProvider =
	/** @type {UserEmailVerificationRequestsProvider} */ ({});

/** @param {UserEmailVerificationRequestsProvider} newUserEmailVerificationRequestProvider  */
function setUserEmailVerificationRequestProvider(newUserEmailVerificationRequestProvider) {
	userEmailVerificationRequestProvider = {
		...userEmailVerificationRequestProvider,
		...newUserEmailVerificationRequestProvider,
	};
}

export let passwordResetSessionProvider = /** @type {PasswordResetSessionsProvider} */ ({});

/** @param {PasswordResetSessionsProvider} newPasswordResetSessionProvider */
function setPasswordResetSessionProvider(newPasswordResetSessionProvider) {
	passwordResetSessionProvider = {
		...passwordResetSessionProvider,
		...newPasswordResetSessionProvider,
	};
}

export let sessionProvider = /** @type {SessionsProvider} */ ({});

/** @param {SessionsProvider} newSessionProvider */
function setSessionProvider(newSessionProvider) {
	sessionProvider = { ...sessionProvider, ...newSessionProvider };
}

export let usersProvider = /** @type {UsersProvider} */ ({});

/** @param {UsersProvider} newUserProvider  */
function setUserProvider(newUserProvider) {
	usersProvider = { ...usersProvider, ...newUserProvider };
}

/** @type {AuthStrategy} */
let authStrategy = process.env.AUTH_STRATEGY ?? globalThis.__AUTH_STRATEGY ?? "session";

/**
 * @param {AuthStrategy} strategy - The authentication strategy to set. Must be either "session" or "jwt".
 * @throws {Error} If the strategy is not "session" or "jwt".
 */
function setAuthStrategy(strategy) {
	if (strategy !== "session" && strategy !== "jwt") {
		throw new Error(`Invalid auth strategy: ${strategy}. Must be 'session' or 'jwt'.`);
	}
	authStrategy = strategy;
}

export function getAuthStrategy() {
	return authStrategy;
}

/** @param {Partial<ProvidersInit>} providers */
export async function initAuth(providers) {
	if (providers.strategy) {
		setAuthStrategy(providers.strategy);
	}

	await Promise.all(
		/** @type {const} */ ([
			["cookies", setCookiesProvider],
			["ids", setIdsProvider],
			["headers", setHeadersProvider],
			["jwt", setJWTProvider],
		]).map(([key, setter]) => {
			const value = providers[key];
			if (!value) return;

			if (typeof value === "function") {
				const res = value();
				if (res instanceof Promise) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return res.then(setter);
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				return setter(res);
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			setter(value);
		}),
	);

	await Promise.all(
		/** @type {const} */ ([
			["users", setUserProvider],
			["sessions", setSessionProvider],
			["passwordResetSessions", setPasswordResetSessionProvider],
			["emailVerificationRequests", setUserEmailVerificationRequestProvider],
		]).map(([key, setter]) => {
			const value = providers.providers?.[key];
			if (!value) return;

			if (typeof value === "function") {
				const res = value();
				if (res instanceof Promise) {
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					return res.then(setter);
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				return setter(res);
			}
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			setter(value);
		}),
	);
}
