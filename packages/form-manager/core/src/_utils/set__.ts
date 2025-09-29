import type { PathSegmentItem } from "src/shared/types";

function set<T, P extends PathSegmentItem | PathSegmentItem[] | undefined | "">(
	obj: T,
	path: P,
	value: any,
	isImmutable = false,
): void {
	const segments = Array.isArray(path)
		? path
		: typeof path === "string"
			? path.split(".")
			: typeof path === "number"
				? [path]
				: [];
	let current: any = obj;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const nextSegment = segments[i + 1];

		if (current[segment] == null) {
			// Determine if the next segment is a number to create an array
			if (
				typeof nextSegment === "number" ||
				!Number.isNaN(Number(nextSegment))
			) {
				current[segment] = [];
			} else {
				current[segment] = {};
			}
		}

		if (isImmutable) {
			current[segment] =
				// Array
				Array.isArray(current[segment])
					? [...current[segment]]
					: // Map
						current[segment] instanceof Map
						? new Map(current[segment])
						: // Set
							current[segment] instanceof Set
							? new Set(current[segment])
							: // Class instance _9not only object
								typeof current[segment] === "object";
			// How to clone class instance properly?
		}
		current = current[segment];
	}

	const lastSegment = segments[segments.length - 1];
	if (typeof lastSegment === "number" || !Number.isNaN(Number(lastSegment))) {
		current[Number(lastSegment)] = value;
	} else {
		current[lastSegment] = value;
	}
}
