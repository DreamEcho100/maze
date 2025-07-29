import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { RouterClient } from "@orpc/server";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";
import { QueryCache, QueryClient } from "@tanstack/solid-query";
import type { appRouter } from "../../../volmify-main-server/src/routers/index";

export const queryClient = new QueryClient({
	queryCache: new QueryCache({
		onError: (error) => {
			console.error(`Error: ${error.message}`);
		},
	}),
});

export const link = new RPCLink({
	url: `${import.meta.env.VITE_SERVER_URL}/rpc`,
	fetch(url, options) {
		return fetch(url, {
			...options,
			credentials: "include",
		});
	},
});

export const client: RouterClient<typeof appRouter> = createORPCClient(link);

export const orpc = createTanstackQueryUtils(client);
