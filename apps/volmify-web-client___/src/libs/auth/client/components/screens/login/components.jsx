import { LOGIN_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useTranslations } from "@de100/i18n-solidjs";
import { useMutation } from "@tanstack/solid-query";
import { createMemo, Show } from "solid-js";
import { useGetCurrentSessionQuery } from "#libs/auth/client/hooks/get-current-session.js";
import { authRoutesConfig } from "../../routes-config.js";
import { loginAction } from "./actions.js";

/**
 * @param {{
 * 	isPending?: boolean;
 * 	errorMessage?: string;
 * }} props
 */
export function LoginForm(props) {
	const t = useTranslations();
	const router = useRouter();
	const getCurrentSessionQuery = useGetCurrentSessionQuery();
	const mutation = useMutation(() => ({
		mutationFn: loginAction,
		onSuccess: (result) => {
			if (result.type === "success") {
				getCurrentSessionQuery.refetch();
				router.push("/");
				return;
			}

			switch (result.messageCode) {
				case LOGIN_MESSAGES_ERRORS.ACCOUNT_NOT_FOUND.messageCode:
					return router.push(authRoutesConfig.register.path);
				case LOGIN_MESSAGES_ERRORS.EMAIL_VERIFICATION_REQUIRED.messageCode:
					return router.push(authRoutesConfig.verifyEmail.path);
				case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_SETUP_REQUIRED.messageCode:
					return router.push(authRoutesConfig.twoFactorSetup.path);
				case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED.messageCode:
					return router.push(authRoutesConfig.twoFactor.path);
			}
		},
	}));

	const isPending = createMemo(() => props.isPending || mutation.isPending);
	const errorMessage = createMemo(
		() =>
			!isPending() &&
			(mutation.error?.message ?? mutation.data?.message ?? props.errorMessage),
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (isPending()) return;

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
				aria-disabled={isPending()}
			>
				Continue
			</button>
			<Show when={!isPending() && errorMessage()}>
				{(errorMessage) => errorMessage()}
			</Show>
			<p>{!isPending() && errorMessage()}</p>
		</form>
	);
}
