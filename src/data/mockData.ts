/**
 * Sample data ported from the Lovable prototype. Everything here is fake and is
 * meant to be replaced by Supabase tables (see roadmap Section 15 / SDD Section 4).
 * Contact details are placeholders, not real people.
 */
import type { HousingType } from "../constants/housing";

export interface Listing {
  id: string;
  title: string;
  area: string;
  type: HousingType;
  price: number; // PHP / month
  amenities: string[];
  /** Tailwind-style gradient string, translated by lib/gradient.ts (stand-in for real photos) */
  photo: string;
  gallery: string[];
  safety: { score: number; notes: string[] };
  landlord: { name: string; verified: boolean; responseTime: string; phone: string; email: string };
  occupancy: "solo" | "shared";
  description: string;
  slotsLeft: number;
  active: boolean;
  /** Admin review state for owner listings (null for demo listings). */
  verification?: "pending" | "verified" | "rejected" | null;
  rejectionReason?: string | null;
  coords: { lat: number; lng: number };
  /** Real photos from Supabase Storage. Demo listings leave this empty and use `photo`. */
  photoUrls?: string[];
  /** Set for listings loaded from Supabase; demo listings have no owner. */
  ownerId?: string | null;
}

export const LISTINGS: Listing[] = [
  {
    id: "l1",
    title: "Casa Verde Boarding House",
    area: "Salinas Drive, Lahug, Cebu City",
    type: "Boarding House",
    price: 7500,
    amenities: ["Wi-Fi", "Study area", "Laundry", "Guarded entrance", "CCTV"],
    photo: "from-emerald-700 via-teal-600 to-emerald-400",
    gallery: ["from-emerald-800 via-teal-600 to-lime-300", "from-teal-700 via-emerald-500 to-amber-200", "from-stone-600 via-emerald-600 to-teal-300"],
    safety: { score: 92, notes: ["CCTV on all floors", "Curfew-free but gated", "Well-lit street, barangay patrol"] },
    landlord: { name: "Tita Marilou Regis", verified: true, responseTime: "~15 min", phone: "+63 900 000 0001", email: "sample1@example.com" },
    occupancy: "shared",
    description: "Renovated family-run boarding house along Salinas Drive with six private rooms, a shared kitchen, and a quiet garden courtyard for late-night reviewing.",
    slotsLeft: 2,
    active: true,
    coords: { lat: 10.3345, lng: 123.9063 },
  },
  {
    id: "l2",
    title: "Banilad Studio 4B",
    area: "Gov. M. Cuenco Ave, Banilad, Cebu City",
    type: "Condo",
    price: 14500,
    amenities: ["Furnished", "Aircon", "Wi-Fi", "Pet-friendly", "CCTV"],
    photo: "from-orange-500 via-rose-400 to-amber-200",
    gallery: ["from-rose-500 via-orange-400 to-yellow-200", "from-amber-600 via-rose-400 to-pink-200", "from-orange-700 via-amber-500 to-orange-200"],
    safety: { score: 88, notes: ["Keycard lobby", "Front desk 24/7", "Fire drill certified 2026"] },
    landlord: { name: "Mr. Dennis Chiong", verified: true, responseTime: "~2 hrs", phone: "+63 900 000 0002", email: "sample2@example.com" },
    occupancy: "solo",
    description: "Bright 24 sqm studio near Banilad Town Centre with a study bar by the window, blackout curtains, and building generator backup.",
    slotsLeft: 1,
    active: true,
    coords: { lat: 10.3437, lng: 123.9127 },
  },
  {
    id: "l3",
    title: "Sanciangko Ladies Dorm — Bunk B",
    area: "Sanciangko St, Downtown Cebu City",
    type: "Dormitory",
    price: 4800,
    amenities: ["Meals included", "Aircon", "Female only", "Guarded entrance", "CCTV"],
    photo: "from-teal-700 via-cyan-600 to-emerald-300",
    gallery: ["from-cyan-700 via-teal-500 to-emerald-200", "from-emerald-700 via-cyan-500 to-sky-200", "from-teal-800 via-emerald-600 to-lime-200"],
    safety: { score: 95, notes: ["Female-only floors", "Biometric entry", "House mother on site"] },
    landlord: { name: "Dorm Office", verified: true, responseTime: "~1 hr", phone: "+63 900 000 0003", email: "sample3@example.com" },
    occupancy: "shared",
    description: "Accredited dorm two blocks from the USC Downtown gate. Bunk-style rooms of four with lockers and a shared review hall.",
    slotsLeft: 5,
    active: true,
    coords: { lat: 10.2952, lng: 123.8955 },
  },
  {
    id: "l4",
    title: "Basak Two-Bedroom Share",
    area: "Basak Pardo, Cebu City",
    type: "Apartment",
    price: 9800,
    amenities: ["Kitchen", "Wi-Fi", "Bike rack", "CCTV"],
    photo: "from-emerald-800 via-green-600 to-amber-300",
    gallery: ["from-green-800 via-emerald-600 to-yellow-200", "from-emerald-700 via-lime-500 to-amber-200", "from-teal-800 via-green-600 to-lime-300"],
    safety: { score: 84, notes: ["Gated compound", "CCTV at entrance", "Neighbors are mostly students"] },
    landlord: { name: "Ms. Aileen Portuguez", verified: false, responseTime: "~6 hrs", phone: "+63 900 000 0004", email: "sample4@example.com" },
    occupancy: "shared",
    description: "Second-floor unit in a quiet Basak compound. One roommate already confirmed, so you'd be filling the second bedroom.",
    slotsLeft: 1,
    active: true,
    coords: { lat: 10.2822, lng: 123.8586 },
  },
  {
    id: "l5",
    title: "Capitol Heritage Flats",
    area: "Escario St, Capitol Site, Cebu City",
    type: "Apartment",
    price: 11200,
    amenities: ["Wi-Fi", "Study area", "Guarded entrance"],
    photo: "from-stone-700 via-amber-600 to-orange-300",
    gallery: ["from-amber-800 via-orange-500 to-yellow-200", "from-stone-800 via-amber-600 to-orange-200", "from-orange-800 via-amber-500 to-stone-300"],
    safety: { score: 76, notes: ["Older building, newer locks", "Quiet after 9pm", "Guard until midnight"] },
    landlord: { name: "Heritage Rentals Cebu", verified: true, responseTime: "~4 hrs", phone: "+63 900 000 0005", email: "sample5@example.com" },
    occupancy: "solo",
    description: "Restored 1950s walk-up near the Capitol with tall windows, wooden floors, and a shared rooftop that catches the sea breeze.",
    slotsLeft: 3,
    active: true,
    coords: { lat: 10.3157, lng: 123.8925 },
  },
  {
    id: "l6",
    title: "Talamban Co-Living Pod",
    area: "Nasipit, Talamban, Cebu City",
    type: "Dormitory",
    price: 8900,
    amenities: ["Wi-Fi", "Study area", "Laundry", "Aircon", "CCTV"],
    photo: "from-cyan-800 via-teal-600 to-orange-300",
    gallery: ["from-teal-800 via-cyan-600 to-rose-200", "from-cyan-700 via-teal-500 to-amber-200", "from-emerald-800 via-cyan-600 to-orange-200"],
    safety: { score: 90, notes: ["App-based door access", "Community manager", "Bright, busy street"] },
    landlord: { name: "Pod Living Cebu", verified: true, responseTime: "~30 min", phone: "+63 900 000 0006", email: "sample6@example.com" },
    occupancy: "shared",
    description: "Modern pod-style rooms walking distance from USC Talamban, with a shared co-working floor, printer, and monthly community dinners.",
    slotsLeft: 4,
    active: false, // starts deactivated so the admin can switch it on in the demo
    coords: { lat: 10.3585, lng: 123.9128 },
  },
  {
    id: "l7",
    title: "N. Bacalso Student Rooms",
    area: "N. Bacalso Ave, Cebu City",
    type: "Boarding House",
    price: 4500,
    amenities: ["Wi-Fi", "Kitchen", "Laundry", "CCTV"],
    photo: "from-green-700 via-emerald-600 to-lime-300",
    gallery: ["from-emerald-700 via-green-500 to-lime-200"],
    safety: { score: 80, notes: ["Gated entrance", "Landlady lives on-site"] },
    landlord: { name: "Sample Landlord A", verified: true, responseTime: "~1 hr", phone: "+63 900 000 0007", email: "sample7@example.com" },
    occupancy: "shared",
    description: "Simple, clean rooms a short walk from CIT-U. Shared kitchen and a small laundry area.",
    slotsLeft: 3,
    active: true,
    coords: { lat: 10.296, lng: 123.883 },
  },
  {
    id: "l8",
    title: "Cebu South Dorm",
    area: "Sanciangko–Colon area, Cebu City",
    type: "Dormitory",
    price: 5200,
    amenities: ["Aircon", "Wi-Fi", "Study area", "Guarded entrance"],
    photo: "from-teal-600 via-emerald-500 to-amber-200",
    gallery: ["from-teal-700 via-emerald-500 to-lime-200"],
    safety: { score: 85, notes: ["24/7 guard", "Visitor log at the gate"] },
    landlord: { name: "Sample Landlord B", verified: false, responseTime: "~3 hrs", phone: "+63 900 000 0008", email: "sample8@example.com" },
    occupancy: "shared",
    description: "Aircon dorm rooms with a study hall on the second floor. Walkable to several downtown campuses.",
    slotsLeft: 6,
    active: true,
    coords: { lat: 10.293, lng: 123.8795 },
  },
];

