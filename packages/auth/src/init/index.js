/** @import { ProvidersInit, AuthStrategy, IdsProvider, CookiesProvider, HeadersProvider, JWTProvider, UserEmailVerificationRequestsProvider, PasswordResetSessionsProvider, SessionsProvider, UsersProvider, } from '#types.ts'; */

import jwt from "jsonwebtoken";

const JWT_SECRET = "process.env.JWT_SECRET";

export class AuthConfig {
	strategy = /** @type {AuthStrategy} */ ("jwt");

	headers = /** @type {HeadersProvider} */ ({});
	cookies = /** @type {CookiesProvider} */ ({});
	jwt = /** @type {JWTProvider} */ ({
		createAccessToken: (props, options = {}) => {
			const payload = props.data;

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
			const { user } = props.data;

			const payload = {
				user,
				// type: "jwt_refresh_token",
				// tokenId: tokenId ?? authConfig.ids.createOneSync(),
				// ...(sessionId && { sessionId }),
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
		verifyAccessToken: (token, options = {}) => {
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
			const authHeader = authConfig.headers.get("authorization");
			if (authHeader?.startsWith("Bearer ")) {
				return authHeader.slice(7);
			}

			// 2. Cookie (for web apps)
			const cookieToken =
				authConfig.cookies.get("auth_token") ?? authConfig.cookies.get("access_token");
			if (cookieToken) {
				return cookieToken;
			}

			// // 3. Query parameter (for webhooks, API callbacks)
			// const queryToken = req.query?.token ?? req.query?.access_token;
			// if (queryToken) {
			// 	return queryToken;
			// }

			// 4. Custom header (for mobile apps)
			const customHeader = authConfig.headers.get("x-auth-token");
			if (customHeader) {
				return customHeader;
			}

			return null;
		},
		createTokenPair: (props, options = {}) => {
			// const tokenId = idsProvider.createOneSync();

			// Create access token
			const accessToken = authConfig.jwt.createAccessToken(props, {
				// "15m"
				expiresIn: options.accessTokenExpiry ?? 1000 * 60 * 15, // 15 minutes in milliseconds
				audience: options.audience,
				issuer: options.issuer,
			});

			// Create refresh token with the generated tokenId
			const refreshToken = authConfig.jwt.createRefreshToken(
				{
					data: {
						user: props.data.user,
						metadata: props.data.metadata,
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
	ids = /** @type {IdsProvider} */ ({});
	providers = {
		userEmailVerificationRequest: /** @type {UserEmailVerificationRequestsProvider} */ ({}),
		passwordResetSession: /** @type {PasswordResetSessionsProvider} */ ({}),
		session: /** @type {SessionsProvider} */ ({}),
		users: /** @type {UsersProvider} */ ({}),
	};

	hasInitialized = false;

	/**
	 *
	 * @param {{
	 *  authStrategy?: AuthStrategy,
	 * 	headers?: HeadersProvider | (() => HeadersProvider | Promise<HeadersProvider>),
	 * 	cookies?: CookiesProvider | (() => CookiesProvider | Promise<CookiesProvider>),
	 * 	jwt?: JWTProvider | (() => JWTProvider | Promise<JWTProvider>),
	 * 	ids?: IdsProvider | (() => IdsProvider | Promise<IdsProvider>),
	 * 	providers?: Partial<{ [Key in keyof AuthConfig["providers"]]: AuthConfig["providers"][Key] | (() => AuthConfig["providers"][Key] | Promise<AuthConfig["providers"][Key]>) }>,
	 * }} config
	 */
	async init(config = {}) {
		if (config.authStrategy) this.strategy = config.authStrategy;

		await Promise.all(
			/** @type {const} */ (["cookies", "ids", "headers", "jwt"]).map(async (key) => {
				const value = config[key];
				if (!value) return;

				if (typeof value === "function") {
					const promisedValue = value();
					if (promisedValue instanceof Promise) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						await promisedValue.then((res) => ({ ...this[key], ...res }));
						return;
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					this[key] = { ...this[key], ...promisedValue };
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this[key] = { ...this[key], ...value };
				return;
			}),
		);

		await Promise.all(
			/** @type {const} */ ([
				"userEmailVerificationRequest",
				"passwordResetSession",
				"session",
				"users",
			]).map(async (key) => {
				const value = config.providers?.[key];
				if (!value) return;

				if (typeof value === "function") {
					const promisedValue = value();
					if (promisedValue instanceof Promise) {
						// eslint-disable-next-line @typescript-eslint/ban-ts-comment
						// @ts-ignore
						await promisedValue.then((res) => ({ ...this.providers[key], ...res }));
						return;
					}
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					this.providers[key] = { ...this.providers[key], ...promisedValue };
					return;
				}
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				this.providers[key] = { ...this.providers[key], ...value };
				return;
			}),
		);

		this.hasInitialized = true;

		return this;
	}
}

// eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
const _global = /** @type {{ ___authConfig?: AuthConfig }} */ (globalThis ?? global);
export const authConfig = (_global.___authConfig ??= new AuthConfig());

/** @param {Partial<ProvidersInit>} config */
export async function initAuth(config) {
	if (authConfig.hasInitialized) {
		// If authConfig is already initialized, we can return it directly
		return authConfig;
	}

	await authConfig.init(config);
}
