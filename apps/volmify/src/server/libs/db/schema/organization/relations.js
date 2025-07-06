import { relations } from "drizzle-orm";

import { user } from "../auth/schema.js";
import { country, currency, marketTemplate } from "../currency-and-market/schema.js";
import { productPrice, productZonePrice } from "../product/schema.js";
import { seoMetadata } from "../seo/schema.js";
import { systemPermission } from "../system/schema.js";
import { instructorOrganizationAffiliation, vendor } from "../vendor/schema.js";
import {
	organization,
	organizationCurrencySettings,
	organizationDepartment,
	organizationLocale,
	organizationMarket,
	organizationMarketCountry,
	organizationMarketTranslation,
	organizationMember,
	organizationMemberDepartment,
	organizationMemberInvitation,
	organizationMemberPermissionsGroup,
	organizationMemberTeam,
	organizationPermissionsGroup,
	organizationPermissionsGroupPermission,
	organizationTeam,
	organizationTeamDepartment,
	pricingZone,
	pricingZoneCountry,
} from "./schema.js";

export const organizationRelations = relations(organization, ({ many }) => ({
	members: many(organizationMember),
	teams: many(organizationTeam),
	departments: many(organizationDepartment),
	permissionGroups: many(organizationPermissionsGroup),
	locales: many(organizationLocale),
	currencySettings: many(organizationCurrencySettings),
	markets: many(organizationMarket),
	pricingZones: many(pricingZone),
	vendors: many(vendor),
	instructorAffiliations: many(instructorOrganizationAffiliation),
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
	memberInvitations: many(organizationMemberInvitation),
	memberDepartments: many(organizationMemberDepartment),
}));
// ✅ ADD: Department relations
export const organizationDepartmentRelations = relations(
	organizationDepartment,
	({ one, many }) => ({
		organization: one(organization, {
			fields: [organizationDepartment.organizationId],
			references: [organization.id],
		}),
		memberDepartments: many(organizationMemberDepartment),
		teamDepartments: many(organizationTeamDepartment),
		instructorAffiliations: many(instructorOrganizationAffiliation),
	}),
);
export const organizationTeamDepartmentRelations = relations(
	organizationTeamDepartment,
	({ one }) => ({
		team: one(organizationTeam, {
			fields: [organizationTeamDepartment.teamId],
			references: [organizationTeam.id],
		}),
		department: one(organizationDepartment, {
			fields: [organizationTeamDepartment.departmentId],
			references: [organizationDepartment.id],
		}),
	}),
);

export const organizationMemberDepartmentRelations = relations(
	organizationMemberDepartment,
	({ one }) => ({
		member: one(organizationMember, {
			fields: [organizationMemberDepartment.memberId],
			references: [organizationMember.id],
		}),
		department: one(organizationDepartment, {
			fields: [organizationMemberDepartment.departmentId],
			references: [organizationDepartment.id],
		}),
	}),
);
export const organizationTeamRelations = relations(organizationTeam, ({ one, many }) => ({
	organization: one(organization, {
		fields: [organizationTeam.organizationId],
		references: [organization.id],
	}),
	teamDepartments: many(organizationTeamDepartment),
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
		seoMetadata: one(seoMetadata, {
			fields: [organizationMarketTranslation.seoMetadataId],
			references: [seoMetadata.id],
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
