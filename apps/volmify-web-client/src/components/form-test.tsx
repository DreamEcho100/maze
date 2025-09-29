import { type CreateFormApiProps, initFormApi } from "@de100/form-manager-core";
import type { FieldNode } from "@de100/form-manager-core/fields/shape/types";
import type { ValuesShape } from "@de100/form-manager-core/shared/types";
import type { FormApi } from "@de100/form-manager-core/types";
import { zodResolver } from "@de100/form-manager-resolver-zod";
import { createUniqueId } from "solid-js";
import { createStore } from "solid-js/store";
import { z } from "zod/v4";

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
	const baseId = props.baseId ?? `form-${createUniqueId()}`;

	// Potential other approach:
	// To cache the initial instance on the _stalled closure_
	// Still you will need to set the instance on the state manager
	// Or use a stable reference for the instance, for example using `useRef` in React
	// let instanceCache: any;

	const formApi = createStore<{
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
						getState: () => formApi[0].instance,
						setState: (newState) =>
							formApi[1]({
								instance: {
									...formApi[0].instance,
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

	return formApi[0].instance;
}

export default function FormTest() {
	const id = createUniqueId();
	const formApi = createFormApi({
		fieldsShape: zodResolver(
			z.object({
				// represent basic fields
				username: z
					.string()
					.min(2)
					.max(20)
					.regex(/^[a-zA-Z0-9_]+$/),
				password: z.string().min(6).max(100),
				rememberMe: z.boolean().optional(),
				// represent nested object
				profile: z.object({
					firstName: z.string().min(1).max(50),
					lastName: z.string().min(1).max(50),
					age: z.number().min(0).max(120).optional(),
				}),
				// represent array of objects
				contacts: z
					.array(
						z.object({
							type: z.enum(["email", "phone"]),
							value: z.string().min(5).max(100),
						}),
					)
					.min(1)
					.max(5),
				// represent record of objects
				settings: z
					.record(
						z.string().min(1),
						z.object({
							enabled: z.boolean(),
							value: z.string().min(1).max(100).optional(),
						}),
					)
					.optional(),
			}),
		).node,
		initialValues: (): {
			username: string;
			password: string;
			rememberMe?: boolean;
			profile: {
				firstName: string;
				lastName: string;
				age?: number;
			};
			contacts: { type: "email" | "phone"; value: string }[];
			settings?: Record<string, { enabled: boolean; value?: string }>;
		} => ({
			username: "initialUser",
			password: "initialPass",
			profile: {
				firstName: "John",
				lastName: "Doe",
			},
			contacts: [{ type: "email", value: "example@test.com" }],
			settings: {
				theme: { enabled: true, value: "dark" },
				notifications: { enabled: false },
			},
		}),
	});

	console.log("___ formApi", formApi);

	return <div>Form Test</div>;
}
