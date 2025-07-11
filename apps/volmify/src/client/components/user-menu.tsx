import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@de100/ui/components/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@de100/ui/components/dropdown-menu";
import { Skeleton } from "@de100/ui/components/skeleton";

import { useGetCurrentSession } from "#client/libs/auth/hooks/get-current-session";

export default function UserMenu() {
	const router = useRouter();
	const { data: session, status } = useGetCurrentSession();

	if (status === "PENDING") {
		return <Skeleton className="h-9 w-24" />;
	}

	if (status === "UNAUTHENTICATED") {
		return (
			<Button variant="outline" asChild>
				<Link href="/login">Sign In</Link>
			</Button>
		);
	}

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="outline">{session.user.name}</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="bg-card">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem>{session.user.email}</DropdownMenuItem>
				<DropdownMenuItem asChild>
					<Button
						variant="destructive"
						className="w-full"
						onClick={() => {
							// // eslint-disable-next-line @typescript-eslint/no-floating-promises
							// authClient.signOut({
							// 	fetchOptions: {
							// 		onSuccess: () => {
							// 			router.push("/");
							// 		},
							// 	},
							// });
						}}
					>
						Sign Out
					</Button>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
