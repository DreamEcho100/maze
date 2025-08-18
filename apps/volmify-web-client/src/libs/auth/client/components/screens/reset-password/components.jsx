"use client";

import { useMutation } from "@tanstack/solid-query";
import { resetPasswordAction } from "./actions";

export function PasswordResetForm() {
	const mutation = useMutation(() => ({
		mutationFn: resetPasswordAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({ password: formData.get("password") });
			}}
		>
			<label for="form-reset.password">Password</label>
			<input
				type="password"
				id="form-reset.password"
				name="password"
				autocomplete="new-password"
				required
			/>
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Reset password
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
