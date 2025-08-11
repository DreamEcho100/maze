"use client";

import { useMutation } from "@tanstack/solid-query";
import { verify2FAAction } from "./actions";

export function TwoFactorVerificationForm() {
	const mutation = useMutation(() => ({
		mutationFn: verify2FAAction,
	}));

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
			<label for="form-totp.code">Code</label>
			<input id="form-totp.code" name="code" autocomplete="one-time-code" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Verify
			</button>
			<p>{mutation.data?.message}</p>
		</form>
	);
}
