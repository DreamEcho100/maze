import { Loader2 } from "lucide-react";

import type { ButtonProps } from "@de100/ui/components/button";
import { Button } from "@de100/ui/components/button";

interface LoadingButtonProps extends ButtonProps {
	isLoading: boolean;
}

export default function LoadingButton({
	children,
	isLoading: loading,
	...props
}: LoadingButtonProps) {
	return (
		<Button {...props} disabled={props.disabled ?? loading}>
			{loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
			{children}
		</Button>
	);
}
