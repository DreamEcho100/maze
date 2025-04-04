"use client";

import { useState } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ChevronDown } from "lucide-react";
import { useStore } from "zustand";

import { Button } from "@de100/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@de100/ui/collapsible";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@de100/ui/tabs";

import { deepResearchStore } from "~/stores/deep-research";

const ResearchActivities = () => {
  const activities = useStore(deepResearchStore, (state) => state.activities);
  const sources = useStore(deepResearchStore, (state) => state.sources);
  const [isOpen, setIsOpen] = useState(true);

  if (activities.length === 0) return;

  return (
    <div className="fixed top-4 right-4 z-20 w-[90vw] sm:w-[400px]">
      <Collapsible className="w-full" open={isOpen} onOpenChange={setIsOpen}>
        <div className="mb-2 flex justify-end">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="w-9 p-0">
              <ChevronDown
                className={`h-4 w-4 ${isOpen ? "rotate-180" : ""}`}
              />
              <span className="sr-only">Toggle</span>
            </Button>
          </CollapsibleTrigger>
        </div>
        <CollapsibleContent className="h-[50vh]">
          <Tabs defaultValue="activities" className="h-full w-full shadow-md">
            <TabsList className="w-full px-2 py-6">
              <TabsTrigger
                value="activities"
                className="flex-1 border-solid border-black/10 shadow-none"
              >
                Activities
              </TabsTrigger>
              {sources.length > 0 && (
                <TabsTrigger value="sources">Sources</TabsTrigger>
              )}
            </TabsList>
            <TabsContent
              value="activities"
              className="h-[calc(100%-60px)] overflow-y-auto rounded-xl border border-solid border-black/10 bg-white/60 shadow-none backdrop-blur-sm"
            >
              <ul className="space-y-4 p-4">
                {activities.map((activity, index) => {
                  let activityMessage: string;

                  if (activity.message.includes("https://")) {
                    const tempSplit = activity.message.split("https://");

                    const tempFirstSegment = tempSplit[0];
                    const tempSecondSegment = tempSplit[1]?.split("/")[0];

                    if (!tempFirstSegment && !tempSecondSegment) {
                      return <></>;
                    }

                    activityMessage = `${tempFirstSegment}${tempSecondSegment}`;
                  } else {
                    activityMessage = activity.message;
                  }

                  return (
                    <li
                      key={index}
                      className="flex flex-col gap-2 border-b p-2 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        <span
                          className={` ${
                            activity.status === "complete"
                              ? "bg-green-500"
                              : activity.status === "error"
                                ? "bg-red-500"
                                : "bg-yellow-500"
                          } block h-2 min-h-2 min-w-2 rounded-full`}
                        >
                          &nbsp;
                        </span>

                        <p>{activityMessage}</p>
                      </div>
                      {activity.timestamp && (
                        <span className="text-xs text-muted-foreground">
                          {format(activity.timestamp, "HH:mm:ss")}
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </TabsContent>
            {sources.length > 0 && (
              <TabsContent
                value="sources"
                className="h-[calc(100%-60px)] overflow-y-auto rounded-xl border border-solid border-black/10 bg-white/60 shadow-none backdrop-blur-sm"
              >
                <ul className="space-y-4 p-4">
                  {sources.map((source, index) => {
                    return (
                      <li
                        key={index}
                        className="flex flex-col gap-2 border-b p-2"
                      >
                        <Link
                          href={source.url}
                          target="_blank"
                          className="text-sm text-blue-600 hover:underline"
                        >
                          {source.title}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </TabsContent>
            )}
          </Tabs>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
};

export default ResearchActivities;
