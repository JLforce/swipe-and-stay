import type { HousingType } from "../constants/housing";
import type { Listing } from "../data/mockData";
import type { Database } from "../types/database";
import { supabase } from "./supabase";

type ListingInsert = Database["public"]["Tables"]["listings"]["Insert"];
type ListingUpdate = Database["public"]["Tables"]["listings"]["Update"];
type ListingRow = Database["public"]["Tables"]["listings"]["Row"];

// The app shows readable labels; the database stores these four values only.
const TYPE_TO_DB: Record<HousingType, string> = {
  Dormitory: "dorm",
  "Boarding House": "boarding_house",
  Apartment: "apartment",
  Condo: "condo",
};

const TYPE_FROM_DB: Record<string, HousingType> = {
  dorm: "Dormitory",
  boarding_house: "Boarding House",
  apartment: "Apartment",
  condo: "Condo",
};

// Stand-in picture until photo upload (Supabase Storage) is built.
const DEFAULT_GRADIENT = "from-emerald-700 via-teal-600 to-emerald-400";

/** Turns a database row into the Listing shape the screens already use. */
export function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    area: row.address,
    type: TYPE_FROM_DB[row.type] ?? "Boarding House",
    price: Number(row.price),
    amenities: row.amenities ?? [],
    photo: DEFAULT_GRADIENT,
    gallery: row.photo_urls ?? [],
    // No database columns exist for these four values yet.
    safety: { score: 0, notes: [] },
    landlord: {
      name: row.landlord_name ?? "",
      verified: false,
      responseTime: "",
      phone: row.landlord_phone ?? "",
      email: row.landlord_email ?? "",
    },
    occupancy: row.occupancy === "shared" ? "shared" : "solo",
    description: row.description ?? "",
    slotsLeft: 0,
    active: row.is_active,
    coords: { lat: Number(row.lat), lng: Number(row.lng) },
  };
}

/**
 * Columns for a NEW listing. The id and created_by are never sent:
 * the database creates the id and a trigger sets the owner.
 */
export function listingToInsert(l: Listing, isActive: boolean): ListingInsert {
  return {
    title: l.title,
    address: l.area,
    price: l.price,
    type: TYPE_TO_DB[l.type],
    occupancy: l.occupancy,
    lat: l.coords.lat,
    lng: l.coords.lng,
    amenities: l.amenities,
    description: l.description || null,
    landlord_name: l.landlord.name || null,
    landlord_phone: l.landlord.phone || null,
    landlord_email: l.landlord.email || null,
    is_active: isActive,
  };
}

/** Columns for EDITING a listing (status and photos are changed elsewhere). */
export function listingToUpdate(l: Listing): ListingUpdate {
  return {
    title: l.title,
    address: l.area,
    price: l.price,
    type: TYPE_TO_DB[l.type],
    occupancy: l.occupancy,
    lat: l.coords.lat,
    lng: l.coords.lng,
    amenities: l.amenities,
    description: l.description || null,
    landlord_name: l.landlord.name || null,
    landlord_phone: l.landlord.phone || null,
    landlord_email: l.landlord.email || null,
  };
}

/**
 * Fetch listings visible to the currently authenticated user.
 * Supabase RLS determines which records can be returned.
 */
export async function fetchListings(): Promise<ListingRow[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch listings: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Fetch only the listings created by this admin (drafts included).
 * RLS also lets admins read every active listing, so we filter by owner.
 */
export async function fetchMyListings(userId: string): Promise<ListingRow[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch your listings: ${error.message}`);
  }

  return data ?? [];
}

/**
 * Create a listing.
 * The database generates its UUID and assigns created_by through its trigger.
 */
export async function createListing(
  listing: ListingInsert,
): Promise<ListingRow> {
  const { data, error } = await supabase
    .from("listings")
    .insert(listing)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to create listing: ${error.message}`);
  }

  return data;
}

/**
 * Update an existing listing by its database UUID.
 */
export async function updateListing(
  id: string,
  changes: ListingUpdate,
): Promise<ListingRow> {
  const { data, error } = await supabase
    .from("listings")
    .update(changes)
    .eq("id", id)
    .select("*")
    .single();

  if (error) {
    throw new Error(`Failed to update listing: ${error.message}`);
  }

  return data;
}

/**
 * Change a listing's active status.
 */
export async function setListingActive(
  id: string,
  isActive: boolean,
): Promise<ListingRow> {
  return updateListing(id, { is_active: isActive });
}
