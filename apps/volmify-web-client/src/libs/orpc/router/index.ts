import { me, signin, signup } from "./auth.ts";
import {
	createPlanet,
	findPlanet,
	listPlanets,
	updatePlanet,
} from "./planet.ts";
import { sse } from "./sse.ts";

export const router = {
	auth: {
		signup,
		signin,
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
