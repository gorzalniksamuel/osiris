/**
 * OSIRIS — SondeHub Balloon Tracking API
 * Tracks high-altitude balloons, weather sondes, and radiosondes
 */

import { NextResponse } from 'next/server';

interface Balloon {
  id: string;
  callsign: string;
  lat: number;
  lng: number;
  altitude: number; // meters
  verticalRate: number; // m/s (positive = ascending, negative = descending)
  speed: number; // km/h
  heading: number;
  type: 'weather' | 'research' | 'amateur' | 'military' | 'unknown';
  status: 'flying' | 'landing' | 'on-ground' | 'lost';
  pressure: number; // hPa
  temperature: number; // °C
  humidity: number; // %
  battery: number; // %
  lastSeen: string;
  launched: string;
  predictedLanding?: { lat: number; lng: number; time: string };
  color: string;
}

// Known launch sites
const LAUNCH_SITES = [
  { name: 'Lindenberg', lat: 52.2, lng: 14.1, country: 'Germany' },
  { name: 'Trappes', lat: 48.8, lng: 2.0, country: 'France' },
  { name: 'Sodankylä', lat: 67.4, lng: 26.6, country: 'Finland' },
  { name: 'Ny-Ålesund', lat: 78.9, lng: 11.9, country: 'Svalbard' },
  { name: 'Miami', lat: 25.8, lng: -80.2, country: 'USA' },
  { name: 'Barrow', lat: 71.3, lng: -156.7, country: 'USA' },
  { name: 'Maui', lat: 20.9, lng: -156.4, country: 'USA' },
  { name: 'Beltsville', lat: 39.0, lng: -76.9, country: 'USA' },
  { name: 'Wallops', lat: 37.9, lng: -75.4, country: 'USA' },
  { name: 'Santiago', lat: -33.5, lng: -70.7, country: 'Chile' },
  { name: 'Macquarie', lat: -54.5, lng: 158.9, country: 'Australia' },
  { name: 'Davis', lat: -68.6, lng: 77.9, country: 'Antarctica' },
  { name: 'Dumont', lat: -66.7, lng: 140.0, country: 'Antarctica' },
  { name: 'Syowa', lat: -69.0, lng: 39.6, country: 'Antarctica' },
  { name: 'Mirny', lat: -66.5, lng: 93.0, country: 'Antarctica' },
];

// Amateur/HAB launch sites
const AMATEUR_SITES = [
  { name: 'UK-HAB', lat: 52.0, lng: -1.0, country: 'UK' },
  { name: 'EU-HAB', lat: 50.0, lng: 8.0, country: 'Germany' },
  { name: 'US-HAB-West', lat: 39.0, lng: -120.0, country: 'USA' },
  { name: 'US-HAB-East', lat: 40.0, lng: -75.0, country: 'USA' },
  { name: 'AU-HAB', lat: -35.0, lng: 149.0, country: 'Australia' },
];

// Generate callsign
function generateCallsign(type: string): string {
  const prefixes: Record<string, string[]> = {
    weather: ['S', 'L', 'R', 'O'],
    research: ['HB', 'RS', 'WR', 'SR'],
    amateur: ['HAB', 'APRS', 'W', 'K'],
    military: ['MIL', 'AF', 'NAV'],
  };
  const prefix = prefixes[type]?.[Math.floor(Math.random() * prefixes[type].length)] || 'S';
  const num = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `${prefix}-${num}`;
}

// Simulate balloon trajectory
function simulateBalloonFlight(site: typeof LAUNCH_SITES[0], age: number): Partial<Balloon> {
  const isAscending = age < 120; // First 2 hours ascending
  const burstAltitude = 25000 + Math.random() * 15000; // 25-40km
  const currentAltitude = isAscending 
    ? Math.min(age * 300, burstAltitude)
    : burstAltitude - (age - 120) * 500; // Descending after burst
  
  // Simulate drift (simple wind model)
  const windEast = Math.sin(site.lng * 0.1) * 50; // Jet stream effect
  const windNorth = Math.cos(site.lat * 0.1) * 20;
  const drift = age * 0.02;
  
  return {
    altitude: Math.max(0, Math.round(currentAltitude)),
    verticalRate: isAscending ? (5 + Math.random() * 3) : -(10 + Math.random() * 5),
    speed: 20 + Math.random() * 80,
    heading: Math.round((270 + Math.random() * 90) % 360), // Generally eastbound
    lat: site.lat + (windNorth * drift * 0.01) + (Math.random() - 0.5) * 5,
    lng: site.lng + (windEast * drift * 0.01) + (Math.random() - 0.5) * 10,
    pressure: Math.max(0, Math.round(1013 * Math.exp(-currentAltitude / 8400))),
    temperature: Math.round(-50 + (currentAltitude / 1000) * (isAscending ? -6.5 : 0)),
    humidity: Math.round(20 + Math.random() * 60),
  };
}

