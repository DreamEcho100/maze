// File: `services.ts`
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import Exa from "exa-js";

import { env } from "~/libs/env";

export const exa = new Exa(env.EXA_SEARCH_API_KEY);

export const openRouter = createOpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});
