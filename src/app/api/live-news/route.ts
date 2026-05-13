import { NextResponse } from 'next/server';

/**
 * OSIRIS — Live News Feeds v2
 * Uses verified YouTube video IDs for 24/7 live news channels.
 * Updated: These are the known stable live stream IDs.
 * Zero external API calls — served from memory.
 */

const LIVE_FEEDS = [
  // ── North America ──
  { id: 'nbcnews', name: 'NBC News NOW', city: 'New York', country: 'US', lat: 40.759, lng: -73.980, url: 'https://www.youtube.com/embed/JnCHHW_YBp8?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'cbsnews', name: 'CBS News 24/7', city: 'New York', country: 'US', lat: 40.764, lng: -73.973, url: 'https://www.youtube.com/embed/4b71rT9fU-k?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'abcnews', name: 'ABC News Live', city: 'New York', country: 'US', lat: 40.763, lng: -73.979, url: 'https://www.youtube.com/embed/gCNeDWCI0vo?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'bloomberg', name: 'Bloomberg TV', city: 'New York', country: 'US', lat: 40.756, lng: -73.988, url: 'https://www.youtube.com/embed/dp8PhLsUcFE?autoplay=1&mute=1', category: 'finance', language: 'en' },
  { id: 'cspan', name: 'C-SPAN', city: 'Washington DC', country: 'US', lat: 38.897, lng: -77.036, url: 'https://www.youtube.com/embed/VRhIkGxhIMY?autoplay=1&mute=1', category: 'government', language: 'en' },
  { id: 'cbc', name: 'CBC News', city: 'Toronto', country: 'CA', lat: 43.644, lng: -79.387, url: 'https://www.youtube.com/embed/65sR4KKWG8Y?autoplay=1&mute=1', category: 'mainstream', language: 'en' },

  // ── Europe ──
  { id: 'skynews', name: 'Sky News', city: 'London', country: 'GB', lat: 51.500, lng: -0.118, url: 'https://www.youtube.com/embed/9Auq9mYxFEE?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'france24en', name: 'France 24 EN', city: 'Paris', country: 'FR', lat: 48.830, lng: 2.280, url: 'https://www.youtube.com/embed/h3MuIUNCCzI?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'dwnews', name: 'DW News', city: 'Berlin', country: 'DE', lat: 52.508, lng: 13.376, url: 'https://www.youtube.com/embed/GE_SfNVNyqk?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'euronews', name: 'Euronews', city: 'Lyon', country: 'FR', lat: 45.764, lng: 4.836, url: 'https://www.youtube.com/embed/pykpO5kQJ98?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'trtworld', name: 'TRT World', city: 'Istanbul', country: 'TR', lat: 41.008, lng: 28.978, url: 'https://www.youtube.com/embed/CV5Fooi1XGQ?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'ukrinform', name: 'UKRINFORM', city: 'Kyiv', country: 'UA', lat: 50.450, lng: 30.523, url: 'https://www.youtube.com/embed/jNZM_H6q1rY?autoplay=1&mute=1', category: 'conflict', language: 'en' },

  // ── Middle East / Africa ──
  { id: 'aljazeera', name: 'Al Jazeera EN', city: 'Doha', country: 'QA', lat: 25.286, lng: 51.534, url: 'https://www.youtube.com/embed/F-POY4Q0KSI?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'i24news', name: 'i24NEWS EN', city: 'Tel Aviv', country: 'IL', lat: 32.085, lng: 34.781, url: 'https://www.youtube.com/embed/LH4MzFoXYOw?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'africanews', name: 'Africanews', city: 'Pointe-Noire', country: 'CG', lat: -4.778, lng: 11.865, url: 'https://www.youtube.com/embed/NJwVzo7mBgc?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'sabcnews', name: 'SABC News', city: 'Johannesburg', country: 'ZA', lat: -26.204, lng: 28.047, url: 'https://www.youtube.com/embed/NwN04K8JXOI?autoplay=1&mute=1', category: 'mainstream', language: 'en' },

  // ── Asia Pacific ──
  { id: 'nhkworld', name: 'NHK World', city: 'Tokyo', country: 'JP', lat: 35.690, lng: 139.692, url: 'https://www.youtube.com/embed/f0lYkdA-Kx0?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'cna', name: 'CNA 24/7', city: 'Singapore', country: 'SG', lat: 1.290, lng: 103.852, url: 'https://www.youtube.com/embed/XWq5kBlakcQ?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'wion', name: 'WION', city: 'New Delhi', country: 'IN', lat: 28.614, lng: 77.209, url: 'https://www.youtube.com/embed/U1RYpeWGUas?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'abcau', name: 'ABC Australia', city: 'Sydney', country: 'AU', lat: -33.867, lng: 151.207, url: 'https://www.youtube.com/embed/W1ilCy6XrmI?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'arirang', name: 'Arirang TV', city: 'Seoul', country: 'KR', lat: 37.566, lng: 126.978, url: 'https://www.youtube.com/embed/JCM4dDPmrnA?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'cgtn', name: 'CGTN', city: 'Beijing', country: 'CN', lat: 39.904, lng: 116.407, url: 'https://www.youtube.com/embed/LjSVSBo5PD0?autoplay=1&mute=1', category: 'state', language: 'en' },

  // ── Latin America / State ──
  { id: 'telesur', name: 'teleSUR EN', city: 'Caracas', country: 'VE', lat: 10.491, lng: -66.902, url: 'https://www.youtube.com/embed/4G7RgMuUkfQ?autoplay=1&mute=1', category: 'mainstream', language: 'en' },
  { id: 'rt', name: 'RT News', city: 'Moscow', country: 'RU', lat: 55.755, lng: 37.617, url: 'https://www.youtube.com/embed/V5E8kTYI8k0?autoplay=1&mute=1', category: 'state', language: 'en' },
];

export async function GET() {
  return NextResponse.json({
    feeds: LIVE_FEEDS,
    total: LIVE_FEEDS.length,
    categories: ['mainstream', 'government', 'finance', 'conflict', 'state'],
    timestamp: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=172800' },
  });
}
