import { Pinecone } from "@pinecone-database/pinecone";

import { env } from "~/libs/env";

const pinecone = new Pinecone({
  // environment: "gcp-starter",
  apiKey: env.PINECONE_API_KEY,
});

export const notesIndex = pinecone.Index("nextjs-ai-note-app");
