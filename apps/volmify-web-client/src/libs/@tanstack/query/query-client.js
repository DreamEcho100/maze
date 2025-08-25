import { QueryClient } from "@tanstack/solid-query";

export function createQueryClient() {
	/** @type {QueryClient} */
	const queryClient = new QueryClient({
		defaultOptions: {
			queries: {
				staleTime: 1000 * 60 * 3, // 3 minutes
				gcTime: 1000 * 60 * 5, // 5 minutes

				// refetchOnWindowFocus: false,
				// refetchOnReconnect: false,
				// retry: false,
				meta: {
					// get queryClient() {
					// 	return queryClient;
					// },
				},
				// experimental_prefetchInRender: true,
			},
			mutations: {
				// retry: false,
				meta: {
					// get queryClient() {
					// 	return queryClient;
					// },
				},
			},
		},
	});

	return queryClient;
}

/** @type {QueryClient | undefined} */
let clientQueryClientSingleton;
export const getQueryClient = () => {
	if (typeof window === "undefined") {
		// Server: always make a new query client
		return createQueryClient();
	}

	// Browser: use singleton pattern to keep the same query client
	return (clientQueryClientSingleton ??= createQueryClient());
};

// export const queryClient = getQueryClient();
