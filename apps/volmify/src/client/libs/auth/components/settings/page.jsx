import { authConfig } from "@de100/auth/init";

import { Link } from "#client/components/link";
import { redirect } from "#i18n/server";
import { getCurrentSession } from "#server/libs/auth/get-current-session";
import {
	RecoveryCodeSection,
	UpdateEmailForm,
	UpdatePasswordForm,
	UpdateToggleIsTwoFactorEnabledForm,
} from "./components";

export default async function AuthSettingsPage() {
	const { session, user } = await getCurrentSession();

	if (session === null) {
		return redirect("/auth/login");
	}
	if (user.twoFactorEnabledAt && user.twoFactorRegisteredAt && !session.twoFactorVerifiedAt) {
		return redirect("/auth/2fa");
	}

	/** @type {string | null} */
	let recoveryCode = null;
	if (user.twoFactorRegisteredAt) {
		// recoveryCode = await getUserRecoveryCodeRepository(user.id);
		recoveryCode = await authConfig.providers.users.getOneRecoveryCode(user.id);
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

				<UpdateToggleIsTwoFactorEnabledForm twoFactorEnabledAt={!!user.twoFactorEnabledAt} />
			</main>
		</>
	);
}
