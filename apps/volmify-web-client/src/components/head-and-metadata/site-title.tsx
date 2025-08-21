import { Title } from "@solidjs/meta";
import type { ParentProps } from "solid-js";

export default function SiteTitle(props: ParentProps) {
	return <Title>{props.children} | Volmify</Title>;
}
