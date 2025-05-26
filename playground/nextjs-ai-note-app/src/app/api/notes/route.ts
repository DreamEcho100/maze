import { createNoteSchema, deleteNoteSchema, updateNoteSchema } from "~/libs/schemas/note";
import { protectedRoute } from "~/libs/server";
import { notesIndex } from "~/libs/server/db/pinecone";
import { prisma } from "~/libs/server/db/prisma";
import { getEmbedding } from "~/libs/server/openai";

async function getEmbeddingForNote(title: string, content?: string) {
	return getEmbedding(title + "\n\n" + (content ?? ""));
}

export const POST = protectedRoute({
	requestBodySchema: createNoteSchema,
	handler: async (req) => {
		const body = req.ctx.requestBody;

		const embedding = await getEmbedding(body.title);

		const note = await prisma.$transaction(async (tx) => {
			const note = await tx.note.create({
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

			return note;
		});

		return { status: 201, json: { note } };
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
			return { type: "error", statusNum: 404, message: "Note not found" };
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

		return { json: { updatedNote } };
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
			return { type: "error", statusNum: 404, message: "Note not found" };
		}

		await prisma.$transaction(async (tx) => {
			await tx.note.delete({ where: { id: body.id, userId: user.userId } });
			await notesIndex.deleteOne(body.id);
		});

		return { json: { message: "Note deleted" } };
	},
});
