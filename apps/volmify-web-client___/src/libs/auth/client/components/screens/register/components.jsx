import { REGISTER_MESSAGES_ERRORS } from "@de100/auth-shared/constants";
import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useMutation } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
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
	// const mutation = useMutation(() => ({
	// 	mutationFn: signupAction,
	// }));

	// 	const queryClient = useQueryClient();

	const mutation = useMutation(() =>
		orpc.auth.signup.mutationOptions({
			onSuccess(res) {
				// queryClient.invalidateQueries({
				// 	queryKey: orpc.planet.key(),
				// });

				if (res.type === "success") {
					return router.push(authRoutesConfig.login.path);
				}

				switch (res.messageCode) {
					case REGISTER_MESSAGES_ERRORS.TWO_FACTOR_VALIDATION_OR_SETUP_REQUIRED.messageCode:
						return router.push(authRoutesConfig.twoFactorSetup.path);
				}
			},
			onError(error) {
				console.error(error);
				// alert(error.message);
			},
		}),
	);

	const isPending = createMemo(() => props.isPending || mutation.isPending);
	const errorMessage = createMemo(
		() => mutation.data?.message ?? props.errorMessage ?? mutation.error?.message,
	);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (isPending()) return;

				const formData = new FormData(e.currentTarget);
				// TODO: integrate with an form lib
				mutation.mutate({
					name: formData.get("name"),
					displayName: formData.get("display_name"),
					email: formData.get("email"),
					password: formData.get("password"),
					enable2FA: formData.get("enable_2fa") === "on",
				});
			}}
		>
			<label for="form-signup.name">Username</label>
			<input id="form-signup.name" name="name" required minLength={4} maxLength={31} />
			<br />
			<label for="form-signup.display_name">Display Name</label>
			<input
				id="form-signup.display_name"
				name="display_name"
				required
				minLength={4}
				maxLength={31}
			/>
			<br />
			<label for="form-signup.email">Email</label>
			<input type="email" id="form-signup.email" name="email" autocomplete="name" required />
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
			<button type="submit" aria-disabled={isPending()}>
				Continue
			</button>
			<p>{!isPending() && errorMessage()}</p>
		</form>
	);
}
