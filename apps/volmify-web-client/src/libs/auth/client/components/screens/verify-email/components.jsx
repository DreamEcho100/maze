"use client";

import { useMutation } from "@tanstack/solid-query";
import {
	resendEmailVerificationCodeAction,
	verifyEmailAction,
} from "./actions";

export function EmailVerificationForm() {
	const mutation = useMutation(() => ({
		mutationFn: verifyEmailAction,
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
				Verify
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}

export function ResendEmailVerificationCodeForm() {
	const mutation = useMutation(() => ({
		mutationFn: resendEmailVerificationCodeAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				mutation.mutate();
			}}
		>
			<button type="submit" disabled={mutation.isPending}>
				Resend code
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
