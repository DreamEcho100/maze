import { protectedProcedure, publicProcedure } from "../libs/orpc";

export const appRouter = {
	healthCheck: publicProcedure.handler(() => {
		return "OK";
	}),
	privateData: protectedProcedure.handler(({ context }) => {
		return {
			message: "This is private",
			user: context.session.user,
		};
	}),
};
export type AppRouter = typeof appRouter;
