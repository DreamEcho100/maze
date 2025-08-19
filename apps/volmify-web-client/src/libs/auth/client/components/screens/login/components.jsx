"use client";

import { useTranslations } from "@de100/i18n-solidjs";
import { useMutation } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { loginAction } from "./actions.js";

/**
 * @param {{
 * 	isDisabled?: boolean;
 * 	errorMessage?: string;
 * }} props
 */
export function LoginForm(props) {
	const t = useTranslations();
	const mutation = useMutation(() => ({
		mutationFn: loginAction,
	}));

	const isDisabled = createMemo(() => props.isDisabled || mutation.isPending);
	const errorMessage = createMemo(
		() =>
			mutation.data?.message ?? props.errorMessage ?? mutation.error?.message,
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (isDisabled()) return;

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
			<button
				type="submit"
				disabled={mutation.isPending}
				aria-disabled={isDisabled()}
			>
				Continue
			</button>
			<p>{errorMessage()}</p>
		</form>
	);
}
