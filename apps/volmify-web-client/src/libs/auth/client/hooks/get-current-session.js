// @ts-check

/** @import { ValidSessionResult, InvalidSessionResult } from "@de100/auth-shared/types" */

import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useQuery } from "@tanstack/solid-query";
import { createMemo, createRenderEffect, createSignal, onMount } from "solid-js";
import { getCurrentSessionQuery } from "../components/queries";
import { authRoutesConfig } from "../components/routes-config";

export const CLIENT_CURRENT_SESSION_STATUS = /** @type {const} */ ({
	AUTHENTICATED: "AUTHENTICATED",
	UNAUTHENTICATED: "UNAUTHENTICATED",
	PENDING: "PENDING",
});
// * 	refreshCurrentSession: typeof refreshCurrentSession;
// * 	extendCurrentSession: typeof extendCurrentSession;
// * 	updateUser: (user: Partial<SessionWithUser["user"]>) => Promise<void>;
// * @typedef {{
// * }} Utils

/**
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS[keyof typeof CLIENT_CURRENT_SESSION_STATUS]} ClientCurrentSessionStatus
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS} TCLIENT_CURRENT_SESSION_STATUS
 *
 * @typedef {{ data: ValidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["AUTHENTICATED"] }} ClientAuthenticatedUserSession
 * @typedef {{refreshCurrentSession?: undefined; extendCurrentSession?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["UNAUTHENTICATED"] }} ClientUnauthenticatedUserSession
 * @typedef {{refreshCurrentSession?: undefined; extendCurrentSession?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["PENDING"] }} ClientInitialLoadingUserSession
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
 * @typedef {Required extends true ? RequiredClientUserSession : ClientUserSession} UserSession
 */

const useIsMounted = () => {
	const [mounted, setMounted] = createSignal(false);
	onMount(() => {
		setMounted(true);
	});
	return mounted;
};

const defaultData = /** @type {UserSession<any>} */ ({
	status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	data: INITIAL_INVALID_DATA,
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
		queryFn:
			/** @returns {Promise<UserSession<Required>>} */
			async () => {
				const result = await getCurrentSessionQuery();

				if (!result.session) {
					return /** @type {UserSession<Required>} */ ({
						status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
						data: INITIAL_INVALID_DATA,
					});
				}

				// /** @param {Partial<SessionWithUser['user']>} user */
				// async function updateUser(user) {
				// 	queryClient.setQueryData(
				// 		getCurrentSessionQueryKey(),
				// 		/**
				// 		 * @param {ClientUserSession | null} prev
				// 		 * @returns {ClientUserSession}
				// 		 */
				// 		(prev) => {
				// 			if (!prev) {
				// 				return {
				// 					status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
				// 					data: INITIAL_INVALID_DATA,
				// 				};
				// 			}

				// 			if (prev.status !== CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED) {
				// 				return prev;
				// 			}

				// 			return /** @type {ClientUserSession<Required>} */ ({
				// 				...prev,
				// 				data: {
				// 					...prev.data,
				// 					user: {
				// 						...prev.data.user,
				// 						...user,
				// 					},
				// 				},
				// 			});
				// 		},
				// 	);
				// }

				return /** @type {UserSession<Required>} */ ({
					status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
					data: result,
					// updateUser: updateUser,
					// refreshCurrentSession: refreshCurrentSession,
					// extendCurrentSession: extendCurrentSession,
				});
			},
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		// @ts-expect-error
		placeholderData: defaultData,
	}));

	const sessionStatus = createMemo(() => query.data?.status);

	createRenderEffect(() => {
		if (!props?.required || sessionStatus() !== CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED) {
			return;
		}

		try {
			throw new Error("Redirecting to login...");
		} catch (error) {
			// If required, ensure we have a session
			// navigate("/auth/login", { replace: true });
			// throw new Error("Redirecting to login...");
			throw new Error(/** @type {Error} */ (error).message);
		} finally {
			router.push(authRoutesConfig.login.path); // { replace: true }
		}
	});

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

	// 		return /** @type {UserSession<Required>} */ (
	// 			data ?? {
	// 				status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	// 				data: INITIAL_INVALID_DATA,
	// 			}
	// 		);
	// 	}

	// 	return /** @type {UserSession<Required>} */ (
	// 		data ?? {
	// 			status: CLIENT_CURRENT_SESSION_STATUS.PENDING,
	// 			data: INITIAL_INVALID_DATA,
	// 		}
	// 	);
	// });
}

// export function useInvalidateCurrentSession() {
// 	const query = useQuery(() => ({
// 		queryKey: getCurrentSessionQueryKey(),
// 		queryFn: getCurrentSessionQuery,
// 		enabled: false,
// 	}));

// 	const invalidate = async () => {
// 		await query.refetch();
// 	};

// 	return invalidate;
// }
