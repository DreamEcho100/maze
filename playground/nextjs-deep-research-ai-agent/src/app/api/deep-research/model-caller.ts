// File: `model-caller.ts`

import { generateObject, generateText } from "ai";

import type { ActivityTracker, ModelCallOptions, ResearchState } from "./types";
import { delay } from "~/libs/utils";
import { MAX_RETRY_ATTEMPTS, RETRY_DELAY_MS } from "./constants";
import { openRouter } from "./services";

export async function callModel<T = undefined>(
  {
    model,
    prompt,
    system,
    schema,
    activityType = "generate",
  }: ModelCallOptions<T>,
  researchState: ResearchState,
  activityTracker: ActivityTracker,
): Promise<T extends undefined ? string : T> {
  let attempts = 0;
  let lastError: Error | null = null;

  while (attempts < MAX_RETRY_ATTEMPTS) {
    try {
      if (schema) {
        const { object, usage } = await generateObject({
          model: openRouter(model),
          prompt,
          system,
          schema: schema,
        });

        researchState.tokenUsed += usage.totalTokens;
        researchState.completedSteps++;

        return object as T extends undefined ? string : T;
      } else {
        const { text, usage } = await generateText({
          model: openRouter(model),
          prompt,
          system,
        });

        researchState.tokenUsed += usage.totalTokens;
        researchState.completedSteps++;

        return text as unknown as T extends undefined ? string : T;
      }
    } catch (error) {
      attempts++;
      lastError = error instanceof Error ? error : new Error("Unknown error");

      if (attempts < MAX_RETRY_ATTEMPTS) {
        activityTracker.add(
          activityType,
          "warning",
          `Model _(${model})_ call failed, attempt ${attempts}/${MAX_RETRY_ATTEMPTS}. Retrying...`,
        );
      }
      await delay(RETRY_DELAY_MS * attempts);
    }
  }

  throw lastError ?? new Error(`Failed after ${MAX_RETRY_ATTEMPTS} attempts!`);
}
