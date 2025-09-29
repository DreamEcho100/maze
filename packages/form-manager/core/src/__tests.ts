// @ts-nocheck
import { fnConfigKey } from "./constants.js";
import type { FieldNode } from "./fields/shape/types.ts";
import { type CreateFormApiProps, initFormApi } from "./index.ts";
import type { ValuesShape } from "./shared/types.ts";
import type { FormApi } from "./types.ts";

/**
 * Simulate a state manager with basic get and set functionality.
 * This is a placeholder and should be replaced with a proper state management solution.
 * It should be replaced with your state management solution
 */
function stateManagerSimulator<T>(initialState: T) {
	let state = { ...initialState };

	return {
		getState: () => state,
		setState: (newState: Partial<T>) => {
			state = { ...state, ...newState };
		},
	};
}

function createUniqueId() {
	return Math.random().toString(36).substring(2, 10);
}

/**
 * @notes
 * This is more like a base approach on how the integration with other state management libs will be
 * Which means it will differ internally by you slightly based on the state management solution you use
 * As long as you can provide a `getState`, `setState` and a stable reference for the instance, it should work 😊
 *
 * @warning
 *
 * - **Serialization Problems**: this instance will have problems if you try to serialize it (e.g., for server-side rendering or saving to local storage). Consider implementing a custom serialization method if needed.
 * - **Performance**: This will mostly depend on the state management solution you use. If you notice performance issues, consider optimizing the state updates or using a more efficient state management library.
 * - **Deep Equality Checks**: If your state management solution uses deep equality checks, maybe it's better to disable it if possible to avoid unnecessary re-renders.
 */
function createFormApi<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
>(
	props: Omit<
		CreateFormApiProps<FieldsShape, Values, SubmitError, SubmitResult>,
		"stateManager" | "baseId"
	> & { baseId?: string },
) {
	type FormApiType = FormApi<FieldsShape, Values, SubmitError, SubmitResult>;

	const uniqueId = createUniqueId();
	const baseId = props.baseId ?? `form-${uniqueId}`;

	// Potential other approach:
	// To cache the initial instance on the _stalled closure_
	// Still you will need to set the instance on the state manager
	// Or use a stable reference for the instance, for example using `useRef` in React
	// let instanceCache: any;

	const formApi: {
		getState: () => {
			instance: FormApiType;
		};
		setState: (
			newState: Partial<{
				instance: FormApiType;
			}>,
		) => void;
	} = stateManagerSimulator<{
		instance: FormApiType;
	}>({
		get instance(): FormApiType {
			try {
				if (process.env.NODE_ENV === "development") {
					console.log("Initializing FormApi...");
				}

				const instance = initFormApi<
					FieldsShape,
					Values,
					SubmitError,
					SubmitResult
				>({
					...props,
					baseId,
					stateManager: {
						getState: () => formApi.getState().instance,
						setState: (newState) =>
							formApi.setState({
								instance: {
									...formApi.getState().instance,
									...newState,
								},
							}),
					},
				});

				Object.defineProperty(this, "instance", {
					value: instance,
					configurable: true,
					enumerable: true,
				});
				// Potential other approach:
				// This could be nessacery
				// instanceCache = instance
				// formApi.setState({ instance })

				return instance;
			} catch (error) {
				console.error("FormApi initialization failed:", error);
				throw error;
			}
		},
	});

	return formApi.getState().instance;
}

const formApi = createFormApi({
	fieldsShape: {
		[fnConfigKey]: {
			level: "object",
			constraints: { presence: "required", readonly: false },
			pathSegments: [],
			normalizedPathSegments: [],
			pathString: "",
			userMetadata: {},
			metadata: {},
			validation: {
				validate(value, options) {
					if (!value || typeof value !== "object") {
						throw new Error("Not implemented");
					}
					throw new Error("Not implemented");
				},
			},
		},
		foo: {
			[fnConfigKey]: {
				level: "string",
				constraints: { presence: "required", readonly: false },
				pathSegments: ["foo"] as const,
				normalizedPathSegments: ["foo"] as const,
				pathString: "foo",
				userMetadata: {},
				metadata: {},
				validation: {
					validate(value: unknown) {
						if (typeof value !== "string") {
							throw new Error("Not implemented");
						}
						throw new Error("Not implemented");
					},
				},
			},
		},
		bar: {
			[fnConfigKey]: {
				level: "number",
				constraints: { presence: "optional", readonly: false },
				pathSegments: ["bar"] as const,
				normalizedPathSegments: ["bar"] as const,
				pathString: "bar",
				userMetadata: {},
				metadata: {},
				validation: {
					validate(value: unknown) {
						if (typeof value !== "number") {
							throw new Error("Not implemented");
						}
						throw new Error("Not implemented");
					},
				},
			},
		},
		moo: {
			[fnConfigKey]: {
				level: "object",
				constraints: { presence: "required", readonly: false },
				pathSegments: ["moo"] as const,
				normalizedPathSegments: ["moo"] as const,
				pathString: "moo",
				userMetadata: {},
				metadata: {},
				validation: {
					validate(value: unknown) {
						if (!value || typeof value !== "object") {
							throw new Error("Not implemented");
						}
						throw new Error("Not implemented");
					},
				},
			},
			foo: {
				[fnConfigKey]: {
					level: "string",
					constraints: { presence: "required", readonly: false },
					pathSegments: ["moo", "foo"] as const,
					normalizedPathSegments: ["moo", "foo"] as const,
					pathString: "moo.foo",
					userMetadata: {},
					metadata: {},
					validation: {
						validate(value: unknown) {
							if (typeof value !== "string") {
								throw new Error("Not implemented");
							}
							throw new Error("Not implemented");
						},
					},
				},
			},
			bar: {
				[fnConfigKey]: {
					level: "number",
					constraints: { presence: "optional", readonly: false },
					pathSegments: ["moo", "bar"] as const,
					normalizedPathSegments: ["moo", "bar"] as const,
					pathString: "moo.bar",
					userMetadata: {},
					metadata: {},
					validation: {
						validate(value: unknown) {
							if (typeof value !== "number") {
								throw new Error("Not implemented");
							}
							throw new Error("Not implemented");
						},
					},
				},
			},
		},
	} satisfies FieldNode,
	initialValues: { foo: "initialFoo", bar: 42 },
	baseId: "form-manager",
});

formApi.fields.shape[fnConfigKey].pathSegments;
formApi.fields.shape.bar[fnConfigKey].pathSegments;
formApi.fields.shape.foo[fnConfigKey].pathSegments;
formApi.fields.errors.current["moo.bar"]?.pathIssuerSegments;
formApi.values.current.foo;
