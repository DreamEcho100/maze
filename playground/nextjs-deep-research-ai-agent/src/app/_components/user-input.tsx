"use client";

import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useStore } from "zustand";

import { Button } from "@de100/ui/components/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@de100/ui/components/form";
import { Input } from "@de100/ui/components/input";

import { isApiErrorResponse } from "~/libs/utils";
import { deepResearchStore } from "~/stores/deep-research";

const formSchema = z.object({
  input: z.string().min(2).max(200),
});

const UserInput = () => {
  const [isLoading, setIsLoading] = useState(false);
  const setQuestions = useStore(
    deepResearchStore,
    (state) => state.setQuestions,
  );
  const setTopic = useStore(deepResearchStore, (state) => state.setTopic);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      input: "",
    },
  });

  // 2. Define a submit handler.
  async function onSubmit(values: z.infer<typeof formSchema>) {
    deepResearchStore.setState(deepResearchStore.getInitialState());
    setIsLoading(true);
    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        body: JSON.stringify({ topic: values.input }),
      });
      const data = (await response.json()) as string[];

      if (isApiErrorResponse(data)) {
        alert(data.error);
        return;
      }

      setTopic(values.input);
      setQuestions(data);
      form.reset();
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="flex w-[90vw] flex-col items-center justify-center gap-4 sm:w-[80vw] sm:flex-row xl:w-[50vw]"
      >
        <FormField
          control={form.control}
          name="input"
          render={({ field }) => (
            <FormItem className="w-full flex-1">
              <FormControl>
                <Input
                  placeholder="Enter your research topic"
                  {...field}
                  className="w-full flex-1 rounded-full border-solid border-black/10 bg-white/60 p-4 py-4 shadow-none backdrop-blur-sm placeholder:text-sm sm:py-6"
                  disabled={isLoading}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button
          type="submit"
          className="cursor-pointer rounded-full px-6"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            "Submit"
          )}
        </Button>
      </form>
    </Form>
  );
};

export default UserInput;
