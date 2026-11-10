import { useFocusEffect } from "expo-router";
import { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { colors } from "../../constants/brand";
import { adminGetStats, type AdminStudent } from "../../lib/api";
import { useApp } from "../../lib/store";

type Filter = "all" | "onboarded" | "incomplete";
type SortMode = "newest" | "active";

function initials(student: AdminStudent): string {
  const source = (student.name ?? student.email ?? "?").trim();

  return (
    source
      .split(/[\s@.]+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "?"
  );
}

function formatDate(value: string): string {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "Unknown date";

  return date.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function StatCard({
  label,
  value,
  description,
  accent = false,
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
        minHeight: 112,
        padding: 15,
        justifyContent: "space-between",
        borderRadius: 19,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.card,
      }}
    >
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 11,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>

      <Text
        style={{
          color: accent ? colors.accent : colors.primary,
          fontSize: 27,
          fontWeight: "900",
        }}
      >
        {value}
      </Text>

      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 10,
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
            lineHeight: 18,
          }}
        >
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

function FilterButton({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: selected ? colors.primary : colors.border,
        backgroundColor: selected ? colors.primary : colors.card,
      }}
    >
      <Text
        style={{
          color: selected ? colors.primaryForeground : colors.mutedForeground,
          fontSize: 11,
          fontWeight: "800",
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function Students() {
  const { account } = useApp();
  const accountId = account?.id;
  const { width } = useWindowDimensions();

  const isWide = width >= 850;

  const [students, setStudents] = useState<AdminStudent[] | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [totalSwipes, setTotalSwipes] = useState<number | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [sort, setSort] = useState<SortMode>("newest");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const loadStudents = useCallback(() => {
    if (!accountId) return;

    let active = true;
    setLoading(true);

    adminGetStats()
      .then((res) => {
        if (!active) return;

        setStudents(res.students);
        setTotal(res.stats.registered_students);
        setTotalSwipes(res.stats.total_swipes);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!active) return;

        setError(
          e instanceof Error ? e.message : "Could not load the students.",
        );
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [accountId]);

  useFocusEffect(loadStudents);

  const onboardedCount = (students ?? []).filter(
    (student) => student.onboarding_completed,
  ).length;

  const incompleteCount = (students ?? []).length - onboardedCount;

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = (students ?? []).filter((student) => {
      const searchable = [
        student.name ?? "",
        student.email ?? "",
        student.campus ?? "",
        student.program ?? "",
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch = searchable.includes(query);

      const matchesFilter =
        filter === "all" ||
        (filter === "onboarded" && student.onboarding_completed) ||
        (filter === "incomplete" && !student.onboarding_completed);

      return matchesSearch && matchesFilter;
    });

    return result.sort((a, b) => {
      if (sort === "active") {
        return b.swipes - a.swipes;
      }

      return new Date(b.joined_at).getTime() - new Date(a.joined_at).getTime();
    });
  }, [students, search, filter, sort]);

  const statWidth = isWide ? "23.5%" : "48.5%";

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background }}
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
          <Text
            style={{
              color: colors.foreground,
              fontSize: isWide ? 29 : 25,
              fontWeight: "900",
              letterSpacing: -0.8,
            }}
          >
            Student management
          </Text>

          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 13,
              lineHeight: 19,
            }}
          >
            Monitor student accounts, registration, and platform engagement.
          </Text>
        </View>

        {/* Overview statistics */}
        <View style={{ gap: 12 }}>
          <SectionHeading
            title="Student overview"
            subtitle="A snapshot of registered student accounts."
          />

          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              justifyContent: "space-between",
              rowGap: 11,
            }}
          >
            <View style={{ width: statWidth }}>
              <StatCard
                label="Registered students"
                value={total === null ? "—" : String(total)}
                description="All registered accounts"
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Onboarded"
                value={students ? String(onboardedCount) : "—"}
                description="In the loaded student list"
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Incomplete onboarding"
                value={students ? String(incompleteCount) : "—"}
                description="In the loaded student list"
                accent
              />
            </View>

            <View style={{ width: statWidth }}>
              <StatCard
                label="Total swipes"
                value={totalSwipes === null ? "—" : String(totalSwipes)}
                description="Recorded platform swipes"
              />
            </View>
          </View>
        </View>

        {/* Student directory */}
        <View style={{ gap: 14 }}>
          <SectionHeading
            title="Student directory"
            subtitle="Search, filter, and inspect registered students."
          />

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
            <Text style={{ color: colors.mutedForeground, fontSize: 17 }}>
              ⌕
            </Text>

            <TextInput
              value={search}
              onChangeText={setSearch}
              placeholder="Search name, email, campus or program..."
              placeholderTextColor={colors.mutedForeground}
              style={{
                flex: 1,
                paddingVertical: 12,
                fontSize: 12,
                color: colors.foreground,
              }}
            />

            {search.length > 0 ? (
              <Pressable
                onPress={() => setSearch("")}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 17,
                    fontWeight: "700",
                  }}
                >
                  ×
                </Text>
              </Pressable>
            ) : null}
          </View>

          {/* Filters */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8 }}
          >
            <FilterButton
              label="All students"
              selected={filter === "all"}
              onPress={() => setFilter("all")}
            />

            <FilterButton
              label="Onboarded"
              selected={filter === "onboarded"}
              onPress={() => setFilter("onboarded")}
            />

            <FilterButton
              label="Incomplete"
              selected={filter === "incomplete"}
              onPress={() => setFilter("incomplete")}
            />
          </ScrollView>

          {/* Directory header and sorting */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: 8,
            }}
          >
            <View style={{ gap: 3 }}>
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 14,
                  fontWeight: "900",
                }}
              >
                Registered accounts
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 11,
                }}
              >
                {students
                  ? `${filteredStudents.length} shown · ${total ?? students.length} registered`
                  : "Loading student records..."}
              </Text>
            </View>

            <View style={{ flexDirection: "row", gap: 6 }}>
              <Pressable
                onPress={() => setSort("newest")}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor:
                    sort === "newest" ? colors.secondary : colors.card,
                  borderWidth: 1,
                  borderColor:
                    sort === "newest" ? colors.secondary : colors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      sort === "newest"
                        ? colors.primary
                        : colors.mutedForeground,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  Newest
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setSort("active")}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 8,
                  borderRadius: 10,
                  backgroundColor:
                    sort === "active" ? colors.secondary : colors.card,
                  borderWidth: 1,
                  borderColor:
                    sort === "active" ? colors.secondary : colors.border,
                }}
              >
                <Text
                  style={{
                    color:
                      sort === "active"
                        ? colors.primary
                        : colors.mutedForeground,
                    fontSize: 10,
                    fontWeight: "800",
                  }}
                >
                  Most active
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Error */}
          {error ? (
            <View
              style={{
                padding: 15,
                borderRadius: 15,
                backgroundColor: `${colors.destructive}12`,
                gap: 9,
              }}
            >
              <Text
                style={{
                  color: colors.destructive,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {error}
              </Text>

              <Pressable
                onPress={loadStudents}
                style={{
                  alignSelf: "flex-start",
                  paddingHorizontal: 13,
                  paddingVertical: 9,
                  borderRadius: 10,
                  backgroundColor: colors.card,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 11,
                    fontWeight: "800",
                  }}
                >
                  Try again
                </Text>
              </Pressable>
            </View>
          ) : null}

          {/* Loading */}
          {loading && !students ? (
            <View style={{ alignItems: "center", paddingVertical: 35 }}>
              <ActivityIndicator color={colors.primary} />
              <Text
                style={{
                  marginTop: 10,
                  color: colors.mutedForeground,
                  fontSize: 12,
                }}
              >
                Loading student accounts...
              </Text>
            </View>
          ) : null}

          {/* Student cards */}
          {students && filteredStudents.length > 0 ? (
            <View style={{ gap: 11 }}>
              {filteredStudents.map((student) => {
                const expanded = expandedId === student.id;

                return (
                  <Pressable
                    key={student.id}
                    onPress={() => setExpandedId(expanded ? null : student.id)}
                    accessibilityRole="button"
                    accessibilityState={{ expanded }}
                    style={{
                      padding: 15,
                      borderRadius: 20,
                      borderWidth: 1,
                      borderColor: expanded ? colors.primary : colors.border,
                      backgroundColor: colors.card,
                      gap: 13,
                    }}
                  >
                    {/* Main student row */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                      }}
                    >
                      <View
                        style={{
                          width: 45,
                          height: 45,
                          borderRadius: 23,
                          alignItems: "center",
                          justifyContent: "center",
                          backgroundColor: colors.secondary,
                        }}
                      >
                        <Text
                          style={{
                            color: colors.primary,
                            fontSize: 13,
                            fontWeight: "900",
                          }}
                        >
                          {initials(student)}
                        </Text>
                      </View>

                      <View style={{ flex: 1, gap: 4 }}>
                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.foreground,
                            fontSize: 13,
                            fontWeight: "800",
                          }}
                        >
                          {student.name ?? "Unnamed student"}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 10,
                          }}
                        >
                          {student.email ?? "No email provided"}
                        </Text>

                        <Text
                          numberOfLines={1}
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 10,
                          }}
                        >
                          {student.campus ?? "No campus yet"}
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
                            color: colors.primary,
                            fontSize: 15,
                            fontWeight: "900",
                          }}
                        >
                          {student.swipes}
                        </Text>

                        <Text
                          style={{
                            color: colors.mutedForeground,
                            fontSize: 9,
                          }}
                        >
                          swipes
                        </Text>
                      </View>
                    </View>

                    {/* Status and expand indicator */}
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingTop: 11,
                        borderTopWidth: 1,
                        borderTopColor: colors.border,
                      }}
                    >
                      <View
                        style={{
                          paddingHorizontal: 9,
                          paddingVertical: 5,
                          borderRadius: 8,
                          backgroundColor: student.onboarding_completed
                            ? colors.secondary
                            : colors.muted,
                        }}
                      >
                        <Text
                          style={{
                            color: student.onboarding_completed
                              ? colors.primary
                              : colors.mutedForeground,
                            fontSize: 9,
                            fontWeight: "800",
                          }}
                        >
                          {student.onboarding_completed
                            ? "ONBOARDED"
                            : "INCOMPLETE ONBOARDING"}
                        </Text>
                      </View>

                      <Text
                        style={{
                          color: colors.mutedForeground,
                          fontSize: 11,
                          fontWeight: "700",
                        }}
                      >
                        {expanded ? "Show less  ↑" : "View details  ↓"}
                      </Text>
                    </View>

                    {/* Expanded details */}
                    {expanded ? (
                      <View
                        style={{
                          paddingTop: 12,
                          borderTopWidth: 1,
                          borderTopColor: colors.border,
                          gap: 12,
                        }}
                      >
                        <View
                          style={{
                            flexDirection: "row",
                            flexWrap: "wrap",
                            gap: 12,
                          }}
                        >
                          <View style={{ flex: 1, minWidth: 120, gap: 4 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 10,
                              }}
                            >
                              Academic program
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {student.program ?? "Not provided"}
                            </Text>
                          </View>

                          <View style={{ flex: 1, minWidth: 120, gap: 4 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 10,
                              }}
                            >
                              Campus
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {student.campus ?? "Not selected"}
                            </Text>
                          </View>

                          <View style={{ flex: 1, minWidth: 120, gap: 4 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 10,
                              }}
                            >
                              Registration date
                            </Text>
                            <Text
                              style={{
                                color: colors.foreground,
                                fontSize: 12,
                                fontWeight: "700",
                              }}
                            >
                              {formatDate(student.joined_at)}
                            </Text>
                          </View>

                          <View style={{ flex: 1, minWidth: 120, gap: 4 }}>
                            <Text
                              style={{
                                color: colors.mutedForeground,
                                fontSize: 10,
                              }}
                            >
                              Recorded swipes
                            </Text>
                            <Text
                              style={{
                                color: colors.primary,
                                fontSize: 12,
                                fontWeight: "900",
                              }}
                            >
                              {student.swipes}
                            </Text>
                          </View>
                        </View>
                      </View>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          ) : null}

          {/* Empty state */}
          {students && filteredStudents.length === 0 && !loading ? (
            <View
              style={{
                alignItems: "center",
                paddingHorizontal: 20,
                paddingVertical: 35,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: colors.border,
                backgroundColor: colors.card,
                gap: 10,
              }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  borderRadius: 19,
                  backgroundColor: colors.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 25,
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
                  ? "No matching students"
                  : "No students in this category"}
              </Text>

              <Text
                style={{
                  maxWidth: 260,
                  color: colors.mutedForeground,
                  fontSize: 11,
                  lineHeight: 18,
                  textAlign: "center",
                }}
              >
                {search.trim()
                  ? "Try another name, email, campus, or program."
                  : "Student accounts matching this filter will appear here."}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Data scope note */}
        <Text
          style={{
            color: colors.mutedForeground,
            fontSize: 10,
            lineHeight: 16,
            textAlign: "center",
          }}
        >
          Student details are based on the records returned by the current admin
          dashboard service.
        </Text>
      </View>
    </ScrollView>
  );
}
