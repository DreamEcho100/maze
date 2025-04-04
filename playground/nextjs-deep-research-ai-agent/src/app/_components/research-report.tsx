"use client";

import type { ComponentPropsWithRef } from "react";
import type { SyntaxHighlighterProps } from "react-syntax-highlighter";
import { Download } from "lucide-react";
import Markdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { nightOwl } from "react-syntax-highlighter/dist/esm/styles/prism";
import remarkGfm from "remark-gfm";
import { useStore } from "zustand";

import { Button } from "@de100/ui/components/button";
import { Card } from "@de100/ui/components/card";

import { deepResearchStore } from "~/stores/deep-research";

type CodeProps = ComponentPropsWithRef<"code"> & {
  inline?: boolean;
};

const ResearchReport = () => {
  const report = useStore(deepResearchStore, (state) => state.report);
  const isCompleted = useStore(deepResearchStore, (state) => state.isCompleted);
  const isLoading = useStore(deepResearchStore, (state) => state.isLoading);
  const topic = useStore(deepResearchStore, (state) => state.topic);

  const handleMarkdownDownload = () => {
    const content = report.split("<report>")[1]?.split("</report>")[0];
    if (!content) {
      console.error("No report content found");
      throw new Error("No report content found");
    }

    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${topic}-research-report.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isCompleted) return null;

  if (report.length <= 0 && isLoading) {
    return (
      <Card className="max-w-[50vw] rounded-xl border bg-white/60 p-4 px-4 py-2">
        <div className="flex flex-col items-center justify-center space-y-4 p-8">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary"></div>
          <p className="text-sm text-muted-foreground">
            Researching your topic...
          </p>
        </div>
      </Card>
    );
  }

  if (report.length <= 0) return null;

  return (
    <Card className="relative max-w-[90vw] rounded-xl border border-solid border-black/10 bg-white/60 p-6 px-4 py-6 antialiased shadow-none backdrop-blur-xl xl:max-w-[60vw]">
      <div className="absolute top-4 right-4 mb-4 flex justify-end gap-2">
        <Button
          size="sm"
          className="flex items-center gap-2 rounded"
          onClick={handleMarkdownDownload}
        >
          <Download className="h-4 w-4" /> Download
        </Button>
      </div>

      <div className="prose prose-sm md:prose-base prose-pre:p-2 max-w-none overflow-x-scroll">
        <Markdown
          remarkPlugins={[remarkGfm]}
          components={{
            code({ className, children, inline, ...props }: CodeProps) {
              const match = /language-(\w+)/.exec(className ?? "");
              const language = match ? match[1] : "";

              if (!inline && language) {
                const SyntaxHighlighterProps: SyntaxHighlighterProps = {
                  style: nightOwl,
                  language,
                  PreTag: "div",
                  // eslint-disable-next-line @typescript-eslint/no-base-to-string
                  children: String(children).replace(/\n$/, ""),
                };

                return <SyntaxHighlighter {...SyntaxHighlighterProps} />;
              }

              return (
                <code className={className} {...props}>
                  {children}
                </code>
              );
            },
          }}
        >
          {report.split("<report>")[1]?.split("</report>")[0]}
        </Markdown>
      </div>
    </Card>
  );
};

export default ResearchReport;
