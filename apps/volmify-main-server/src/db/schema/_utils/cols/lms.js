import { decimal, integer } from "drizzle-orm/pg-core";

export const lmsCols = {
	// Progress tracking (frequent updates)
	progressPercentage: () =>
		decimal("progress_percentage", { precision: 5, scale: 2 }).default("0.00"),
	completionRate: () => decimal("completion_rate", { precision: 5, scale: 2 }),

	// Time tracking (minutes for analytics)
	estimatedDuration: () => integer("estimated_duration_minutes"),
	actualDuration: () => integer("actual_duration_minutes"),
	totalLearningTime: () => integer("total_learning_minutes").default(0),

	// Ratings and feedback (community quality)
	levelRating: () => integer("level_rating"), // 1-10 prerequisite level
	difficultyRating: () => integer("difficulty_rating"), // 1-10 complexity
	avgRating: () => decimal("avg_rating", { precision: 3, scale: 2 }).default("0.00"), // 0.00-10.00

	// Access control
	requiredAccessTier: () => integer("required_access_tier").default(1),
	maxAccessTier: () => integer("max_access_tier").default(10),
};
