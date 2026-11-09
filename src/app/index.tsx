import { Redirect } from "expo-router";
import { useApp } from "../lib/store";

export default function Index() {
  const { account, onboarded } = useApp();
  if (!account) return <Redirect href="/intro" />;
  if (account.role === "admin") return <Redirect href="/overview" />;
  return <Redirect href={onboarded ? "/discover" : "/setup"} />;
}
