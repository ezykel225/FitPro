// components/RouteMap.web.tsx
// Web version of the route map: a real OpenStreetMap map (via Leaflet) with
// the route drawn on top. Metro picks this file over RouteMap.tsx for web.

import React, { useEffect, useRef } from "react";
import { View, Text, StyleSheet } from "react-native";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useAppTheme } from "../context/ThemeContext";
import type { RouteMapProps } from "./RouteMap";

const ROUTE_COLOR = "#FC4C02";

export default function RouteMap({ segments, height, follow = false }: RouteMapProps) {
  const { theme } = useAppTheme();
  const containerRef = useRef<View>(null);
  const mapRef = useRef<L.Map | null>(null);
  const layerRef = useRef<L.LayerGroup | null>(null);
  const fitRef = useRef<() => void>(() => {});
  const hasPoints = segments.some((s) => s.length > 0);

  // Create the map once there's somewhere to put it.
  useEffect(() => {
    const el = containerRef.current as unknown as HTMLElement | null;
    if (!el || mapRef.current || !hasPoints) return;
    const map = L.map(el, { zoomControl: false, attributionControl: true, fadeAnimation: false });
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution: "© OpenStreetMap",
    }).addTo(map);
    layerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const pts = segments.flat();
    map.setView(pts[pts.length - 1], 17, { animate: false });

    // The map can be created mid screen-transition, before its box has its
    // final size - re-measure (and re-fit the route) whenever the box resizes.
    const observer = new ResizeObserver(() => {
      map.invalidateSize();
      fitRef.current();
    });
    observer.observe(el);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasPoints]);

  useEffect(
    () => () => {
      mapRef.current?.remove();
      mapRef.current = null;
    },
    []
  );

  // Redraw the route whenever it changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = layerRef.current;
    const all = segments.flat();
    if (!map || !layer || all.length === 0) return;
    layer.clearLayers();
    for (const segment of segments) {
      if (segment.length > 1) {
        L.polyline(segment as L.LatLngExpression[], { color: ROUTE_COLOR, weight: 5, opacity: 0.9 }).addTo(layer);
      }
    }
    const first = all[0];
    const last = all[all.length - 1];
    L.circleMarker(first, { radius: 6, color: "#fff", weight: 2, fillColor: theme.success, fillOpacity: 1 }).addTo(layer);
    L.circleMarker(last, {
      radius: follow ? 8 : 6,
      color: "#fff",
      weight: 2,
      fillColor: follow ? theme.primary : theme.danger,
      fillOpacity: 1,
    }).addTo(layer);

    fitRef.current = () => {
      if (follow) map.panTo(last as L.LatLngExpression, { animate: true });
      else if (all.length > 1) map.fitBounds(L.latLngBounds(all as L.LatLngExpression[]), { padding: [24, 24], animate: false });
    };
    fitRef.current();
  }, [segments, hasPoints, follow, theme]);

  return (
    <View style={[styles.box, { height, backgroundColor: theme.surfaceAlt }]}>
      {/* zIndex: 0 keeps Leaflet's own z-indexes from covering modals and the tab bar */}
      <View ref={containerRef} style={[StyleSheet.absoluteFill, { zIndex: 0 }]} />
      {!hasPoints ? (
        <View style={styles.overlay}>
          <Text style={{ color: theme.subtext }}>Waiting for GPS…</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: 16, overflow: "hidden" },
  overlay: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },
});