export type Role = "student" | "owner" | "admin";
export interface DemoAccount {
  role: Role;
  email: string;
  password: string;
  name: string;
}

// Dev-only sign-in. The real app uses Google OAuth through Supabase (SRS 3.1.1, 3.5.2).
export const DEMO_ACCOUNTS: DemoAccount[] = [
  { role: "student", email: "student@example.com", password: "swipe123", name: "Andrea Lim" },
  { role: "admin", email: "admin@example.com", password: "admin123", name: "Admin" },
];

export const STUDENT_ACCOUNTS = [
  { id: "s1", name: "Maria Santos", email: "maria@example.edu.ph", campus: "UP Cebu", swipes: 148, saved: 14 },
  { id: "s2", name: "Joshua Dela Cruz", email: "joshua@example.edu.ph", campus: "USC Talamban", swipes: 96, saved: 9 },
  { id: "s3", name: "Angela Reyes", email: "angela@example.edu.ph", campus: "UP Cebu", swipes: 212, saved: 22 },
  { id: "s4", name: "Kevin Bautista", email: "kevin@example.edu.ph", campus: "CIT-U", swipes: 64, saved: 5 },
];

export const WEEKLY_SWIPES = [
  { day: "Mon", n: 310 },
  { day: "Tue", n: 340 },
  { day: "Wed", n: 360 },
  { day: "Thu", n: 410 },
  { day: "Fri", n: 520 },
  { day: "Sat", n: 640 },
  { day: "Sun", n: 590 },
];

