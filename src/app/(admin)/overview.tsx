import { useFocusEffect } from "expo-router";
import { useCallback, useState, type ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
  useWindowDimensions,
  type ViewStyle,
} from "react-native";

import { colors } from "../../constants/brand";
import {
  adminGetStats,
  type AdminDashboardAnalytics,
  type AdminStats,
} from "../../lib/api";
import { useApp } from "../../lib/store";

type Period = 7 | 30;

type ChartPoint = {
  date: string;
  value: number;
};

function formatNumber(value: number | null | undefined): string {
  return value == null ? "—" : value.toLocaleString();
}

function Panel({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View
      style={[
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          borderWidth: 1,
          borderRadius: 22,
          padding: 18,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

function PanelHeading({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: string;
}) {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
        gap: 10,
        marginBottom: 18,
      }}
    >
      <View style={{ flex: 1 }}>
        <Text
          style={{
            color: colors.foreground,
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          {title}
        </Text>

        {subtitle ? (
          <Text
            style={{
              color: colors.mutedForeground,
              fontSize: 12,
              marginTop: 5,
            }}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      {trailing !== undefined ? (
        <Text
          style={{
            color: colors.primary,
            fontSize: 13,
            fontWeight: "900",
          }}
        >
          {trailing}
        </Text>
      ) : null}
    </View>
  );
}

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
        width: "100%",
        minHeight: 132,
        backgroundColor: colors.card,
        borderColor: colors.border,
        borderWidth: 1,
        borderRadius: 20,
        padding: 16,
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 12,
          fontWeight: "700",
        }}
      >
        {label}
      </Text>

      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        style={{
          color: accent ? colors.accent : colors.primary,
          fontSize: 29,
          fontWeight: "900",
          letterSpacing: -1,
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

function EmptyState({ message }: { message: string }) {
  return (
    <View
      style={{
        minHeight: 115,
        alignItems: "center",
        justifyContent: "center",
        paddingVertical: 12,
      }}
    >
      <View
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          backgroundColor: colors.secondary,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 10,
        }}
      >
        <Text
          style={{
            color: colors.primary,
            fontSize: 21,
            fontWeight: "800",
          }}
        >
          —
        </Text>
      </View>

      <Text
        style={{
          color: colors.mutedForeground,
          fontSize: 12,
          textAlign: "center",
        }}
      >
        {message}
      </Text>
    </View>
  );
}

function formatDate(date: string, period: Period): string {
  const parsed = new Date(`${date}T12:00:00`);

  if (period === 7) {
    return parsed.toLocaleDateString("en-PH", {
      weekday: "short",
    });
  }

  return String(parsed.getDate());
}

function BarChart({
  data,
  period,
  emptyMessage,
}: {
  data: ChartPoint[];
  period: Period;
  emptyMessage: string;
}) {
  const maximum = Math.max(1, ...data.map((item) => item.value));
  const hasValues = data.some((item) => item.value > 0);

  if (!data.length || !hasValues) {
    return <EmptyState message={emptyMessage} />;
  }

  const chartWidth = period === 30 ? 720 : "100%";

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={period === 30}
      contentContainerStyle={{
        width: chartWidth,
        flexGrow: 1,
      }}
    >
      <View
        style={{
          width: chartWidth,
          height: 155,
          flexDirection: "row",
          alignItems: "flex-end",
          justifyContent: "space-between",
          paddingTop: 8,
          gap: period === 30 ? 5 : 8,
        }}
      >
        {data.map((item, index) => {
          const height =
            item.value === 0 ? 3 : Math.max(7, (item.value / maximum) * 105);

          const showLabel =
            period === 7 || index % 5 === 0 || index === data.length - 1;

          return (
            <View
              key={item.date}
              style={{
                flex: 1,
                minWidth: 0,
                height: 150,
                alignItems: "center",
                justifyContent: "flex-end",
                gap: 7,
              }}
            >
              <Text
                style={{
                  color: colors.foreground,
                  fontSize: 10,
                  fontWeight: "800",
                }}
              >
                {item.value > 0 ? item.value : ""}
              </Text>

              <View
                style={{
                  width: "100%",
                  maxWidth: 34,
                  minWidth: 3,
                  height,
                  borderRadius: 8,
                  backgroundColor:
                    item.value > 0 ? colors.primary : colors.border,
                }}
              />

              <Text
                style={{
                  height: 13,
                  color: colors.mutedForeground,
                  fontSize: 9,
                  fontWeight: "600",
                }}
              >
                {showLabel ? formatDate(item.date, period) : ""}
              </Text>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

function EngagementPanel({
  analytics,
}: {
  analytics: AdminDashboardAnalytics;
}) {
  const likes = analytics.engagement.total_likes;
  const passes = analytics.engagement.total_passes;
  const total = likes + passes;

  const likesPercentage = total > 0 ? (likes / total) * 100 : 0;
  const passesPercentage = total > 0 ? (passes / total) * 100 : 0;

  return (
    <Panel style={{ flex: 1 }}>
      <PanelHeading
        title="Engagement breakdown"
        subtitle="Likes versus passes"
      />

      {total === 0 ? (
        <EmptyState message="No engagement activity recorded yet." />
      ) : (
        <>
          <View
            style={{
              height: 13,
              flexDirection: "row",
              overflow: "hidden",
              borderRadius: 20,
              backgroundColor: colors.muted,
              marginBottom: 22,
            }}
          >
            <View
              style={{
                width: `${likesPercentage}%`,
                backgroundColor: colors.primary,
              }}
            />

            <View
              style={{
                width: `${passesPercentage}%`,
                backgroundColor: colors.accent,
              }}
            />
          </View>

          <View
            style={{
              flexDirection: "row",
              gap: 16,
            }}
          >
            {[
              {
                label: "Likes",
                value: likes,
                percentage: likesPercentage,
                color: colors.primary,
              },
              {
                label: "Passes",
                value: passes,
                percentage: passesPercentage,
                color: colors.accent,
              },
            ].map((item) => (
              <View key={item.label} style={{ flex: 1, gap: 7 }}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <View
                    style={{
                      width: 9,
                      height: 9,
                      borderRadius: 5,
                      backgroundColor: item.color,
                    }}
                  />

                  <Text
                    style={{
                      color: colors.mutedForeground,
                      fontSize: 11,
                      fontWeight: "700",
                    }}
                  >
                    {item.label}
                  </Text>
                </View>

                <Text
                  style={{
                    color: colors.foreground,
                    fontSize: 23,
                    fontWeight: "900",
                  }}
                >
                  {formatNumber(item.value)}
                </Text>

                <Text
                  style={{
                    color: colors.mutedForeground,
                    fontSize: 11,
                  }}
                >
                  {item.percentage.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </Panel>
  );
}

function TopListings({
  listings,
}: {
  listings: AdminDashboardAnalytics["most_liked"];
}) {
  return (
    <Panel style={{ flex: 1 }}>
      <PanelHeading
        title="Most liked listings"
        subtitle="Ranked by current likes"
      />

      {listings.length === 0 ? (
        <EmptyState message="No likes yet. Popular listings will appear here." />
      ) : (
        <View style={{ gap: 13 }}>
          {listings.slice(0, 5).map((listing, index) => (
            <View
              key={listing.listing_id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                gap: 11,
              }}
            >
              <View
                style={{
                  width: 34,
                  height: 34,
                  borderRadius: 12,
                  backgroundColor:
                    index === 0 ? colors.primary : colors.secondary,
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text
                  style={{
                    color:
                      index === 0 ? colors.primaryForeground : colors.primary,
                    fontSize: 13,
                    fontWeight: "900",
                  }}
                >
                  {index + 1}
                </Text>
              </View>

              <Text
                numberOfLines={1}
                style={{
                  flex: 1,
                  color: colors.foreground,
                  fontSize: 12,
                  fontWeight: "700",
                }}
              >
                {listing.title}
              </Text>

              <View
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderRadius: 10,
                  backgroundColor: colors.secondary,
                }}
              >
                <Text
                  style={{
                    color: colors.primary,
                    fontSize: 10,
                    fontWeight: "900",
                  }}
                >
                  {formatNumber(listing.likes)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Panel>
  );
}

export default function Overview() {
  const { account } = useApp();
  const accountId = account?.id;

  const { width } = useWindowDimensions();

  const isWide = width >= 850;
  const isTablet = width >= 600;

  const [period, setPeriod] = useState<Period>(7);
  const [data, setData] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      if (!accountId) return;

      let active = true;

      setLoading(true);
      setError(null);

      adminGetStats(period)
        .then((result) => {
          if (!active) return;
          setData(result);
        })
        .catch((e: unknown) => {
          if (!active) return;

          setError(
            e instanceof Error
              ? e.message
              : "Could not load dashboard analytics.",
          );
        })
        .finally(() => {
          if (active) setLoading(false);
        });

      return () => {
        active = false;
      };
    }, [accountId, period]),
  );

  const analytics = data?.analytics;

  const dailyActivity: ChartPoint[] =
    analytics?.daily_activity.map((item) => ({
      date: item.date,
      value: item.swipes,
    })) ?? [];

  const dailyRegistrations: ChartPoint[] =
    analytics?.daily_registrations.map((item) => ({
      date: item.date,
      value: item.students,
    })) ?? [];

  const mostLiked = analytics?.most_liked ?? [];

  const registrationTotal = dailyRegistrations.reduce(
    (sum, item) => sum + item.value,
    0,
  );

  const statWidth = isWide ? "23.5%" : "48.5%";

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={{
        paddingHorizontal: isWide ? 28 : 16,
        paddingTop: isWide ? 26 : 20,
        paddingBottom: 40,
        alignItems: "center",
      }}
      showsVerticalScrollIndicator={false}
    >
      <View
        style={{
          width: "100%",
          maxWidth: 1150,
          gap: 18,
        }}
      >
        {/* Dashboard header */}
        <View
          style={{
            flexDirection: isTablet ? "row" : "column",
            alignItems: isTablet ? "center" : "flex-start",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <View style={{ flex: 1 }}>
            <Text
              style={{
                color: colors.foreground,
                fontSize: isWide ? 29 : 25,
                fontWeight: "900",
                letterSpacing: -0.8,
              }}
            >
              Dashboard overview
            </Text>

            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 13,
                marginTop: 5,
              }}
            >
              Monitor your student housing platform.
            </Text>
          </View>

          {/* Reporting period */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              padding: 4,
              borderRadius: 14,
              backgroundColor: colors.muted,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            {([7, 30] as const).map((value) => {
              const selected = period === value;

              return (
                <Pressable
                  key={value}
                  disabled={loading && !data}
                  onPress={() => setPeriod(value)}
                  style={{
                    paddingHorizontal: 19,
                    paddingVertical: 10,
                    borderRadius: 11,
                    backgroundColor: selected ? colors.primary : "transparent",
                  }}
                >
                  <Text
                    style={{
                      color: selected
                        ? colors.primaryForeground
                        : colors.mutedForeground,
                      fontSize: 12,
                      fontWeight: "800",
                    }}
                  >
                    {value} days
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Error message */}
        {error ? (
          <View
            style={{
              backgroundColor: colors.destructive + "12",
              borderColor: colors.destructive,
              borderWidth: 1,
              borderRadius: 14,
              padding: 13,
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
          </View>
        ) : null}

        {/* Initial loading */}
        {loading && !data ? (
          <View
            style={{
              minHeight: 220,
              justifyContent: "center",
              alignItems: "center",
              gap: 12,
            }}
          >
            <ActivityIndicator size="large" color={colors.primary} />

            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 12,
              }}
            >
              Loading dashboard...
            </Text>
          </View>
        ) : data ? (
          <>
            {/* KPI cards */}
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
                  label="Active listings"
                  value={`${formatNumber(data.stats.active_listings)}/${formatNumber(data.stats.total_listings)}`}
                  description="Currently active properties"
                />
              </View>

              <View style={{ width: statWidth }}>
                <StatCard
                  label="Registered students"
                  value={formatNumber(data.stats.registered_students)}
                  description="All registered student accounts"
                />
              </View>

              <View style={{ width: statWidth }}>
                <StatCard
                  label="Total swipes"
                  value={formatNumber(analytics?.engagement.total_swipes)}
                  description={`During the last ${period} days`}
                  accent
                />
              </View>

              <View style={{ width: statWidth }}>
                <StatCard
                  label="Total likes"
                  value={formatNumber(analytics?.engagement.total_likes)}
                  description={`During the last ${period} days`}
                />
              </View>
            </View>

            {/* Charts */}
            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                gap: 14,
              }}
            >
              <View style={{ flex: 1, minWidth: 0 }}>
                <Panel>
                  <PanelHeading
                    title="Swipe activity"
                    subtitle={`Daily swipe activity · ${period} days`}
                    trailing={formatNumber(analytics?.engagement.total_swipes)}
                  />

                  <BarChart
                    data={dailyActivity}
                    period={period}
                    emptyMessage="No swipe activity recorded in this period."
                  />
                </Panel>
              </View>

              <View style={{ flex: 1, minWidth: 0 }}>
                <Panel>
                  <PanelHeading
                    title="Student registrations"
                    subtitle={`New student accounts · ${period} days`}
                    trailing={formatNumber(registrationTotal)}
                  />

                  <BarChart
                    data={dailyRegistrations}
                    period={period}
                    emptyMessage="No new student registrations in this period."
                  />
                </Panel>
              </View>
            </View>

            {/* Engagement and popular listings */}
            <View
              style={{
                flexDirection: isWide ? "row" : "column",
                gap: 14,
              }}
            >
              {analytics ? (
                <View style={{ flex: 1, minWidth: 0 }}>
                  <EngagementPanel analytics={analytics} />
                </View>
              ) : null}

              <View style={{ flex: 1, minWidth: 0 }}>
                <TopListings listings={mostLiked} />
              </View>
            </View>

            {/* Footer */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 3,
              }}
            >
              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 10,
                }}
              >
                {loading ? "Updating analytics..." : "Dashboard updated"}
              </Text>

              <Text
                style={{
                  color: colors.mutedForeground,
                  fontSize: 10,
                }}
              >
                {analytics?.period.timezone ?? "Asia/Manila"}
              </Text>
            </View>
          </>
        ) : !error ? (
          <Panel>
            <Text
              style={{
                color: colors.mutedForeground,
                textAlign: "center",
                fontSize: 12,
              }}
            >
              Dashboard data is not available.
            </Text>
          </Panel>
        ) : null}
      </View>
    </ScrollView>
  );
}
