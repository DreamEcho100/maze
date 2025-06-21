/** @import { ValidSessionResult, InvalidSessionResult } from "@de100/auth/types" */
/** @import { SessionWithUser } from "@de100/auth/types";  */

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

import { queryClient } from "#client/libs/orpc";
import { getCurrentSession } from "../../../../server/libs/auth/get-current-session";

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
 * @typedef {{ update: (user: Partial<SessionWithUser["user"]>) => Promise<void>; data: ValidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["AUTHENTICATED"] }} ClientAuthenticatedUserSession
 * @typedef {{update?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["UNAUTHENTICATED"] }} ClientUnauthenticatedUserSession
 * @typedef {{update?: undefined; data: InvalidSessionResult} & { status: TCLIENT_CURRENT_SESSION_STATUS["INITIAL_LOADING"] }} ClientInitialLoadingUserSession
 *
 * @typedef {ClientAuthenticatedUserSession
 * 	| ClientUnauthenticatedUserSession
 *  | ClientInitialLoadingUserSession} ClientUserSession
 *
 * @typedef {ClientInitialLoadingUserSession | ClientAuthenticatedUserSession} RequiredClientUserSession
 */

const getCurrentSessionQueryKey = ["current-session"];
const INITIAL_INVALID_DATA = /** @type {InvalidSessionResult} */ ({
	session: null,
	user: null,
	metadata: null,
});

/**
 * @template {true|undefined} [Required=undefined]
 * @param {{ data?: SessionWithUser | null; required?: Required }} [props]
 *
 * @returns {Required extends true ? RequiredClientUserSession : ClientUserSession}
 *
 */
export function useGetCurrentSession(props) {
	const query = useQuery({
		queryKey: getCurrentSessionQueryKey,
		/** @returns {Promise<ClientUserSession>} */
		queryFn: async () => {
			const result = await getCurrentSession();

			if (!result.session) {
				return {
					status: CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED,
					data: INITIAL_INVALID_DATA,
				};
			}

			/** @param {Partial<SessionWithUser['user']>} user */
			async function updateUserSession(user) {
				// const queryClient = getQueryClient({});
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
								data: INITIAL_INVALID_DATA,
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

				await refetch();
			}

			return {
				status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
				data: result,
				update: updateUserSession,
			};
		},
		refetchOnWindowFocus: true,
		refetchOnReconnect: true,
		// /** @type {ClientAuthenticatedUserSession|ClientUnauthenticatedUserSession|undefined} */
		// placeholderData: props?.data?.user && {
		// 	status: CLIENT_CURRENT_SESSION_STATUS.AUTHENTICATED,
		// 	data: /** @type {import("@de100/auth/types").ValidSessionResult} */ (props.data),
		// 	update: updateUserSession,
		// },
	});

	const data = query.data;
	const refetch = query.refetch;

	const res = useMemo(() => {
		if (props?.required) {
			if (data?.status === CLIENT_CURRENT_SESSION_STATUS.UNAUTHENTICATED) {
				// eslint-disable-next-line react-compiler/react-compiler
				window.location.href = "/auth/login";
				throw new Error("Redirecting to login...");
			}
			console.log(
				data ?? {
					status: CLIENT_CURRENT_SESSION_STATUS.INITIAL_LOADING,
					data: INITIAL_INVALID_DATA,
				},
			);

			return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
				data ?? {
					status: CLIENT_CURRENT_SESSION_STATUS.INITIAL_LOADING,
					data: INITIAL_INVALID_DATA,
				}
			);
		}

		return /** @type {Required extends true ? RequiredClientUserSession : ClientUserSession} */ (
			data ?? {
				status: CLIENT_CURRENT_SESSION_STATUS.INITIAL_LOADING,
				data: INITIAL_INVALID_DATA,
			}
		);
	}, [props?.required, data]);

	return res;
}
