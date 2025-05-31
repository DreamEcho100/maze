import { Link } from "#client/components/link";
import { ForgotPasswordForm } from "./components";

export default function ForgotPasswordPage() {
	return (
		<>
			<h1>Forgot your password?</h1>
			<ForgotPasswordForm />
			<Link href="/auth/login">Sign in</Link>
		</>
	);
}
