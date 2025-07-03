"use client";

import { useMutation } from "@tanstack/react-query";
import { verify2FAAction } from "./actions";

export function TwoFactorVerificationForm() {
	const mutation = useMutation({
		mutationFn: verify2FAAction,
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					code: formData.get("code"),
				});
			}}
		>
			<label htmlFor="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" autoComplete="one-time-code" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Verify
			</button>
			<p>{mutation.data?.message}</p>
		</form>
	);
}
