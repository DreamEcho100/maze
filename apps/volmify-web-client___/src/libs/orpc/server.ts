"use server";
import { createRouterClient } from "@orpc/server";
import { getRequestEvent } from "solid-js/web";
import { router } from "#libs/orpc/router/index.ts";

if (typeof window !== "undefined") {
	throw new Error("This file should not be imported in the browser");
}

export function initializeClient() {
	/**
	 * This is part of the Optimize SSR setup.
	 *
	 * @see {@link https://orpc.unnoq.com/docs/adapters/solid-start#optimize-ssr}
	 */
	globalThis.$client = createRouterClient(router, {
		/**
		 * Provide initial context if needed.
		 *
		 * Because this client instance is shared across all requests,
		 * only include context that's safe to reuse globally.
		 * For per-request context, use middleware context or pass a function as the initial context.
		 */
		context: async () => {
			const headers = getRequestEvent()?.request.headers;

			return {
				headers: headers, // provide headers if initial context required
			};
		},
	});
}
