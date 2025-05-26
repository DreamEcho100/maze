import { Metadata } from "next";
import { SignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
	title: "FlowBrain - Sign In",
};

export default function SignInPage() {
	return (
		<div className="flex h-screen items-center justify-center">
			<SignIn appearance={{ variables: { colorPrimary: "#0F172A" } }} />
		</div>
	);
}
