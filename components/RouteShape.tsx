// components/RouteShape.tsx
// Draws a GPS route as a line (no map tiles) - used for activity thumbnails,
// and as the map on native builds.

import React from "react";
import { View, StyleSheet } from "react-native";
import Svg, { Polyline, Circle } from "react-native-svg";
import { LatLng } from "../constants/types";
import { useAppTheme } from "../context/ThemeContext";

interface RouteShapeProps {
  segments: LatLng[][];
  width: number;
  height: number;
  strokeWidth?: number;
  padding?: number;
}

export default function RouteShape({ segments, width, height, strokeWidth = 3, padding = 6 }: RouteShapeProps) {
  const { theme } = useAppTheme();
  const all = segments.flat();

  if (all.length < 2) {
    return <View style={[styles.empty, { width, height, backgroundColor: theme.background }]} />;
  }

  // Equirectangular projection, scaled by cos(latitude) so shapes aren't stretched.
  const midLat = (Math.min(...all.map((p) => p[0])) + Math.max(...all.map((p) => p[0]))) / 2;
  const kx = Math.cos((midLat * Math.PI) / 180);
  const xs = all.map((p) => p[1] * kx);
  const ys = all.map((p) => p[0]);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const span = Math.max(maxX - minX, maxY - minY) || 1e-6;
  const scale = Math.min(width - padding * 2, height - padding * 2) / span;
  const offX = (width - (maxX - minX) * scale) / 2;
  const offY = (height - (maxY - minY) * scale) / 2;
  const project = (p: LatLng) => [offX + (p[1] * kx - minX) * scale, offY + (maxY - p[0]) * scale] as const;

  const start = project(all[0]);
  const end = project(all[all.length - 1]);

  return (
    <View style={{ width, height, borderRadius: 10, overflow: "hidden", backgroundColor: theme.background }}>
      <Svg width={width} height={height}>
        {segments
          .filter((s) => s.length > 1)
          .map((s, i) => (
            <Polyline
              key={i}
              points={s.map((p) => project(p).join(",")).join(" ")}
              fill="none"
              stroke="#FC4C02"
              strokeWidth={strokeWidth}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ))}
        <Circle cx={start[0]} cy={start[1]} r={strokeWidth + 1} fill={theme.success} />
        <Circle cx={end[0]} cy={end[1]} r={strokeWidth + 1} fill={theme.danger} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { borderRadius: 10 },
});
