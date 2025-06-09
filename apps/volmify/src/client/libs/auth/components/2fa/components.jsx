"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { verify2FAAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function TwoFactorVerificationForm() {
	const [state, action] = useActionState(verify2FAAction, initialState);

	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" autoComplete="one-time-code" required />
			<br />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}
