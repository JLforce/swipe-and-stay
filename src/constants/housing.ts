export type HousingType = "Boarding House" | "Dormitory" | "Apartment" | "Condo";
export const HOUSING_TYPES: HousingType[] = ["Dormitory", "Boarding House", "Apartment", "Condo"];

export interface Campus {
  id: string;
  name: string;
  short: string;
  lat: number;
  lng: number;
}

// NOTE: coordinates are approximate. Verify with Google Maps before the demo.
export const CAMPUSES: Campus[] = [
  { id: "citu", name: "Cebu Institute of Technology – University", short: "CIT-U", lat: 10.2954, lng: 123.8813 },
  { id: "upcebu", name: "UP Cebu (Lahug)", short: "UP Cebu", lat: 10.3226, lng: 123.8996 },
  { id: "usc-dt", name: "University of San Carlos – Downtown", short: "USC Downtown", lat: 10.2995, lng: 123.8996 },
  { id: "usc-tal", name: "University of San Carlos – Talamban", short: "USC Talamban", lat: 10.3535, lng: 123.9115 },
  { id: "usjr", name: "University of San Jose–Recoletos (Basak)", short: "USJ-R", lat: 10.2823, lng: 123.8645 },
  { id: "cnu", name: "Cebu Normal University", short: "CNU", lat: 10.3092, lng: 123.8937 },
];

// One fixed amenity vocabulary (roadmap DEC-07). Safety tags live here too.
export const AMENITY_VOCAB = [
  "Wi-Fi",
  "Aircon",
  "Laundry",
  "Study area",
  "Kitchen",
  "Furnished",
  "Meals included",
  "CCTV",
  "Guarded entrance",
  "Female only",
  "Pet-friendly",
  "Bike rack",
];

export const BUDGET_PRESETS: { label: string; min: number; max: number }[] = [
  { label: "₱3k – ₱6k", min: 3000, max: 6000 },
  { label: "₱5k – ₱8k", min: 5000, max: 8000 },
  { label: "₱5k – ₱10k", min: 5000, max: 10000 },
  { label: "₱8k – ₱15k", min: 8000, max: 15000 },
  { label: "₱15k+", min: 15000, max: 30000 },
];
