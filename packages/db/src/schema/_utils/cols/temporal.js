import { timestamp } from "drizzle-orm/pg-core";

export const temporalCols = {
	// Business events (second precision sufficient)
	startsAt: () =>
		timestamp("starts_at", { precision: 3, withTimezone: true }).defaultNow(),
	endsAt: () => timestamp("ends_at", { precision: 3, withTimezone: true }),
	expiresAt: () =>
		timestamp("expires_at", { precision: 3, withTimezone: true }),

	// User activity (minute precision for analytics)
	lastAccessedAt: () =>
		timestamp("last_accessed_at", { precision: 3, withTimezone: true }),
	lastUsedAt: () =>
		timestamp("last_used_at", { precision: 3, withTimezone: true }),
	completedAt: () =>
		timestamp("completed_at", { precision: 3, withTimezone: true }),

	// ✅ AUDIT TRAIL: High precision for compliance
	audit: {
		createdAt: (name = "created_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		lastUpdatedAt: (name = "last_updated_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		deletedAt: (name = "deleted_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		deprecatedAt: (name = "deprecated_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ BUSINESS EVENTS: Second precision sufficient
	business: {
		startsAt: (name = "starts_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		transactionDate: (name = "transaction_date") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		endsAt: (name = "ends_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		expiresAt: (name = "expires_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		publishedAt: (name = "published_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		scheduledAt: (name = "scheduled_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		verifiedAt: (name = "verified_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		hiredAt: (name = "hired_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		terminatedAt: (name = "terminated_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		leaveOfAbsenceAt: (name = "leave_of_absence_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		appliedAt: (name = "applied_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		approvedAt: (name = "approved_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		rejectedAt: (name = "rejected_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		reviewedAt: (name = "reviewed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ FINANCIAL: High precision for financial events
	financial: {
		issuedAt: (name = "issued_at") =>
			timestamp(name, { precision: 3, withTimezone: true }).defaultNow(),
		paidAt: (name = "paid_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		refundedAt: (name = "refunded_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		validFrom: (name = "valid_from") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		validTo: (name = "valid_to") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ USER ACTIVITY: Minute precision for analytics
	activity: {
		// Q: lastAccessedAt vs lastActiveAt
		lastAccessedAt: (name = "last_accessed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		lastActiveAt: (name = "last_active_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		completedAt: (name = "completed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		lastSeenAt: (name = "last_seen_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		joinedAt: (name = "joined_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		invitedAt: (name = "invited_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		acceptedAt: (name = "accepted_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		declinedAt: (name = "declined_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},

	// ✅ SYSTEM EVENTS: Millisecond precision for debugging
	system: {
		processedAt: (name = "processed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		syncedAt: (name = "synced_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
		indexedAt: (name = "indexed_at") =>
			timestamp(name, { precision: 3, withTimezone: true }),
	},
};