/** Baseline like counts for the admin "most liked" list (demo only). */
export const BASE_LIKES: Record<string, number> = { l1: 212, l3: 301, l4: 120, l2: 64, l5: 40, l6: 90, l7: 55, l8: 48 };

export interface AppNotification {
  id: string;
  kind: "match" | "deactivated" | "rerank" | "lease" | "info";
  title: string;
  body: string;
  time: string;
  read: boolean;
  listingId?: string;
}

export const INITIAL_NOTIFICATIONS: AppNotification[] = [
  {
    id: "n1",
    kind: "match",
    title: "New 96% match near UP Cebu",
    body: "Casa Verde Boarding House moved to the top of your deck after your last 5 swipes.",
    time: "2 min ago",
    read: false,
  },
  {
    id: "n2",
    kind: "deactivated",
    title: "A saved listing is no longer available",
    body: "Talamban Co-Living Pod was deactivated by the admin. It was removed from your deck.",
    time: "1 hr ago",
    read: false,
  },
  {
    id: "n3",
    kind: "rerank",
    title: "Re-ranking complete",
    body: "You liked 3 walkable places. Distance now counts for more in your matches.",
    time: "Yesterday",
    read: true,
  },
  {
    id: "n4",
    kind: "lease",
    title: "Lease summary ready",
    body: "A plain-language summary for Casa Verde is ready to review.",
    time: "Yesterday",
    read: true,
  },
];

