import { I18nA } from "@de100/i18n-solid-startjs/client/components/Link";
// import { ForgotPasswordForm } from "./components.jsx";

export default function ForgotPasswordPage() {
	return (
		<>
			<h1>Forgot your password?</h1>
			{/* <ForgotPasswordForm /> */}
			<I18nA href="/auth/login">Sign in</I18nA>
		</>
	);
}
