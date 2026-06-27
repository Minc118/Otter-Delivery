export function getRoutePoints(order) {
  const pickup = normalizeRoutePoint(order.pickupLocation);
  const destination = normalizeRoutePoint(order.deliveryLocation);
  const polylinePoints = decodePolyline(order.encodedPolyline);
  if (polylinePoints.length >= 2) {
    const alignedPolyline = alignRouteToEndpoints(
      polylinePoints,
      pickup,
      destination,
    );
    if (alignedPolyline.length >= 2) {
      return alignedPolyline;
    }
  }

  const suppliedPoints = normalizeRoutePoints(order.routePoints);
  if (suppliedPoints.length >= 2) {
    const alignedRoute = alignRouteToEndpoints(
      suppliedPoints,
      pickup,
      destination,
    );
    if (alignedRoute.length >= 2) {
      return alignedRoute;
    }
  }

  if (pickup && destination) {
    return createCoordinateAwareFallbackRoute(pickup, destination);
  }

  return [];
}

export function interpolateRoute(points, progress) {
  const route = normalizeRoutePoints(points);
  if (route.length === 0) {
    return { headingDegrees: 0, location: null };
  }
  if (route.length === 1) {
    return { headingDegrees: 0, location: route[0] };
  }

  const segmentLengths = [];
  let routeLength = 0;
  for (let index = 1; index < route.length; index += 1) {
    const length = distanceBetween(route[index - 1], route[index]);
    segmentLengths.push(length);
    routeLength += length;
  }

  const targetDistance = clamp(progress, 0, 1) * routeLength;
  let traversedDistance = 0;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    if (
      traversedDistance + segmentLength >= targetDistance ||
      index === segmentLengths.length - 1
    ) {
      const start = route[index];
      const end = route[index + 1];
      const segmentProgress =
        segmentLength === 0
          ? 0
          : (targetDistance - traversedDistance) / segmentLength;
      return {
        headingDegrees: headingBetween(start, end),
        location: {
          lat: start.lat + (end.lat - start.lat) * segmentProgress,
          lng: start.lng + (end.lng - start.lng) * segmentProgress,
        },
      };
    }
    traversedDistance += segmentLength;
  }

  return { headingDegrees: 0, location: route.at(-1) };
}

export function splitRouteAtProgress(points, progress) {
  const route = normalizeRoutePoints(points);
  if (route.length < 2) {
    return { completed: route, remaining: route };
  }

  const normalizedProgress = clamp(progress, 0, 1);
  if (normalizedProgress === 0) {
    return { completed: [route[0]], remaining: route };
  }
  if (normalizedProgress === 1) {
    return { completed: route, remaining: [route.at(-1)] };
  }

  const segmentLengths = [];
  let routeLength = 0;
  for (let index = 1; index < route.length; index += 1) {
    const length = distanceBetween(route[index - 1], route[index]);
    segmentLengths.push(length);
    routeLength += length;
  }

  const targetDistance = normalizedProgress * routeLength;
  let traversedDistance = 0;
  for (let index = 0; index < segmentLengths.length; index += 1) {
    const segmentLength = segmentLengths[index];
    if (traversedDistance + segmentLength >= targetDistance) {
      const segmentProgress =
        segmentLength === 0
          ? 0
          : (targetDistance - traversedDistance) / segmentLength;
      const start = route[index];
      const end = route[index + 1];
      const boundary = {
        lat: start.lat + (end.lat - start.lat) * segmentProgress,
        lng: start.lng + (end.lng - start.lng) * segmentProgress,
      };
      return {
        completed: [...route.slice(0, index + 1), boundary],
        remaining: [boundary, ...route.slice(index + 1)],
      };
    }
    traversedDistance += segmentLength;
  }

  return { completed: route, remaining: [route.at(-1)] };
}

export function hashOrderId(orderId) {
  return String(orderId ?? "otter-demo")
    .split("")
    .reduce((hash, character) => {
      return (hash * 31 + character.charCodeAt(0)) >>> 0;
    }, 7);
}

function createCoordinateAwareFallbackRoute(start, end) {
  return createCurvedRoute(start, end, 7);
}

function createCurvedRoute(start, end, pointCount, seedAngle = 0) {
  const latDelta = end.lat - start.lat;
  const lngDelta = end.lng - start.lng;
  const span = Math.max(Math.abs(latDelta), Math.abs(lngDelta), 0.002);

  return Array.from({ length: pointCount }, (_, index) => {
    const progress = index / (pointCount - 1);
    const broadCurve = Math.sin(progress * Math.PI);
    const roadBend = Math.sin(progress * Math.PI * 3 + seedAngle) * broadCurve;
    return {
      lat:
        start.lat +
        latDelta * progress +
        broadCurve * span * 0.08 +
        roadBend * span * 0.025,
      lng:
        start.lng +
        lngDelta * progress -
        broadCurve * span * 0.05 +
        roadBend * span * 0.018,
    };
  });
}

