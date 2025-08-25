import {
	login,
	me,
	register,
	resendEmailVerificationCode,
	verifyEmail,
} from "./auth.ts";
import {
	createPlanet,
	findPlanet,
	listPlanets,
	updatePlanet,
} from "./planet.ts";
import { sse } from "./sse.ts";

export const router = {
	auth: {
		register,
		login,
		verifyEmail,
		resendEmailVerificationCode,
		me,
	},

	planet: {
		list: listPlanets,
		create: createPlanet,
		find: findPlanet,
		update: updatePlanet,
	},

	sse,
};
