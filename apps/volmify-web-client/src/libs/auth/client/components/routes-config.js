export const authRoutesConfig = /** @type {const} */ ({
	login: {
		path: "/auth/login",
		title: "Login",
	},
	register: {
		path: "/auth/register",
		title: "Register",
	},
	verifyEmail: {
		path: "/auth/verify-email",
		title: "Verify email",
	},
	twoFactorSetup: {
		path: "/auth/2fa/setup",
		title: "2FA Setup",
	},
	twoFactor: {
		path: "/auth/2fa",
		title: "Two Factor Authentication",
	},
});
