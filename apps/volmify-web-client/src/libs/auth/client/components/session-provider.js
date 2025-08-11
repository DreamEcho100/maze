/**
 * @import { ValidSessionResult } from "@de100/auth-core/types";
 * @import { PropsWithChildren } from "react";
 */

import { useGetCurrentSessionQuery } from "../hooks/get-current-session";

// import { useGetCurrentSession } from "../utils/hooks/get-current-session";

/** @param {PropsWithChildren<{ authData?: ValidSessionResult | null }>} props */
export default function SessionProvider(props) {
	useGetCurrentSessionQuery(props);

	return props.children;
}
