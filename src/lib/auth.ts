import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

// Reads both ?query and #hash parameters from the redirect URL
function parseParams(url: string): Record<string, string> {
  const [base, hash = ""] = url.split("#");
  const query = base.split("?")[1] ?? "";
  const out: Record<string, string> = {};
  (query + "&" + hash).split("&").forEach((kv) => {
    const [k, v] = kv.split("=");
    if (k) out[decodeURIComponent(k)] = decodeURIComponent(v ?? "");
  });
  return out;
}

export async function signInWithGoogle() {
  const redirectTo = Linking.createURL("auth/callback");

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: { prompt: "select_account" },
    },
  });
  if (error) throw error;

  const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (res.type !== "success") return null; // user cancelled

  const p = parseParams(res.url);
  if (p.code) {
    const { error: e } = await supabase.auth.exchangeCodeForSession(p.code);
    if (e) throw e;
  } else if (p.access_token && p.refresh_token) {
    const { error: e } = await supabase.auth.setSession({
      access_token: p.access_token,
      refresh_token: p.refresh_token,
    });
    if (e) throw e;
  }

  return (await supabase.auth.getSession()).data.session;
}

export const signOut = () => supabase.auth.signOut();
