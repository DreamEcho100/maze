// File `main.ts`

import type { DataStreamWriter } from "ai";

import type { ResearchState, SearchResult } from "./types";
import { createActivityTracker } from "./activity-tracker";
import { MAX_ITERATIONS } from "./constants";
import {
	analyzeFindings,
	generateReport,
	generateSearchQueries,
	processSearchResults,
	search,
} from "./research-utils";

export async function deepResearch(
	researchState: ResearchState,
	dataStream: DataStreamWriter,
	// TODO: _upgrade-plan[1]
) {
	let iteration = 0;

	const activityTracker = createActivityTracker(dataStream, researchState);

	// Planning Phase
	const initialQueries = await generateSearchQueries(
		researchState,
		activityTracker,
		// TODO: _upgrade-plan[1]
	);
	let currentQueries: string[] | undefined = initialQueries?.searchQueries;

	while (currentQueries && currentQueries.length > 0 && iteration <= MAX_ITERATIONS) {
		iteration++;

		console.log("We are running on the iteration number: ", iteration);

		const searchResultsResponses = await Promise.allSettled(
			currentQueries.map((query) => search(query, researchState, activityTracker)),
		);

		const allSearchResults: SearchResult[] = [];
		for (const result of searchResultsResponses) {
			if (result.status === "fulfilled" && result.value.length > 0) {
				allSearchResults.push(...result.value);
			}
		}

		console.log(`We got ${allSearchResults.length} search results!`);

		const newFindings = await processSearchResults(
			allSearchResults,
			researchState,
			activityTracker,
		);

		console.log("Results are processed!");

		researchState.findings = [...researchState.findings, ...newFindings];

		const analysis = await analyzeFindings(
			researchState,
			currentQueries,
			iteration,
			activityTracker,
		);

		console.log("Analysis: ", analysis);

		if (analysis?.sufficient) {
			break;
		}

		const currentQueriesTmp = new Set<string>([]);
		for (const query of analysis?.queries ?? []) {
			currentQueriesTmp.add(query.query);
		}
		currentQueries = [...currentQueriesTmp];
	}

	console.log("We are outside of the loop with total iterations: ", iteration);

	const report = await generateReport(researchState, activityTracker);

	if (!report) {
		dataStream.writeData({
			type: "report",
			content: {
				error: "Failed to generate report",
			},
		});
	} else {
		dataStream.writeData({
			type: "report",
			content: report,
		});
	}

	return initialQueries;
}
