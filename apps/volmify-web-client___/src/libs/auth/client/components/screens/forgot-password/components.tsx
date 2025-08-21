import { useMutation } from "@tanstack/solid-query";
// import { useMutation } from "@tanstack/solid-query";
// import { forgotPasswordAction } from "./actions.js";

export function ForgotPasswordForm() {
	const mutation = useMutation(() => ({
		mutationFn: async ({ email }) => {
			"use server";
			if (process.env.NODE_ENV === "development") {
				console.log("___ forgotPasswordAction", email);
			}
			// return forgotPasswordAction({ email });
			return {
				message: `Password reset link sent to ${email}`,
			};
		},
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({ email: formData.get("email") });
			}}
		>
			<label for="form-forgot.email">Email</label>
			<input type="email" id="form-forgot.email" name="email" required />
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Send
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
