import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { CAMPUSES } from "../constants/housing";
import {
  INITIAL_NOTIFICATIONS,
  LISTINGS,
  type AppNotification,
  type Listing,
} from "../data/mockData";
import {
  getCurrentAccount,
  signOut as supabaseSignOut,
  type AuthAccount,
} from "./auth";
import {
  DEFAULT_WEIGHTS,
  FACTORS,
  factorScores,
  matchScore,
  updateWeights,
  type Factor,
  type Prefs,
  type Weights,
} from "./matching";
import { supabase } from "./supabase";

const FACTOR_NAME: Record<Factor, string> = {
  price: "price",
  distance: "distance",
  amenities: "amenities",
  type: "housing type",
};

export interface Swipe {
  listingId: string;
  direction: "left" | "right";
  at: number;
}

const DEFAULT_PREFS: Prefs = {
  campus: CAMPUSES[1]!,
  budgetMin: 5000,
  budgetMax: 10000,
  housingType: "Any",
  roommate: "any",
  desiredAmenities: [],
};

interface AppState {
  account: AuthAccount | null;
  authLoading: boolean; // true until the first session check has finished
  onboarded: boolean;
  prefs: Prefs;
  weights: Weights;
  listings: Listing[];
  swipes: Swipe[];
  likedIds: string[]; // newest first
  notifications: AppNotification[];
  unreadCount: number;
  toast: string | null;
  signOut: () => void;
  savePrefs: (p: Prefs) => void;
  swipe: (l: Listing, dir: "left" | "right") => void;
  undoSwipe: () => void;
  resetSwipes: () => void;
  unlike: (id: string) => void;
  like: (id: string) => void;
  upsertListing: (l: Listing) => void;
  toggleActive: (id: string) => void;
  markAllRead: () => void;
  notify: (n: Omit<AppNotification, "id" | "time" | "read">) => void;
  flash: (msg: string) => void;
}

const Ctx = createContext<AppState | null>(null);

