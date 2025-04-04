import { NextResponse } from "next/server";
import { createOpenRouter } from "@openrouter/ai-sdk-provider";
import { generateObject } from "ai";
import { z } from "zod";

import { env } from "~/libs/env";

const MODELS = {
  GENERATE_QUESTIONS: "openrouter/quasar-alpha", // "meta-llama/llama-3.3-70b-instruct",
};

const openRouter = createOpenRouter({
  apiKey: env.OPEN_ROUTER_API_KEY,
});

const clarifyResearchGoals = async (topic: string) => {
  const prompt = `
Given the research topic <topic>${topic}</topic>, generate 2-4 clarifying questions to help narrow down the research scope. Focus on identifying:
- Specific aspects of interest
- Required depth/complexity level
- Any particular perspective or excluded sources

The response should be a JSON object with a key "questions" containing an array of strings, each representing a question.
\`\`\`json
{
    questions: string[];
}
\`\`\`
    `;

  try {
    const { object } = await generateObject({
      model: openRouter(MODELS.GENERATE_QUESTIONS), // The model for the generation of the questions
      prompt,
      schema: z.object({
        questions: z.array(z.string()),
      }),
    });

    return object.questions;
  } catch (error) {
    console.log("Error while generating questions: ", error);
    throw new Error("Failed to generate questions");
  }
};

export async function POST(req: Request) {
  const { topic } = (await req.json()) as { topic: string };
  console.log("Topic: ", topic);

  try {
    const questions = await clarifyResearchGoals(topic);
    console.log("Questions: ", questions);

    return NextResponse.json(questions);
  } catch (error) {
    console.error("Error while generating questions: ", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate questions",
      },
      { status: 500 },
    );
  }
}