export const ONBOARDING_SLIDES = [
  {
    tag: "Discover",
    title: "Swipe your way home",
    body: "Boarding houses, dorms, apartments and condos near your campus, one card at a time.",
    gradient: "from-emerald-700 via-teal-600 to-emerald-300",
  },
  {
    tag: "Adaptive matching",
    title: "It learns what you like",
    body: "Every swipe re-ranks your deck. Price, distance, amenities and housing type all get weighted by your choices.",
    gradient: "from-orange-500 via-rose-400 to-amber-200",
  },
  {
    tag: "Safer renting",
    title: "Know before you sign",
    body: "Paste a lease to get a plain-language summary, and check our safety checklist before you pay anything.",
    gradient: "from-teal-700 via-cyan-600 to-emerald-300",
  },
];

export const SAFETY_CHECKLIST = [
  "Never pay a deposit before viewing the place in person.",
  "Bring a friend or family member to the viewing.",
  "Ask for the landlord's ID and proof of ownership.",
  "Get a receipt for every payment.",
  "Read the lease first. Try the Lease tab.",
];

/** Matches the JSON schema in roadmap DEC-08 (summary, deposit, notice, utilities, penalties, flags). */
export interface LeaseResult {
  summary: string;
  deposit: string;
  notice_period: string;
  utilities_included: string;
  penalties: string;
  flagged_clauses: { clause: string; reason: string }[];
}

export const SAMPLE_LEASE_TEXT = `RESIDENTIAL LEASE (SAMPLE)
1. Term. The lease is for six (6) months starting on the date of signing.
2. Rent. The Lessee shall pay PHP 7,500 per month, due every 5th day of the month.
3. Deposit. The Lessee shall remit two (2) months' deposit and one (1) month advance upon signing.
4. Utilities. Electricity and water are billed separately at sub-meter rates.
5. Early termination. Pre-termination before six months forfeits the deposit in full.
6. Guests. Overnight guests are prohibited without prior written consent of the Lessor.
7. Repairs. Ordinary wear and tear is for the account of the Lessor.`;

export const SAMPLE_LEASE_RESULT: LeaseResult = {
  summary:
    "A 6-month room lease at ₱7,500 per month. You pay ₱22,500 on signing, utilities are extra, and leaving early costs you the deposit.",
  deposit: "₱22,500 on signing: 2 months' deposit (₱15,000, refundable) + 1 month advance (₱7,500).",
  notice_period: "Not clearly stated. Ask the landlord how much notice is needed before moving out.",
  utilities_included: "No. Electricity and water are billed separately (sub-meter rates).",
  penalties: "Leaving before 6 months forfeits the full deposit.",
  flagged_clauses: [
    { clause: "Early termination", reason: "You lose the entire ₱15,000 deposit if you leave before 6 months." },
    { clause: "Overnight guests", reason: "No overnight visitors unless the landlord approves in writing first." },
  ],
};
