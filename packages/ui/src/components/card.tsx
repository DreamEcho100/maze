import type { HTMLAttributes } from "react";

import { cn } from "#libs/utils";

function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn(
				"rounded-xl border bg-card text-card-foreground shadow",
				className,
			)}
			{...props}
		/>
	);
}
Card.displayName = "Card";

const CardHeader = ({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) => (
	<div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
);

function CardTitle({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("font-semibold leading-none tracking-tight", className)}
			{...props}
		/>
	);
}

function CardDescription({
	className,
	...props
}: HTMLAttributes<HTMLDivElement>) {
	return (
		<div
			className={cn("text-muted-foreground text-sm", className)}
			{...props}
		/>
	);
}

function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return <div className={cn("p-6 pt-0", className)} {...props} />;
}

function CardFooter({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex items-center p-6 pt-0", className)} {...props} />
	);
}

export {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
};
