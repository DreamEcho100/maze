import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export const jwtProvider = /** @type {import("#types.ts").JWTProvider} */ ({
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
			// tokenId: tokenId ?? idsProvider.createOneSync(),
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
