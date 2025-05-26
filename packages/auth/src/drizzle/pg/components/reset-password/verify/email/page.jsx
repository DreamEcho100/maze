import { cookies } from "next/headers";

import { validatePasswordResetSessionRequest } from "@acme/auth/utils/password-reset";

import { redirect } from "~/libs/i18n/navigation/custom";
import { PasswordResetEmailVerificationForm } from "./components";

export default async function AuthPasswordResetEmailVerificationPage() {
  const cookiesManager = await cookies();
  const { session } = await validatePasswordResetSessionRequest(
    (name) => cookiesManager.get(name)?.value,
    cookiesManager.set,
  );

  if (session === null) {
    return redirect("/auth/forgot-password");
  }
  if (session.emailVerifiedAt) {
    if (!session.twoFactorVerifiedAt) {
      return redirect("/auth/reset-password/2fa");
    }
    return redirect("/auth/reset-password");
  }

  return (
    <>
      <h1>Verify your email address</h1>
      <p>We sent an 8-digit code to {session.email}.</p>
      <PasswordResetEmailVerificationForm />
    </>
  );
}
