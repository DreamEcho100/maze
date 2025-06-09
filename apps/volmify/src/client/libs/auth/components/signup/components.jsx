"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { signupAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function SignUpForm() {
	const [state, action] = useActionState(signupAction, initialState);

	return (
		<form action={action}>
			<label htmlFor="form-signup.name">Username</label>
			<input id="form-signup.name" name="name" required minLength={4} maxLength={31} />
			<br />
			<label htmlFor="form-signup.email">Email</label>
			<input type="email" id="form-signup.email" name="email" autoComplete="name" required />
			<br />
			<label htmlFor="form-signup.password">Password</label>
			<input
				type="password"
				id="form-signup.password"
				name="password"
				autoComplete="new-password"
				required
			/>
			<br />
			<label htmlFor="form-signup.enable-2fa">Enable 2FA</label>
			<input type="checkbox" id="form-signup.enable-2fa" name="enable_2fa" />
			<button>Continue</button>
			<p>{state.message}</p>
		</form>
	);
}
