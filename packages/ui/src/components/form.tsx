"use client";

import type { Label as LabelPrimitive } from "radix-ui";
import type { ComponentProps, HTMLAttributes } from "react";
import type { ControllerProps, FieldPath, FieldValues, UseFormProps } from "react-hook-form";
import type { ZodType } from "zod/v4";
import { createContext, useContext, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Slot } from "radix-ui";
import { useForm as __useForm, Controller, FormProvider, useFormContext } from "react-hook-form";

import { cn } from "#libs/utils";
import { Label } from "./label";

const useForm = <TOut extends FieldValues, TIn extends FieldValues>(
	props: Omit<UseFormProps<TIn>, "resolver"> & {
		schema: ZodType<TOut, TIn>;
	},
) => {
	const form = __useForm<TIn, unknown, TOut>({
		...props,
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore
		resolver: zodResolver(props.schema, undefined),
	});

	return form;
};

const Form = FormProvider;

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const FormFieldContext = createContext<FormFieldContextValue | null>(null);

const FormField = <
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	...props
}: ControllerProps<TFieldValues, TName>) => {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
};

const useFormField = () => {
	const fieldContext = useContext(FormFieldContext);
	const itemContext = useContext(FormItemContext);
	const { getFieldState, formState } = useFormContext();

	if (!fieldContext) {
		throw new Error("useFormField should be used within <FormField>");
	}
	const fieldState = getFieldState(fieldContext.name, formState);

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
};

interface FormItemContextValue {
	id: string;
}

const FormItemContext = createContext<FormItemContextValue>({} as FormItemContextValue);

function FormItem({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	const id = useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div className={cn("space-y-2", className)} {...props} />
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: ComponentProps<typeof LabelPrimitive.Root>) {
	const { error, formItemId } = useFormField();

	return (
		<Label className={cn(error && "text-destructive", className)} htmlFor={formItemId} {...props} />
	);
}

function FormControl({ ...props }: ComponentProps<typeof Slot.Slot>) {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

	return (
		<Slot.Slot
			id={formItemId}
			aria-describedby={!error ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`}
			aria-invalid={!!error}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	const { formDescriptionId } = useFormField();

	return <p id={formDescriptionId} className={cn("bg-red-500", className)} {...props} />;
}

function FormMessage({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error.message) : children;

	if (!body) {
		return null;
	}

	return (
		<p
			id={formMessageId}
			className={cn("text-destructive text-[0.8rem] font-medium", className)}
			{...props}>
			{body}
		</p>
	);
}

export {
	useForm,
	useFormField,
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
};

export { useFieldArray } from "react-hook-form";
