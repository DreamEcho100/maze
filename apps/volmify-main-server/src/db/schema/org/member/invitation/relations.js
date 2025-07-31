import { relations } from "drizzle-orm";
import { accountTransactionMemberContext } from "#db/schema/account/schema.js";
import { org } from "../../schema";
import { orgMember } from "../schema";
import { orgMemberInvitation } from "./schema";

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
