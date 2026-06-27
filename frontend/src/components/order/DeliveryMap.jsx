import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import {
  getRoutePoints,
  normalizeRoutePoint,
  splitRouteAtProgress,
} from "../../services/routeGeometry.js";

const OPENSTREETMAP_TILE_URL =
  "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const OPENSTREETMAP_ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

export default function DeliveryMap({ order }) {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const leafletRef = useRef(null);
  const corridorRouteRef = useRef(null);
  const completedRouteRef = useRef(null);
  const destinationMarkerRef = useRef(null);
  const driverMarkerRef = useRef(null);
  const edgeRouteRef = useRef(null);
  const pickupMarkerRef = useRef(null);
  const remainingRouteRef = useRef(null);
  const routeBoundsRef = useRef(null);
  const [mapGeneration, setMapGeneration] = useState(0);
  const routePoints = getRoutePoints(order);
  const pickupPoint =
    normalizeRoutePoint(order.pickupLocation) ?? routePoints[0];
  const destinationPoint =
    normalizeRoutePoint(order.deliveryLocation) ?? routePoints.at(-1);
  const destinationLabel = order.deliveryAddress?.label?.trim() || "Destination";
  const routeGeometryKey = createRouteGeometryKey(
    order.id,
    [pickupPoint, ...routePoints, destinationPoint].filter(Boolean),
  );

  useEffect(() => {
    if (!mapContainerRef.current) {
      return undefined;
    }

    let cancelled = false;
    let resizeTimer;
    let map;
    let resizeObserver;

    async function initializeMap() {
      const { default: L } = await import("leaflet");
      if (cancelled || !mapContainerRef.current) {
        return;
      }

      map = L.map(mapContainerRef.current, {
        attributionControl: true,
        preferCanvas: true,
        scrollWheelZoom: false,
        zoomControl: true,
      });
      mapRef.current = map;
      leafletRef.current = L;

      L.tileLayer(OPENSTREETMAP_TILE_URL, {
        attribution: OPENSTREETMAP_ATTRIBUTION,
        maxZoom: 19,
      }).addTo(map);
      setMapGeneration((generation) => generation + 1);

      let previousWidth = 0;
      let previousHeight = 0;
      resizeObserver = new ResizeObserver(([entry]) => {
        const { height, width } = entry.contentRect;
        if (
          Math.abs(width - previousWidth) < 2 &&
          Math.abs(height - previousHeight) < 2
        ) {
          return;
        }
        previousWidth = width;
        previousHeight = height;
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(() => {
          map.invalidateSize({ animate: false, pan: false });
          fitMapToRoute(map, routeBoundsRef.current);
        }, 100);
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    initializeMap();

    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      resizeObserver?.disconnect();
      corridorRouteRef.current = null;
      completedRouteRef.current = null;
      destinationMarkerRef.current = null;
      driverMarkerRef.current = null;
      edgeRouteRef.current = null;
      leafletRef.current = null;
      remainingRouteRef.current = null;
      pickupMarkerRef.current = null;
      routeBoundsRef.current = null;
      mapRef.current = null;
      map?.remove();
    };
  }, []);

  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map || routePoints.length < 2) {
      return;
    }

    const routeLatLngs = toLatLngs(L, routePoints);
    const routeOptions = {
      lineCap: "round",
      lineJoin: "round",
    };

    corridorRouteRef.current = updatePolyline({
      L,
      map,
      options: {
        ...routeOptions,
        className: "otter-route-corridor",
        color: "#c6e8e3",
        opacity: 0.82,
        weight: 13,
      },
      points: routeLatLngs,
      polyline: corridorRouteRef.current,
    });
    edgeRouteRef.current = updatePolyline({
      L,
      map,
      options: {
        ...routeOptions,
        className: "otter-route-edge",
        color: "rgba(49, 92, 89, 0.18)",
        opacity: 0.55,
        weight: 1,
      },
      points: routeLatLngs,
      polyline: edgeRouteRef.current,
    });

    const segments = splitRouteAtProgress(routePoints, order.routeProgress);
    completedRouteRef.current = updatePolyline({
      L,
      map,
      options: {
        ...routeOptions,
        className: "otter-route-completed",
        color: "#f7fbfa",
        opacity: 0.96,
        weight: 8,
      },
      points: toLatLngs(L, segments.completed),
      polyline: completedRouteRef.current,
    });
    remainingRouteRef.current = updatePolyline({
      L,
      map,
      options: {
        ...routeOptions,
        className: "otter-route-remaining",
        color: "#177c76",
        opacity: 1,
        weight: 6,
      },
      points: toLatLngs(L, segments.remaining),
      polyline: remainingRouteRef.current,
    });

    pickupMarkerRef.current = updateMarker({
      L,
      icon: createMarkerIcon(L, "pickup", "Pickup"),
      map,
      marker: pickupMarkerRef.current,
      point: toLatLng(L, pickupPoint),
      zIndexOffset: 300,
    });
    destinationMarkerRef.current = updateMarker({
      L,
      icon: createMarkerIcon(L, "destination", destinationLabel),
      map,
      marker: destinationMarkerRef.current,
      point: toLatLng(L, destinationPoint),
      zIndexOffset: 300,
    });

    if (!driverMarkerRef.current) {
      driverMarkerRef.current = L.marker(
        toLatLng(
          L,
          normalizeRoutePoint(order.driverLocation) ??
            pickupPoint,
        ),
        {
          icon: createMarkerIcon(L, "driver", "Driver", order.driverHeading),
          keyboard: false,
          zIndexOffset: 600,
        },
      );
    }

    routeBoundsRef.current = L.latLngBounds([
      ...routeLatLngs,
      toLatLng(L, pickupPoint),
      toLatLng(L, destinationPoint),
    ]);
    map.invalidateSize({ animate: false, pan: false });
    fitMapToRoute(map, routeBoundsRef.current);
  }, [destinationLabel, mapGeneration, routeGeometryKey]);

  useEffect(() => {
    const map = mapRef.current;
    const marker = driverMarkerRef.current;
    if (!map || !marker) {
      return;
    }

    if (!isDriverVisible(order.phase)) {
      if (map.hasLayer(marker)) {
        map.removeLayer(marker);
      }
      return;
    }

    if (!map.hasLayer(marker)) {
      marker.addTo(map);
    }
    const driverLocation = normalizeRoutePoint(order.driverLocation);
    if (!driverLocation) {
      return;
    }

    marker.setLatLng(toCoordinatePair(driverLocation));
    const arrow = marker.getElement()?.querySelector(".otter-driver-arrow");
    if (arrow) {
      arrow.style.transform = `rotate(${Number(order.driverHeading) || 0}deg)`;
    }
  }, [mapGeneration, order.driverHeading, order.driverLocation, order.phase]);

  useEffect(() => {
    const completedRoute = completedRouteRef.current;
    const remainingRoute = remainingRouteRef.current;
    if (!completedRoute || !remainingRoute) {
      return;
    }

    const segments = splitRouteAtProgress(routePoints, order.routeProgress);
    completedRoute.setLatLngs(toCoordinatePairs(segments.completed));
    remainingRoute.setLatLngs(toCoordinatePairs(segments.remaining));
  }, [mapGeneration, order.routeProgress, routeGeometryKey]);

  return (
    <div className="lg:col-span-2 flex min-w-0 flex-col gap-4">
      <div className="relative h-[460px] overflow-hidden rounded-xl border border-surface bg-[#e8f0ec] shadow-[0_12px_32px_rgba(36,36,38,0.04)] lg:h-[620px]">
        <div
          aria-label="Coordinate-aware Otter Delivery map"
          className="otter-coordinate-map absolute inset-0"
          ref={mapContainerRef}
          role="region"
        />
        <div className="pointer-events-none absolute bottom-7 left-3 z-[500] rounded-full border border-surface bg-surface-container-lowest/95 px-3 py-1.5 font-metadata text-metadata text-on-surface-variant shadow-sm">
          {order.routeProvider === "google_routes"
            ? "Google road route"
            : "Coordinate-aware fallback · may not follow roads"}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="flex items-center gap-3 rounded-xl border border-surface bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-container text-on-primary">
            <span className="material-symbols-outlined text-[20px]">
              directions_bike
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-metadata text-metadata text-on-surface-variant">
              Your rider
            </p>
            <p className="font-card-title text-[16px] text-on-surface">
              {order.rider.name}
            </p>
            <p className="truncate font-metadata text-metadata text-primary">
              {order.statusText}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 rounded-xl border border-surface bg-surface-container-lowest p-4 shadow-sm">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary-fixed text-on-secondary-fixed">
            <span className="material-symbols-outlined text-[20px]">
              location_on
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-metadata text-metadata uppercase tracking-wider text-on-surface-variant">
              Delivery to: {destinationLabel}
            </p>
            <p className="truncate font-body-md text-body-md text-on-surface">
              {order.deliveryAddress
                ? `${order.deliveryAddress.line1}, ${order.deliveryAddress.postalCode} ${order.deliveryAddress.city}`
                : "Your saved delivery address"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function createMarkerIcon(L, variant, label, heading = 0) {
  const safeLabel = escapeHtml(label);
  const driverArrow =
    variant === "driver"
      ? `<span class="otter-driver-arrow" style="transform:rotate(${Number(heading) || 0}deg)"></span>`
      : "";

  return L.divIcon({
    className: `otter-leaflet-div-icon otter-${variant}-icon`,
    html: `<div class="otter-map-marker" data-marker="${variant}">
      <span class="otter-marker-shape">${driverArrow}</span>
      <span class="otter-marker-label">${safeLabel}</span>
    </div>`,
    iconAnchor: [18, 18],
    iconSize: [36, 36],
  });
}

function toLatLngs(L, points) {
  return points.map((point) => toLatLng(L, point));
}

function toLatLng(L, point) {
  return L.latLng(Number(point.lat), Number(point.lng));
}

function toCoordinatePairs(points) {
  return points.map(toCoordinatePair);
}

function toCoordinatePair(point) {
  return [point.lat, point.lng];
}

function createRouteGeometryKey(orderId, routePoints) {
  return [orderId, ...routePoints]
    .map((point) =>
      typeof point === "object"
        ? `${Number(point.lat).toFixed(6)},${Number(point.lng).toFixed(6)}`
        : String(point ?? ""),
    )
    .join("|");
}

function fitMapToRoute(map, bounds) {
  if (!bounds?.isValid()) {
    return;
  }

  map.fitBounds(bounds, {
    animate: false,
    maxZoom: 15,
    padding: [56, 56],
  });
}

function updatePolyline({ L, map, options, points, polyline }) {
  if (polyline) {
    polyline.setLatLngs(points);
    return polyline;
  }

  return L.polyline(points, options).addTo(map);
}

function updateMarker({ L, icon, map, marker, point, zIndexOffset }) {
  if (marker) {
    marker.setIcon(icon);
    marker.setLatLng(point);
    return marker;
  }

  return L.marker(point, {
    icon,
    keyboard: false,
    zIndexOffset,
  }).addTo(map);
}

function isDriverVisible(phase) {
  return ["ON_THE_WAY", "ARRIVING_SOON", "DELIVERED"].includes(phase);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
