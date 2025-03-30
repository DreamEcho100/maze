import type { StandardSchemaV1 } from "@standard-schema/spec";
import { auth } from "@clerk/nextjs/server";

import {
  createNoteSchema,
  deleteNoteSchema,
  updateNoteSchema,
} from "~/libs/schemas/note";
import { notesIndex } from "~/libs/server/db/pinecone";
import { prisma } from "~/libs/server/db/prisma";
import { getEmbedding } from "~/libs/server/openai";

async function getEmbeddingForNote(title: string, content?: string) {
  return getEmbedding(title + "\n\n" + (content ?? ""));
}

interface ProtectedRouteRequest<
  RequestBodySchema extends StandardSchemaV1 | undefined = undefined,
> extends Request {
  ctx: {
    user: { userId: string };
    requestBody: RequestBodySchema extends StandardSchemaV1
      ? StandardSchemaV1.InferOutput<RequestBodySchema>
      : undefined;
  };
}

function protectedRoute<
  RequestBodySchema extends StandardSchemaV1 | undefined = undefined,
>(param: {
  handler: (req: ProtectedRouteRequest<RequestBodySchema>) => Promise<Response>;
  requestBodySchema?: RequestBodySchema;
}) {
  return async (req: ProtectedRouteRequest<RequestBodySchema>) => {
    try {
      const user = await auth();

      if (!user.userId) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }

      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      req.ctx = req.ctx ?? {};

      req.ctx.user = {
        userId: user.userId,
      };

      if (param.requestBodySchema) {
        const body = await param.requestBodySchema["~standard"].validate(
          await req.json(),
        );
        if (body.issues) {
          console.error(body.issues);
          return Response.json({ error: "Invalid input" }, { status: 400 });
        }
        req.ctx.requestBody =
          body.value as ProtectedRouteRequest<RequestBodySchema>["ctx"]["requestBody"];
      }

      return param.handler(req);
    } catch (error) {
      console.error(error);
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  };
}

export const POST = protectedRoute({
  requestBodySchema: createNoteSchema,
  handler: async (req) => {
    const body = req.ctx.requestBody;

    const embedding = await getEmbedding(body.title);

    const note = await prisma.note.create({
      data: {
        title: body.title,
        content: body.content,
        userId: req.ctx.user.userId,
      },
    });

    await notesIndex.upsert([
      {
        id: note.id,
        values: embedding,
        metadata: { userId: req.ctx.user.userId },
      },
    ]);

    return Response.json({ note }, { status: 201 });
  },
});

export const PUT = protectedRoute({
  requestBodySchema: updateNoteSchema,
  handler: async (req) => {
    const body = req.ctx.requestBody;
    const user = req.ctx.user;

    const note = await prisma.note.findUnique({
      where: { id: body.id, userId: user.userId },
    });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    const embedding = await getEmbeddingForNote(body.title, body.content);

    const updatedNote = await prisma.$transaction(async (tx) => {
      const updatedNote = await tx.note.update({
        where: { id: body.id, userId: user.userId },
        data: {
          title: body.title,
          content: body.content,
        },
      });

      await notesIndex.upsert([
        {
          id: updatedNote.id,
          values: embedding,
          metadata: { userId: user.userId },
        },
      ]);

      return updatedNote;
    });

    return Response.json({ updatedNote }, { status: 200 });
  },
});

export const DELETE = protectedRoute({
  requestBodySchema: deleteNoteSchema,
  async handler(req) {
    const body = req.ctx.requestBody;
    const user = req.ctx.user;

    const note = await prisma.note.findUnique({
      where: { id: body.id, userId: user.userId },
    });

    if (!note) {
      return Response.json({ error: "Note not found" }, { status: 404 });
    }

    await prisma.$transaction(async (tx) => {
      await tx.note.delete({ where: { id: body.id, userId: user.userId } });
      await notesIndex.deleteOne(body.id);
    });

    return Response.json({ message: "Note deleted" }, { status: 200 });
  },
});
