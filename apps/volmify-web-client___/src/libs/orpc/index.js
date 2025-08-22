// if (typeof window === "undefined") {
// 	const initializeClient = (await import("./server")).initializeClient;
// 	initializeClient();
// }

/**
 * @import { RouterClient } from "@orpc/server";
 * @import { router } from "#libs/orpc/router/index.ts";
 */

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
// import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createORPCSolidQueryUtils } from "@orpc/solid-query";
import { getRequestEvent } from "solid-js/web";

const link = new RPCLink({
	url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/rpc`,
	headers: () => Object.fromEntries(getRequestEvent()?.request.headers ?? []),
});

/** @type {RouterClient<typeof router>} */
export const client = globalThis.$client ?? createORPCClient(link);

export const orpc = createORPCSolidQueryUtils(client);
