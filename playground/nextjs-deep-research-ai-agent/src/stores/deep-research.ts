/* eslint-disable @typescript-eslint/no-explicit-any */
import type { StoreApi } from "zustand/vanilla";
import { createStore } from "zustand/vanilla";

import type { Activity, Source } from "~/app/api/deep-research/types";

interface DeepResearchState {
	topic: string;
	questions: string[];
	answers: string[];
	currentQuestion: number;
	isCompleted: boolean;
	isLoading: boolean;
	activities: Activity[];
	sources: Source[];
	report: string;
}

type SetStateUpdaterMap<State extends Record<string, any>> = {
	[Key in keyof State as `set${Capitalize<Key & string>}`]: (
		value: State[Key] | ((prevState: State[Key]) => State[Key]),
	) => void;
};

const createSetStateUpdater = <
	State extends Record<string, any>,
	Actions extends SetStateUpdaterMap<State>,
>(
	state: State,
	set: StoreApi<State>["setState"],
): Actions => {
	const setActions = Object.keys(state).reduce(
		(acc, key) => ({
			...acc,
			[`set${key.charAt(0).toUpperCase() + key.slice(1)}`]: (
				value: State[typeof key] | ((prevState: State[typeof key]) => State[typeof key]),
			) => {
				if (typeof value === "function") {
					set((prevState) => {
						// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call
						const newValue = (value as State[typeof key])(prevState[key as keyof State]);
						return {
							...prevState,
							// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
							[key]: newValue,
						};
					});
				} else {
					set({ [key]: value } as Partial<State>);
				}
			},
		}),
		{},
	);

	return setActions as unknown as Actions;
};

const initialState: DeepResearchState = {
	topic: "",
	questions: [],
	answers: [],
	currentQuestion: 0,
	isCompleted: false,
	isLoading: false,
	activities: [],
	sources: [],
	report: "",
};

export const deepResearchStore = createStore<
	DeepResearchState & SetStateUpdaterMap<DeepResearchState>
>((set) => ({
	...initialState,
	...createSetStateUpdater(initialState, set),
}));
