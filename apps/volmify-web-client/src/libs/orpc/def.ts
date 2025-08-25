import type { RouterClient } from "@orpc/server";
import type { router } from "./router";

declare global {
	var $client: RouterClient<typeof router> | undefined;
}