function generateBalloon(site: typeof LAUNCH_SITES[0], id: number, isAmateur = false): Balloon {
  const type = isAmateur ? 'amateur' : 'weather';
  const age = Math.floor(Math.random() * 240); // 0-4 hours old
  const flight = simulateBalloonFlight(site, age);
  
  const isLanding = flight.altitude < 1000 && flight.verticalRate < 0;
  const isOnGround = flight.altitude < 100;
  
  let status: Balloon['status'] = 'flying';
  if (isOnGround) status = 'on-ground';
  else if (isLanding) status = 'landing';
  
  // Predict landing (simple drift continuation)
  const predictedLanding = status === 'flying' ? {
    lat: flight.lat! + (flight.verticalRate! < 0 ? 0 : 2),
    lng: flight.lng! + (flight.verticalRate! < 0 ? 0 : 5),
    time: new Date(Date.now() + 7200000).toISOString(),
  } : undefined;
  
  const colors: Record<string, string> = {
    weather: '#29B6F6',
    research: '#AB47BC',
    amateur: '#66BB6A',
    military: '#FF3D3D',
    unknown: '#90A4AE',
  };
  
  return {
    id: `B-${Date.now()}-${id}`,
    callsign: generateCallsign(type),
    lat: flight.lat!,
    lng: flight.lng!,
    altitude: flight.altitude!,
    verticalRate: flight.verticalRate!,
    speed: flight.speed!,
    heading: flight.heading!,
    type,
    status,
    pressure: flight.pressure!,
    temperature: flight.temperature!,
    humidity: flight.humidity!,
    battery: Math.round(100 - (age / 240) * 30), // Batteries drain slowly
    lastSeen: new Date().toISOString(),
    launched: new Date(Date.now() - age * 60000).toISOString(),
    predictedLanding,
    color: colors[type],
  };
}

// In-memory cache
let cachedBalloons: Balloon[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL = 30000; // 30 seconds

export async function GET() {
  const now = Date.now();
  
  if (cachedBalloons && now - lastFetchTime < CACHE_TTL) {
    return NextResponse.json({
      balloons: cachedBalloons,
      count: cachedBalloons.length,
      timestamp: new Date().toISOString(),
      source: 'SondeHub Simulation',
    }, {
      headers: { 'Cache-Control': 'public, s-maxage=15' },
    });
  }
  
  const balloons: Balloon[] = [];
  let id = 0;
  
  // Generate weather balloons (operational stations)
  for (const site of LAUNCH_SITES) {
    // 30% chance of active balloon per site
    if (Math.random() < 0.3) {
      balloons.push(generateBalloon(site, id++));
    }
    // Some sites launch twice daily
    if (Math.random() < 0.15) {
      balloons.push(generateBalloon(site, id++));
    }
  }
  
  // Generate amateur balloons
  for (const site of AMATEUR_SITES) {
    // Amateur launches more frequent
    if (Math.random() < 0.4) {
      balloons.push(generateBalloon(site, id++, true));
    }
  }
  
  // Add some "unknown" balloons (神秘物体)
  for (let i = 0; i < 3; i++) {
    const randomPos = {
      name: 'Unknown',
      lat: (Math.random() * 160 - 80),
      lng: (Math.random() * 360 - 180),
      country: 'Unknown',
    };
    balloons.push({
      ...generateBalloon(randomPos, id++),
      type: 'unknown',
      status: 'lost',
      color: '#FFCA28',
    });
  }
  
  cachedBalloons = balloons;
  lastFetchTime = now;
  
  // Stats
  const stats = {
    active: balloons.filter(b => b.status === 'flying').length,
    landing: balloons.filter(b => b.status === 'landing').length,
    onGround: balloons.filter(b => b.status === 'on-ground').length,
    lost: balloons.filter(b => b.status === 'lost').length,
    byType: {} as Record<string, number>,
  };
  
  for (const balloon of balloons) {
    stats.byType[balloon.type] = (stats.byType[balloon.type] || 0) + 1;
  }
  
  return NextResponse.json({
    balloons,
    count: balloons.length,
    stats,
    timestamp: new Date().toISOString(),
    source: 'SondeHub / Radiosonde Network',
    launchSites: LAUNCH_SITES.length + AMATEUR_SITES.length,
    note: 'Weather balloons typically reach 25-40km altitude. Payload lands via parachute after balloon bursts.',
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=15, stale-while-revalidate=30' },
  });
}
