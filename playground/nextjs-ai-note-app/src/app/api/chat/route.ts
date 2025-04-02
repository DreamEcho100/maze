import type { ChatCompletionMessage } from "openai/resources/index.mjs";
import { z } from "zod";

import { protectedRoute } from "~/libs/server";
import { notesIndex } from "~/libs/server/db/pinecone";
import { prisma } from "~/libs/server/db/prisma";
import { getEmbedding, openai } from "~/libs/server/openai";

export const POST = protectedRoute({
  requestBodySchema: z.object({
    messages: z.array(
      z.object({
        content: z.string().nullable(),
        role: z.enum(["user", "assistant"]).default("user"),
        parts: z
          .array(
            z.object({
              type: z.literal("text"),
              text: z.string(),
            }),
          )
          .default([]),
      }),
    ),
  }),
  async handler(req) {
    const body = req.ctx.requestBody;
    const user = req.ctx.user;

    const messagesTruncated = body.messages.slice(-6);
    const embedding = await getEmbedding(
      messagesTruncated.map((message) => message.content).join("\n"),
    );

    const vectorQueryResponse = await notesIndex.query({
      vector: embedding,
      topK: 4,
      filter: { userId: user.userId },
    });

    const relevantNotes = await prisma.note.findMany({
      where: {
        id: {
          in: vectorQueryResponse.matches.map((match) => match.id),
        },
      },
    });

    const systemMessage: ChatCompletionMessage = {
      role: "assistant",
      content:
        "You are an intelligent note-taking app. You answer the user's question based on their existing notes. " +
        "The relevant notes for this query are:\n" +
        relevantNotes
          .map((note) => `Title: ${note.title}\n\nContent:\n${note.content}`)
          .join("\n\n"),
      refusal: "none",
    };

    const assistantsMessages: ChatCompletionMessage[] = [];

    for (const message of messagesTruncated) {
      // Need to check if message.content is not null
      // And need to send the parts and for any role even for the user
      // Otherwise it will lead to an error
      if (message.content) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        assistantsMessages.push({
          role: message.role,
          content: message.content,
          refusal: "none",
          parts: message.parts,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } as any);
      }
    }

    console.dir(assistantsMessages, { depth: Number.MAX_SAFE_INTEGER });

    const response = await openai.chat.completions.create({
      model: "gemini-2.0-flash",
      stream: true,
      messages: [systemMessage, ...assistantsMessages],
    });

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of response) {
          const content = chunk.choices[0]?.delta?.content ?? "";
          controller.enqueue(
            new TextEncoder().encode(
              // To be compatible with vercel `ai` package
              `0: ${JSON.stringify(content)}\n`,
            ),
          );
        }

        controller.close();
      },
    });

    return { type: "success", stream };
  },
});
