"use client";

import { useMutation } from "@tanstack/solid-query";
import { setup2FAAction } from "./actions";

/** @param {{ encodedTOTPKey: string }} props */
export function TwoFactorSetUpForm(props) {
	const mutation = useMutation(() => ({
		mutationFn: setup2FAAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					code: formData.get("code"),
					encodedTOTPKey: formData.get("key"),
				});
			}}
		>
			<input name="key" value={props.encodedTOTPKey} hidden required />
			<label for="form-totp.code">Verify the code from the app</label>
			<input id="form-totp.code" name="code" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Save
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
