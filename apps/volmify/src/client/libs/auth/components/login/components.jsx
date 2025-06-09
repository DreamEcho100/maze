"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState } from "react";

import { useTranslations } from "@de100/i18n-reactjs";

import { loginAction } from "./actions";

/** @type {ActionResult} */
const initialState = {
	type: "idle",
};

export function LoginForm() {
	const [state, action] = useActionState(loginAction, initialState);
	const t = useTranslations();

	return (
		<form action={action}>
			<h2>{t("locale")}</h2>
			<label htmlFor="form-login.email">Email</label>
			<input type="email" id="form-login.email" name="email" autoComplete="name" required />
			<br />
			<label htmlFor="form-login.password">Password</label>
			<input
				type="password"
				id="form-login.password"
				name="password"
				autoComplete="current-password"
				required
			/>
			<br />
			<button>Continue</button>
			<p>{state.message}</p>
		</form>
	);
}
