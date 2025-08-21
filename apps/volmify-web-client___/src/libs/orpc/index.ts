if (typeof window === "undefined") {
	await import("./server");
}

import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
// import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { createORPCSolidQueryUtils } from "@orpc/solid-query";
import { getRequestEvent } from "solid-js/web";
import type { router } from "#libs/orpc/router/index.ts";

declare global {
	var $client: RouterClient<typeof router> | undefined;
}

const link = new RPCLink({
	url: `${typeof window !== "undefined" ? window.location.origin : "http://localhost:3000"}/rpc`,
	headers: () => Object.fromEntries(getRequestEvent()?.request.headers ?? []),
});

export const client: RouterClient<typeof router> =
	globalThis.$client ?? createORPCClient(link);

export const orpc = createORPCSolidQueryUtils(client);
