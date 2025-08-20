/**
 * @import { ValidSessionResult } from "@de100/auth-core/types";
 * @import { ParentProps } from "solid-js";
 */

import { useGetCurrentSessionQuery } from "../hooks/get-current-session.js";

/** @param {ParentProps<{ authData?: ValidSessionResult | null }>} props */
export default function SessionProvider(props) {
	"use server";
	useGetCurrentSessionQuery(props);

	return <>{props.children}</>;
}
