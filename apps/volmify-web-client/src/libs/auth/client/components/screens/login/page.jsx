import { I18nA } from "@de100/i18n-solid-startjs/client/components/Link";
import { useQuery } from "@tanstack/solid-query";
import { validateNonOrInvalidAuthQuery } from "../../queries.js";
import { authRoutesConfig } from "../../routes-config.js";
import { LoginForm } from "./components.jsx";

export function AuthLoginScreen() {
	const query = useQuery(() => ({
		queryKey: ["auth", "validate-non-or-invalid-auth"],
		queryFn: () => validateNonOrInvalidAuthQuery(),
	}));

	return (
		<>
			<h1>Sign in</h1>
			<LoginForm isPending={query.isPending} errorMessage={query.error?.message} />
			<I18nA href={authRoutesConfig.register.path}>Create an account</I18nA>
			<I18nA href={authRoutesConfig.forgotPassword.path}>Forgot password?</I18nA>
		</>
	);
}

/*

export default function AuthLoginPage() {
	// const query = useQuery(() => ({
	// 	queryKey: ["auth", "validate-non-or-invalid-auth"],
	// 	queryFn: validateNonOrInvalidAuth,
	// }));

	const validatedNonOrInvalidAuth = createAsync(validateNonOrInvalidAuth);

	return (
		<>
			<h1>Sign in</h1>
			<ErrorBoundary
				fallback={(error) => (
					<div>
						<h1>Error</h1>
						<p>{error.message}</p>
					</div>
				)}
			>
				<Suspense fallback={<div>Loading...</div>}>
					{JSON.stringify(validatedNonOrInvalidAuth())}

					<LoginForm
					// isDisabled={query.isPending}
					// errorMessage={query.error?.message}
					/>
				</Suspense>
			</ErrorBoundary>
			<Link href={authRoutesConfig.register.path}>Create an account</Link>
			<Link href={authRoutesConfig.forgotPassword.path}>Forgot password?</Link>
		</>
	);
}
*/
