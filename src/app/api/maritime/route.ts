/**
 * OSIRIS — Maritime/AIS Tracking API
 * Fetches real-time ship positions via AIS data simulation
 */

import { NextResponse } from 'next/server';

interface Ship {
  mmsi: number;
  name: string;
  lat: number;
  lng: number;
  speed: number;
  heading: number;
  type: string;
  typeCode: number;
  length: number;
  destination: string;
  color: string;
  timestamp: string;
}

// Ship type configurations
const SHIP_CONFIGS: Record<string, { color: string; lengthMin: number; lengthMax: number; speedMax: number }> = {
  tanker: { color: '#EF5350', lengthMin: 150, lengthMax: 400, speedMax: 18 },
  cargo: { color: '#FFA726', lengthMin: 80, lengthMax: 300, speedMax: 22 },
  passenger: { color: '#29B6F6', lengthMin: 50, lengthMax: 350, speedMax: 28 },
  fishing: { color: '#66BB6A', lengthMin: 10, lengthMax: 80, speedMax: 12 },
  military: { color: '#FF3D3D', lengthMin: 100, lengthMax: 350, speedMax: 35 },
  pleasure: { color: '#AB47BC', lengthMin: 5, lengthMax: 50, speedMax: 25 },
  other: { color: '#90A4AE', lengthMin: 20, lengthMax: 150, speedMax: 20 },
};

const DESTINATIONS = ['Rotterdam', 'Singapore', 'Shanghai', 'Dubai', 'Hamburg', 'Antwerp', 'Los Angeles', 'Tokyo', 'New York', 'Busan', 'Hong Kong', 'Jeddah', 'Cape Town', 'Sydney', 'Vancouver', 'Panama', 'Suez', 'Istanbul', 'Mumbai', 'Oslo'];

// Generate ship name
function generateShipName(type: string): string {
  const prefixes: Record<string, string[]> = {
    tanker: ['MT', 'MT', 'ST'],
    cargo: ['MV', 'MV', 'CS'],
    passenger: ['SS', 'MS', 'MV'],
    fishing: ['FV', 'FV', 'FV'],
    military: ['USS', 'HMS', 'INS'],
    pleasure: ['SY', 'SY', '']
  };
  const cities = ['Atlantic', 'Pacific', 'Baltic', 'Nordic', 'Star', 'Fortune', 'Hope', 'Unity', 'Voyager', 'Pioneer', 'Ocean', 'Seas', 'Pearl', 'Diamond', 'Royal'];
  const prefix = prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || 'MV';
  return `${prefix} ${cities[Math.floor(Math.random() * cities.length)]}`;
}

// Major shipping routes with traffic density
const SHIPPING_ROUTES = [
  // Asia - Europe (via Suez)
  { start: { lat: 31.2, lng: 121.5 }, end: { lat: 31.5, lng: 32.0 }, count: 80, types: ['cargo', 'tanker'] }, // Shanghai -> Suez
  { start: { lat: 1.3, lng: 103.8 }, end: { lat: 26.5, lng: 56.3 }, count: 60, types: ['tanker', 'cargo'] }, // Singapore -> Hormuz
  { start: { lat: 35.7, lng: 139.7 }, end: { lat: 37.8, lng: -122.4 }, count: 30, types: ['cargo', 'passenger'] }, // Tokyo -> SF
  
  // Europe - Americas
  { start: { lat: 50.5, lng: -1.0 }, end: { lat: 40.7, lng: -74.0 }, count: 50, types: ['cargo', 'passenger'] }, // UK -> NYC
  { start: { lat: 51.5, lng: 1.5 }, end: { lat: 36.0, lng: -5.5 }, count: 40, types: ['cargo', 'tanker'] }, // North Sea -> Gibraltar
  
  // Intra-Asia
  { start: { lat: 22.4, lng: 114.1 }, end: { lat: 1.3, lng: 103.8 }, count: 45, types: ['cargo', 'tanker'] }, // HK -> Singapore
  { start: { lat: 12.9, lng: 77.6 }, end: { lat: 1.3, lng: 103.8 }, count: 35, types: ['cargo', 'tanker'] }, // India -> Singapore
  { start: { lat: 35.0, lng: 139.5 }, end: { lat: 37.5, lng: 126.9 }, count: 25, types: ['cargo', 'passenger'] }, // Tokyo -> Busan
  
  // Americas
  { start: { lat: 37.8, lng: -122.4 }, end: { lat: 34.0, lng: -118.2 }, count: 20, types: ['cargo', 'passenger'] }, // SF -> LA
  { start: { lat: 40.7, lng: -74.0 }, end: { lat: 25.8, lng: -80.2 }, count: 30, types: ['passenger', 'cargo'] }, // NYC -> Miami
  { start: { lat: -23.0, lng: -43.4 }, end: { lat: -34.6, lng: -58.4 }, count: 25, types: ['cargo'] }, // Brazil -> Argentina
  
  // Africa routes
  { start: { lat: -33.9, lng: 18.4 }, end: { lat: 31.2, lng: 29.9 }, count: 20, types: ['cargo', 'tanker'] }, // Cape Town -> Suez
  { start: { lat: -1.3, lng: 36.8 }, end: { lat: 25.3, lng: 55.2 }, count: 15, types: ['cargo'] }, // Mombasa -> Dubai
];

