import { Textarea } from "_ignore/Deep-Research-AI-Agent/src/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useStore } from "zustand";

import { Button } from "@de100/ui/components/button";
import { Card, CardContent, CardHeader, CardTitle } from "@de100/ui/components/card";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@de100/ui/components/form";

import { deepResearchStore } from "~/stores/deep-research";

const formSchema = z.object({
	answer: z.string().min(1, "Answer is required!"),
});

const QuestionForm = () => {
	const questions = useStore(deepResearchStore, (state) => state.questions);
	const currentQuestion = useStore(deepResearchStore, (state) => state.currentQuestion);
	const answers = useStore(deepResearchStore, (state) => state.answers);
	const setCurrentQuestion = useStore(deepResearchStore, (state) => state.setCurrentQuestion);
	const setAnswers = useStore(deepResearchStore, (state) => state.setAnswers);
	const setIsCompleted = useStore(deepResearchStore, (state) => state.setIsCompleted);
	const isLoading = useStore(deepResearchStore, (state) => state.isLoading);
	const isCompleted = useStore(deepResearchStore, (state) => state.isCompleted);

	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			answer: answers[currentQuestion] ?? "",
		},
	});

	// 2. Define a submit handler.
	function onSubmit(values: z.infer<typeof formSchema>) {
		// Do something with the form values.
		// ✅ This will be type-safe and validated.
		const newAnswers = [...answers];
		newAnswers[currentQuestion] = values.answer;
		setAnswers(newAnswers);

		if (currentQuestion < questions.length - 1) {
			setCurrentQuestion(currentQuestion + 1);
			form.reset();
		} else {
			setIsCompleted(true);
		}
	}

	if (isCompleted) return;

	if (questions.length === 0) return;

	return (
		<Card className="w-full max-w-[90vw] rounded-xl border border-solid border-black/10 bg-white/60 px-4 py-6 shadow-none backdrop-blur-sm sm:max-w-[80vw] xl:max-w-[50vw]">
			<CardHeader className="px-4 sm:px-6">
				<CardTitle className="text-base text-primary/50">
					Question {currentQuestion + 1} of {questions.length}
				</CardTitle>
			</CardHeader>
			<CardContent className="w-full space-y-6 px-4 sm:px-6">
				<p className="text-base">{questions[currentQuestion]}</p>
				<Form {...form}>
					<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
						<FormField
							control={form.control}
							name="answer"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<Textarea
											placeholder="Type your answer here..."
											{...field}
											className="resize-none border-black/20 px-4 py-2 text-base placeholder:text-sm"
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
						<div className="flex items-center justify-between">
							<Button
								type="button"
								variant={"outline"}
								onClick={() => {
									if (currentQuestion > 0) {
										setCurrentQuestion(currentQuestion - 1);
										form.setValue("answer", answers[currentQuestion - 1] ?? "");
									}
								}}>
								Previous
							</Button>

							<Button type="submit" disabled={isLoading}>
								{currentQuestion === questions.length - 1 ? "Start Research" : "Next"}
							</Button>
						</div>
					</form>
				</Form>

				<div className="h-1 w-full rounded bg-gray-200">
					<div
						className="h-1 rounded bg-primary transition-all duration-300"
						style={{
							width: `${((currentQuestion + 1) / questions.length) * 100}%`,
						}}
					/>
				</div>
			</CardContent>
		</Card>
	);
};

export default QuestionForm;
