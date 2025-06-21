import { useQuery } from "@tanstack/react-query";

import { Link } from "#client/components/link";
import { LogoutButton } from "#client/libs/auth/components/logout/components";
import { useGetCurrentSession } from "#client/libs/auth/hooks/get-current-session";
import { orpc } from "#client/libs/orpc";

const TITLE_TEXT = `
 ██████╗ ███████╗████████╗████████╗███████╗██████╗
 ██╔══██╗██╔════╝╚══██╔══╝╚══██╔══╝██╔════╝██╔══██╗
 ██████╔╝█████╗     ██║      ██║   █████╗  ██████╔╝
 ██╔══██╗██╔══╝     ██║      ██║   ██╔══╝  ██╔══██╗
 ██████╔╝███████╗   ██║      ██║   ███████╗██║  ██║
 ╚═════╝ ╚══════╝   ╚═╝      ╚═╝   ╚══════╝╚═╝  ╚═╝

 ████████╗    ███████╗████████╗ █████╗  ██████╗██╗  ██╗
 ╚══██╔══╝    ██╔════╝╚══██╔══╝██╔══██╗██╔════╝██║ ██╔╝
    ██║       ███████╗   ██║   ███████║██║     █████╔╝
    ██║       ╚════██║   ██║   ██╔══██║██║     ██╔═██╗
    ██║       ███████║   ██║   ██║  ██║╚██████╗██║  ██╗
    ╚═╝       ╚══════╝   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝
 `;

export default function HomeScreen() {
	const { data: session, status } = useGetCurrentSession();
	const healthCheck = useQuery(orpc.healthCheck.queryOptions());

	return (
		<div className="container mx-auto max-w-3xl px-4 py-2">
			<pre className="overflow-x-auto font-mono text-sm">{TITLE_TEXT}</pre>
			<div className="grid gap-6">
				<section className="rounded-lg border p-4">
					<h2 className="mb-2 font-medium">API Status</h2>
					<div className="flex items-center gap-2">
						<div
							className={`h-2 w-2 rounded-full ${healthCheck.data ? "bg-green-500" : "bg-red-500"}`}
						/>
						<span className="text-muted-foreground text-sm">
							{healthCheck.isLoading
								? "Checking..."
								: healthCheck.data
									? "Connected"
									: "Disconnected"}
						</span>
					</div>
				</section>
				<br />
				<section>
					{status === "AUTHENTICATED" ? (
						<>
							<header>
								<Link href="/">Home</Link>
								<Link href="/settings">Settings</Link>
							</header>
							<main>
								<h1>Hi {session.user.name}!</h1>
								<LogoutButton />
							</main>
						</>
					) : status === "UNAUTHENTICATED" ? (
						<>
							<header>
								<Link href="/">Home</Link>
								<Link href="/login">Login</Link>
							</header>
							<main>
								<h1>Welcome to Volmify!</h1>
								<p>Please log in to continue.</p>
								<Link href="/login" className="btn btn-primary">
									Login
								</Link>
							</main>
						</>
					) : (
						<>
							<header>
								<Link href="/">Home</Link>
								<Link href="/login">Login</Link>
							</header>
							<main>
								<h1>Loading...</h1>
							</main>
						</>
					)}
				</section>
			</div>
		</div>
	);
}
