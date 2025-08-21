import { query } from "@solidjs/router";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { validateNonOrInvalidAuth } from "./validate-non-or-invalid-auth";

export const validateNonOrInvalidAuthQuery = query(
	validateNonOrInvalidAuth,
	"validated-non-or-invalid-auth",
);

export const getCurrentSessionQuery = query(
	/**
	 * @param {object} [props]
	 * @param {Headers} [props.reqHeaders] - Optional headers from the request, typically used to access cookies.
	 * @param {boolean} [props.canMutateCookies] - Indicates whether the function can modify cookies.
	 */
	(props) => {
		"use server";
		return getCurrentSession(props);
	},
	"get-current-session",
);
