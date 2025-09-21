// @ts-nocheck

// form-manger/under-discussion-todo/field-array-utils.ts

import type { NestedPath, NestedPathValue, ValuesShape } from "../types";

type PotentialArr = any[] | ReadonlyArray<any> | undefined | null;
type GetPotentialArrVal<T extends PotentialArr> = T extends ReadonlyArray<
	infer U
>
	? U
	: T extends Array<infer U>
		? U
		: never;

// type PotentialArr = unknown[] | ReadonlyArray<unknown> | null | undefined;
// type GetArrayItem<T> = T extends ReadonlyArray<infer U> ? U : T extends Array<infer U> ? U : never;

export interface FormManagerWithFieldArrays<Values extends ValuesShape> {
	/** Field array management with trie-optimized operations */
	fieldArrays: {
		[Key in NestedPath<Values>]?: {
			/** Stable keys for efficient rendering */
			keys: string[];

			/** Get path for a specific array item */
			getItemPath: (index: number) => string;

			/** Array operations */
			append: (
				value: NestedPathValue<Values, Key> extends PotentialArr
					? GetPotentialArrVal<NestedPathValue<Values, Key>>
					: never,
			) => void;
			prepend: (
				value: NestedPathValue<Values, Key> extends PotentialArr
					? GetPotentialArrVal<NestedPathValue<Values, Key>>
					: never,
			) => void;
			insert: (
				index: number,
				value: NestedPathValue<Values, Key> extends PotentialArr
					? GetPotentialArrVal<NestedPathValue<Values, Key>>
					: never,
			) => void;
			remove: (index: number | number[]) => void;
			move: (from: number, to: number) => void;
			swap: (indexA: number, indexB: number) => void;
			update: (
				index: number,
				value: NestedPathValue<Values, Key> extends PotentialArr
					? GetPotentialArrVal<NestedPathValue<Values, Key>>
					: never,
			) => void;
			replace: (values: NestedPathValue<Values, Key>) => void;
		};
	};
}