function interpolatePosition(start: {lat: number, lng: number}, end: {lat: number, lng: number}, progress: number) {
  return {
    lat: start.lat + (end.lat - start.lat) * progress,
    lng: start.lng + (end.lng - start.lng) * progress,
  };
}

function generateShipsOnRoute(route: typeof SHIPPING_ROUTES[0]): Ship[] {
  const ships: Ship[] = [];
  const config = SHIP_CONFIGS[route.types[0]] || SHIP_CONFIGS.other;
  
  for (let i = 0; i < route.count; i++) {
    const type = route.types[Math.floor(Math.random() * route.types.length)];
    const typeConfig = SHIP_CONFIGS[type] || SHIP_CONFIGS.other;
    
    // Distribute ships along the route
    const progress = Math.random();
    const jitterLat = (Math.random() - 0.5) * 4;
    const jitterLng = (Math.random() - 0.5) * 4;
    
    const pos = interpolatePosition(route.start, route.end, progress);
    
    // Calculate heading towards destination
    const dLat = route.end.lat - route.start.lat;
    const dLng = route.end.lng - route.start.lng;
    const heading = Math.round((Math.atan2(dLng, dLat) * 180 / Math.PI + 360) % 360);
    
    // Chokepoint clustering
    ships.push({
      mmsi: 200000000 + Math.floor(Math.random() * 800000000),
      name: generateShipName(type),
      lat: pos.lat + jitterLat,
      lng: pos.lng + jitterLng,
      speed: Math.round((1 + Math.random() * typeConfig.speedMax) * 10) / 10,
      heading: heading + Math.floor((Math.random() - 0.5) * 30),
      type,
      typeCode: type === 'tanker' ? 80 : type === 'cargo' ? 70 : type === 'passenger' ? 60 : 30,
      length: Math.floor(typeConfig.lengthMin + Math.random() * (typeConfig.lengthMax - typeConfig.lengthMin)),
      destination: DESTINATIONS[Math.floor(Math.random() * DESTINATIONS.length)],
      color: typeConfig.color,
      timestamp: new Date().toISOString(),
    });
  }
  
  return ships;
}

// In-memory cache
let cachedShips: Ship[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 60000; // 60 seconds

export async function GET() {
  const now = Date.now();
  
  if (cachedShips && now - lastFetchTime < CACHE_TTL) {
    return NextResponse.json({
      ships: cachedShips,
      count: cachedShips.length,
      timestamp: new Date().toISOString(),
      source: 'AIS Simulation',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=30' },
    });
  }
  
  // Generate ships on all routes
  const allShips: Ship[] = [];
  for (const route of SHIPPING_ROUTES) {
    allShips.push(...generateShipsOnRoute(route));
  }
  
  // Add some random fishing vessels
  for (let i = 0; i < 100; i++) {
    const config = SHIP_CONFIGS.fishing;
    allShips.push({
      mmsi: 400000000 + i,
      name: generateShipName('fishing'),
      lat: (Math.random() * 140 - 70), // -70 to 70 latitude
      lng: (Math.random() * 360 - 180),
      speed: Math.round((1 + Math.random() * 10) * 10) / 10,
      heading: Math.floor(Math.random() * 360),
      type: 'fishing',
      typeCode: 30,
      length: Math.floor(config.lengthMin + Math.random() * (config.lengthMax - config.lengthMin)),
      destination: 'Fishing Grounds',
      color: config.color,
      timestamp: new Date().toISOString(),
    });
  }
  
  cachedShips = allShips;
  lastFetchTime = now;
  
  // Stats by type
  const stats = {
    total: allShips.length,
    byType: {} as Record<string, number>,
  };
  
  for (const ship of allShips) {
    stats.byType[ship.type] = (stats.byType[ship.type] || 0) + 1;
  }
  
  return NextResponse.json({
    ships: allShips,
    count: allShips.length,
    stats,
    timestamp: new Date().toISOString(),
    source: 'AIS Maritime Traffic Simulation',
    routes: SHIPPING_ROUTES.length,
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=60' },
  });
}
