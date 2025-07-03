"use client";

/**
 *  @import { ActionResult } from "./actions";
 * @import { ButtonHTMLAttributes } from "react";
 */
import { useActionState } from "react";

import { logoutAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

/** @param {ButtonHTMLAttributes<HTMLButtonElement>} props  */
export function LogoutButton(props) {
	const [, action] = useActionState(logoutAction, initialState);
	return (
		<form action={action} style={{ display: "contents" }}>
			<button {...props} type="submit">
				Sign out
			</button>
		</form>
	);
}
