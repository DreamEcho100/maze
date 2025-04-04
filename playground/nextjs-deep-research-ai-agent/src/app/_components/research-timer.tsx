"use client";

import { useEffect, useState } from "react";
import { useStore } from "zustand";

import { Card } from "@de100/ui/card";

import { deepResearchStore } from "~/stores/deep-research";

function ResearchTimer() {
  const report = useStore(deepResearchStore, (state) => state.report);
  const isCompleted = useStore(deepResearchStore, (state) => state.isCompleted);
  const activities = useStore(deepResearchStore, (state) => state.activities);
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    // Reset elapsed time when activities are reset
    if (activities.length <= 0) {
      setElapsedTime(0);
      return;
    }

    if (report.length > 10) return;

    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, 16);

    return () => clearInterval(timer);
  }, [report, isCompleted, activities]);

  if (activities.length <= 0) return null;

  const seconds = Math.floor(elapsedTime / 1000);
  const milliseconds = elapsedTime % 1000;

  return (
    <Card className="rounded border border-solid border-black/10 bg-white/60 p-2 shadow-none backdrop-blur-sm">
      <p className="text-sm text-muted-foreground">
        Time elapsed:{" "}
        <span className="inline-block min-w-[55px] font-mono">
          {seconds > 60
            ? `${Math.floor(seconds / 60)}m ${seconds % 60 > 0 ? `${(seconds % 60).toString().padStart(2, "0")}s` : ""}`
            : `${seconds}.${milliseconds.toString().padStart(3, "0")}s`}
        </span>
      </p>
    </Card>
  );
}
export default ResearchTimer;
