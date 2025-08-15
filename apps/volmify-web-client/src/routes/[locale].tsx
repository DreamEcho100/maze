import { type RouteDefinition, useParams } from "@solidjs/router";
import { createMemo, type ParentProps } from "solid-js";
import Providers from "#components/providers/index.tsx";
import { getTranslationByLocal } from "#libs/i18n/server/get-translation.ts";

export default function LocalLayout(props: ParentProps) {
	const params = useParams();
	const joinedParamsEntries = createMemo(() =>
		Object.entries(params)
			.map(([key, value]) => `${key}: ${value}`)
			.join(", "),
	);

	return (
		<Providers>
			<main>
				<h1>Locale Layout</h1>
				<p>This is a layout for locale-specific routes.</p>
				<p>Current Params: {joinedParamsEntries()}</p>
				<div>{props.children}</div>
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
