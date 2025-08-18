"use client";

import { useTranslations } from "@de100/i18n-solidjs";
import { useMutation } from "@tanstack/solid-query";
import { loginAction } from "./actions";

export function LoginForm() {
	const t = useTranslations();

	const mutation = useMutation(() => ({
		mutationFn: loginAction,
	}));

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				const formData = new FormData(e.currentTarget);
				mutation.mutate({
					email: formData.get("email"),
					password: formData.get("password"),
				});
			}}
		>
			<h2>{t("locale")}</h2>
			<label for="form-login.email">Email</label>
			<input
				type="email"
				id="form-login.email"
				name="email"
				autocomplete="name"
				required
			/>
			<br />
			<label for="form-login.password">Password</label>
			<input
				type="password"
				id="form-login.password"
				name="password"
				autocomplete="current-password"
				required
			/>
			<br />
			<button type="submit" disabled={mutation.isPending}>
				Continue
			</button>
			<p>{mutation.data?.message ?? mutation.error?.message}</p>
		</form>
	);
}
