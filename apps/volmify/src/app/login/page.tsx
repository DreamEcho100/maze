"use client"

import SignInForm from "#client/components/sign-in-form";
import SignUpForm from "#client/components/sign-up-form";
import { useState } from "react";


export default function LoginPage() {
  const [showSignIn, setShowSignIn] = useState(false);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
}
