// File: `utils.ts`
import type { Activity, ActivityTracker, ResearchFindings } from "./types";

export const combineFindings = (findings: ResearchFindings[]): string => {
  let resultContent = "";

  for (let i = 0; i < findings.length; i++) {
    const finding = findings[i];
    if (!finding?.summary || !finding.source) {
      console.log("Findings: ", finding);
      throw new Error(
        "When combining the findings  is missing summary or source",
      );
    }

    resultContent += `${finding.summary}\n\n Source: ${finding.source}`;
    if (i < findings.length - 1) {
      resultContent += "\n\n---\n\n";
    }
  }

  return resultContent;
};

export const handleError = <T = undefined>(
  error: unknown,
  context: string,
  activityTracker?: ActivityTracker,
  activityType?: Activity["type"],
  fallbackReturn?: T,
) => {
  const errorMessage = error instanceof Error ? error.message : "Unkown error";

  if (activityTracker && activityType) {
    activityTracker.add(
      activityType,
      "error",
      `${context} failed" ${errorMessage}`,
    );
  }
  return fallbackReturn;
};