export function normalizeRoutePoints(points) {
  if (!Array.isArray(points)) {
    return [];
  }
  return removeConsecutiveDuplicates(
    points.map(normalizeRoutePoint).filter(Boolean),
  );
}

export function normalizeRoutePoint(point) {
  if (!point) {
    return null;
  }

  let lat;
  let lng;
  if (Array.isArray(point) && point.length >= 2) {
    // Route APIs commonly expose coordinate arrays in GeoJSON order: [lng, lat].
    lng = Number(point[0]);
    lat = Number(point[1]);
  } else {
    const nestedPoint = point.latLng ?? point.location ?? point;
    lat = Number(nestedPoint.lat ?? nestedPoint.latitude);
    lng = Number(
      nestedPoint.lng ?? nestedPoint.lon ?? nestedPoint.longitude,
    );
  }

  if (looksLikeSwappedBerlinCoordinate(lat, lng)) {
    [lat, lng] = [lng, lat];
  }

  return isValidCoordinate(lat, lng) ? { lat, lng } : null;
}

function decodePolyline(encodedPolyline) {
  if (!encodedPolyline) {
    return [];
  }

  try {
    const points = [];
    let index = 0;
    let latitude = 0;
    let longitude = 0;

    while (index < encodedPolyline.length) {
      const latitudeResult = decodePolylineValue(encodedPolyline, index);
      index = latitudeResult.index;
      const longitudeResult = decodePolylineValue(encodedPolyline, index);
      index = longitudeResult.index;
      latitude += latitudeResult.value;
      longitude += longitudeResult.value;
      points.push({ lat: latitude / 100000, lng: longitude / 100000 });
    }
    return normalizeRoutePoints(points);
  } catch {
    return [];
  }
}

function alignRouteToEndpoints(points, pickup, destination) {
  let route = normalizeRoutePoints(points);
  if (route.length < 2) {
    return [];
  }

  if (pickup && destination) {
    const forwardDistance =
      distanceBetween(route[0], pickup) +
      distanceBetween(route.at(-1), destination);
    const reverseDistance =
      distanceBetween(route[0], destination) +
      distanceBetween(route.at(-1), pickup);
    if (reverseDistance < forwardDistance) {
      route = [...route].reverse();
    }

    if (
      distanceInMeters(route[0], pickup) > 2000 ||
      distanceInMeters(route.at(-1), destination) > 2000
    ) {
      return [];
    }
  }

  if (pickup) {
    route[0] = pickup;
  }
  if (destination) {
    route[route.length - 1] = destination;
  }

  return removeConsecutiveDuplicates(route);
}

function isValidCoordinate(lat, lng) {
  return (
    Number.isFinite(lat) &&
    Number.isFinite(lng) &&
    lat >= -90 &&
    lat <= 90 &&
    lng >= -180 &&
    lng <= 180
  );
}

function looksLikeSwappedBerlinCoordinate(lat, lng) {
  return lat >= 10 && lat <= 15 && lng >= 50 && lng <= 55;
}

function sameCoordinate(left, right) {
  return distanceBetween(left, right) < 0.00001;
}

function removeConsecutiveDuplicates(points) {
  return points.filter(
    (point, index) =>
      index === 0 || !sameCoordinate(point, points[index - 1]),
  );
}

function decodePolylineValue(encodedPolyline, startIndex) {
  let index = startIndex;
  let result = 0;
  let shift = 0;
  let value;

  do {
    if (index >= encodedPolyline.length) {
      throw new Error("Invalid encoded route geometry.");
    }
    value = encodedPolyline.charCodeAt(index) - 63;
    index += 1;
    result |= (value & 0x1f) << shift;
    shift += 5;
  } while (value >= 0x20);

  return {
    index,
    value: result & 1 ? ~(result >> 1) : result >> 1,
  };
}

function distanceBetween(start, end) {
  const averageLatitude = ((start.lat + end.lat) / 2) * (Math.PI / 180);
  const latDistance = end.lat - start.lat;
  const lngDistance = (end.lng - start.lng) * Math.cos(averageLatitude);
  return Math.hypot(latDistance, lngDistance);
}

export function distanceInMeters(startPoint, endPoint) {
  const start = normalizeRoutePoint(startPoint);
  const end = normalizeRoutePoint(endPoint);
  if (!start || !end) {
    return Number.POSITIVE_INFINITY;
  }

  return distanceBetween(start, end) * 111320;
}

function headingBetween(start, end) {
  return (
    Math.atan2(end.lng - start.lng, end.lat - start.lat) *
    (180 / Math.PI)
  );
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}
