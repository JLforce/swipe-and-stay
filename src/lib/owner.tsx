import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Listing } from "../data/mockData";
import { subscribeToInbox } from "./chat";
import {
  createListing,
  deleteListing,
  fetchMyListings,
  setListingActive,
  updateListing,
  type ListingDraft,
} from "./listings";
import { useApp } from "./store";
import { supabase } from "./supabase";

export interface OwnerStats {
  totalListings: number;
  activeListings: number;
  swipes: number;
  saves: number;
  interestedStudents: number;
  newInquiries: number;
}

const EMPTY_STATS: OwnerStats = {
  totalListings: 0,
  activeListings: 0,
  swipes: 0,
  saves: 0,
  interestedStudents: 0,
  newInquiries: 0,
};

interface OwnerState {
  listings: Listing[];
  stats: OwnerStats;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  saveListing: (draft: ListingDraft, id?: string) => Promise<Listing>;
  setActive: (id: string, active: boolean) => Promise<void>;
  removeListing: (id: string) => Promise<void>;
}

const Ctx = createContext<OwnerState | null>(null);

export function useOwner() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useOwner must be used inside <OwnerProvider>");
  return v;
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

async function fetchStats(): Promise<OwnerStats> {
  const { data, error } = await supabase.rpc("owner_dashboard_stats");
  if (error) throw new Error(error.message);

  const s = (data ?? {}) as Record<string, unknown>;
  return {
    totalListings: toNumber(s.total_listings),
    activeListings: toNumber(s.active_listings),
    swipes: toNumber(s.swipes),
    saves: toNumber(s.saves),
    interestedStudents: toNumber(s.interested_students),
    newInquiries: toNumber(s.new_inquiries),
  };
}

export function OwnerProvider({ children }: { children: ReactNode }) {
  const { account } = useApp();
  const ownerId = account?.id ?? null;
  const [listings, setListings] = useState<Listing[]>([]);
  const [stats, setStats] = useState<OwnerStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!ownerId) return;
    try {
      const [mine, counts] = await Promise.all([
        fetchMyListings(ownerId),
        fetchStats(),
      ]);
      setListings(mine);
      setStats(counts);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your dashboard.");
    } finally {
      setLoading(false);
    }
  }, [ownerId]);

  // First load. State is set inside the promise callbacks, not in the effect body.
  useEffect(() => {
    if (!ownerId) return;
    let active = true;

    Promise.all([fetchMyListings(ownerId), fetchStats()])
      .then(([mine, counts]) => {
        if (!active) return;
        setListings(mine);
        setStats(counts);
        setError(null);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : "Could not load your dashboard.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [ownerId]);

  // A student message changes "new inquiries"; refresh the numbers when one arrives.
  useEffect(() => {
    if (!ownerId) return;
    return subscribeToInbox(() => {
      fetchStats()
        .then(setStats)
        .catch(() => undefined);
    });
  }, [ownerId]);

  const saveListing = useCallback(
    async (draft: ListingDraft, id?: string) => {
      const saved = id ? await updateListing(id, draft) : await createListing(draft);
      setListings((cur) =>
        id ? cur.map((l) => (l.id === id ? saved : l)) : [saved, ...cur],
      );
      void fetchStats().then(setStats).catch(() => undefined);
      return saved;
    },
    [],
  );

  const setActive = useCallback(async (id: string, active: boolean) => {
    const saved = await setListingActive(id, active);
    setListings((cur) => cur.map((l) => (l.id === id ? saved : l)));
    void fetchStats().then(setStats).catch(() => undefined);
  }, []);

  const removeListing = useCallback(async (id: string) => {
    await deleteListing(id);
    setListings((cur) => cur.filter((l) => l.id !== id));
    void fetchStats().then(setStats).catch(() => undefined);
  }, []);

  const value = useMemo<OwnerState>(
    () => ({ listings, stats, loading, error, refresh, saveListing, setActive, removeListing }),
    [listings, stats, loading, error, refresh, saveListing, setActive, removeListing],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
