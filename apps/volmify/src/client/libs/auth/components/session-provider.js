/**
 * @import { ValidSessionResult } from "@de100/auth/types";
 * @import { PropsWithChildren } from "react";
 */

import { useGetCurrentSession } from "../hooks/get-current-session";

// import { useGetCurrentSession } from "../utils/hooks/get-current-session";

/** @param {PropsWithChildren<{ authData?: ValidSessionResult | null }>} props */
export default function SessionProvider(props) {
	useGetCurrentSession(props);

	return props.children;
}
