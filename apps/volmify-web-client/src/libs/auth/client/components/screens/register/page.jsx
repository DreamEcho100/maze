import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { useQuery } from "@tanstack/solid-query";
import { QueryBoundary } from "#libs/@tanstack/query/query-boundry.tsx";
import { validateNonOrInvalidAuth } from "../../validate-non-or-invalid-auth";
import { SignUpForm } from "./components";

export default function AuthRegisterPage() {
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
					<h1>Create an account</h1>
					<p>
						Your name must be at least 3 characters long and your password must
						be at least 8 characters long.
					</p>
					<SignUpForm />
					<Link href="/auth/login">Sign in</Link>
				</>
			)}
		</QueryBoundary>
	);
}
