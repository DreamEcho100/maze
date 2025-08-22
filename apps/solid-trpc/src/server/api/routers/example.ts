import { wrap } from "@typeschema/valibot";
import { randomUUID } from "crypto";
import { string } from "valibot";
import { createTRPCRouter, publicProcedure } from "../utils";

export const exampleRouter = createTRPCRouter({
	hello: publicProcedure.input(wrap(string())).query(({ input }) => {
		return `Hello ${input}!`;
	}),
	getId: publicProcedure.query(() => {
		return randomUUID();
	}),
});
