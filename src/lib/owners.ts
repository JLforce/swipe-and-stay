import { supabase } from "./supabase";

export type OwnerAccountStatus = "active" | "pending" | "suspended";

export type OwnerRecord = {
  id: string;
  name: string;
  email: string;
  properties: number;
  status: OwnerAccountStatus;
};

export async function fetchOwners(): Promise<OwnerRecord[]> {
  // Fetch all Owner profiles.
  const { data: ownerProfiles, error: ownerError } = await supabase
    .from("profiles")
    .select("id, full_name, email, account_status")
    .eq("role", "owner")
    .order("created_at", { ascending: false });

  if (ownerError) {
    throw new Error(`Failed to fetch Owners: ${ownerError.message}`);
  }

  if (!ownerProfiles || ownerProfiles.length === 0) {
    return [];
  }

  // Get the IDs of the Owner accounts.
  const ownerIds = ownerProfiles.map((owner) => owner.id);

  // Fetch listings submitted by those Owners.
  const { data: listings, error: listingsError } = await supabase
    .from("listings")
    .select("created_by")
    .in("created_by", ownerIds);

  if (listingsError) {
    throw new Error(
      `Failed to fetch Owner properties: ${listingsError.message}`,
    );
  }

  // Count submitted properties for each Owner.
  const propertyCounts = new Map<string, number>();

  ownerIds.forEach((id) => propertyCounts.set(id, 0));

  listings?.forEach((listing) => {
    if (listing.created_by) {
      const currentCount = propertyCounts.get(listing.created_by) ?? 0;
      propertyCounts.set(listing.created_by, currentCount + 1);
    }
  });

  // Convert database records into the format used by the Owners screen.
  return ownerProfiles.map((owner) => {
    const status = owner.account_status;

    if (status !== "active" && status !== "pending" && status !== "suspended") {
      throw new Error(
        `Unexpected account status for Owner ${owner.id}: ${status}`,
      );
    }

    return {
      id: owner.id,
      name: owner.full_name?.trim() || "Unnamed Owner",
      email: owner.email ?? "",
      properties: propertyCounts.get(owner.id) ?? 0,
      status,
    };
  });
}
