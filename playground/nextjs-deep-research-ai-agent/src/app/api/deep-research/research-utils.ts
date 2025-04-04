// File `research-utils.ts`

import { z } from "zod";

import type {
  ActivityTracker,
  ResearchFindings,
  ResearchState,
  SearchResult,
} from "./types";
import {
  MAX_CONTENT_CHARS,
  MAX_ITERATIONS,
  MAX_SEARCH_RESULTS,
  MODELS,
} from "./constants";
import { callModel } from "./model-caller";
import {
  ANALYSIS_SYSTEM_PROMPT,
  EXTRACTION_SYSTEM_PROMPT,
  getAnalysisPrompt,
  getExtractionPrompt,
  getPlanningPrompt,
  getReportPrompt,
  PLANNING_SYSTEM_PROMPT,
  REPORT_SYSTEM_PROMPT,
} from "./prompts";
import { exa } from "./services";
import { combineFindings, handleError } from "./utils";

export async function generateSearchQueries(
  researchState: ResearchState,
  activityTracker: ActivityTracker,
  // TODO: _upgrade-plan[1]
) {
  try {
    activityTracker.add("planning", "pending", "Planning the research");

    const result = await callModel(
      {
        model: MODELS.PLANNING,
        prompt: getPlanningPrompt(
          researchState.topic,
          researchState.clarificationsText,
        ),
        system: PLANNING_SYSTEM_PROMPT,
        schema: z.object({
          searchQueries: z
            .array(z.string())
            .describe(
              "The search queries that can be used to find the most relevant content which can be used to write the comprehensive report on the given topic. (max 3 queries)",
            ),
        }),
        activityType: "planning",
      },
      researchState,
      activityTracker,
    );

    activityTracker.add("planning", "complete", "Crafted the research plan");

    return result;
  } catch (error) {
    return handleError(
      error,
      `Research planning`,
      activityTracker,
      "planning",
      {
        searchQueries: [
          `${researchState.topic} best practices`,
          `${researchState.topic} guidelines`,
          `${researchState.topic} examples`,
        ],
      },
    );
  }
}

export async function search(
  query: string,
  researchState: ResearchState,
  activityTracker: ActivityTracker,
): Promise<SearchResult[]> {
  activityTracker.add("search", "pending", `Searching for ${query}`);

  try {
    // TODO: _upgrade-plan[2]
    const searchResult = await exa.searchAndContents(query, {
      type: "keyword",
      numResults: MAX_SEARCH_RESULTS,
      startPublishedDate: new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endPublishedDate: new Date().toISOString(),
      startCrawlDate: new Date(
        Date.now() - 365 * 24 * 60 * 60 * 1000,
      ).toISOString(),
      endCrawlDate: new Date().toISOString(),
      excludeDomains: ["https://youtube.com"],
      text: {
        maxCharacters: MAX_CONTENT_CHARS,
      },
    });

    const filteredResults: {
      title: string;
      url: string;
      content: string;
    }[] = [];

    for (const item of searchResult.results) {
      if (item.title) {
        filteredResults.push({
          title: item.title,
          url: item.url,
          content: item.text,
        });
      }
    }

    researchState.completedSteps++;

    activityTracker.add(
      "search",
      "complete",
      `Found ${filteredResults.length} results for ${query}`,
    );

    return filteredResults;
  } catch (error) {
    console.log("error: ", error);
    return (
      handleError(
        error,
        `Searching for ${query}`,
        activityTracker,
        "search",
        [],
      ) ?? []
    );
  }
}

export async function extractContent(
  content: string,
  url: string,
  researchState: ResearchState,
  activityTracker: ActivityTracker,
) {
  try {
    activityTracker.add("extract", "pending", `Extracting content from ${url}`);

    const result = await callModel(
      {
        model: MODELS.EXTRACTION,
        prompt: getExtractionPrompt(
          content,
          researchState.topic,
          researchState.clarificationsText,
        ),
        system: EXTRACTION_SYSTEM_PROMPT,
        schema: z.object({
          summary: z
            .string()
            .describe("A comprehensive summary of the content"),
        }),
        activityType: "extract",
      },
      researchState,
      activityTracker,
    );

    activityTracker.add("extract", "complete", `Extracted content from ${url}`);

    return {
      url,
      summary: typeof result === "string" ? result : result.summary,
    };
  } catch (error) {
    return handleError(
      error,
      `Content extraction from ${url}`,
      activityTracker,
      "extract",
      null,
    );
  }
}

