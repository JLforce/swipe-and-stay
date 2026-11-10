/**
 * ADMIN LISTINGS — UI PREVIEW DATA ONLY
 *
 * All records and contact details are fictional.
 * These records are not fetched from or saved to Supabase.
 * Replace this data source during the backend integration phase.
 */
import type { HousingType } from "../constants/housing";

export type VerificationStatus = "pending" | "verified" | "rejected";
export type PublicationStatus = "published" | "unpublished";

export interface AdminListingPreview {
  id: string;
  title: string;
  address: string;
  type: HousingType;
  occupancy: "solo" | "shared";
  price: number;
  description: string;
  amenities: string[];
  photo: string;
  gallery: string[];
  coords: {
    lat: number;
    lng: number;
  };
  owner: {
    name: string;
    email: string;
    phone: string;
  };
  verificationStatus: VerificationStatus;
  publicationStatus: PublicationStatus;
  rejectionReason: string | null;
  submittedAt: string;
}

export const ADMIN_LISTING_PREVIEW: AdminListingPreview[] = [
  {
    id: "preview-001",
    title: "Casa Verde Boarding House",
    address: "Salinas Drive, Lahug, Cebu City",
    type: "Boarding House",
    occupancy: "shared",
    price: 7500,
    description:
      "A family-run boarding house with private rooms, a shared kitchen, and a quiet common area for students.",
    amenities: ["Wi-Fi", "Study area", "Laundry", "CCTV", "Guarded entrance"],
    photo: "from-emerald-700 via-teal-600 to-emerald-400",
    gallery: [
      "from-emerald-800 via-teal-600 to-lime-300",
      "from-teal-700 via-emerald-500 to-amber-200",
      "from-stone-600 via-emerald-600 to-teal-300",
    ],
    coords: { lat: 10.3345, lng: 123.9063 },
    owner: {
      name: "Marilou Reyes",
      email: "marilou.preview@example.com",
      phone: "+63 900 000 0101",
    },
    verificationStatus: "pending",
    publicationStatus: "unpublished",
    rejectionReason: null,
    submittedAt: "2026-11-08T09:30:00+08:00",
  },
  {
    id: "preview-002",
    title: "Banilad Studio Residence",
    address: "Gov. M. Cuenco Avenue, Banilad, Cebu City",
    type: "Condo",
    occupancy: "solo",
    price: 14500,
    description:
      "A furnished studio unit near commercial establishments, with a dedicated study corner and building security.",
    amenities: ["Furnished", "Aircon", "Wi-Fi", "CCTV"],
    photo: "from-orange-500 via-rose-400 to-amber-200",
    gallery: [
      "from-rose-500 via-orange-400 to-yellow-200",
      "from-amber-600 via-rose-400 to-pink-200",
    ],
    coords: { lat: 10.3437, lng: 123.9127 },
    owner: {
      name: "Dennis Chua",
      email: "dennis.preview@example.com",
      phone: "+63 900 000 0102",
    },
    verificationStatus: "pending",
    publicationStatus: "unpublished",
    rejectionReason: null,
    submittedAt: "2026-11-09T14:15:00+08:00",
  },
  {
    id: "preview-003",
    title: "Sanciangko Student Dorm",
    address: "Sanciangko Street, Downtown Cebu City",
    type: "Dormitory",
    occupancy: "shared",
    price: 4800,
    description:
      "A student dormitory with shared rooms, a common study hall, and controlled building access.",
    amenities: ["Meals included", "Aircon", "Guarded entrance", "CCTV"],
    photo: "from-teal-700 via-cyan-600 to-emerald-300",
    gallery: [
      "from-cyan-700 via-teal-500 to-emerald-200",
      "from-emerald-700 via-cyan-500 to-sky-200",
    ],
    coords: { lat: 10.2952, lng: 123.8955 },
    owner: {
      name: "Cebu Dorm Rentals",
      email: "dorm.preview@example.com",
      phone: "+63 900 000 0103",
    },
    verificationStatus: "verified",
    publicationStatus: "published",
    rejectionReason: null,
    submittedAt: "2026-11-05T10:00:00+08:00",
  },
  {
    id: "preview-004",
    title: "Basak Two-Bedroom Apartment",
    address: "Basak Pardo, Cebu City",
    type: "Apartment",
    occupancy: "shared",
    price: 9800,
    description:
      "A two-bedroom apartment in a residential compound with a shared kitchen and nearby public transport.",
    amenities: ["Kitchen", "Wi-Fi", "Bike rack", "CCTV"],
    photo: "from-emerald-800 via-green-600 to-amber-300",
    gallery: [
      "from-green-800 via-emerald-600 to-yellow-200",
      "from-emerald-700 via-lime-500 to-amber-200",
    ],
    coords: { lat: 10.2822, lng: 123.8586 },
    owner: {
      name: "Aileen Santos",
      email: "aileen.preview@example.com",
      phone: "+63 900 000 0104",
    },
    verificationStatus: "verified",
    publicationStatus: "unpublished",
    rejectionReason: null,
    submittedAt: "2026-11-06T11:45:00+08:00",
  },
  {
    id: "preview-005",
    title: "Capitol Heritage Flats",
    address: "Escario Street, Capitol Site, Cebu City",
    type: "Apartment",
    occupancy: "solo",
    price: 11200,
    description:
      "A restored apartment unit near the Cebu Provincial Capitol, featuring large windows and a shared rooftop area.",
    amenities: ["Wi-Fi", "Study area", "Guarded entrance"],
    photo: "from-stone-700 via-amber-600 to-orange-300",
    gallery: [
      "from-amber-800 via-orange-500 to-yellow-200",
      "from-stone-800 via-amber-600 to-orange-200",
    ],
    coords: { lat: 10.3157, lng: 123.8925 },
    owner: {
      name: "Heritage Property Rentals",
      email: "heritage.preview@example.com",
      phone: "+63 900 000 0105",
    },
    verificationStatus: "rejected",
    publicationStatus: "unpublished",
    rejectionReason: "The submitted property information is incomplete. Please provide the missing property documentation for verification.",
    submittedAt: "2026-11-04T08:20:00+08:00",
  },
  {
    id: "preview-006",
    title: "Talamban Co-Living Residence",
    address: "Nasipit, Talamban, Cebu City",
    type: "Dormitory",
    occupancy: "shared",
    price: 8900,
    description:
      "A co-living residence with shared study facilities, laundry services, and secured entry.",
    amenities: ["Wi-Fi", "Study area", "Laundry", "Aircon", "CCTV"],
    photo: "from-cyan-800 via-teal-600 to-orange-300",
    gallery: [
      "from-teal-800 via-cyan-600 to-rose-200",
      "from-cyan-700 via-teal-500 to-amber-200",
    ],
    coords: { lat: 10.3585, lng: 123.9128 },
    owner: {
      name: "Talamban Living Spaces",
      email: "talamban.preview@example.com",
      phone: "+63 900 000 0106",
    },
    verificationStatus: "rejected",
    publicationStatus: "unpublished",
    rejectionReason: "The property photos do not sufficiently show the actual room interiors and available facilities.",
    submittedAt: "2026-11-07T16:10:00+08:00",
  },
];
