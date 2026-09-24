// components/RouteMap.tsx
// Native fallback for the route map: draws the route shape without map tiles.
// The web build (what runs on the iPhone home screen) uses RouteMap.web.tsx,
// which shows a real OpenStreetMap map.

import React, { useState } from "react";
import { View, Text, StyleSheet, LayoutChangeEvent } from "react-native";
import RouteShape from "./RouteShape";
import { LatLng } from "../constants/types";
import { useAppTheme } from "../context/ThemeContext";

export interface RouteMapProps {
  segments: LatLng[][];
  height: number;
  /** Follow the latest point (live tracking) instead of fitting the whole route. */
  follow?: boolean;
}

export default function RouteMap({ segments, height }: RouteMapProps) {
  const { theme } = useAppTheme();
  const [width, setWidth] = useState(0);
  const points = segments.flat().length;

  return (
    <View
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
      style={[styles.box, { height, backgroundColor: theme.surfaceAlt }]}
    >
      {points < 2 ? (
        <Text style={{ color: theme.subtext }}>Waiting for GPS…</Text>
      ) : width > 0 ? (
        <RouteShape segments={segments} width={width} height={height} strokeWidth={4} padding={20} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
});
