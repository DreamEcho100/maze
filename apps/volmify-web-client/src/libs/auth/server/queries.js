"use server";

/**
 * @import { AuthProvidersShape, AuthProvidersWithGetSessionUtils, HeadersProvider } from "@de100/auth-core/types";
 */

import { resolveAuthSessionService } from "@de100/auth-core/services/resolve-auth-session";
import { AUTH_URLS } from "@de100/auth-core/utils/constants";
import { getCurrentAuthSession } from "@de100/auth-core/utils/sessions";
import { db } from "@de100/db/client";
import { query } from "@solidjs/router";
import { redirect } from "#libs/i18n/server/utils.ts";
import { generateGetCurrentAuthSessionProps } from "./utils.js";

/**
 * @param {object} [props]
 * @param {Headers} [props.reqHeaders] - Optional headers from the request, typically used to access cookies.
 * @param {boolean} [props.canMutateCookies] - Indicates whether the function can modify cookies.
 */
export async function getUncachedCurrentSession(props) {
	return getCurrentAuthSession(
		await generateGetCurrentAuthSessionProps({
			reqHeaders: props?.reqHeaders,
			canMutateCookies: props?.canMutateCookies,
		}),
	);
}

export const getCurrentSession = query(
	/**
	 * @param {object} [props]
	 * @param {Headers} [props.reqHeaders] - Optional headers from the request, typically used to access cookies.
	 * @param {boolean} [props.canMutateCookies] - Indicates whether the function can modify cookies.
	 */
	(props) => {
		"use server";
		return getUncachedCurrentSession(props);
	},
	"getCurrentSession",
);

// export const sessionUtils = generateSessionUtils({
// 	generateGetCurrentAuthSessionProps,
// 	getCurrentSession,
// });

// /**
//  * @param {Partial<Parameters<typeof generateGetCurrentAuthSessionProps>[0]>} props
//  */
// exconst generateAuthSessionProps = async (props) => {
// 	const authProps = await generateGetCurrentAuthSessionProps(props);
// 	const result = await getCurrentSession(authProps);

// 	if (!result.session) {
// 		return null;
// 	}

// 	return {
// 		...authProps,
// 		user: result.user,
// 		session: result.session,
// 		sessionMetadata: result.metadata,
// 	};
// };

export const extendCurrentSession = async () => {
	// return sessionUtils.extendCurrentSession({
	// 	onInvalidSession: () => {
	// 		redirect(AUTH_URLS.LOGIN);
	// 	},
	// });
	const authProps = await generateAuthSessionProps({});
	if (!authProps) {
		redirect(AUTH_URLS.LOGIN);
		// props.onInvalidSession();
		return;
	}

	return db.transaction(async (tx) =>
		resolveAuthSessionService({ ...authProps, tx }),
	);
};
export const refreshCurrentSession = async () => {
	// return sessionUtils.refreshCurrentSession({
	// 	onInvalidSession: () => {
	// 		redirect(AUTH_URLS.LOGIN);
	// 	},
	// });

	const authProps = await generateAuthSessionProps({});
	if (!authProps) {
		redirect(AUTH_URLS.LOGIN);
		return;
	}

	return db.transaction(async (tx) => {
		return resolveAuthSessionService({ ...authProps, tx });
	});
};

// /**
//  * @param {{
//  * 	onInvalidSession: () => void;
//  * }} props
//  */
// refreshCurrentSession: async (props) => {
// 	const authProps = await result.generateAuthSessionProps({});
// 	if (!authProps) {
// 		// redirect(AUTH_URLS.LOGIN);
// 		props.onInvalidSession();
// 		return;
// 	}

// 	return db.transaction(async (tx) => {
// 		return resolveAuthSessionService({ ...authProps, tx });
// 	});
// },
// /**
//  * @param {{
//  * 	onInvalidSession: () => void;
//  * }} props
//  */
// extendCurrentSession: async (props) => {
// 	const authProps = await result.generateAuthSessionProps({});
// 	if (!authProps) {
// 		// redirect(AUTH_URLS.LOGIN);
// 		props.onInvalidSession();
// 		return;
// 	}

// 	return db.transaction(async (tx) => resolveAuthSessionService({ ...authProps, tx }));
// },

// /**
//  * @template {Partial<AuthProvidersWithGetSessionUtils> & {
//  * 	authProviders?: AuthProvidersShape
//  * 	reqHeaders?: Headers;
//  * }} TProps
//  * @param {TProps} props
//  */
// export const generateAuthSessionProps = async (props) => {
// 	const authProps = await generateGetCurrentAuthSessionProps(props);
// 	const result = await getCurrentSession(authProps);

// 	if (!result.session) {
// 		return null;
// 	}

// 	return {
// 		...authProps,
// 		user: result.user,
// 		session: result.session,
// 		sessionMetadata: result.metadata,
// 	};
// }

/**
 * @template {Partial<AuthProvidersWithGetSessionUtils> & {
 * 	authProviders?: AuthProvidersShape
 * 	reqHeaders?: Headers;
 * }} TProps
 * @param {TProps} props
 */
export async function generateAuthSessionProps(props) {
	const input = await generateGetCurrentAuthSessionProps(props);
	const result = await getCurrentSession(input);

	if (!result.session) {
		return null;
	}

	return {
		...input,
		user: result.user,
		session: result.session,
		sessionMetadata: result.metadata,
	};
}
