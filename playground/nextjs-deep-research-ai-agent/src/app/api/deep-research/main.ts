import type { DataStreamWriter, JSONValue } from "ai";

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
) {
  let iteration = 0;

  const activityTracker = createActivityTracker(dataStream, researchState);

  const initialQueries = await generateSearchQueries(
    researchState,
    activityTracker,
  );
  let currentQueries: string[] | undefined =
    typeof initialQueries === "string"
      ? [initialQueries]
      : typeof initialQueries === "undefined"
        ? undefined
        : initialQueries.searchQueries;
  while (
    currentQueries &&
    currentQueries.length > 0 &&
    iteration <= MAX_ITERATIONS
  ) {
    iteration++;

    console.log("We are running on the iteration number: ", iteration);

    const searchResults = currentQueries.map((query: string) =>
      search(query, researchState, activityTracker),
    );
    const searchResultsResponses = await Promise.allSettled(searchResults);

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

    if (typeof analysis === "object" && analysis.sufficient) {
      break;
    }

    currentQueries = (
      typeof analysis === "string" ? [analysis] : (analysis?.queries ?? [])
    ).filter((query) => !currentQueries?.includes(query));
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
      content: report as JSONValue,
    });
  }
  // console.log("REPORT: ", report)

  return initialQueries;
}
