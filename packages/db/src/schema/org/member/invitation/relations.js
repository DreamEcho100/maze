import { relations } from "drizzle-orm";
import { accountTransactionMemberContext } from "#schema/account/schema.js";
import { org } from "../../schema.js";
import { orgMember } from "../schema.js";
import { orgMemberInvitation } from "./schema.js";

export const orgMemberInvitationRelations = relations(orgMemberInvitation, ({ many, one }) => ({
	org: one(org, {
		fields: [orgMemberInvitation.orgId],
		references: [org.id],
	}),
	invitedByMember: one(orgMember, {
		fields: [orgMemberInvitation.invitedByMemberId],
		references: [orgMember.id],
		relationName: "org_member_invitation_sent",
	}),
	invitedMember: one(orgMember, {
		fields: [orgMemberInvitation.memberId],
		references: [orgMember.id],
		relationName: "org_member_invitation_received",
	}),
	accountTransactions: many(accountTransactionMemberContext),
	// member:
}));
