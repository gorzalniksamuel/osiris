<div align="center">

# ⬡ OSIRIS

### Open Source Intelligence & Reconnaissance Integrated System

[![Live Demo](https://img.shields.io/badge/LIVE-osiris--theta.vercel.app-00E5FF?style=for-the-badge&logo=vercel&logoColor=white)](https://osiris-theta.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-GPU_Rendered-396CB2?style=for-the-badge)](https://maplibre.org)
[![License](https://img.shields.io/badge/License-MIT-D4AF37?style=for-the-badge)](LICENSE)

**A real-time global intelligence dashboard that aggregates live flight tracking, CCTV networks, earthquake monitoring, conflict zone mapping, and 24/7 news feeds into a single GPU-accelerated interface.**

[Live Demo](https://osiris-theta.vercel.app) · [Report Bug](https://github.com/simplifaisoul/osiris/issues) · [Request Feature](https://github.com/simplifaisoul/osiris/issues)

</div>

---

## Overview

Osiris is a production-grade OSINT platform that provides situational awareness across multiple intelligence domains. Built with Next.js 16 and MapLibre GL, every data point is rendered via WebGL for 60fps performance even with thousands of concurrent entities on-screen.

### Key Capabilities

| Domain | Data Points | Sources |
|--------|------------|---------|
| **Aviation** | Commercial, Private, Military, Jets | OpenSky Network |
| **Maritime** | 39 Global Ports, 10 Chokepoints | Static Naval Intel |
| **CCTV** | 2,000+ Cameras | TfL, WSDOT, Caltrans, NYC DOT, VicRoads + more |
| **Seismic** | Real-time M2.5+ | USGS Earthquake API |
| **Fires** | Active Hotspots | NASA FIRMS |
| **News** | 24/7 Live Streams | 25+ Global Broadcasters |
| **Weather** | Severe Events | NASA EONET |
| **Space** | Solar Weather, Satellites | NOAA SWPC, N2YO |
| **Cyber** | CVE Threats, Vulnerability Scanning | NVD, Custom Scanner |
| **Conflict** | 13 Active Zones | Static OSINT Intel |

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│                  OSIRIS CLIENT                   │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐ │
│  │ MapLibre  │  │  HUD     │  │  RECON Toolkit│ │
│  │  GL (GPU) │  │ Panels   │  │  Port Scan    │ │
│  │  WebGL    │  │ Layers   │  │  DNS / WHOIS  │ │
│  │  Render   │  │ Controls │  │  Vuln Scanner │ │
│  └──────────┘  └──────────┘  └───────────────┘ │
├─────────────────────────────────────────────────┤
│               NEXT.JS API ROUTES                 │
│  /api/flights  /api/earthquakes  /api/cctv      │
│  /api/news     /api/fires        /api/maritime  │
│  /api/gdelt    /api/satellites   /api/weather   │
│  /api/scanner  /api/sentinel     /api/osint/*   │
├─────────────────────────────────────────────────┤
│              EXTERNAL DATA SOURCES               │
│  OpenSky · USGS · NASA · NOAA · TfL · NVD      │
│  GDACS · EONET · FIRMS · N2YO · RSS Feeds      │
└─────────────────────────────────────────────────┘
```

---

## Features

### Intelligence Layers
- **15 toggleable data layers** with real-time entity counts
- **GPU-accelerated rendering** — all map data rendered via WebGL, not DOM
- **Progressive loading** — data fetched on-demand when layers are activated
- **Viewport-aware** — only loads relevant data for the visible region

### RECON Toolkit
- **Port Scanner** — TCP connect scan with service fingerprinting
- **DNS Lookup** — Full record resolution (A, AAAA, MX, NS, TXT, CNAME)
- **WHOIS** — Domain/IP registration data
- **SSL/TLS Inspector** — Certificate chain analysis
- **IP Intelligence** — Geolocation, ASN, and threat reputation
- **Vulnerability Scanner** — CVE lookup against NVD database

### Live Broadcast Network
- **25+ live 24/7 news streams** from global broadcasters
- Click any news dot on the map to open the live stream
- Feeds from NBC, CBS, ABC, Sky News, Al Jazeera, France 24, NHK, WION, and more

### Conflict Zone Monitoring
- **13 active conflict/tension zones** with severity-coded warning markers
- Active Wars: Ukraine, Gaza, Sudan, Myanmar, DRC, Yemen
- High Tension: Syria, Lebanon, Sahel, Somalia, Red Sea
- Elevated: Taiwan Strait, Korean DMZ

### Performance Optimized
- **75% reduction in edge requests** vs initial release
- Aggressive polling relaxation (15-30 min intervals for stable data)
- Static data served from memory (zero external API calls for news feeds)
- `layerFetchedRef` prevents duplicate API requests

---

## Quick Start

```bash
git clone https://github.com/simplifaisoul/osiris.git
cd osiris
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

Create a `.env.local` file:

```env
# Optional — enhances flight data
OPENSKY_USERNAME=your_username
OPENSKY_PASSWORD=your_password

# Optional — satellite tracking
N2YO_API_KEY=your_key
```

> Most features work without any API keys. The platform is designed to be functional out of the box.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5 |
| Map Engine | MapLibre GL JS (WebGL) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Custom CSS Design System |
| Deployment | Vercel Edge Network |

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `F` | Toggle flight layers |
| `E` | Toggle earthquakes |
| `S` | Toggle satellites |
| `D` | Toggle day/night cycle |
| `Escape` | Close panels |

---

## License

MIT — see [LICENSE](LICENSE) for details.

---

<div align="center">

**Built by [simplifaisoul](https://github.com/simplifaisoul)**

</div>
