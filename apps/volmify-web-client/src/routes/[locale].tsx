import { type RouteDefinition, useParams } from "@solidjs/router";
import { createMemo, type ParentProps, Suspense } from "solid-js";
import Providers from "#components/providers/index.tsx";
import { getTranslationByLocal } from "#libs/i18n/server/get-translation.ts";

import "../app.css";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { Title } from "@solidjs/meta";
import { authRoutesConfig } from "#libs/auth/client/components/routes-config.js";

export default function LocalLayout(props: ParentProps) {
	const params = useParams();
	const joinedParamsEntries = createMemo(() =>
		Object.entries(params)
			.map(([key, value]) => `${key}: ${value}`)
			.join(", "),
	);

	return (
		<Providers>
			<Title>SolidStart - Basic</Title>
			<header>
				<Link href="/">Index</Link>
				<Link href="/about">About</Link>
				<Link href="/orpc">ORPC</Link>
				<Link href={authRoutesConfig.login.path}>{authRoutesConfig.login.title}</Link>
				<Link href={authRoutesConfig.verifyEmail.path}>{authRoutesConfig.verifyEmail.title}</Link>
				<Link href={authRoutesConfig.register.path}>{authRoutesConfig.register.title}</Link>
			</header>
			<main>
				<h1>Locale Layout</h1>
				<p>This is a layout for locale-specific routes.</p>
				<p>Current Params: {joinedParamsEntries()}</p>
				<div>
					<Suspense>{props.children}</Suspense>
				</div>
			</main>
		</Providers>
	);
}

export const route = {
	preload() {
		// define preload function
		console.log("Preloading locale layout...");
		getTranslationByLocal({ direct: true });
	},
} satisfies RouteDefinition;
