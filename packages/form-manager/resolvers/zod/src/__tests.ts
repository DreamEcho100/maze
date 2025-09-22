// @ts-nocheck

import {
	fieldNodeTokenEnum,
	fnConfigKey,
} from "@de100/form-manager-core/constants";
import z from "zod";
import type { ZodResolverFieldNodeResult } from "./types";

// import type { ZodResolverFieldNodeResult } from "./index.ts";

const zodSchemaTest = z
	.object({
		stringField: z
			.string()
			.min(2)
			.max(5)
			.regex(/^[a-z]+$/),
		literalStringField: z.literal("literal-string"),
		numberField: z.number().min(1).max(10).int(),
		literalNumberField: z.literal(0),
		booleanField: z.boolean().default(true),
		dateField: z.date().min(new Date("2020-01-01")).max(new Date("2030-12-31")),
		nestedObject: z.object({
			nestedString: z.string().optional(),
			nestedNumber: z.number().nullable(),
		}),
		recordField: z.record(z.string(), z.number().min(0)),
		recordOfObjects: z.record(
			z.string().min(1),
			z.object({
				id: z.uuid({ version: "v7" }),
				value: z.string().min(1),
			}),
		),
		arrayField: z.array(z.string().min(1)).min(1).max(3),
		arrayOfObjects: z.array(
			z.object({
				id: z.uuid({ version: "v7" }),
				value: z.number().positive(),
			}),
		),
		tupleField: z.tuple([
			z.string(),
			z.number().optional(),
			z.boolean().default(false),
		]),
		unionField: z.union([z.string(), z.number(), z.boolean()]),
		unionOfObjects: z.union([
			z.object({ type: z.literal("A"), value: z.string() }),
			z.object({ type: z.literal("B"), value: z.number() }),
			z.object({ type: z.literal("C"), value: z.boolean() }),
		]),
		unionOfArrays: z.union([z.array(z.string()), z.array(z.number())]),
		unionOfTuples: z.union([
			z.tuple([z.string(), z.number()]),
			z.tuple([z.boolean(), z.string()]),
		]),
		unionOfDifferent: z.union([z.string(), z.number()]),
		discriminatedUnion: z.discriminatedUnion("type", [
			z.object({ type: z.literal("A"), value: z.string() }),
			z.object({ type: z.literal("B"), value: z.number() }),
			z.object({ type: z.literal("C"), value: z.boolean() }),
			z.object({ type: z.undefined(), value: z.null() }),
		]),
	})
	.optional();
type ZodSchemaTest = typeof zodSchemaTest;
type ZodSchemaTestTrieResult = ZodResolverFieldNodeResult<
	ZodSchemaTest,
	ZodSchemaTest
>;
//^?
const zodSchemaTestTrieResult = {} as ZodSchemaTestTrieResult;
zodSchemaTestTrieResult.stringField[fnConfigKey].level; // "string"
zodSchemaTestTrieResult.literalStringField[fnConfigKey].level; // "string"
zodSchemaTestTrieResult.numberField[fnConfigKey].level; // "number"
zodSchemaTestTrieResult.literalNumberField[fnConfigKey].level; // "number"
zodSchemaTestTrieResult.nestedObject.nestedNumber[fnConfigKey].level; // "primitive"
zodSchemaTestTrieResult.recordField[fnConfigKey].level; // "record"
zodSchemaTestTrieResult.recordField[fieldNodeTokenEnum.recordProperty][
	fnConfigKey
].level; // "number"
zodSchemaTestTrieResult.recordOfObjects[fnConfigKey].level; // "record"
zodSchemaTestTrieResult.recordOfObjects[fieldNodeTokenEnum.recordProperty][
	fnConfigKey
].level; // "object"
zodSchemaTestTrieResult.recordOfObjects[fieldNodeTokenEnum.recordProperty].id[
	fnConfigKey
].level; // "string"
zodSchemaTestTrieResult.arrayField[fnConfigKey].level; // "array"
zodSchemaTestTrieResult.arrayField[fieldNodeTokenEnum.arrayItem][fnConfigKey]
	.level; // "string"
zodSchemaTestTrieResult.arrayOfObjects[fnConfigKey].level; // "array"
zodSchemaTestTrieResult.arrayOfObjects[fieldNodeTokenEnum.arrayItem][
	fnConfigKey
].level; // "object"
zodSchemaTestTrieResult.arrayOfObjects[fieldNodeTokenEnum.arrayItem].value[
	fnConfigKey
].level; // "number"
zodSchemaTestTrieResult.tupleField[fnConfigKey].level; // "tuple"
zodSchemaTestTrieResult.tupleField[0][fnConfigKey].level; // "string"
zodSchemaTestTrieResult.tupleField[1][fnConfigKey].level; // "number"
zodSchemaTestTrieResult.unionField[fnConfigKey].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[0].level;
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][0][
	fieldNodeTokenEnum.arrayItem
][fnConfigKey].level; // "string"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][1][
	fieldNodeTokenEnum.arrayItem
][fnConfigKey].level; // "number"
zodSchemaTestTrieResult.unionOfArrays[fnConfigKey].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.arrayItem][0][
	fieldNodeTokenEnum.arrayItem
][fnConfigKey].level; // "primitive"
zodSchemaTestTrieResult.unionOfObjects.type[fnConfigKey].level;
zodSchemaTestTrieResult.unionOfObjects[fnConfigKey].level; // "union-root"
zodSchemaTestTrieResult.unionOfObjects[fnConfigKey].level; // "object"
// NOTE: discriminated Union is still in progress
const discriminatedUnionValueToOptionIndexTest =
	zodSchemaTestTrieResult.discriminatedUnion[
		fnConfigKey
	].constraints.tag?.valueToOptionIndex.get("C"); // { type: "A", value: string }
const discriminatedUnionValuesTest = [
	...zodSchemaTestTrieResult.discriminatedUnion[fnConfigKey].constraints.tag
		.values,
]; // ( "A" | "B" | "C" | undefined )[]

// type T = Prettify<{ a: { b: { c: "d" } } } & { a: { b: { e: "f" } } }>;
// type X = T["a"]["b"]["c"];
// type Y = T["a"]["b"]["e"];

z.discriminatedUnion("type", [
	z.object({ type: z.literal("A"), value: z.string() }),
	z.object({ type: z.literal("B"), value: z.number() }),
	z.object({ type: z.literal("C"), value: z.boolean() }),
]);
