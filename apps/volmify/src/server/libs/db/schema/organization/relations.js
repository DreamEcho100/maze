import { relations } from "drizzle-orm";

import { user } from "../auth/schema.js";
import { country, currency, marketTemplate } from "../currency-and-market/schema.js";
import { productZonePrice } from "../product/schema.js";
import { systemPermission } from "../system/schema.js";
import {
	organization,
	organizationCurrencySettings,
	organizationLocale,
	organizationMarket,
	organizationMarketCountry,
	organizationMarketTranslation,
	organizationMember,
	organizationMemberInvitation,
	organizationMemberPermissionsGroup,
	organizationMemberTeam,
	organizationPermissionsGroup,
	organizationPermissionsGroupPermission,
	organizationTeam,
	pricingZone,
	pricingZoneCountry,
} from "./schema.js";

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(organizationMember),
	teams: many(organizationTeam),
	permissionGroups: many(organizationPermissionsGroup),
	locales: many(organizationLocale),
	currencySettings: many(organizationCurrencySettings),
	markets: many(organizationMarket),
	pricingZones: many(pricingZone),
}));
export const organizationMemberRelations = relations(organizationMember, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationMember.organizationId],
		references: [organization.id],
	}),
	user: one(user, {
		fields: [organizationMember.userId],
		references: [user.id],
	}),
	// ✅ New: Multiple teams via junction table
	memberTeams: many(organizationMemberTeam),
	memberGroups: many(organizationMemberPermissionsGroup),
	memberInvitations: many(organizationMemberInvitation, {
		relationName: "member_invitation",
	}),
}));
export const organizationTeamRelations = relations(organizationTeam, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationTeam.organizationId],
		references: [organization.id],
	}),
	memberTeams: many(organizationMemberTeam), // Via junction table
}));
export const organizationMemberTeamRelations = relations(organizationMemberTeam, ({ one }) => ({
	member: one(organizationMember, {
		fields: [organizationMemberTeam.memberId],
		references: [organizationMember.id],
	}),
	team: one(organizationTeam, {
		fields: [organizationMemberTeam.teamId],
		references: [organizationTeam.id],
	}),
}));
export const organizationMemberPermissionsGroupRelations = relations(
	organizationMemberPermissionsGroup,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberPermissionsGroup.memberId],
			references: [organizationMember.id],
		}),
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationMemberPermissionsGroup.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
	}),
);
export const organizationPermissionsGroupRelations = relations(
	organizationPermissionsGroup,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationPermissionsGroup.organizationId],
			references: [organization.id],
		}),
		groupPermissions: many(organizationPermissionsGroupPermission),
		memberGroups: many(organizationMemberPermissionsGroup),
	}),
);
export const organizationPermissionsGroupPermissionRelations = relations(
	organizationPermissionsGroupPermission,
	({ one }) => ({
		permissionGroup: one(organizationPermissionsGroup, {
			fields: [organizationPermissionsGroupPermission.permissionsGroupId],
			references: [organizationPermissionsGroup.id],
		}),
		systemPermission: one(systemPermission, {
			fields: [organizationPermissionsGroupPermission.systemPermissionId],
			references: [systemPermission.id],
		}),
	}),
);
export const organizationMemberInvitationRelations = relations(
	organizationMemberInvitation,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationMemberInvitation.organizationId],
			references: [organization.id],
		}),
		invitedByUser: one(user, {
			fields: [organizationMemberInvitation.invitedByUserId],
			references: [user.id],
		}),
		member: one(organizationMember, {
			fields: [organizationMemberInvitation.memberId],
			references: [organizationMember.id],
			relationName: "member_invitation",
		}),
	}),
);

// Add these new relations:
export const organizationLocaleRelations = relations(organizationLocale, ({ one }) => ({
	organization: one(organization, {
		fields: [organizationLocale.organizationId],
		references: [organization.id],
	}),
}));

export const organizationCurrencySettingsRelations = relations(
	organizationCurrencySettings,
	({ one }) => ({
		organization: one(organization, {
			fields: [organizationCurrencySettings.organizationId],
			references: [organization.id],
		}),
		currency: one(currency, {
			fields: [organizationCurrencySettings.currencyCode],
			references: [currency.code],
		}),
	}),
);

// Organization Market Relations
export const organizationMarketRelations = relations(organizationMarket, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationMarket.organizationId],
		references: [organization.id],
	}),
	template: one(marketTemplate, {
		fields: [organizationMarket.templateId],
		references: [marketTemplate.id],
	}),
	currency: one(currency, {
		fields: [organizationMarket.currencyCode],
		references: [currency.code],
	}),
	countries: many(organizationMarketCountry),
	translations: many(organizationMarketTranslation),
	productPrices: many(productPrice),
}));

export const organizationMarketCountryRelations = relations(
	organizationMarketCountry,
	({ one }) => ({
		organizationMarket: one(organizationMarket, {
			fields: [organizationMarketCountry.organizationMarketId],
			references: [organizationMarket.id],
		}),
		country: one(country, {
			fields: [organizationMarketCountry.countryId],
			references: [country.id],
		}),
	}),
);

export const organizationMarketTranslationRelations = relations(
	organizationMarketTranslation,
	({ one }) => ({
		organizationMarket: one(organizationMarket, {
			fields: [organizationMarketTranslation.organizationMarketId],
			references: [organizationMarket.id],
		}),
		organization: one(organization, {
			fields: [organizationMarketTranslation.organizationId],
			references: [organization.id],
		}),
	}),
);

export const pricingZoneRelations = relations(pricingZone, ({ one, many }) => ({
	organization: one(organization, {
		fields: [pricingZone.organizationId],
		references: [organization.id],
	}),
	currency: one(currency, {
		fields: [pricingZone.currencyCode],
		references: [currency.code],
	}),
	countries: many(pricingZoneCountry),
	productZonePrices: many(productZonePrice),
}));

export const pricingZoneCountryRelations = relations(pricingZoneCountry, ({ one }) => ({
	zone: one(pricingZone, {
		fields: [pricingZoneCountry.zoneId],
		references: [pricingZone.id],
	}),
	country: one(country, {
		fields: [pricingZoneCountry.countryId],
		references: [country.id],
	}),
}));
