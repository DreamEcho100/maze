"use client";
import { useMutation } from "@tanstack/solid-query";

import { verifyPasswordResetEmailVerificationAction } from "./actions";

export function PasswordResetEmailVerificationForm() {
	const mutation = useMutation(() => ({
		mutationFn: verifyPasswordResetEmailVerificationAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({ code: formData.get("code") });
			}}
		>
			<label for="form-verify.code">Code</label>
			<input id="form-verify.code" name="code" required />
			<button type="submit" disabled={mutation.isPending}>
				verify
			</button>
			<p>{mutation.data?.message}</p>
		</form>
	);
}
