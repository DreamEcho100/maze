// biome-ignore lint/correctness/noUnusedImports: <explanation>
import type { QueryClient } from "@tanstack/solid-query";

interface MyMeta extends Record<string, unknown> {
	// queryClient: QueryClient;
}
declare module "@tanstack/solid-query" {
	interface Register {
		// defaultError: AxiosError;
		queryMeta: MyMeta;
		mutationMeta: MyMeta;
	}
}
