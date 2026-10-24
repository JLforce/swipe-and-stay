import { supabase } from "./supabase";

// One place to call every Edge Function
export async function callFn<T>(name: string, body: object = {}): Promise<T> {
  const { data, error } = await supabase.functions.invoke(name, { body });
  if (error) throw new Error(error.message ?? "Request failed");
  if (data?.error) throw new Error(data.error.message ?? "Request failed");
  return data as T;
}
