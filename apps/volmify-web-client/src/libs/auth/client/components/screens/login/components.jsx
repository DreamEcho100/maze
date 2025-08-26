import { LOGIN_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useMutation } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { FormBuilder } from "#components/ui/form-builder/index.jsx";
import { useGetCurrentSessionQuery } from "#libs/auth/client/hooks/get-current-session.js";
import { orpc } from "#libs/orpc/index.js";
import { authRoutesConfig } from "../../routes-config.js";

/**
 * @param {{
 * 	isPending?: boolean;
 * 	errorMessage?: string;
 * }} props
 */
export function LoginForm(props) {
	const router = useRouter();
	const getCurrentSessionQuery = useGetCurrentSessionQuery();
	const mutation = useMutation(() =>
		orpc.auth.login.mutationOptions({
			// mutationFn: loginAction,
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
					case LOGIN_MESSAGES_ERRORS.TWO_FACTOR_VERIFICATION_REQUIRED
						.messageCode:
						return router.push(authRoutesConfig.twoFactor.path);
				}

				throw new Error(result.message);
			},
		}),
	);

	const isPending = createMemo(() => props.isPending || mutation.isPending);
	const errorMessage = createMemo(
		() => mutation.status === "error" && mutation.error?.message,
	);

	return (
		<FormBuilder
			onSubmit={({ values }) => {
				if (isPending()) return;

				mutation.mutate({
					email: values.email,
					password: values.password,
				});
			}}
			fields={[
				{ name: "email", label: "Email", type: "email", required: true },
				{
					name: "password",
					label: "Password",
					type: "password",
					required: true,
				},
			]}
			actions={{
				submitBtn: {
					children: isPending() ? "Resending..." : "Resend",
					disabled: isPending(),
				},
			}}
			error={errorMessage()}
		/>
	);
}
