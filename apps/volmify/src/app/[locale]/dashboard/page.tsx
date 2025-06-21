"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

import { useGetCurrentSession } from "#client/libs/auth/hooks/get-current-session";
import { orpc } from "#client/libs/orpc";

export default function Dashboard() {
	const router = useRouter();
	const { data: session, status } = useGetCurrentSession({
		required: true,
	});

	const privateData = useQuery(orpc.privateData.queryOptions());

	useEffect(() => {
		if (status !== "INITIAL_LOADING") {
			router.push("/login");
		}
	}, [router, session, status]);

	if (status === "INITIAL_LOADING") {
		return <div>Loading...</div>;
	}

	return (
		<div>
			<h1>Dashboard</h1>
			<p>Welcome {session.user.name}</p>
			<p>privateData: {privateData.data?.message}</p>
		</div>
	);
}
