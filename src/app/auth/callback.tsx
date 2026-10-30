import { Redirect } from "expo-router";

// The Google sign-in redirect lands here. The session is already handled in
// src/lib/auth.ts, so just send the user back to the home screen.
export default function AuthCallback() {
  return <Redirect href="/" />;
}
