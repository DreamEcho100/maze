/**
 * Volmify Multi-Tenant JWT Helper
 *
 * Provides utilities for creating tenant-aware JWT tokens for the Volmify platform.
 */

/**
 * Creates JWT custom claims for multi-tenant context
 * @param {Object} params
 * @param {string} params.userId - User ID
 * @param {string} params.tenantId - Tenant/organization ID (e.g., "acme-corp")
 * @param {string[]} params.roles - User roles within the tenant (e.g., ["admin", "product-manager"])
 * @param {string[]} params.permissions - Specific permissions (e.g., ["can_edit_products", "can_view_analytics"])
 * @param {string} [params.teamId] - Team ID within the organization
 * @param {Object} [params.tenantMetadata] - Additional tenant-specific metadata
 * @returns {Object} JWT custom claims
 */
export function createVolmifyJWTClaims({
	userId,
	tenantId,
	roles = [],
	permissions = [],
	teamId,
	tenantMetadata = {},
}) {
	return {
		// User context
		sub: userId, // Standard JWT subject claim
		userId, // Explicit user ID for clarity

		// Multi-tenant context
		tenantId,
		tenantSlug: tenantId, // For URL routing (tenant.volmify.com)

		// Access control
		roles,
		permissions,
		teamId,

		// Tenant-specific data
		tenantMetadata: {
			domain: tenantMetadata.domain, // Custom domain if any
			plan: tenantMetadata.plan, // "starter", "pro", "enterprise"
			features: tenantMetadata.features || [], // Enabled features
			...tenantMetadata,
		},

		// Platform metadata
		platform: "volmify",
		version: "1.0",

		// Security context
		scope: "marketplace", // Could be "marketplace", "admin", "api"
	};
}

/**
 * Validates if a JWT token has required permissions for a specific action
 * @param {Object} tokenPayload - Decoded JWT payload
 * @param {string} requiredPermission - Permission to check
 * @param {string} [requiredTenant] - Tenant ID to verify access to
 * @returns {boolean} Whether user has permission
 */
export function hasPermission(tokenPayload, requiredPermission, requiredTenant) {
	// Check tenant access if specified
	if (requiredTenant && tokenPayload.tenantId !== requiredTenant) {
		return false;
	}

	// Check permission
	return tokenPayload.permissions?.includes(requiredPermission) || false;
}

/**
 * Validates if a JWT token has required role for a specific action
 * @param {Object} tokenPayload - Decoded JWT payload
 * @param {string} requiredRole - Role to check
 * @param {string} [requiredTenant] - Tenant ID to verify access to
 * @returns {boolean} Whether user has role
 */
export function hasRole(tokenPayload, requiredRole, requiredTenant) {
	// Check tenant access if specified
	if (requiredTenant && tokenPayload.tenantId !== requiredTenant) {
		return false;
	}

	// Check role
	return tokenPayload.roles?.includes(requiredRole) ?? false;
}

/**
 * Example JWT payload structure for Volmify:
 * {
 *   "sub": "user_123",
 *   "userId": "user_123",
 *   "tenantId": "acme-corp",
 *   "tenantSlug": "acme-corp",
 *   "roles": ["admin", "product-manager"],
 *   "permissions": [
 *     "can_edit_products",
 *     "can_view_analytics",
 *     "can_manage_team",
 *     "can_process_payments"
 *   ],
 *   "teamId": "sales-team",
 *   "tenantMetadata": {
 *     "domain": "acme-corp.com",
 *     "plan": "enterprise",
 *     "features": ["white-label", "custom-domain", "advanced-analytics"]
 *   },
 *   "platform": "volmify",
 *   "version": "1.0",
 *   "scope": "marketplace",
 *   "iat": 1640995200,
 *   "exp": 1640995800,
 *   "aud": "volmify.com",
 *   "iss": "volmify.com"
 * }
 */
