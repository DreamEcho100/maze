"use client";

/** @import { ActionResult } from "./actions"; */
import { useActionState, useState } from "react";

import {
	regenerateRecoveryCodeAction,
	updateEmailAction,
	updateIsTwoFactorEnabledAction,
	updatePasswordAction,
} from "./actions";

/** @type {ActionResult} */
const initialUpdatePasswordState = {
	type: "idle",
};

export function UpdatePasswordForm() {
	const [state, action] = useActionState(updatePasswordAction, initialUpdatePasswordState);

	return (
		<form action={action}>
			<label htmlFor="form-password.password">Current password</label>
			<input
				type="password"
				id="form-email.password"
				name="password"
				autoComplete="current-password"
				required
			/>
			<br />
			<label htmlFor="form-password.new-password">New password</label>
			<input
				type="password"
				id="form-password.new-password"
				name="new_password"
				autoComplete="new-password"
				required
			/>
			<br />
			<button>Update</button>
			<p>{state.message}</p>
		</form>
	);
}

/** @type {ActionResult} */
const initialUpdateFormState = {
	type: "idle",
};

export function UpdateEmailForm() {
	const [state, action] = useActionState(updateEmailAction, initialUpdateFormState);

	return (
		<form action={action}>
			<label htmlFor="form-email.email">New email</label>
			<input type="email" id="form-email.email" name="email" required />
			<br />
			<button>Update</button>
			<p>{state.message}</p>
		</form>
	);
}

/** @type {ActionResult} */
const initialUpdateToggleIsTwoFactorEnabledState = {
	type: "idle",
};

/** @param {{ twoFactorEnabledAt: boolean }} props */
export function UpdateToggleIsTwoFactorEnabledForm(props) {
	const [state, action] = useActionState(
		updateIsTwoFactorEnabledAction,
		initialUpdateToggleIsTwoFactorEnabledState,
	);

	return (
		<form action={action}>
			<button name="is_two_factor_enabled" value={props.twoFactorEnabledAt ? "off" : "on"}>
				Toggle two-factor authentication (currently{" "}
				{props.twoFactorEnabledAt ? "enabled" : "disabled"})
			</button>
			<p>{state.message}</p>
		</form>
	);
}

/** @param {{ recoveryCode: string }} props */
export function RecoveryCodeSection(props) {
	const [recoveryCode, setRecoveryCode] = useState(props.recoveryCode);
	return (
		<section>
			<h1>Recovery code</h1>
			<p>Your recovery code is: {recoveryCode}</p>
			<button
				onClick={async () => {
					const result = await regenerateRecoveryCodeAction();
					if (result.type === "success") {
						setRecoveryCode(result.data.recoveryCode);
					}
				}}>
				Generate new code
			</button>
		</section>
	);
}
