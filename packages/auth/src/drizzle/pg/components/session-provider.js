/**
 * @import { SessionWithUser } from "@acme/auth/types";
 * @import { PropsWithChildren } from "react";
 */

import { useGetCurrentSession } from "../utils/hooks/get-current-session";

/** @param {PropsWithChildren<{ data?: SessionWithUser | null }>} props */
export default function SessionProvider(props) {
	useGetCurrentSession(props);

	return props.children;
}
