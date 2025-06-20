"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { reset2FAAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function TwoFactorResetForm() {
	const [state, action] = useActionState(reset2FAAction, initialState);
	return (
		<form action={action}>
			<label htmlFor="form-totp.code">Recovery code</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button type="submit">Verify</button>
			<p>{state.message ?? ""}</p>
		</form>
	);
}
