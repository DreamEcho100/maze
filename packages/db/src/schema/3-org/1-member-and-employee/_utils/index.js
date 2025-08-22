import { tEnum } from "../../../_utils/tables";

export const orgMemberTableName = "org_member";

export const orgMemberStatusEnum = tEnum(`${orgMemberTableName}_status`, [
	"active",
	// Q: What're the possible statuses of a member/user of an org?
	"banned",
	"pending",
	"none_but_invited_as_employee",
]);
