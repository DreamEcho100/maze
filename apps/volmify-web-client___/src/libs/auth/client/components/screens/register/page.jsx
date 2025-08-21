import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useQuery } from "@tanstack/solid-query";
import { validateNonOrInvalidAuthQuery } from "../../queries.js";
import { authRoutesConfig } from "../../routes-config.js";
import { SignUpForm } from "./components.jsx";

export function AuthRegister() {
	const query = useQuery(() => ({
		queryKey: ["auth", "validate-non-or-invalid-auth"],
		queryFn: () => validateNonOrInvalidAuthQuery(),
	}));

	return (
		<>
			<h1>Create an account</h1>
			<p>
				Your name must be at least 3 characters long and your password must be at least 8 characters
				long.
			</p>
			<SignUpForm isPending={query.isPending} errorMessage={query.error?.message} />
			<Link href={authRoutesConfig.login.path}>Login</Link>
		</>
	);
}
