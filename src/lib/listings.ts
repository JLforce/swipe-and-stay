import type { HousingType } from "../constants/housing";
import type { AdminListingPreview } from "../data/adminListingPreview";
import type { Listing } from "../data/mockData";
import type { Tables, TablesInsert } from "../types/database";
import { supabase } from "./supabase";

type ListingRow = Tables<"listings">;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Demo listings use ids like "l1". Only database listings have UUIDs. */
export function isDatabaseId(id: string): boolean {
  return UUID_RE.test(id);
}

const TYPE_FROM_DB: Record<string, HousingType> = {
  dorm: "Dormitory",
  boarding_house: "Boarding House",
  apartment: "Apartment",
  condo: "Condo",
};

const TYPE_TO_DB: Record<HousingType, string> = {
  Dormitory: "dorm",
  "Boarding House": "boarding_house",
  Apartment: "apartment",
  Condo: "condo",
};

// Listings without photos still need a colored card. Pick one from the id so
// the same listing always gets the same color.
const GRADIENTS = [
  "from-emerald-700 via-teal-600 to-emerald-400",
  "from-orange-500 via-rose-400 to-amber-200",
  "from-teal-700 via-cyan-600 to-emerald-300",
  "from-emerald-800 via-green-600 to-amber-300",
  "from-stone-700 via-amber-600 to-orange-300",
  "from-cyan-800 via-teal-600 to-orange-300",
];

function gradientFor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) | 0;
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length]!;
}

export function rowToListing(row: ListingRow): Listing {
  return {
    id: row.id,
    title: row.title,
    area: row.address,
    type: TYPE_FROM_DB[row.type] ?? "Boarding House",
    price: Number(row.price),
    amenities: row.amenities ?? [],
    photo: gradientFor(row.id),
    gallery: [],
    safety: { score: 0, notes: [] },
    landlord: {
      name: row.landlord_name ?? "",
      verified: false,
      responseTime: "when available",
      phone: row.landlord_phone ?? "",
      email: row.landlord_email ?? "",
    },
    occupancy: row.occupancy === "solo" ? "solo" : "shared",
    description: row.description ?? "",
    slotsLeft: row.slots_left,
    active: row.is_active,
    verification: (row.verification_status as Listing["verification"]) ?? null,
    rejectionReason: row.rejection_reason ?? null,
    coords: { lat: Number(row.lat), lng: Number(row.lng) },
    photoUrls: row.photo_urls ?? [],
    ownerId: row.created_by,
  };
}

/** What the owner types into the form. */
export interface ListingDraft {
  title: string;
  address: string;
  price: number;
  type: HousingType;
  occupancy: "solo" | "shared";
  amenities: string[];
  description: string;
  lat: number;
  lng: number;
  slotsLeft: number;
  landlordName: string;
  landlordPhone: string;
  landlordEmail: string;
  photoUrls: string[];
  isActive: boolean;
}

function draftToRow(d: ListingDraft): TablesInsert<"listings"> {
  return {
    title: d.title,
    address: d.address,
    price: d.price,
    type: TYPE_TO_DB[d.type],
    occupancy: d.occupancy,
    amenities: d.amenities,
    description: d.description || null,
    lat: d.lat,
    lng: d.lng,
    slots_left: d.slotsLeft,
    landlord_name: d.landlordName || null,
    landlord_phone: d.landlordPhone || null,
    landlord_email: d.landlordEmail || null,
    photo_urls: d.photoUrls,
    is_active: d.isActive,
  };
}

/** Listings students can swipe on. */
export async function fetchActiveListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToListing);
}

/** The signed-in owner's own listings, including drafts and inactive ones. */
export async function fetchMyListings(ownerId: string): Promise<Listing[]> {
  const { data, error } = await supabase
    .from("listings")
    .select("*")
    .eq("created_by", ownerId)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(rowToListing);
}

export async function createListing(draft: ListingDraft): Promise<Listing> {
  const { data, error } = await supabase
    .from("listings")
    .insert(draftToRow(draft))
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToListing(data);
}

export async function updateListing(
  id: string,
  draft: ListingDraft,
): Promise<Listing> {
  const { data, error } = await supabase
    .from("listings")
    .update(draftToRow(draft))
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToListing(data);
}

export async function setListingActive(
  id: string,
  active: boolean,
): Promise<Listing> {
  const { data, error } = await supabase
    .from("listings")
    .update({ is_active: active })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return rowToListing(data);
}

/** Fetch all listings available to the Admin, including their Owner profiles. */
export async function fetchAdminListings(): Promise<AdminListingPreview[]> {
  const { data, error } = await supabase
    .from("listings")
    .select(
      `
      *,
      owner:profiles!listings_created_by_fkey (
        full_name,
        email
      )
    `,
    )
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const photoUrls = row.photo_urls ?? [];
    const verificationStatus = row.verification_status ?? "pending";

    return {
      id: row.id,
      title: row.title,
      address: row.address,
      type: TYPE_FROM_DB[row.type] ?? "Boarding House",
      occupancy: row.occupancy === "solo" ? "solo" : "shared",
      price: Number(row.price),
      description: row.description ?? "",
      amenities: row.amenities ?? [],
      photo: gradientFor(row.id),
      gallery: [],
      photoUrl: photoUrls[0] ?? null,
      galleryUrls: photoUrls.slice(1),
      coords: {
        lat: Number(row.lat),
        lng: Number(row.lng),
      },
      owner: {
        name: row.owner?.full_name ?? row.landlord_name ?? "Unknown Owner",
        email: row.owner?.email ?? row.landlord_email ?? "",
        phone: row.landlord_phone ?? "",
      },
      verificationStatus:
        verificationStatus as AdminListingPreview["verificationStatus"],
      publicationStatus: row.is_active ? "published" : "unpublished",
      rejectionReason: row.rejection_reason ?? null,
      submittedAt: row.created_at,
    };
  });
}

