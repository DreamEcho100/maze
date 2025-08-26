import { REGISTER_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useMutation } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { FormBuilder } from "#components/ui/form-builder/index.jsx";
import { orpc } from "#libs/orpc/index.js";
import { authRoutesConfig } from "../../routes-config";

/**
 * @param {{
 * 	isPending?: boolean;
 * 	errorMessage?: string;
 * }} props
 */
export function SignUpForm(props) {
	const router = useRouter();
	const mutation = useMutation(() =>
		orpc.auth.register.mutationOptions({
			onSuccess(res) {
				// queryClient.invalidateQueries({
				// 	queryKey: orpc.planet.key(),
				// });

				if (res.type === "success") {
					return router.push(authRoutesConfig.login.path);
				}

				switch (res.messageCode) {
					case REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED
						.messageCode:
						return router.push(authRoutesConfig.twoFactorSetup.path);
				}

				throw new Error(res.message);
			},
		}),
	);

	const isPending = createMemo(() => props.isPending || mutation.isPending);
	const errorMessage = createMemo(
		() => mutation.status === "error" && mutation.error?.message,
	);

	return (
		<FormBuilder
			onSubmit={async ({ values }) => {
				if (isPending()) return;

				// values should contain the form fields directly
				await mutation.mutateAsync({
					name: values.name,
					displayName: values.displayName,
					email: values.email,
					password: values.password,
					enable2FA: values.enable2FA === true || values.enable2FA === "on",
				});
			}}
			fields={[
				{
					name: "name",
					label: "Username",
					required: true,
					minLength: 3,
					maxLength: 128,
				},
				{
					name: "displayName",
					label: "Display Name",
					required: true,
					minLength: 3,
					maxLength: 128,
				},
				{
					type: "email",
					name: "email",
					label: "Email",
					required: true,
					autocomplete: "email",
				},
				{
					type: "password",
					name: "password",
					label: "Password",
					required: true,
					autocomplete: "new-password",
				},
				{ ft: "checkbox", name: "enable2FA", label: "Enable 2FA" },
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
