"use client";

/**
 * @import { ButtonHTMLAttributes } from "react";
 */
import { useMutation } from "@tanstack/react-query";

import { logoutAction } from "./actions";

/** @param {ButtonHTMLAttributes<HTMLButtonElement>} props  */
export function LogoutButton(props) {
	const mutation = useMutation({
		mutationFn: logoutAction,
	});

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				if (mutation.isPending) return;
				mutation.mutate();
			}}
			style={{ display: "contents" }}
		>
			<button {...props} type="submit" disabled={mutation.isPending}>
				Sign out
			</button>
		</form>
	);
}
