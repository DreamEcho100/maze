// @ts-nocheck

import {
	FORM_FIELD_TN_CONFIG,
	fieldNodeTokenEnum,
} from "@de100/form-manager-core/constants";
import z from "zod";
import type { ZodResolverFieldNodeResult } from "./index.ts";

const zodSchemaTest = z
	.object({
		stringField: z
			.string()
			.min(2)
			.max(5)
			.regex(/^[a-z]+$/),
		numberField: z.number().min(1).max(10).int(),
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
zodSchemaTestTrieResult.stringField[FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.stringField[FORM_FIELD_TN_CONFIG].type; // "string"
zodSchemaTestTrieResult.nestedObject.nestedNumber[FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.recordField[FORM_FIELD_TN_CONFIG].level; // "record"
zodSchemaTestTrieResult.recordField[fieldNodeTokenEnum.recordProperty][
	FORM_FIELD_TN_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.recordField[fieldNodeTokenEnum.recordProperty][
	FORM_FIELD_TN_CONFIG
].type; // "number"
zodSchemaTestTrieResult.recordOfObjects[FORM_FIELD_TN_CONFIG].level; // "record"
zodSchemaTestTrieResult.recordOfObjects[fieldNodeTokenEnum.recordProperty][
	FORM_FIELD_TN_CONFIG
].level; // "object"
zodSchemaTestTrieResult.recordOfObjects[fieldNodeTokenEnum.recordProperty].id[
	FORM_FIELD_TN_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.recordOfObjects[fieldNodeTokenEnum.recordProperty].id[
	FORM_FIELD_TN_CONFIG
].type; // "string"
zodSchemaTestTrieResult.arrayField[FORM_FIELD_TN_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayField[fieldNodeTokenEnum.arrayItem][
	FORM_FIELD_TN_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.arrayField[fieldNodeTokenEnum.arrayItem][
	FORM_FIELD_TN_CONFIG
].type; // "string"
zodSchemaTestTrieResult.arrayOfObjects[FORM_FIELD_TN_CONFIG].level; // "array"
zodSchemaTestTrieResult.arrayOfObjects[fieldNodeTokenEnum.arrayItem][
	FORM_FIELD_TN_CONFIG
].level; // "object"
zodSchemaTestTrieResult.arrayOfObjects[fieldNodeTokenEnum.arrayItem].value[
	FORM_FIELD_TN_CONFIG
].level; // "primitive"
zodSchemaTestTrieResult.arrayOfObjects[fieldNodeTokenEnum.arrayItem].value[
	FORM_FIELD_TN_CONFIG
].type; // "number"
zodSchemaTestTrieResult.tupleField[FORM_FIELD_TN_CONFIG].level; // "tuple"
zodSchemaTestTrieResult.tupleField[0][FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[0][FORM_FIELD_TN_CONFIG].type; // "string"
zodSchemaTestTrieResult.tupleField[1][FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.tupleField[1][FORM_FIELD_TN_CONFIG].type; // "number"
zodSchemaTestTrieResult.unionField[FORM_FIELD_TN_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[0].level;
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][0][
	fieldNodeTokenEnum.arrayItem
][FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][0][
	fieldNodeTokenEnum.arrayItem
][FORM_FIELD_TN_CONFIG].type; // "string"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][1][
	fieldNodeTokenEnum.arrayItem
][FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.unionOptionOn][1][
	fieldNodeTokenEnum.arrayItem
][FORM_FIELD_TN_CONFIG].type; // "number"
zodSchemaTestTrieResult.unionOfArrays[FORM_FIELD_TN_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfArrays[fieldNodeTokenEnum.arrayItem][0][
	fieldNodeTokenEnum.arrayItem
][FORM_FIELD_TN_CONFIG].level; // "primitive"
zodSchemaTestTrieResult.unionOfObjects.type[FORM_FIELD_TN_CONFIG].level;
zodSchemaTestTrieResult.unionOfObjects[FORM_FIELD_TN_CONFIG].level; // "union-root"
zodSchemaTestTrieResult.unionOfObjects[FORM_FIELD_TN_CONFIG].level; // "object"
// NOTE: discriminated Union is still in progress
const discriminatedUnionValueToOptionIndexTest =
	zodSchemaTestTrieResult.discriminatedUnion[
		FORM_FIELD_TN_CONFIG
	].constraints.tag.valueToOptionIndex.get("C"); // { type: "A", value: string }
const discriminatedUnionValuesTest = [
	...zodSchemaTestTrieResult.discriminatedUnion[FORM_FIELD_TN_CONFIG]
		.constraints.tag.values,
]; // ( "A" | "B" | "C" | undefined )[]

type T = Prettify<{ a: { b: { c: "d" } } } & { a: { b: { e: "f" } } }>;
type X = T["a"]["b"]["c"];
type Y = T["a"]["b"]["e"];
