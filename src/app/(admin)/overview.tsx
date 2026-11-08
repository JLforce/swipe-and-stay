import { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import { Btn, Card, SectionTitle } from "../../components/kit";
import { ListingFormModal } from "../../components/ListingForm";
import { BASE_LIKES, type Listing } from "../../data/mockData";
import { boardersStore, conversationsStore, myListingsStore } from "../../lib/landlordStore";
import { useApp } from "../../lib/store";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card className="w-[48%] p-3">
      <Text className="text-xl font-extrabold text-primary">{value}</Text>
      <Text className="mt-1 text-[11px] font-semibold text-muted-foreground">{label}</Text>
    </Card>
  );
}

export default function Overview() {
  const { likedIds, upsertListing, flash } = useApp();
  const [mine] = myListingsStore.use();
  const [boarders] = boardersStore.use();
  const [chats] = conversationsStore.use();
  const [formKey, setFormKey] = useState<number | null>(null);

  const active = mine.filter((l) => l.active).length;
  const likesOf = (id: string) => (BASE_LIKES[id] ?? 0) + (likedIds.includes(id) ? 1 : 0);
  const totalLikes = mine.reduce((s, l) => s + likesOf(String(l.id)), 0);
  const unread = chats.reduce((s, c) => s + c.unread, 0);
  const rentDue = boarders.filter((b) => !b.paid).length;

  const mostLiked = mine
    .map((l) => ({ l, likes: likesOf(String(l.id)) }))
    .filter((x) => x.likes > 0)
    .sort((a, b) => b.likes - a.likes)
    .slice(0, 3);

  const notices: string[] = [];
  if (mine.length === 0) notices.push("Add your first posting to start getting students.");
  if (unread > 0) notices.push(`${unread} unread message${unread > 1 ? "s" : ""}`);
  if (rentDue > 0) notices.push(`${rentDue} boarder${rentDue > 1 ? "s have" : " has"} rent due`);

  return (
    <ScrollView className="flex-1 bg-background" contentContainerClassName="gap-4 px-4 pb-10">
      <Btn icon="add" label="Add a new posting" onPress={() => setFormKey(Date.now())} />

      <View className="flex-row flex-wrap justify-between gap-y-3">
        <Stat label="Active listings" value={`${active}/${mine.length}`} />
        <Stat label="Current boarders" value={`${boarders.length}`} />
        <Stat label="Total likes" value={`${totalLikes}`} />
        <Stat label="Unread messages" value={`${unread}`} />
      </View>

      <View>
        <SectionTitle>Needs your attention</SectionTitle>
        <Card className="gap-2">
          {notices.length === 0 ? (
            <Text className="text-sm text-muted-foreground">You're all caught up.</Text>
          ) : (
            notices.map((t) => (
              <Text key={t} className="text-sm text-foreground">
                • {t}
              </Text>
            ))
          )}
        </Card>
      </View>

      <View>
        <SectionTitle>Your most liked listings</SectionTitle>
        <Card className="gap-3">
          {mostLiked.map(({ l, likes }, i) => (
            <View key={l.id} className="flex-row items-center gap-3">
              <View className="h-7 w-7 items-center justify-center rounded-full bg-secondary">
                <Text className="text-xs font-extrabold text-primary">{i + 1}</Text>
              </View>
              <Text className="flex-1 text-sm font-semibold text-foreground" numberOfLines={1}>
                {l.title}
              </Text>
              <Text className="text-sm font-bold text-muted-foreground">♡ {likes}</Text>
            </View>
          ))}
          {mostLiked.length === 0 ? <Text className="text-sm text-muted-foreground">No likes yet.</Text> : null}
        </Card>
      </View>

      {formKey ? (
        <ListingFormModal
          key={formKey}
          visible
          listing={null}
          onClose={() => setFormKey(null)}
          onSave={(l) => {
            const saved = (l.id ? l : { ...l, id: `L${Date.now()}` }) as Listing;
            upsertListing(saved);
            myListingsStore.set((p) => [...p, saved]);
            flash("Listing added");
            setFormKey(null);
          }}
        />
      ) : null}
    </ScrollView>
  );
}