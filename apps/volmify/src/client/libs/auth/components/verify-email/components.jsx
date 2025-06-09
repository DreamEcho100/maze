"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { resendEmailVerificationCodeAction, verifyEmailAction } from "./actions";

/** @type {ActionResult} */
const emailVerificationInitialState = {
	type: "idle",
};

export function EmailVerificationForm() {
	const [state, action] = useActionState(verifyEmailAction, emailVerificationInitialState);
	return (
		<form action={action}>
			<label htmlFor="form-verify.code">Code</label>
			<input id="form-verify.code" name="code" required />
			<button>Verify</button>
			<p>{state.message}</p>
		</form>
	);
}

/** @type {ActionResult} */
const resendEmailInitialState = {
	type: "idle",
};

export function ResendEmailVerificationCodeForm() {
	const [state, action] = useActionState(
		resendEmailVerificationCodeAction,
		resendEmailInitialState,
	);
	return (
		<form action={action}>
			<button>Resend code</button>
			<p>{state.message}</p>
		</form>
	);
}
