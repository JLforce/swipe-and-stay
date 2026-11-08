import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSyncExternalStore } from "react";
import type { Listing } from "../data/mockData";

export type Boarder = { id: string; name: string; room: string; rent: string; paid: boolean };

export type ChatMessage = { id: string; from: "student" | "landlord"; text: string; at: number };
export type Conversation = {
  id: string;
  studentName: string;
  listingTitle: string;
  unread: number;
  messages: ChatMessage[];
};

export type LandlordProfile = { name: string; contact: string };

// Saves to the phone's storage, so data survives app reloads.
// TODO(database): replace load() and set() below with Supabase reads/writes.
function createStore<T>(key: string, initial: T) {
  let value = initial;
  let ready = false;
  let started = false;
  const subs = new Set<() => void>();
  const emit = () => subs.forEach((f) => f());

  async function load() {
    if (started) return;
    started = true;
    try {
      const raw = await AsyncStorage.getItem(key);
      if (raw) value = JSON.parse(raw) as T;
    } catch {}
    ready = true;
    emit();
  }

  function set(u: T | ((p: T) => T)) {
    value = typeof u === "function" ? (u as (p: T) => T)(value) : u;
    emit();
    AsyncStorage.setItem(key, JSON.stringify(value)).catch(() => {});
  }

  function use(): [T, typeof set, boolean] {
    const subscribe = (cb: () => void) => {
      subs.add(cb);
      load();
      return () => {
        subs.delete(cb);
      };
    };
    const v = useSyncExternalStore(subscribe, () => value);
    const r = useSyncExternalStore(subscribe, () => ready);
    return [v, set, r];
  }

  return { use, set };
}

export const myListingsStore = createStore<Listing[]>("landlord.listings.v1", []);
export const boardersStore = createStore<Boarder[]>("landlord.boarders.v1", []);
export const conversationsStore = createStore<Conversation[]>("landlord.conversations.v1", []);
export const landlordProfileStore = createStore<LandlordProfile>("landlord.profile.v1", { name: "", contact: "" });