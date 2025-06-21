"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { verifyPasswordResetEmailVerificationAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function PasswordResetEmailVerificationForm() {
	const [state, action] = useActionState(verifyPasswordResetEmailVerificationAction, initialState);

	return (
		<form action={action}>
			<label htmlFor="form-verify.code">Code</label>
			<input id="form-verify.code" name="code" required />
			<button type="submit">verify</button>
			<p>{state.message}</p>
		</form>
	);
}