export function useApp() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApp must be used inside <AppProvider>");
  return v;
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<AuthAccount | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [onboarded, setOnboarded] = useState(false);
  const [prefs, setPrefs] = useState<Prefs>(DEFAULT_PREFS);
  const [weights, setWeights] = useState<Weights>(DEFAULT_WEIGHTS);
  const [listings, setListings] = useState<Listing[]>(LISTINGS);
  const [swipes, setSwipes] = useState<Swipe[]>([]);
  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>(
    INITIAL_NOTIFICATIONS,
  );
  const [toast, setToast] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Remembers who is signed in so repeated sign-in events don't refetch the profile.
  const accountIdRef = useRef<string | null>(null);

  const flash = useCallback((msg: string) => {
    setToast(msg);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setToast(null), 1800);
  }, []);

  const pushNote = useCallback(
    (n: Omit<AppNotification, "id" | "time" | "read">) => {
      setNotifications((cur) => [
        {
          ...n,
          id: `n${Date.now()}${cur.length}`,
          time: "Just now",
          read: false,
        },
        ...cur,
      ]);
    },
    [],
  );

  // Stores the signed-in account that came from Supabase.
  const applyAccount = useCallback((acc: AuthAccount) => {
    accountIdRef.current = acc.id;
    setAccount(acc);
    setOnboarded(acc.onboardingCompleted);
  }, []);

  // Clears everything that belongs to the signed-in user.
  const clearSession = useCallback(() => {
    accountIdRef.current = null;
    setAccount(null);
    setSwipes([]);
    setLikedIds([]);
    setWeights(DEFAULT_WEIGHTS);
    setOnboarded(false);
  }, []);

  // Restore the saved session on start, then follow sign-in / sign-out events.
  useEffect(() => {
    let active = true;

    getCurrentAccount()
      .then((acc) => {
        if (!active) return;
        if (acc) applyAccount(acc);
        else clearSession();
      })
      .catch((e: unknown) => {
        console.warn("Could not restore the session", e);
        if (active) clearSession();
      })
      .finally(() => {
        if (active) setAuthLoading(false);
      });

    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // Do not await Supabase calls inside this callback (it can deadlock);
      // schedule the work for later instead.
      if (event === "SIGNED_OUT") {
        setTimeout(() => {
          if (!active) return;
          clearSession();
          setAuthLoading(false);
        }, 0);
        return;
      }
      if (event === "SIGNED_IN" || event === "USER_UPDATED") {
        if (event === "SIGNED_IN" && session?.user.id === accountIdRef.current)
          return;
        // Show the loading screen until the profile arrives, so guards don't redirect too early.
        if (event === "SIGNED_IN") setAuthLoading(true);
        setTimeout(() => {
          getCurrentAccount()
            .then((acc) => {
              if (active && acc) applyAccount(acc);
            })
            .catch((e: unknown) =>
              console.warn("Could not load the profile", e),
            )
            .finally(() => {
              if (active) setAuthLoading(false);
            });
        }, 0);
      }
    });

    return () => {
      active = false;
      data.subscription.unsubscribe();
    };
  }, [applyAccount, clearSession]);

  const swipe = useCallback(
    (l: Listing, dir: "left" | "right") => {
      const nextWeights = updateWeights(weights, factorScores(l, prefs), dir);
      const count = swipes.length + 1;
      setSwipes((s) => [
        ...s,
        { listingId: l.id, direction: dir, at: Date.now() },
      ]);
      setWeights(nextWeights);
      if (dir === "right")
        setLikedIds((ids) => [l.id, ...ids.filter((x) => x !== l.id)]);
      // Every 5th swipe, tell the student what the matcher has learned.
      if (count % 5 === 0) {
        const top = FACTORS.reduce((a, b) =>
          nextWeights[b] > nextWeights[a] ? b : a,
        );
        pushNote({
          kind: "rerank",
          title: "Re-ranking complete",
          body: `After your last 5 swipes, ${FACTOR_NAME[top]} matters most to you (${Math.round(nextWeights[top] * 100)}%).`,
        });
      }
    },
    [prefs, weights, swipes.length, pushNote],
  );

  const undoSwipe = useCallback(() => {
    setSwipes((s) => {
      const last = s[s.length - 1];
      if (!last) return s;
      if (last.direction === "right")
        setLikedIds((ids) => ids.filter((x) => x !== last.listingId));
      return s.slice(0, -1);
    });
  }, []);

  const value = useMemo<AppState>(
    () => ({
      account,
      authLoading,
      onboarded,
      prefs,
      weights,
      listings,
      swipes,
      likedIds,
      notifications,
      unreadCount: notifications.filter((n) => !n.read).length,
      toast,
      signOut: () => {
        clearSession();
        supabaseSignOut().catch((e: unknown) =>
          console.warn("Supabase sign-out failed", e),
        );
      },
      savePrefs: (p) => {
        setPrefs(p);
        setOnboarded(true);
        if (!account) return;
        // Remember in the database that this student finished onboarding,
        // so the next sign-in goes straight to /discover.
        supabase
          .from("profiles")
          .update({ onboarding_completed: true })
          .eq("id", account.id)
          .then(({ error }) => {
            if (error) {
              console.warn("Could not save onboarding status", error);
              setOnboarded(false);
              flash("Could not save your preferences. Please try again.");
            }
          });
      },
      swipe,
      undoSwipe,
      resetSwipes: () => setSwipes([]),
      unlike: (id) => setLikedIds((ids) => ids.filter((x) => x !== id)),
      like: (id) => setLikedIds((ids) => [id, ...ids.filter((x) => x !== id)]),
      upsertListing: (l) => {
        const isNew = !listings.some((x) => x.id === l.id);
        setListings((cur) =>
          isNew ? [l, ...cur] : cur.map((x) => (x.id === l.id ? l : x)),
        );
        if (isNew && l.active && matchScore(l, prefs, weights) >= 75) {
          pushNote({
            kind: "match",
            title: "New listing matches your preferences",
            body: `${l.title} was just added.`,
          });
        }
      },
      toggleActive: (id) => {
        const target = listings.find((x) => x.id === id);
        if (!target) return;
        setListings((cur) =>
          cur.map((x) => (x.id === id ? { ...x, active: !x.active } : x)),
        );
        if (target.active && likedIds.includes(id)) {
          pushNote({
            kind: "deactivated",
            title: "A saved listing is no longer available",
            body: `${target.title} was deactivated by the admin.`,
          });
        }
      },
      markAllRead: () =>
        setNotifications((cur) => cur.map((n) => ({ ...n, read: true }))),
      notify: pushNote,
      flash,
    }),
    [
      account,
      authLoading,
      onboarded,
      prefs,
      weights,
      listings,
      swipes,
      likedIds,
      notifications,
      toast,
      swipe,
      undoSwipe,
      flash,
      pushNote,
      clearSession,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
