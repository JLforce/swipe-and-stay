import { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { colors } from "../../constants/brand";

type OwnerFilter = "all" | "active" | "pending" | "suspended";

const FILTERS: { label: string; value: OwnerFilter }[] = [
  { label: "All owners", value: "all" },
  { label: "Active", value: "active" },
  { label: "Pending", value: "pending" },
  { label: "Suspended", value: "suspended" },
];

function StatCard({
  label,
  value,
  description,
  accent,
}: {
  label: string;
  value: string;
  description: string;
  accent?: boolean;
}) {
  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        minHeight: 122,
        padding: 16,
        borderRadius: 20,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
        justifyContent: "space-between",
      }}
    >
      <Text
        style={{
          fontSize: 12,
          fontWeight: "700",
          color: colors.mutedForeground,
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          fontSize: 27,
          fontWeight: "900",
          color: accent ? colors.accent : colors.primary,
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          fontSize: 10,
          color: colors.mutedForeground,
        }}
      >
        {description}
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
  const isTablet = width >= 600;

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<OwnerFilter>("all");

  // Owner records will be connected to Supabase later.
  // Keep this empty instead of displaying fabricated owner information.
  const owners: {
    id: string;
    name: string;
    email: string;
    properties: number;
    status: "active" | "pending" | "suspended";
  }[] = [];

  const filteredOwners = useMemo(() => {
    return owners.filter((owner) => {
      const matchesSearch = `${owner.name} ${owner.email}`
        .toLowerCase()
        .includes(search.trim().toLowerCase());

      const matchesFilter = filter === "all" || owner.status === filter;

      return matchesSearch && matchesFilter;
    });
  }, [owners, search, filter]);

  const statWidth = isWide ? "23.5%" : "48.5%";

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
        {/* Page heading */}
        <View style={{ gap: 6 }}>
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
            }}
          >
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

            <View
              style={{
                backgroundColor: colors.secondary,
                paddingHorizontal: 9,
                paddingVertical: 5,
                borderRadius: 8,
              }}
            >
              <Text
                style={{
                  color: colors.primary,
                  fontSize: 9,
                  fontWeight: "900",
                }}
              >
                OWNERS
              </Text>
            </View>
          </View>

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

        {/* Summary statistics */}
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
                value="—"
                description="All registered owners"
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Active owners"
                value="—"
                description="Currently active accounts"
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Pending approval"
                value="—"
                description="Awaiting verification"
                accent
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Total properties"
                value="—"
                description="Properties submitted by owners"
              />
            </View>
          </View>
        </View>

        {/* Owner directory */}
        <View style={{ gap: 14 }}>
          <View style={{ gap: 4 }}>
            <SectionHeading
              title="Owner directory"
              subtitle="Find and manage registered property owners."
            />
          </View>

          {/* Search */}
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
                fontSize: 18,
              }}
            >
              ⌕
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

          {/* Status filters */}
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

          {/* Directory content */}
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
                {filteredOwners.length} owners
              </Text>
            </View>

            {filteredOwners.length === 0 ? (
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
                    ♙
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
                  {search.trim()
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
                  {search.trim()
                    ? "Try another name or email address."
                    : "Owner accounts will appear here once the owner registration and backend integration are connected."}
                </Text>
              </View>
            ) : (
              <View style={{ gap: 12 }}>
                {filteredOwners.map((owner) => (
                  <View
                    key={owner.id}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 12,
                      paddingVertical: 10,
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border,
                    }}
                  >
                    <View
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: 15,
                        backgroundColor: colors.secondary,
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 15,
                          fontWeight: "900",
                        }}
                      >
                        {owner.name.slice(0, 1).toUpperCase()}
                      </Text>
                    </View>

                    <View style={{ flex: 1, gap: 4 }}>
                      <Text
                        style={{
                          color: colors.foreground,
                          fontSize: 12,
                          fontWeight: "800",
                        }}
                      >
                        {owner.name}
                      </Text>

                      <Text
                        numberOfLines={1}
                        style={{
                          color: colors.mutedForeground,
                          fontSize: 10,
                        }}
                      >
                        {owner.email}
                      </Text>
                    </View>

                    <View style={{ alignItems: "flex-end", gap: 5 }}>
                      <Text
                        style={{
                          color: colors.primary,
                          fontSize: 11,
                          fontWeight: "800",
                        }}
                      >
                        {owner.properties} properties
                      </Text>

                      <Text
                        style={{
                          color:
                            owner.status === "active"
                              ? colors.primary
                              : owner.status === "suspended"
                                ? colors.destructive
                                : colors.accent,
                          fontSize: 10,
                          fontWeight: "800",
                          textTransform: "capitalize",
                        }}
                      >
                        {owner.status}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        </View>

        {/* Backend integration notice */}
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
              Owner management is being prepared
            </Text>

            <Text
              style={{
                color: colors.secondaryForeground,
                fontSize: 11,
                lineHeight: 17,
              }}
            >
              This interface is frontend-only for now. Statistics and owner
              records will be populated after the backend integration is ready.
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
