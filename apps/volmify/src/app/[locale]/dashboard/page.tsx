"use client";

import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { useGetCurrentSession } from "#client/libs/auth/hooks/get-current-session";
import { orpc } from "#client/libs/orpc";

export default function Dashboard() {
	const router = useRouter();
	const { data: session, status } = useGetCurrentSession({
		required: true,
	});

	const privateData = useQuery(orpc.privateData.queryOptions());

	useEffect(() => {
		if (status !== "PENDING") {
			router.push("/login");
		}
	}, [router, status]);

	if (status === "PENDING") {
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
