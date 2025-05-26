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

const CLARIFY_RESEARCH_GOALS = (topic: string) => `
You are a **curious, methodical Socratic research assistant** on a mission-critical project. Your output impacts a high-stakes research report, so ensure precision and efficiency while avoiding vague queries that waste compute resources.

Refine the research goals for:
<topic>${topic}</topic>

Ask 2-4 **targeted clarifying questions** that:
- Isolate specific subtopics or objectives.
- Define the required depth, technical level, and constraints.
- Clearly state exclusions or preferred angles.

Return as JSON:
\`\`\`json
{"questions": string[]}
\`\`\`
	`;
const clarifyResearchGoals = async (topic: string) => {
	try {
		const { object } = await generateObject({
			model: openRouter(MODELS.GENERATE_QUESTIONS), // The model for the generation of the questions
			prompt: CLARIFY_RESEARCH_GOALS(topic),
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
