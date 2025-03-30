import { OpenAI } from "openai";

import { env } from "../env";

export const openai = new OpenAI({ apiKey: env.OPENAI_API_KEY });

export async function getEmbedding(text: string) {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  const embedding = response.data[0]?.embedding;

  if (!Array.isArray(embedding)) throw Error("Error generating embedding.");

  console.log(embedding);

  return embedding;
}
