"use client";

import { useMutation } from "@tanstack/react-query";
import { forgotPasswordAction } from "./actions";

export function ForgotPasswordForm() {
	const mutation = useMutation({
		mutationFn: forgotPasswordAction,
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({ email: formData.get("email") });
			}}
		>
			<label htmlFor="form-forgot.email">Email</label>
			<input type="email" id="form-forgot.email" name="email" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Send
			</button>
			<p>{mutation.data?.message}</p>
		</form>
	);
}
