import CustomLink from "~/components/common/CustomLink";
import { ForgotPasswordForm } from "./components";

export default function ForgotPasswordPage() {
	return (
		<>
			<h1>Forgot your password?</h1>
			<ForgotPasswordForm />
			<CustomLink
				classVariants={{
					px: null,
					py: null,
					theme: null,
					rounded: null,
					size: null,
					layout: null,
					w: null,
				}}
				href="/auth/login"
			>
				Sign in
			</CustomLink>
		</>
	);
}
