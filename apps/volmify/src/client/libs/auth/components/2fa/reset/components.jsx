"use client";

import { useMutation } from "@tanstack/react-query";
import { reset2FAAction } from "./actions";

export function TwoFactorResetForm() {
	const mutation = useMutation({
		mutationFn: reset2FAAction,
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
			<label htmlFor="form-totp.code">Recovery code</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Verify
			</button>
			<p>{mutation.data?.message ?? ""}</p>
		</form>
	);
}
