"use client";
import { useMutation } from "@tanstack/solid-query";

import {
	verifyPasswordReset2FAWithRecoveryCodeAction,
	verifyPasswordReset2FAWithTOTPAction,
} from "./actions";

export function PasswordResetTOTPForm() {
	const mutation = useMutation(() => ({
		mutationFn: verifyPasswordReset2FAWithTOTPAction,
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
			<label for="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Verify
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}

export function PasswordResetRecoveryCodeForm() {
	const mutation = useMutation(() => ({
		mutationFn: verifyPasswordReset2FAWithRecoveryCodeAction,
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
			<label for="form-recovery-code.code">Recovery code</label>
			<input id="form-recovery-code.code" name="code" required />
			<br />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Verify
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
