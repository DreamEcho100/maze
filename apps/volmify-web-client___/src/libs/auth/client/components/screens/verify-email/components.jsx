import {
	RESEND_EMAIL_MESSAGES_ERRORS,
	VERIFY_EMAIL_MESSAGES_ERRORS,
} from "@de100/auth-shared/constants";
import { useRouter } from "@de100/i18n-solid-startjs/client";
import { useMutation } from "@tanstack/solid-query";
import { createMemo } from "solid-js";
import { authRoutesConfig } from "../../routes-config.js";
import {
	resendEmailVerificationCodeAction,
	verifyEmailAction,
} from "./actions.js";

/**
 * @param {{
 * 	isPending?: boolean;
 * 	errorMessage?: string;
 * }} props
 */
export function EmailVerificationForm(props) {
	const router = useRouter();
	const mutation = useMutation(() => ({
		mutationFn: verifyEmailAction,
		onSuccess: (result) => {
			if (result.type === "success") {
				return router.push(authRoutesConfig.verifyEmailSuccess.path);
			}

			switch (result.messageCode) {
				case VERIFY_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
					return router.push(authRoutesConfig.login.path);
				case VERIFY_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
					return router.push(authRoutesConfig.login.path);
				case VERIFY_EMAIL_MESSAGES_ERRORS
					.VERIFICATION_CODE_EXPIRED_WE_SENT_NEW_CODE.messageCode:
					return router.push(authRoutesConfig.verifyEmail.path);
				case VERIFY_EMAIL_MESSAGES_ERRORS.TWO_FACTOR_SETUP_INCOMPLETE
					.messageCode:
					return router.push(authRoutesConfig.twoFactorSetup.path);
			}
		},
	}));

	const isPending = createMemo(() => mutation.isPending || props.isPending);
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
				mutation.mutate({ code: formData.get("code") });
			}}
		>
			<label for="form-verify.code">Code</label>
			<input id="form-verify.code" name="code" required />
			<button type="submit" aria-disabled={isPending()}>
				Verify
			</button>
			<p>{errorMessage()}</p>
		</form>
	);
}

/**
 * @param {{
 * 	formId?: string;
 * 	onSuccess?: () => void;
 * 	isPending?: boolean;
 * }} props
 */
export function ResendEmailVerificationCodeForm(props) {
	const router = useRouter();
	const mutation = useMutation(() => ({
		mutationFn: () => resendEmailVerificationCodeAction(),
		onSuccess: (result) => {
			if (props.onSuccess) props.onSuccess();

			if (result.type === "success") {
				// return router.push(AUTH_URLS.SUCCESS_VERIFY_EMAIL);
				// TODO: a success indicator on the resend button
				return;
			}

			switch (result.messageCode) {
				case RESEND_EMAIL_MESSAGES_ERRORS.AUTHENTICATION_REQUIRED.messageCode:
				case RESEND_EMAIL_MESSAGES_ERRORS.ACCESS_DENIED.messageCode:
					// Add temp error messages on cookies
					return router.push(authRoutesConfig.login.path);
			}
		},
	}));

	const isPending = createMemo(() => mutation.isPending || props.isPending);
	const errorMessage = createMemo(
		() => !isPending() && (mutation.error?.message ?? mutation.data?.message),
	);

	return (
		<form
			id={props.formId}
			onSubmit={(e) => {
				e.preventDefault();
				if (isPending()) return;

				mutation.mutate();
			}}
		>
			<button type="submit" aria-disabled={isPending()}>
				Resend code
			</button>
			<p>{errorMessage()}</p>
		</form>
	);
}
