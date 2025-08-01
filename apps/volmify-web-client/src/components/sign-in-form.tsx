import { createForm } from "@tanstack/solid-form";
import { useNavigate } from "@tanstack/solid-router";
import { For } from "solid-js";
import z from "zod";
import { authClient } from "@/libs/auth-client";

export default function SignInForm({ onSwitchToSignUp }: { onSwitchToSignUp: () => void }) {
	const navigate = useNavigate({
		from: "/",
	});

	const form = createForm(() => ({
		defaultValues: {
			email: "",
			password: "",
		},
		onSubmit: async ({ value }) => {
			await authClient.signIn.email(
				{
					email: value.email,
					password: value.password,
				},
				{
					onSuccess: () => {
						navigate({
							to: "/dashboard",
						});
						console.log("Sign in successful");
					},
					onError: (error) => {
						console.error(error.error.message);
					},
				},
			);
		},
		validators: {
			onSubmit: z.object({
				email: z.email("Invalid email address"),
				password: z.string().min(8, "Password must be at least 8 characters"),
			}),
		},
	}));

	return (
		<div class="mx-auto mt-10 w-full max-w-md p-6">
			<h1 class="mb-6 text-center font-bold text-3xl">Welcome Back</h1>

			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
				class="space-y-4"
			>
				<div>
					<form.Field name="email">
						{(field) => (
							<div class="space-y-2">
								<label for={field().name}>Email</label>
								<input
									id={field().name}
									name={field().name}
									type="email"
									value={field().state.value}
									onBlur={field().handleBlur}
									onInput={(e) => field().handleChange(e.currentTarget.value)}
									class="w-full rounded border p-2"
								/>
								<For each={field().state.meta.errors}>
									{(error) => <p class="text-red-600 text-sm">{error?.message}</p>}
								</For>
							</div>
						)}
					</form.Field>
				</div>

				<div>
					<form.Field name="password">
						{(field) => (
							<div class="space-y-2">
								<label for={field().name}>Password</label>
								<input
									id={field().name}
									name={field().name}
									type="password"
									value={field().state.value}
									onBlur={field().handleBlur}
									onInput={(e) => field().handleChange(e.currentTarget.value)}
									class="w-full rounded border p-2"
								/>
								<For each={field().state.meta.errors}>
									{(error) => <p class="text-red-600 text-sm">{error?.message}</p>}
								</For>
							</div>
						)}
					</form.Field>
				</div>

				<form.Subscribe>
					{(state) => (
						<button
							type="submit"
							class="w-full rounded bg-indigo-600 p-2 text-white hover:bg-indigo-700 disabled:opacity-50"
							disabled={!state().canSubmit || state().isSubmitting}
						>
							{state().isSubmitting ? "Submitting..." : "Sign In"}
						</button>
					)}
				</form.Subscribe>
			</form>

			<div class="mt-4 text-center">
				<button
					type="button"
					onClick={onSwitchToSignUp}
					class="text-indigo-600 text-sm hover:text-indigo-800 hover:underline"
				>
					Need an account? Sign Up
				</button>
			</div>
		</div>
	);
}
