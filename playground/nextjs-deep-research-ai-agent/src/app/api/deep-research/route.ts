// File: `route.ts`
import { createDataStreamResponse } from "ai";

import type { ResearchState } from "./types";
import { deepResearch } from "./main";

export async function POST(req: Request) {
  try {
    const { messages } = (await req.json()) as {
      messages: {
        content: string;
      }[];
    };

    const lastMessageContent = messages[messages.length - 1]?.content;

    if (!lastMessageContent) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "No message content found!",
        }),
        { status: 400 },
      );
    }

    const parsed = JSON.parse(lastMessageContent) as {
      topic: string;
      clarifications: string[];
    };

    const topic = parsed.topic;
    const clarifications = parsed.clarifications;

    return createDataStreamResponse({
      execute: async (dataStream) => {
        const researchState: ResearchState = {
          topic: topic,
          completedSteps: 0,
          tokenUsed: 0,
          findings: [],
          processedUrl: new Set(),
          clarificationsText: JSON.stringify(clarifications),
        };
        await deepResearch(
          researchState,
          dataStream,
          // TODO: _upgrade-plan[1]
        );
      },
      // onError: error => `Custom error: ${error.message}`,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error:
          error instanceof Error ? error.message : "Invalid message format!",
      }),
      { status: 200 },
    );
  }
}
