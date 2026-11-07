// Native (iOS/Android) map. Metro uses SavedMap.web.tsx on web, because react-native-maps
// has no web support and would crash the web/static render.
import { View } from "react-native";
import MapView, { Marker } from "react-native-maps";
import type { Campus } from "../constants/housing";
import type { Listing } from "../data/mockData";
import { peso } from "../lib/format";

export interface SavedMapItem {
  l: Listing;
  km: number;
}

export function SavedMap({
  campus,
  items,
  onOpen,
}: {
  campus: Campus;
  items: SavedMapItem[];
  onOpen: (id: string) => void;
}) {
  return (
    <View className="h-[380px] overflow-hidden rounded-3xl border border-border">
      <MapView
        style={{ flex: 1 }}
        initialRegion={{ latitude: campus.lat, longitude: campus.lng, latitudeDelta: 0.09, longitudeDelta: 0.09 }}
      >
        <Marker coordinate={{ latitude: campus.lat, longitude: campus.lng }} title={campus.short} description="Your campus" pinColor="blue" />
        {items.map(({ l, km }) => (
          <Marker
            key={l.id}
            coordinate={{ latitude: l.coords.lat, longitude: l.coords.lng }}
            title={l.title}
            description={`${peso(l.price)} · ${km.toFixed(1)} km`}
            onCalloutPress={() => onOpen(l.id)}
          />
        ))}
      </MapView>
    </View>
  );
}
