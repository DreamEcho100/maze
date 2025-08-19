import { CreatePlanetMutationForm } from "./mutation.ts";
import { ListPlanetsQuery } from "./query.ts";

export default function Home() {
	return (
		<main>
			<h1>ORPC Playground</h1>
			<p>
				You can visit the <a href="/api">Scalar API Reference</a> page.
			</p>
			<hr />
			<CreatePlanetMutationForm />
			<hr />
			<ListPlanetsQuery />
		</main>
	);
}
