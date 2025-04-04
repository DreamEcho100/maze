"use client";

import { useEffect } from "react";
import { useChat } from "@ai-sdk/react";
import { useStore } from "zustand";

import type { StreamedActivity } from "../api/deep-research/types";
import { deepResearchStore } from "~/stores/deep-research";
import CompletedQuestions from "./completed-questions";
import QuestionForm from "./question-form";
import ResearchActivities from "./research-activities";
import ResearchReport from "./research-report";
import ResearchTimer from "./research-timer";

const QnA = () => {
  const questions = useStore(deepResearchStore, (state) => state.questions);
  const isCompleted = useStore(deepResearchStore, (state) => state.isCompleted);
  const topic = useStore(deepResearchStore, (state) => state.topic);
  const answers = useStore(deepResearchStore, (state) => state.answers);
  const setIsLoading = useStore(
    deepResearchStore,
    (state) => state.setIsLoading,
  );
  const setActivities = useStore(
    deepResearchStore,
    (state) => state.setActivities,
  );
  const setSources = useStore(deepResearchStore, (state) => state.setSources);
  const setReport = useStore(deepResearchStore, (state) => state.setReport);

  const { append, data, status } = useChat({
    api: "/api/deep-research",
  });

  const isLoading = status === "submitted" || status === "streaming";

  useEffect(() => {
    if (!data) return;

    // extract activities and sources
    const messages = data as unknown[];
    const activities: StreamedActivity["content"][] = [];
    for (const msg of messages) {
      if (
        !msg ||
        typeof msg !== "object" ||
        !("type" in msg) ||
        msg.type !== "activity"
      ) {
        continue;
      }
      activities.push((msg as StreamedActivity).content);
    }

    setActivities(activities);

    const sources: {
      url: string;
      title: string;
    }[] = [];

    for (const activity of activities) {
      if (activity.type === "extract" && activity.status === "complete") {
        const url = activity.message.split("from ")[1];
        const title = url?.split("/")[2] ?? url;

        if (!url || !title) continue;
        sources.push({ url, title });
      }
    }

    setSources(sources);
    const reportData = messages.find(
      (msg): msg is StreamedActivity =>
        !!(
          msg &&
          typeof msg === "object" &&
          "type" in msg &&
          msg.type === "report"
        ),
    );
    const report =
      typeof reportData?.content === "string" ? reportData.content : "";
    setReport(report);

    setIsLoading(isLoading);
  }, [data, setActivities, setSources, setReport, setIsLoading, isLoading]);

  useEffect(() => {
    if (isCompleted && questions.length > 0) {
      const clarifications = questions.map((question, index) => ({
        question: question,
        answer: answers[index],
      }));

      void append({
        role: "user",
        content: JSON.stringify({
          topic: topic,
          clarifications: clarifications,
        }),
      });
    }
  }, [isCompleted, questions, answers, topic, append]);

  if (questions.length === 0) return null;

  return (
    <div className="mb-16 flex w-full flex-col items-center gap-4">
      <QuestionForm />
      <CompletedQuestions />
      <ResearchTimer />
      <ResearchActivities />
      <ResearchReport />
    </div>
  );
};

export default QnA;