export async function processSearchResults(
  searchResults: SearchResult[],
  researchState: ResearchState,
  activityTracker: ActivityTracker,
): Promise<ResearchFindings[]> {
  const extractionResults = await Promise.allSettled(
    searchResults.map((result) =>
      extractContent(
        result.content,
        result.url,
        researchState,
        activityTracker,
      ),
    ),
  );

  const newFindings: {
    summary: string;
    source: string;
  }[] = [];
  for (const item of extractionResults) {
    if (
      item.status === "fulfilled" &&
      item.value !== null &&
      item.value !== undefined
    ) {
      newFindings.push({ summary: item.value.summary, source: item.value.url });
    }
  }

  return newFindings;
}

export async function analyzeFindings(
  researchState: ResearchState,
  currentQueries: string[],
  currentIteration: number,
  activityTracker: ActivityTracker,
) {
  try {
    activityTracker.add(
      "analyze",
      "pending",
      `Analyzing research findings (iteration ${currentIteration}) of ${MAX_ITERATIONS}`,
    );
    const contentText = combineFindings(researchState.findings);

    const result = await callModel(
      {
        model: MODELS.ANALYSIS,
        prompt: getAnalysisPrompt(
          contentText,
          researchState.topic,
          researchState.clarificationsText,
          currentQueries,
          currentIteration,
          MAX_ITERATIONS,
          contentText.length,
        ),
        system: ANALYSIS_SYSTEM_PROMPT,
        schema: z.object({
          sufficient: z
            .boolean()
            .describe(
              "Whether the collected content is sufficient for a useful report",
            ),
          gaps: z.array(z.string()).describe("Identified gaps in the content"),
          coverage: z
            // .enum(["Excellent", "Strong", "Adequate", "Limited", "Deficient"])
            .string()
            .describe("Coverage rating of the content"),
          queries: z
            .array(
              z.object({
                query: z.string().describe("A search query to fill the gaps"),
                purpose: z
                  .string()
                  .describe("The purpose of this search query"),
                priority: z
                  .enum(["high", "medium", "low"])
                  .describe("Priority of the search query"),
                expectedInsight: z
                  .string()
                  .describe("Expected insight from this search query"),
              }),
            )
            .describe("Search queries for missing information. Max 3 queries."),
        }),
        activityType: "analyze",
      },
      researchState,
      activityTracker,
    );

    const isContentSufficient = typeof result !== "string" && result.sufficient;

    activityTracker.add(
      "analyze",
      "complete",
      `Analyzed collected research findings: ${isContentSufficient ? "Content is sufficient" : "More research is needed!"}`,
    );

    return result;
  } catch (error) {
    return handleError(error, `Content analysis`, activityTracker, "analyze", {
      sufficient: false,
      gaps: ["Unable to analyze content"],
      queries: [
        {
          query: `Please try a different search queries instead of "${currentQueries.join(" -*|*- ")}"`,
          purpose: "To find more relevant content",
          priority: "high",
          expectedInsight: "To find more relevant content",
        },
      ],
    });
  }
}

export async function generateReport(
  researchState: ResearchState,
  activityTracker: ActivityTracker,
) {
  try {
    activityTracker.add(
      "generate",
      "pending",
      `Generating comprehensive report!`,
    );

    const contentText = combineFindings(researchState.findings);

    const report = await callModel(
      {
        model: MODELS.REPORT,
        prompt: getReportPrompt(
          contentText,
          researchState.topic,
          researchState.clarificationsText,
        ),
        system: REPORT_SYSTEM_PROMPT,
        activityType: "generate",
      },
      researchState,
      activityTracker,
    );

    activityTracker.add(
      "generate",
      "complete",
      `Generated comprehensive report, Total tokens used: ${researchState.tokenUsed}. Research completed in ${researchState.completedSteps} steps.`,
    );

    return report;
  } catch (error) {
    console.log(error);
    return handleError(
      error,
      `Report Generation`,
      activityTracker,
      "generate",
      `Error generating report. Please try again. Total tokens used: ${researchState.tokenUsed}`,
    );
  }
}
