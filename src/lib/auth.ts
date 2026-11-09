import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { Platform } from "react-native";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

export type AppRole = "student" | "admin";

export interface AuthAccount {
  id: string;
  name: string;
  email: string;
  role: AppRole;
  onboardingCompleted: boolean;
}

/** Shortest password the app accepts for email sign-up. */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Turns a value from the URL (?mode=admin) into a safe role.
 * Anything unknown becomes "student".
 */
export function parseRole(value: string | null | undefined): AppRole {
  return value === "admin" ? "admin" : "student";
}

/**
 * Reads OAuth parameters from either the URL query string or hash.
 */
function parseParams(url: string): Record<string, string> {
  const [base, hash = ""] = url.split("#");
  const query = base.split("?")[1] ?? "";
  const params: Record<string, string> = {};

  (query + "&" + hash).split("&").forEach((part) => {
    if (!part) return;

    const separator = part.indexOf("=");
    const key = separator >= 0 ? part.slice(0, separator) : part;
    const value = separator >= 0 ? part.slice(separator + 1) : "";

    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value);
    }
  });

  return params;
}

/**
 * Starts Google OAuth.
 *
 * Web: Supabase redirects the browser to /auth/callback.
 * Native: Expo WebBrowser opens the OAuth session.
 */
export async function signInWithGoogle(
  selectedRole: AppRole,
): Promise<AuthAccount | null> {
  const redirectTo =
    Platform.OS === "web"
      ? `${window.location.origin}/auth/callback?mode=${selectedRole}`
      : Linking.createURL(`auth/callback?mode=${selectedRole}`);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: Platform.OS !== "web",
      queryParams: {
        prompt: "select_account",
      },
    },
  });

  if (error) {
    throw error;
  }

  // On web, Supabase redirects the current browser automatically.
  // The callback screen finishes the sign-in.
  if (Platform.OS === "web") {
    return null;
  }

  if (!data.url) {
    throw new Error("Google sign-in did not return an authorization URL.");
  }

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);

  if (result.type !== "success") {
    return null;
  }

  return completeSignInFromUrl(result.url, selectedRole);
}

/**
 * Creates a STUDENT account with email and password.
 *
 * No role is sent. The database trigger creates the profile and gives it the
 * default role "student", and clients are not allowed to change roles.
 * Admin accounts are never created here.
 */
export async function signUpWithEmail(
  name: string,
  email: string,
  password: string,
): Promise<AuthAccount> {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanName) {
    throw new Error("Please enter your full name.");
  }

  if (!cleanEmail) {
    throw new Error("Please enter your email address.");
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(
      `Your password must be at least ${MIN_PASSWORD_LENGTH} characters.`,
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email: cleanEmail,
    password,
    options: {
      data: { full_name: cleanName },
    },
  });

  if (error) {
    throw error;
  }

  // With "Confirm email" turned off, Supabase returns a session right away.
  // If there is none, the project settings require email confirmation.
  if (!data.session) {
    throw new Error(
      "Your account was created, but it needs email confirmation. Check your inbox, then sign in.",
    );
  }

  const account = await getCurrentAccount();

  if (!account) {
    throw new Error("Your account was created, but no profile was found.");
  }

  return account;
}

/**
 * Signs in with email and password, then checks the REAL role in the
 * database against the role the person selected (same as Google sign-in).
 */
export async function signInWithEmail(
  email: string,
  password: string,
  selectedRole: AppRole,
): Promise<AuthAccount> {
  const cleanEmail = email.trim().toLowerCase();

  if (!cleanEmail || !password) {
    throw new Error("Please enter your email and password.");
  }

  const { error } = await supabase.auth.signInWithPassword({
    email: cleanEmail,
    password,
  });

  if (error) {
    throw error;
  }

  return validateAccountRole(selectedRole);
}

/**
 * Remembers sign-ins that are running or finished, keyed by URL.
 * An OAuth code works only once, and development builds can run the
 * callback effect twice. The second call gets the same result instead
 * of trying to use the code again.
 */
const signInAttempts = new Map<string, Promise<AuthAccount>>();

/**
 * Finishes a Google sign-in from the full redirect URL.
 * Used by the web callback screen and the native flow.
 */
export function completeSignInFromUrl(
  url: string,
  selectedRole: AppRole,
): Promise<AuthAccount> {
  const existing = signInAttempts.get(url);

  if (existing) {
    return existing;
  }

  const attempt = finishSignIn(url, selectedRole);
  signInAttempts.set(url, attempt);

  return attempt;
}

async function finishSignIn(
  url: string,
  selectedRole: AppRole,
): Promise<AuthAccount> {
  const params = parseParams(url);

  if (params.error_description || params.error) {
    throw new Error(
      params.error_description ??
        params.error ??
        "Google authentication failed.",
    );
  }

  if (params.code) {
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);

    if (error) {
      // The Supabase client may already have used the code when the page
      // loaded. If a session exists, continue; otherwise report the error.
      const { data } = await supabase.auth.getSession();

      if (!data.session) {
        throw error;
      }
    }

    return validateAccountRole(selectedRole);
  }

  if (params.access_token && params.refresh_token) {
    const { error } = await supabase.auth.setSession({
      access_token: params.access_token,
      refresh_token: params.refresh_token,
    });

    if (error) {
      throw error;
    }

    return validateAccountRole(selectedRole);
  }

  // The client may already have read the session from the URL itself.
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    return validateAccountRole(selectedRole);
  }

  throw new Error("Could not retrieve the Google authentication session.");
}

/**
 * Exchanges an OAuth authorization code for a Supabase session.
 * Kept for compatibility with existing imports.
 */
export async function completeGoogleSignIn(
  code: string,
  selectedRole: AppRole,
): Promise<AuthAccount> {
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    throw error;
  }

  return validateAccountRole(selectedRole);
}

/**
 * Checks the authenticated user's actual role in the database.
 * The selected role is never written to the database.
 */
async function validateAccountRole(
  selectedRole: AppRole,
): Promise<AuthAccount> {
  const account = await getCurrentAccount();

  if (!account) {
    throw new Error("Authentication succeeded, but no account was found.");
  }

  if (account.role !== selectedRole) {
    await supabase.auth.signOut();

    throw new Error(
      `This account is registered as ${account.role}. Please choose the ${account.role === "student" ? "Student" : "Admin"} login option.`,
    );
  }

  return account;
}

/**
 * Restores the current Supabase session and retrieves its profile.
 * Used when the application starts or refreshes.
 */
export async function getCurrentAccount(): Promise<AuthAccount | null> {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError) {
    throw sessionError;
  }

  if (!session) {
    return null;
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, email, full_name, role, onboarding_completed")
    .eq("id", session.user.id)
    .single();

  if (profileError) {
    throw new Error(
      `Could not retrieve your account profile: ${profileError.message}`,
    );
  }

  if (profile.role !== "student" && profile.role !== "admin") {
    throw new Error("Your account has an unsupported role.");
  }

  const metadata = session.user.user_metadata ?? {};

  return {
    id: profile.id,
    name:
      profile.full_name ??
      metadata.full_name ??
      metadata.name ??
      profile.email ??
      session.user.email ??
      "Student",
    email: profile.email ?? session.user.email ?? "",
    role: profile.role,
    onboardingCompleted: profile.onboarding_completed,
  };
}

/**
 * Signs out the current Supabase user.
 */
export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    throw error;
  }
}
