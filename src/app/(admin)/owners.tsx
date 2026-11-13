import { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../constants/brand";
import { fetchOwners, type OwnerRecord } from "../../lib/owners";

type OwnerFilter = "all" | "active";

type Owner = OwnerRecord;

const FILTERS: { label: string; value: OwnerFilter }[] = [
  { label: "All owners", value: "all" },
  { label: "Active", value: "active" },
];

function StatCard({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 125,
        padding: 15,
        borderRadius: 19,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        justifyContent: "space-between",
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 13,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: accent ? "#FCEFE5" : colors.secondary,
        }}
      >
        <Text
          style={{
            color: accent ? colors.accent : colors.primary,
            fontSize: 18,
            fontWeight: "800",
          }}
        >
          {icon}
        </Text>
      </View>

      <Text
        style={{
          color: colors.foreground,
          fontSize: 25,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>
    </View>
  );
}

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
}) {
  return (
    <View style={{ gap: 4 }}>
      <Text
        style={{
          color: colors.foreground,
          fontSize: 16,
          fontWeight: "900",
        }}
      >
        {title}
      </Text>

      {subtitle ? (
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 12,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

export default function Owners() {
  const { width } = useWindowDimensions();

  const isWide = width >= 850;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OwnerFilter>("all");

  // Supabase Owner records
  const [owners, setOwners] = useState<Owner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch Owner accounts from Supabase
  useEffect(() => {
    let isMounted = true;

    async function loadOwners() {
      try {
        setIsLoading(true);
        setError(null);

        const data = await fetchOwners();

        if (isMounted) {
          setOwners(data);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "An unexpected error occurred while loading Owner accounts.",
          );
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadOwners();

    return () => {
      isMounted = false;
    };
  }, []);

  // Owner statistics
  const totalOwners = owners.length;

  const totalProperties = owners.reduce(
    (total, owner) => total + owner.properties,
    0,
  );

  // Search and status filtering
  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const matchesSearch = `${owner.name} ${owner.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesFilter = filter === "all" || owner.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [owners, search, filter]);

  const statWidth = "48.5%";

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: isWide ? 28 : 16,
        paddingTop: 22,
        paddingBottom: 40,
        alignItems: "center",
      }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1150,
          gap: 22,
        }}
      >
        {/* PAGE HEADING */}
        <View style={{ gap: 6 }}>
          <Text
            style={{
              color: colors.foreground,
              fontSize: isWide ? 29 : 25,
              fontWeight: "900",
              letterSpacing: -0.8,
            }}
          >
            Owner management
          </Text>

          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            Manage property owners and monitor their housing listings.
          </Text>
        </View>

        {/* OWNER OVERVIEW */}
        <View style={{ gap: 12 }}>
          <SectionHeading
            title="Owner overview"
            subtitle="A summary of owner accounts and properties."
          />

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 12,
            }}
          >
            <View style={{ width: statWidth }}>
              <StatCard
                label="Total owners"
                value={isLoading ? "..." : String(totalOwners)}
                icon={"\u2659"}
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Total properties"
                value={isLoading ? "..." : String(totalProperties)}
                icon={"\u2302"}
              />
            </View>
          </View>
        </View>

        {/* OWNER DIRECTORY */}
        <View style={{ gap: 14 }}>
          <SectionHeading
            title="Owner directory"
            subtitle="Find and manage registered property owners."
          />

          {/* SEARCH */}
          <View
            style={{
              minHeight: 49,
              flexDirection: "row",
              alignItems: "center",
              gap: 10,
              paddingHorizontal: 14,
              borderWidth: 1,
              borderColor: colors.border,
              borderRadius: 15,
              backgroundColor: colors.card,
            }}
          >
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 19,
              }}
            >
              {"\u2315"}
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search owner name or email..."
              placeholderTextColor={colors.mutedForeground}
              style={
                {
                  flex: 1,
                  paddingVertical: 12,
                  fontSize: 12,
                  color: colors.foreground,
                  outlineStyle: "none",
                } as never
              }
            />
          </View>

          {/* STATUS FILTERS */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{
              flexDirection: "row",
              gap: 8,
            }}
          >
            {FILTERS.map((item) => {
              const selected = filter === item.value;

              return (
                <Pressable
                  key={item.value}
                  onPress={() => setFilter(item.value)}
                  style={{
                    paddingHorizontal: 15,
                    paddingVertical: 10,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: selected ? colors.primary : colors.border,
                    backgroundColor: selected ? colors.primary : colors.card,
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                      fontSize: 11,
                      fontWeight: "800",
                    }}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* DIRECTORY */}
          <View
            style={{
              backgroundColor: colors.card,
              borderColor: colors.border,
              borderWidth: 1,
              borderRadius: 22,
              padding: 18,
              gap: 16,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: "900",
                }}
              >
                {FILTERS.find((item) => item.value === filter)?.label}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                }}
              >
                {isLoading ? "Loading..." : `${filteredOwners.length} owners`}
              </Text>
            </View>

            {/* LOADING STATE */}
            {isLoading ? (
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 32,
                  paddingHorizontal: 12,
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 12,
                  }}
                >
                  Loading Owner accounts...
                </Text>
              </View>
            ) : error ? (
              /* ERROR STATE */
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 32,
                  paddingHorizontal: 12,
                  gap: 12,
                }}
              >
                <Text
                  style={{
                    color: colors.destructive,
                    fontSize: 14,
                    fontWeight: "900",
                    textAlign: "center",
                  }}
                >
                  Unable to load Owner accounts
                </Text>

                <Text
                  style={{
                    maxWidth: 320,
                    color: colors.mutedForeground,
                    fontSize: 12,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  {error}
                </Text>
              </View>
            ) : filteredOwners.length === 0 ? (
              /* EMPTY STATE */
              <View
                style={{
                  alignItems: "center",
                  justifyContent: "center",
                  paddingVertical: 32,
                  paddingHorizontal: 12,
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 22,
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: colors.secondary,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 27,
                      color: colors.primary,
                      fontWeight: "900",
                    }}
                  >
                    {"\u2659"}
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 14,
                    fontWeight: "900",
                    textAlign: "center",
                  }}
                >
                  {search.trim() || filter !== "all"
                    ? "No matching owners"
                    : "No owner records yet"}
                </Text>

                <Text
                  style={{
                    maxWidth: 270,
                    color: colors.mutedForeground,
                    fontSize: 12,
                    lineHeight: 19,
                    textAlign: "center",
                  }}
                >
                  {search.trim() || filter !== "all"
                    ? "Try another name, email address, or status filter."
                    : "Registered Owner accounts will appear here."}
                </Text>
              </View>
            ) : (
              /* OWNER RECORDS */
              <View style={{ gap: 12 }}>
                {filteredOwners.map((owner) => (
                  <View
                    key={owner.id}
                    style={{
                      padding: 16,
                      borderRadius: 19,
                      borderWidth: 1,
                      borderColor: colors.border,
                      backgroundColor: colors.card,
                      gap: 14,
                    }}
                  >
                    {/* OWNER INFORMATION */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 16,
                          backgroundColor: colors.secondary,
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 17,
                            fontWeight: "900",
                          }}
                        >
                          {owner.name.slice(0, 1).toUpperCase()}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 5 }}>
                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 13,
                            fontWeight: "900",
                          }}
                        >
                          {owner.name}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 11,
                          }}
                        >
                          {owner.email}
                        </Text>
                      </View>
                    </View>

                    <View
                      style={{
                        height: 1,
                        backgroundColor: colors.border,
                      }}
                    />

                    {/* OWNER DETAILS */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                      }}
                    >
                      <View style={{ gap: 5 }}>
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 10,
                          }}
                        >
                          Submitted properties
                        </Text>

                        <Text
                          style={{
                            color: colors.foreground,
                            fontSize: 13,
                            fontWeight: "900",
                          }}
                        >
                          {owner.properties}
                        </Text>
                      </View>

                      <View
                        style={{
                          alignItems: "flex-end",
                          gap: 5,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 10,
                          }}
                        >
                          Account status
                        </Text>

                        <Text
                          style={{
                            color:
                              owner.status === "active"
                                ? colors.primary
                                : owner.status === "suspended"
                                  ? colors.destructive
                                  : colors.accent,
                            fontSize: 11,
                            fontWeight: "900",
                            textTransform: "capitalize",
                          }}
                        >
                          {owner.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* BACKEND NOTICE */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "flex-start",
            gap: 11,
            padding: 15,
            borderRadius: 16,
            backgroundColor: colors.secondary,
          }}
        >
          <Text
            style={{
              color: colors.primary,
              fontSize: 16,
              fontWeight: "900",
            }}
          >
            i
          </Text>

          <View style={{ flex: 1, gap: 4 }}>
            <Text
              style={{
                color: colors.primary,
                fontSize: 11,
                fontWeight: "900",
              }}
            >
              Owner management
            </Text>

            <Text
              style={{
                color: colors.secondaryForeground,
                fontSize: 11,
                lineHeight: 17,
              }}
            >
              Owner records and property statistics are retrieved directly from
              Supabase.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
