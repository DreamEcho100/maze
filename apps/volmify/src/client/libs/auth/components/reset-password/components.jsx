"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { resetPasswordAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function PasswordResetForm() {
	const [state, action] = useActionState(resetPasswordAction, initialState);

	return (
		<form action={action}>
			<label htmlFor="form-reset.password">Password</label>
			<input
				type="password"
				id="form-reset.password"
				name="password"
				autoComplete="new-password"
				required
			/>
			<br />
			<button type="submit">Reset password</button>
			<p>{state.message}</p>
		</form>
	);
}
