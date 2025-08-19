import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useQuery } from "@tanstack/solid-query";
import { authRoutesConfig } from "../../routes-config.js";
import { validateNonOrInvalidAuth } from "../../validate-non-or-invalid-auth.js";
import { LoginForm } from "./components.jsx";

export default function AuthLoginPage() {
	const query = useQuery(() => ({
		queryKey: ["auth", "validate-non-or-invalid-auth"],
		queryFn: validateNonOrInvalidAuth,
	}));

	return (
		<>
			<h1>Sign in</h1>
			<LoginForm
				isDisabled={query.isPending}
				errorMessage={query.error?.message}
			/>
			<Link href={authRoutesConfig.register.path}>Create an account</Link>
			<Link href={authRoutesConfig.forgotPassword.path}>Forgot password?</Link>
		</>
	);
}
