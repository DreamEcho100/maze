import { I18nA } from "@de100/i18n-solid-startjs/client/components/Link";
import { Meta, Title } from "@solidjs/meta";
import { type RouteDefinition, useParams } from "@solidjs/router";
import { createMemo, type ParentProps, Suspense } from "solid-js";
import Providers from "#components/providers/index.tsx";
import { authRoutesConfig } from "#libs/auth/client/components/routes-config.js";
import { getTranslationByLocalQuery } from "#libs/i18n/queries.ts";

// import "../styles/app.css";

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
				<Meta name="viewport" content="width=device-width, initial-scale=1" />
				{/* <Link rel="stylesheet" href="/styles/app.css" /> */}
				<I18nA href="/">Index</I18nA>
				<I18nA href="/about">About</I18nA>
				<I18nA href="/orpc">ORPC</I18nA>
				<I18nA href={authRoutesConfig.login.path}>{authRoutesConfig.login.title}</I18nA>
				<I18nA href={authRoutesConfig.verifyEmail.path}>{authRoutesConfig.verifyEmail.title}</I18nA>
				<I18nA href={authRoutesConfig.register.path}>{authRoutesConfig.register.title}</I18nA>
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
		getTranslationByLocalQuery({ direct: true });
	},
} satisfies RouteDefinition;
