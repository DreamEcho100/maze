import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";

import { Button } from "@de100/ui/components/button";

import logo from "~/assets/logo.png";

export default async function Home() {
	const { userId } = await auth();

	if (userId) redirect("/notes");

	return (
		<main className="flex h-screen flex-col items-center justify-center gap-5">
			<div className="flex items-center gap-4">
				<Image src={logo} alt="FlowBrain logo" width={100} height={100} />
				<span className="text-4xl font-extrabold tracking-tight lg:text-5xl">FlowBrain</span>
			</div>
			<p className="max-w-prose text-center">
				An intelligent note-taking app with AI integration, built with OpenAI, Pinecone, Next.js,
				Shadcn UI, Clerk, and more.
			</p>
			<Button size="lg" asChild>
				<Link href="/notes">Open</Link>
			</Button>
		</main>
	);
}
