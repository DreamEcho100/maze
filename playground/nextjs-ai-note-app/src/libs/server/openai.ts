// https://ai.google.dev/gemini-api/docs/openai

import { OpenAI } from "openai";

import { env } from "../env";

export const openai = new OpenAI({
	// apiKey: env.OPENAI_API_KEY
	apiKey: env.GEMINI_API_KEY,
	baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/",
});

export async function getEmbedding(text: string) {
	const response = await openai.embeddings.create({
		model: "text-embedding-004", // "text-embedding-005", // "text-embedding-3-small",
		input: text,
	});

	const embedding = response.data[0]?.embedding;

	if (!Array.isArray(embedding)) throw Error("Error generating embedding.");

	return embedding;
}
