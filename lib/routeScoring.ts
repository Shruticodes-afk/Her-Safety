export interface RouteStats {
  routeIndex: number;
  riskScore: number;
  highRiskCellsCrossed: number;
  distanceKm: number;
  durationMin: number;
  coverage: number;
  isLowCoverage: boolean;
  geometry: any;
}

export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // metres
  const phi1 = lat1 * Math.PI / 180;
  const phi2 = lat2 * Math.PI / 180;
  const deltaPhi = (lat2 - lat1) * Math.PI / 180;
  const deltaLambda = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
            Math.cos(phi1) * Math.cos(phi2) *
            Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function samplePointsAlongGeometry(coordinates: [number, number][], intervalMeters = 100): [number, number][] {
  if (coordinates.length === 0) return [];
  const points: [number, number][] = [coordinates[0]];
  let distanceToNextPoint = intervalMeters;

  for (let i = 0; i < coordinates.length - 1; i++) {
    const p1 = coordinates[i];
    const p2 = coordinates[i + 1];
    const segmentLength = haversineDistance(p1[1], p1[0], p2[1], p2[0]);
    let currentPos = 0;

    while (segmentLength - currentPos >= distanceToNextPoint) {
      currentPos += distanceToNextPoint;
      const ratio = currentPos / segmentLength;
      const lng = p1[0] + (p2[0] - p1[0]) * ratio;
      const lat = p1[1] + (p2[1] - p1[1]) * ratio;
      points.push([lng, lat]);
      distanceToNextPoint = intervalMeters;
    }
    distanceToNextPoint -= (segmentLength - currentPos);
  }
  points.push(coordinates[coordinates.length - 1]);
  return points;
}

export function scoreRoutes(routes: any[], cells: any[], highRiskThreshold: number = 10): RouteStats[] {
  return routes.map((route, idx) => {
    const coordinates = route.geometry.coordinates as [number, number][];
    const samples = samplePointsAlongGeometry(coordinates, 100);
    
    let totalPointRisk = 0;
    let coveredPoints = 0;
    const crossedHighRiskCells = new Set<string>();

    for (const pt of samples) {
      const [lng, lat] = pt;
      let ptRisk = 0;
      let hasCellNearby = false;

      for (const cell of cells) {
        const dist = haversineDistance(lat, lng, cell.lat, cell.lng);
        if (dist <= 150) {
          hasCellNearby = true;
          // max(0, 1 - distance/150) weights closer cells higher
          ptRisk += cell.score * Math.max(0, 1 - dist / 150);
          if (cell.score >= highRiskThreshold) {
            crossedHighRiskCells.add(`${cell.lat},${cell.lng}`);
          }
        }
      }
      totalPointRisk += ptRisk;
      if (hasCellNearby) coveredPoints++;
    }

    console.log(`[ROUTES-DEBUG] Route ${idx}: ${samples.length} sample points, ${coveredPoints} points had a cell within 150m.`);

    const avgRisk = samples.length > 0 ? totalPointRisk / samples.length : 0;
    const coverage = samples.length > 0 ? coveredPoints / samples.length : 0;
    const distanceKm = route.distance / 1000;
    const durationMin = route.duration / 60;

    return {
      routeIndex: idx,
      riskScore: avgRisk,
      highRiskCellsCrossed: crossedHighRiskCells.size,
      distanceKm,
      durationMin,
      coverage,
      isLowCoverage: coverage < 0.3,
      geometry: route.geometry
    };
  });
}
