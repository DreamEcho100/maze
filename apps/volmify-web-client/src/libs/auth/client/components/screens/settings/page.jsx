import { getOneUserRecoveryCode } from "@de100/db/auth/init";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { getCurrentSession } from "#libs/auth/server/queries.js";
import { redirect } from "#libs/i18n/server/utils.ts";
import {
	RecoveryCodeSection,
	UpdateEmailForm,
	UpdatePasswordForm,
	UpdateToggleIsTwoFactorEnabledForm,
} from "./components";

export default async function AuthSettingsPage() {
	const { session, user } = await getCurrentSession({
		canMutateCookies: false,
	});

	if (!session) {
		throw redirect("/auth/login");
	}
	if (
		user.twoFactorEnabledAt &&
		user.twoFactorRegisteredAt &&
		!session.twoFactorVerifiedAt
	) {
		throw redirect("/auth/2fa");
	}

	/** @type {string | null} */
	let recoveryCode = null;
	if (user.twoFactorRegisteredAt) {
		// recoveryCode = await getUserRecoveryCodeRepository(user.id);
		recoveryCode = await getOneUserRecoveryCode(user.id);
	}

	return (
		<>
			<header>
				<Link href="/">Home</Link>
				<Link href="/settings">Settings</Link>
			</header>
			<main>
				<h1>Settings</h1>
				<section>
					<h2>Update email</h2>
					<p>Your email: {user.email}</p>
					<UpdateEmailForm />
				</section>
				<section>
					<h2>Update password</h2>
					<UpdatePasswordForm />
				</section>

				{user.twoFactorRegisteredAt && (
					<section>
						<h2>Update two-factor authentication</h2>
						<Link href="/auth/2fa/setup">Update</Link>
					</section>
				)}

				{recoveryCode && <RecoveryCodeSection recoveryCode={recoveryCode} />}

				<UpdateToggleIsTwoFactorEnabledForm
					twoFactorEnabledAt={!!user.twoFactorEnabledAt}
				/>
			</main>
		</>
	);
}
