/**
 * @import { ValidSessionResult } from "@de100/auth-core/types";
 * @import { ParentProps } from "solid-js";
 */

import { useGetCurrentSessionQuery } from "../hooks/get-current-session";

// import { useGetCurrentSession } from "../utils/hooks/get-current-session";

/** @param {ParentProps<{ authData?: ValidSessionResult | null }>} props */
export default function SessionProvider(props) {
	useGetCurrentSessionQuery(props);

	return <>{props.children}</>;
}
