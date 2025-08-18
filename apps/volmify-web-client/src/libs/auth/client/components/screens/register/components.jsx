import { useMutation } from "@tanstack/solid-query";
import { signupAction } from "./actions";

export function SignUpForm() {
	const mutation = useMutation(() => ({
		mutationFn: signupAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					name: formData.get("name"),
					email: formData.get("email"),
					password: formData.get("password"),
					enable2FA: formData.get("enable_2fa") === "on",
				});
			}}
		>
			<label for="form-signup.name">Username</label>
			<input
				id="form-signup.name"
				name="name"
				required
				minLength={4}
				maxLength={31}
			/>
			<br />
			<label for="form-signup.email">Email</label>
			<input
				type="email"
				id="form-signup.email"
				name="email"
				autocomplete="name"
				required
			/>
			<br />
			<label for="form-signup.password">Password</label>
			<input
				type="password"
				id="form-signup.password"
				name="password"
				autocomplete="new-password"
				required
			/>
			<br />
			<label for="form-signup.enable-2fa">Enable 2FA</label>
			<input type="checkbox" id="form-signup.enable-2fa" name="enable_2fa" />
			<button type="submit" disabled={mutation.isPending}>
				Continue
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
