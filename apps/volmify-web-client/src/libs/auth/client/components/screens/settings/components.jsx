"use client";

import { useMutation } from "@tanstack/solid-query";
import { useState } from "react";
import {
	regenerateRecoveryCodeAction,
	updateEmailAction,
	updateIsTwoFactorEnabledAction,
	updatePasswordAction,
} from "./actions";

export function UpdatePasswordForm() {
	const mutation = useMutation(() => ({
		mutationFn: updatePasswordAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					currentPassword: formData.get("password"),
					newPassword: formData.get("new_password"),
				});
			}}
		>
			<label for="form-password.password">Current password</label>
			<input
				type="password"
				id="form-email.password"
				name="password"
				autocomplete="current-password"
				required
			/>
			<br />
			<label for="form-password.new-password">New password</label>
			<input
				type="password"
				id="form-password.new-password"
				name="new_password"
				autocomplete="new-password"
				required
			/>
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Update
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}

export function UpdateEmailForm() {
	const mutation = useMutation(() => ({
		mutationFn: updateEmailAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					email: formData.get("email"),
				});
			}}
		>
			<label for="form-email.email">New email</label>
			<input type="email" id="form-email.email" name="email" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Update
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}

/** @param {{ twoFactorEnabledAt: boolean }} props */
export function UpdateToggleIsTwoFactorEnabledForm(props) {
	const mutation = useMutation(() => ({
		mutationFn: updateIsTwoFactorEnabledAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					isTwoFactorEnabled: formData.get("is_two_factor_enabled"),
				});
			}}
		>
			<button
				type="button"
				name="is_two_factor_enabled"
				value={props.twoFactorEnabledAt ? "off" : "on"}
			>
				Toggle two-factor authentication (currently{" "}
				{props.twoFactorEnabledAt ? "enabled" : "disabled"})
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
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
				type="button"
				onClick={async () => {
					const result = await regenerateRecoveryCodeAction();
					if (result.type === "success") {
						setRecoveryCode(result.data.recoveryCode);
					}
				}}
			>
				Generate new code
			</button>
		</section>
	);
}
