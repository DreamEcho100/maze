import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { revalidate } from "@solidjs/router";
import { useQuery } from "@tanstack/solid-query";
import { QueryBoundary } from "#libs/@tanstack/query/query-boundry.jsx";
import {
	EmailVerificationForm,
	ResendEmailVerificationCodeForm,
} from "./components.jsx";
import { routeData } from "./route-data.js";

export function AuthVerifyEmail() {
	console.log('"auth", routeData.key', "auth", routeData.key);
	const query = useQuery(() => ({
		queryKey: ["auth", routeData.key],
		queryFn: () => routeData(),
	}));

	return (
		<QueryBoundary query={query} loadingFallback={<>Loading...</>}>
			{(data) => (
				<>
					<h1>Verify your email address</h1>
					{data.verificationRequest?.email ? (
						<> We sent an 8-digit code to {data.verificationRequest.email}.</>
					) : (
						<>
							It looks like you haven't verified your email address yet.
							<button type="submit" form="resend-email-verification-code-form">
								Resend verification code?
							</button>
						</>
					)}
					{data.verificationRequest?.email ?? data.currentSession.user.email}
					.
					<EmailVerificationForm />
					<ResendEmailVerificationCodeForm
						formId="resend-email-verification-code-form"
						onSuccess={() => {
							revalidate(routeData.key);
							query.refetch();
						}}
					/>
					<Link href="/settings">Change your email</Link>
				</>
			)}
		</QueryBoundary>
	);
}
