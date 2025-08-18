import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useQuery } from "@tanstack/solid-query";
import { QueryBoundary } from "#libs/@tanstack/query/query-boundry.tsx";
import { validateNonOrInvalidAuth } from "../../validate-non-or-invalid-auth";
import { LoginForm } from "./components";

export default function AuthLoginPage() {
	const query = useQuery(() => ({
		queryKey: ["auth", "validate-non-or-invalid-auth"],
		queryFn: validateNonOrInvalidAuth,
	}));

	return (
		<QueryBoundary
			query={query}
			loadingFallback={<div class="loader">loading...</div>}
		>
			{() => (
				<>
					<h1>Sign in</h1>
					<LoginForm />
					<Link href="/auth/signup">Create an account</Link>
					<Link href="/auth/forgot-password">Forgot password?</Link>
				</>
			)}
		</QueryBoundary>
	);
}
