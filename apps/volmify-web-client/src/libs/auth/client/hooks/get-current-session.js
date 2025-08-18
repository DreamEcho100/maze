// @ts-check

/** @import { ValidSessionResult, InvalidSessionResult } from "@de100/auth-core/types" */
/** @import { SessionWithUser } from "@de100/auth-core/types";  */

import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useQuery } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { queryClient } from "#libs/@tanstack/query/query-client.js";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import {
	// extendCurrentSession,
	// getCurrentSession,
	// refreshCurrentSession,
} from "#libs/auth/server/utils.js";
// import { extendCurrentSession } from "#server/libs/auth/extend-current-session";
// import { refreshCurrentSession } from "#server/libs/auth/refresh-current-session";

export const CLIENT_CURRENT_SESSION_STATUS = /** @type {const} */ ({
	AUTHENTICATED: "AUTHENTICATED",
	UNAUTHENTICATED: "UNAUTHENTICATED",
	PENDING: "PENDING",
});
// * 	refreshCurrentSession: typeof refreshCurrentSession;
// * 	extendCurrentSession: typeof extendCurrentSession;

/**
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS[keyof typeof CLIENT_CURRENT_SESSION_STATUS]} ClientCurrentSessionStatus
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS} TCLIENT_CURRENT_SESSION_STATUS
 * @typedef {{
 * 	updateUser: (user: Partial<SessionWithUser["user"]>) => Promise<void>;
 * }} Utils
 *
 * @typedef {Utils & { data: ValidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["AUTHENTICATED"] }} ClientAuthenticatedUserSession
 * @typedef {{updateUser?: undefined; refreshCurrentSession?: undefined; extendCurrentSession?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["UNAUTHENTICATED"] }} ClientUnauthenticatedUserSession
 * @typedef {{updateUser?: undefined; refreshCurrentSession?: undefined; extendCurrentSession?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["PENDING"] }} ClientInitialLoadingUserSession
 *
 * @typedef {ClientAuthenticatedUserSession
 * 	| ClientUnauthenticatedUserSession
 *  | ClientInitialLoadingUserSession} ClientUserSession
 *
 * @typedef {ClientInitialLoadingUserSession | ClientAuthenticatedUserSession} RequiredClientUserSession
 */

const getCurrentSessionQueryKey = () => ["current-session"];
const INITIAL_INVALID_DATA = /** @type {InvalidSessionResult} */ ({
	session: null,
	user: null,
	metadata: null,
});

/**
 * @template {true|undefined} [Required=undefined]
 * @param {{ authData?: ValidSessionResult | null; required?: Required }} [props]
 */
export function useGetCurrentSessionQuery(props) {
	// const navigate = useNavigate();
	// _props;
	// _navigate;
	const router = useRouter();
	const query = useQuery(() => ({
		queryKey: getCurrentSessionQueryKey(),
		/** @returns {Promise<Required extends true ? RequiredClientUserSession : ClientUserSession>} */
		queryFn: async () => {
			const result = await getCurrentSession();

			if (!result.session) {
				return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ ({
					status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
					data: INITIAL_INVALID_DATA,
				});
			}

			/** @param {Partial<SessionWithUser['user']>} user */
			async function updateUser(user) {
				queryClient.setQueryData(
					getCurrentSessionQueryKey(),
					/**
					 * @param {ClientUserSession | null} prev
					 * @returns {ClientUserSession}
					 */
					(prev) => {
						if (!prev) {
							return {
								status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
								data: INITIAL_INVALID_DATA,
							};
						}

						if (prev.status !== CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED) {
							return prev;
						}

						return /** @type {ClientUserSession} */ ({
							...prev,
							data: {
								...prev.data,
								user: {
									...prev.data.user,
									...user,
								},
							},
						});
					},
				);
			}

			return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ ({
				status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
				data: result,
				updateUser: updateUser,
				// refreshCurrentSession: refreshCurrentSession,
				// extendCurrentSession: extendCurrentSession,
			});
		},
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		placeholderData: {
			status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
			data: INITIAL_INVALID_DATA,
		},
	}));

	const sessionStatus = createMemo(() => query.data?.status);

	if (
		props?.required &&
		sessionStatus() === CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED
	) {
		// If required, ensure we have a session
		// navigate("/auth/login", { replace: true });
		// throw new Error("Redirecting to login...");
		router.push("/auth/login"); // { replace: true }
		throw new Error("Redirecting to login...");
	}

	return query;
	// return /** @type {const} */ ([() => query.data, query]);

	// const refetch = query.refetch;
	// // Use createMemo instead of useMemo for SolidJS reactivity
	// return createMemo(() => {
	// 	const data = query.data;

	// 	if (props?.required) {
	// 		if (data?.status === CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED) {
	// 			// Use SolidStart navigation instead of window.location
	// 			navigate("/auth/login", { replace: true });
	// 			throw new Error("Redirecting to login...");
	// 		}

	// 		console.log(
	// 			data ?? {
	// 				status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	// 				data: INITIAL_INVALID_DATA,
	// 			},
	// 		);

	// 		return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
	// 			data ?? {
	// 				status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	// 				data: INITIAL_INVALID_DATA,
	// 			}
	// 		);
	// 	}

	// 	return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
	// 		data ?? {
	// 			status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	// 			data: INITIAL_INVALID_DATA,
	// 		}
	// 	);
	// });
}