/** Verify a pending listing and keep it unpublished. */
export async function verifyAdminListing(id: string): Promise<void> {
  const { data, error } = await supabase
    .from("listings")
    .update({
      verification_status: "verified",
      rejection_reason: null,
      is_active: false,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error(
      "Listing was not updated. It may no longer exist or you may not have permission.",
    );
  }
}

/** Reject a listing and persist its required reason. */
export async function rejectAdminListing(
  id: string,
  reason: string,
): Promise<void> {
  const trimmedReason = reason.trim();

  if (!trimmedReason) {
    throw new Error("A rejection reason is required.");
  }

  const { data, error } = await supabase
    .from("listings")
    .update({
      verification_status: "rejected",
      rejection_reason: trimmedReason,
      is_active: false,
    })
    .eq("id", id)
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error(
      "Listing was not rejected. It may no longer exist or you may not have permission.",
    );
  }
}

/** Change publication status for a verified listing. */
export async function setAdminListingPublication(
  id: string,
  published: boolean,
): Promise<void> {
  const { data, error } = await supabase
    .from("listings")
    .update({ is_active: published })
    .eq("id", id)
    .eq("verification_status", "verified")
    .select("id")
    .maybeSingle();

  if (error) throw new Error(error.message);

  if (!data) {
    throw new Error(
      "Publication status was not changed. Make sure the listing exists and is verified.",
    );
  }
}

export async function deleteListing(id: string): Promise<void> {
  const { error } = await supabase.from("listings").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Keep the sample listings next to real owner listings while the pilot has few
 * real ones. Set to false to show only listings posted by owners.
 */
export const SHOW_DEMO_LISTINGS = true;

/**
 * Best-effort save of a student's swipe so owners can see interest.
 * Never throws: the swipe already worked on screen.
 * (Students may only change unliked_at later, so a changed mind from
 * left to right on the same listing is not stored.)
 */
export async function persistSwipe(
  userId: string,
  listingId: string,
  direction: "left" | "right",
): Promise<void> {
  if (!isDatabaseId(listingId)) return;

  const { error } = await supabase
    .from("swipes")
    .insert({ user_id: userId, listing_id: listingId, direction });

  if (error && error.code === "23505" && direction === "right") {
    // Already swiped before; if it was an unliked right swipe, count it again.
    await supabase
      .from("swipes")
      .update({ unliked_at: null })
      .eq("user_id", userId)
      .eq("listing_id", listingId)
      .eq("direction", "right");
  } else if (error && error.code !== "23505") {
    console.warn("Could not save swipe", error.message);
  }
}

export interface StoredSwipe {
  listingId: string;
  direction: "left" | "right";
  at: number;
  /** True when this is a right swipe the student has not removed. */
  saved: boolean;
}

/** The signed-in student's past swipes, oldest first, so Saved survives a new sign-in. */
export async function fetchSwipes(userId: string): Promise<StoredSwipe[]> {
  const { data, error } = await supabase
    .from("swipes")
    .select("listing_id, direction, swiped_at, unliked_at")
    .eq("user_id", userId)
    .order("swiped_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((r) => ({
    listingId: r.listing_id,
    direction: r.direction as "left" | "right",
    at: new Date(r.swiped_at).getTime(),
    saved: r.direction === "right" && r.unliked_at === null,
  }));
}

/** Best-effort: a student removed a saved listing. */
export async function persistUnlike(
  userId: string,
  listingId: string,
): Promise<void> {
  if (!isDatabaseId(listingId)) return;

  const { error } = await supabase
    .from("swipes")
    .update({ unliked_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("listing_id", listingId)
    .eq("direction", "right");

  if (error) console.warn("Could not save unlike", error.message);
}

export const MAX_LISTING_PHOTOS = 6;

/**
 * Uploads one photo to the public listing-photos bucket, inside a folder named
 * after the owner (the storage policy requires that), and returns its URL.
 */
export async function uploadListingPhoto(
  ownerId: string,
  uri: string,
  mimeType?: string | null,
): Promise<string> {
  const type =
    mimeType && mimeType.startsWith("image/") ? mimeType : "image/jpeg";
  const ext =
    type === "image/png" ? "png" : type === "image/webp" ? "webp" : "jpg";
  const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const path = `${ownerId}/${name}`;

  const response = await fetch(uri);
  const bytes = await response.arrayBuffer();

  const { error } = await supabase.storage
    .from("listing-photos")
    .upload(path, bytes, { contentType: type, upsert: false });

  if (error) throw new Error(error.message);

  return supabase.storage.from("listing-photos").getPublicUrl(path).data
    .publicUrl;
}
