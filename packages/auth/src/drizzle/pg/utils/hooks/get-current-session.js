/** @import { ValidSessionResult, InvalidSessionResult } from "@acme/auth/types" */
/** @import { SessionWithUser } from "@acme/auth/types";  */

import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryClient } from "@trpc/react-query/shared";

// import { api } from "~/libs/trpc/react";
import { getCurrentSession } from "../get-current-session";

export const CLIENT_CURRENT_SESSION_STATUS = /** @type {const} */ ({
	AUTHENTICATED: "AUTHENTICATED",
	UNAUTHENTICATED: "UNAUTHENTICATED",
	INITIAL_LOADING: "INITIAL_LOADING",
});

/**
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS[keyof typeof CLIENT_CURRENT_SESSION_STATUS]} ClientCurrentSessionStatus
 * @typedef {typeof CLIENT_CURRENT_SESSION_STATUS} TCLIENT_CURRENT_SESSION_STATUS
 * @typedef {{ update: (user: Partial<SessionWithUser["user"]>) => Promise<void> }} SharedClientUserSession
 *
 * @typedef {SharedClientUserSession & { data: ValidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["AUTHENTICATED"] }} ClientAuthenticatedUserSession
 * @typedef {SharedClientUserSession & { data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["UNAUTHENTICATED"] }} ClientUnauthenticatedUserSession
 * @typedef {SharedClientUserSession & { data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["INITIAL_LOADING"] }} ClientInitialLoadingUserSession
 *
 * @typedef {ClientAuthenticatedUserSession
 * 	| ClientUnauthenticatedUserSession
 *  | ClientInitialLoadingUserSession} ClientUserSession
 *
 * @typedef {ClientInitialLoadingUserSession | ClientAuthenticatedUserSession} RequiredClientUserSession
 */

const getCurrentSessionQueryKey = ["current-session"];

/**
 * @template {true|undefined} [Required=undefined]
 * @param {{ data?: SessionWithUser | null; required?: Required }} [props]
 *
 * @returns {Required extends true ? RequiredClientUserSession : ClientUserSession}
 *
 */
export function useGetCurrentSession(props) {
	// const utils = api.useUtils()
	// utils.client.query
	const update = useCallback(
		/** @param {Partial<SessionWithUser['user']>} user */
		async (user) => {
			const queryClient = getQueryClient({});

			queryClient.setQueryData(
				getCurrentSessionQueryKey,
				/**
				 * @param {ClientUserSession | null} prev
				 * @returns {ClientUserSession}
				 */
				(prev) => {
					if (!prev) {
						return {
							status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
							data: { session: null, user: null },
							update,
						};
					}

					if (prev.status !== CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED) {
						return prev;
					}

					return {
						...prev,
						data: {
							...prev.data,
							user: {
								...prev.data.user,
								...user,
							},
						},
					};
				},
			);

			await query.refetch();
		},
		[],
	);

	const query = useQuery({
		queryKey: getCurrentSessionQueryKey,
		/** @returns {Promise<ClientUserSession>} */
		queryFn: async () => {
			const result = await getCurrentSession();

			if (!result.session) {
				return {
					status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
					data: { session: null, user: null },
					update,
				};
			}

			return {
				status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
				data: result,
				update,
			};
		},
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		/** @type {ClientAuthenticatedUserSession|ClientUnauthenticatedUserSession|undefined} */
		initialData: props?.data?.user && {
			status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
			data: props.data,
			update,
		},
	});

	if (props?.required) {
		if (query.data?.status === CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED) {
			window.location.href = "/auth/login";
			throw new Error("Redirecting to login...");
		}

		return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
			query.data ?? {
				status: CLIENT_CURRENT_SESSION_STATUS.INITIAL_LOADING,
				data: { session: null, user: null },
				update,
			}
		);
	}

	return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
		query.data ?? {
			status: CLIENT_CURRENT_SESSION_STATUS.INITIAL_LOADING,
			data: { session: null, user: null },
			update,
		}
	);
}
