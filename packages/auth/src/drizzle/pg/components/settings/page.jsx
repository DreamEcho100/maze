import Link from "next/link";

import { getUserRecoveryCodeRepository } from "@de100/auth/repositories/users";

import CustomLink from "~/components/common/CustomLink";
import { getCurrentSession } from "~/libs/auth/utils/get-current-session";
import { redirect } from "~/libs/i18n/navigation/custom";
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
		recoveryCode = await getUserRecoveryCodeRepository(user.id);
	}

	return (
		<>
			<header>
				<CustomLink
					classVariants={{
						px: null,
						py: null,
						theme: null,
						rounded: null,
						size: null,
						layout: null,
						w: null,
					}}
					href="/">
					Home
				</CustomLink>
				<CustomLink
					classVariants={{
						px: null,
						py: null,
						theme: null,
						rounded: null,
						size: null,
						layout: null,
						w: null,
					}}
					href="/settings">
					Settings
				</CustomLink>
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
						<CustomLink
							classVariants={{
								px: null,
								py: null,
								theme: null,
								rounded: null,
								size: null,
								layout: null,
								w: null,
							}}
							href="/auth/2fa/setup">
							Update
						</CustomLink>
					</section>
				)}

				{recoveryCode && <RecoveryCodeSection recoveryCode={recoveryCode} />}

				<UpdateToggleIsTwoFactorEnabledForm twoFactorEnabledAt={!!user.twoFactorEnabledAt} />
			</main>
		</>
	);
}
