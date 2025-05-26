import CustomLink from "~/components/common/CustomLink";
import { getCurrentSession } from "~/libs/auth/utils/get-current-session";
import { redirect } from "~/libs/i18n/navigation/custom";
import { LoginForm } from "./components";

export default async function AuthLoginPage() {
  const { session, user } = await getCurrentSession();

  if (session !== null) {
    if (!user.emailVerifiedAt) {
      return redirect("/auth/verify-email");
    }
    if (user.twoFactorEnabledAt) {
      if (!user.twoFactorRegisteredAt) {
        return redirect("/auth/2fa/setup");
      }
      if (!session.twoFactorVerifiedAt) {
        return redirect("/auth/2fa");
      }
    }
    return redirect("/");
  }

  return (
    <>
      <h1>Sign in</h1>
      <LoginForm />
      <CustomLink href="/auth/signup">Create an account</CustomLink>
      <CustomLink href="/auth/forgot-password">Forgot password?</CustomLink>
    </>
  );
}
