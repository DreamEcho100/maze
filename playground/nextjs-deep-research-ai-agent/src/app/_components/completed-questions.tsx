"use client";

import { useStore } from "zustand";

import {
	Accordion,
	AccordionContent,
	AccordionItem,
	AccordionTrigger,
} from "@de100/ui/components/accordion";

import { deepResearchStore } from "~/stores/deep-research";

const CompletedQuestions = () => {
	const questions = useStore(deepResearchStore, (state) => state.questions);
	const answers = useStore(deepResearchStore, (state) => state.answers);
	const isCompleted = useStore(deepResearchStore, (state) => state.isCompleted);

	if (!isCompleted || questions.length === 0) return null;

	return (
		<Accordion
			type="single"
			collapsible
			className="w-full max-w-[90vw] rounded-xl border bg-white/60 px-4 py-2 backdrop-blur-sm sm:max-w-[80vw] xl:max-w-[50vw]"
		>
			<AccordionItem value="item-0" className="border-0">
				<AccordionTrigger className="text-base capitalize hover:no-underline">
					<span>Questions and Answers</span>
				</AccordionTrigger>
				<AccordionContent>
					<div className="mx-auto space-y-8 py-6">
						<Accordion type="single" collapsible className="w-full">
							{questions.map((question, index) => (
								<AccordionItem key={index} value={`item-${index}`}>
									<AccordionTrigger className="text-left hover:no-underline">
										<span className="text-black/70">
											Question {index + 1}: {question}
										</span>
									</AccordionTrigger>
									<AccordionContent className="rounded-md bg-muted/50 p-4">
										<p className="text-muted-foreground">{answers[index]}</p>
									</AccordionContent>
								</AccordionItem>
							))}
						</Accordion>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	);
};

export default CompletedQuestions;
