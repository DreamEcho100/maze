"use client";

import type { PropsWithChildren } from "react";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "next-themes";

export default function Providers(props: PropsWithChildren) {
	return (
		<ClerkProvider>
			<ThemeProvider attribute="class">{props.children}</ThemeProvider>
		</ClerkProvider>
	);
}
