import { ORPCError, os } from "@orpc/server";
import type { z } from "zod";
import type { UserSchema } from "../../schemas/user.ts";
import { dbProviderMiddleware } from "../middlewares/db.ts";

export interface ORPCContext {
	user?: z.infer<typeof UserSchema>;
}

export const pub = os.$context<ORPCContext>().use(dbProviderMiddleware);

export const authed = pub.use(({ context, next }) => {
	if (!context.user) {
		throw new ORPCError("UNAUTHORIZED");
	}

	return next({
		context: {
			user: context.user,
		},
	});
});
