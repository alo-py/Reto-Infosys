# 🚴‍♂️ OptiGo AI — Intelligent Real-Time Delivery Cockpit & Simulation Engine

> **Infosys Challenge — Track 3: The Courier**  
> *Empowering gig-economy delivery couriers in Monterrey, Mexico with combinatorial route optimization (Google OR-Tools), multi-agent LLM intelligence (DeepSeek), dynamic weather detour supervision, real device GPS telemetry, and a high-performance Next.js 16 cockpit.*

---

## 📑 Table of Contents
1. [Overview & Challenge Alignment](#1-overview--challenge-alignment)
2. [Key Capabilities & Features](#2-key-capabilities--features)
3. [System Architecture](#3-system-architecture)
4. [Algorithms & AI Agents](#4-algorithms--ai-agents)
   - [OptiGo AI (OR-Tools + DeepSeek LLM)](#41-optigo-ai-or-tools--deepseek-dual-agent)
   - [Greedy Base Agent](#42-greedy-baseline-agent)
5. [Tech Stack](#5-tech-stack)
6. [Repository Structure](#6-repository-structure)
7. [Getting Started & Installation](#7-getting-started--installation)
   - [Backend Setup (Django + OR-Tools + PostgreSQL)](#backend-setup)
   - [Frontend Setup (Next.js 16 + Tailwind CSS v4 + Leaflet)](#frontend-setup)
8. [API Endpoints Reference](#8-api-endpoints-reference)
9. [Driver Cockpit Guide](#9-driver-cockpit-guide)
   - [Simulation Controls (Run Both, Step, Reset)](#simulation-controls)
   - [Co-Pilot Mode & Autonomy Directives](#co-pilot-mode--autonomy-directives)
   - [Device Live GPS Telemetry](#device-live-gps-telemetry)
   - [Weather & Traffic Scenarios](#weather--traffic-scenarios)
10. [Benchmark Results](#10-benchmark-results)
11. [License & Credits](#11-license--credits)

---

## 1. Overview & Challenge Alignment

In fast-paced metropolitan hubs like **Monterrey, Nuevo León**, gig couriers working on platforms such as DiDi Food, Rappi, and Uber Eats receive non-stop delivery pings. Drivers have mere seconds to accept or decline without knowing:
- Whether the pickup deadhead distance burns more gas than the fare pays.
- If upcoming flooded avenues (such as *Av. Gonzalitos* or *Morones Prieto*) will trigger severe Service Level Agreement (SLA) late delivery penalties.
- How to combine multiple orders into viable dual batches while strictly honoring delivery time windows.

**OptiGo AI** solves this problem by providing couriers with:
1. **Intelligent Order Filtering:** Eliminates unprofitable deadhead travel ($0.90 MXN/km fuel rate) and prioritizes net hourly revenue ($\text{MXN/hr}$).
2. **Combinatorial Batching:** Solves Pickup and Delivery Problems with Time Windows (PDPTW) using **Google OR-Tools**.
3. **Dual-Agent LLM Supervision:** Evaluates weather risks and closed corridors via a DeepSeek Maker-Checker system.
4. **Interactive Co-Pilot & Directives:** Allows drivers to set custom deadhead thresholds, toggle smart batching, and veto risky routes.
5. **Real-Device GPS Telemetry:** Seamlessly captures native device location, velocity, and compass heading alongside the simulation.

---

## 2. Key Capabilities & Features

- **🎮 Dual Concurrent Simulation:** Compare **OptiGo AI** head-to-head against a traditional **Greedy Baseline** driver over a 120-minute continuous shift. Launch both simultaneously with **`Run Both`** or step individually.
- **🗺️ Leaflet Dark Canvas Map:** Custom Monterrey metropolitan street network with 9 key urban hubs (Barrio Antiguo, Centrito Valle, Tec de Monterrey, San Nicolás, Cumbres, etc.), real curvature geometry, and zero third-party watermarks (powered by Esri Dark Gray Canvas).
- **📡 Device Live GPS Telemetry:** Real-time geolocation stream (`navigator.geolocation.watchPosition`) displaying live coordinates, ±accuracy radius, instant speed in km/h, and heading.
- **🤝 Interactive Co-Pilot Mode:** The driver can either let the AI drive autonomously or switch to Co-Pilot mode, pausing on incoming offers with an AI recommendation and custom directives.
- **⛈️ Monterrey Dynamic Scenarios:** Models realistic Monterrey environmental conditions (40°C heatwaves, sudden afternoon storms, Av. Gonzalitos road closures, surge multipliers up to 1.8x).
- **🔐 JWT Authentication:** Courier signup, profile customization (vehicle type: Motorcycle, Bicycle, or Car), and token persistence across sessions.

---

## 3. System Architecture

```
                                  ┌────────────────────────────────────────────────────────┐
                                  │                  CLIENT / FRONTEND                     │
                                  │   Next.js 16 (Turbopack) • React 19 • Tailwind CSS v4  │
                                  │      Leaflet Interactive Map • HTML5 Geolocation       │
                                  └──────────────┬─────────────────────────▲───────────────┘
                                                 │                         │
                                        REST API │ HTTP 200                │ Telemetry & State
                                        (JWT)    │                         │ Synchronization
                                                 ▼                         │
                                  ┌────────────────────────────────────────┴───────────────┐
                                  │                  BACKEND ENGINE                        │
                                  │         Django 5.2 • Django REST Framework (DRF)       │
                                  │             PostgreSQL 16 / SQLite Fallback            │
                                  └──────────────┬─────────────────────────▲───────────────┘
                                                 │                         │
                        ┌────────────────────────┴───────────────┐         │
                        ▼                                        ▼         │
        ┌────────────────────────────────┐       ┌─────────────────────────┴──────┐
        │       OPTIMIZATION CORE        │       │       AI AGENTIC SYSTEM        │
        │ Google OR-Tools (VRPTW/PDPTW)  │       │ DeepSeek Dual Agent (OpenAI)   │
        │  OSMnx Graph Road Network      │       │  • Strategist (Max MXN/hr)     │
        │  Haversine Curvature (1.35x)   │       │  • Supervisor (Risk & Flood)   │
        └────────────────────────────────┘       └────────────────────────────────┘
```

---

## 4. Algorithms & AI Agents

### 4.1 OptiGo AI (OR-Tools + DeepSeek Dual Agent)
- **Deadhead Distance Filter:** Automatically discards delivery requests whose pickup distance exceeds the courier's maximum deadhead threshold (default: 6.0 km).
- **Combinatorial Batching (OR-Tools):** Determines if chaining two overlapping orders into a dual-batch delivery is mathematically feasible without violating customer SLAs or causing delivery delays.
- **Dual LLM System (Maker-Checker):**
  - **Strategist Agent:** Evaluates surge pricing multipliers, estimated tips, and net fuel cost to maximize hourly rate ($\text{MXN/hr}$).
  - **Supervisor Agent:** Inspects active road closures (*Av. Gonzalitos*, *Av. Constitución*, *Av. Morones Prieto*) and automatically redirects the route or vetoes the order if crossing flooded underpasses.

### 4.2 Greedy Baseline Agent
- Emulates the typical behavior of an inexperienced courier: accepts the first incoming ping regardless of deadhead distance.
- Fails to batch compatible deliveries, burning excessive fuel.
- Ignores weather alerts and closed corridors, entering blocked avenues and suffering severe SLA penalties.

---

## 5. Tech Stack

### Frontend
- **Framework:** [Next.js 16.3.4](https://nextjs.org/) (App Router, Turbopack)
- **UI Library:** React 19.2.8
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Map & GIS:** [Leaflet 1.9.4](https://leafletjs.com/) with Esri ArcGIS World Dark Gray Canvas & Reference Tiles
- **Sensors:** HTML5 Geolocation API (`watchPosition`)

### Backend
- **Framework:** [Django 5.2](https://www.djangoproject.com/) + [Django REST Framework](https://www.django-rest-framework.org/)
- **Authentication:** `djangorestframework-simplejwt` (Access & Refresh JWT)
- **Database:** PostgreSQL 16 (Docker) / SQLite (Development)
- **Optimization:** [Google OR-Tools](https://developers.google.com/optimization) (`ortools.constraint_solver`)
- **GIS & Network:** OSMnx, NetworkX, Scikit-learn, Pandas, NumPy
- **LLM Provider:** DeepSeek API (`deepseek-chat`) via OpenAI SDK

---

## 6. Repository Structure

```
.
├── backend/
│   ├── apps/
│   │   ├── users/               # Custom Courier User Model, Serializers & JWT Auth
│   │   ├── simulation/          # Shift Tracking, Telemetry Logs & Order Records
│   │   └── optimization/        # OR-Tools & Dual-Agent Endpoints
│   ├── optigo_project/          # Django Core Settings, URLs & WSGI
│   ├── src/
│   │   ├── config.py            # Monterrey Urban Nodes, Avenues & SLA Constants
│   │   ├── models.py            # Order, Driver, Batch & Route Data Classes
│   │   ├── routing.py           # OSMnx Graph Distances & Haversine Matrix
│   │   ├── optimization.py      # Google OR-Tools PDPTW Batching Solver
│   │   ├── ai.py                # DeepSeek Dual Agent (Strategist + Supervisor)
│   │   ├── agents.py            # Agent Decision Logics (Greedy vs OptiGo AI)
│   │   ├── environment.py       # Weather & Road Events State Engine
│   │   └── data_loader.py       # Solomon VRPTW & Synthetic Stream Ingestion
│   ├── benchmark_10_runs.py     # 10-Shift Automated Comparative Benchmark Script
│   ├── docker-compose.yml       # PostgreSQL 16 Alpine Service
│   ├── manage.py                # Django CLI
│   └── requirements.txt         # Python Dependencies
│
├── frontend/
│   ├── app/
│   │   ├── (Auth)/              # Login & Registration Pages
│   │   ├── (Home)/              # Landing Page & Public Information
│   │   ├── driver/              # Real-Time Interactive Driver Cockpit (/driver)
│   │   ├── services/            # API Client (auth.ts, simulation.ts)
│   │   └── ui/Components/
│   │       ├── Driver/          # DriverMap, DriverHeader, ActiveOrderCard, etc.
│   │       └── Navbar.tsx       # Global Navigation Header
│   ├── package.json             # NPM Dependencies & Scripts
│   └── tsconfig.json            # TypeScript Configuration
│
└── README.md                    # Project Documentation
```

---

## 7. Getting Started & Installation

### Prerequisites
- **Python 3.10+**
- **Node.js 20+** and **pnpm** (or npm)
- **Git**
- *(Optional)* Docker & Docker Compose for PostgreSQL

---

### Backend Setup

1. **Navigate to the backend folder:**
   ```bash
   cd backend
   ```

2. **Create and activate a virtual environment:**
   ```bash
   python3 -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables:**
   Create or edit `backend/.env`:
   ```env
   SECRET_KEY=your-django-secret-key
   DEBUG=True
   DEEPSEEK_API_KEY=your-deepseek-api-key  # Optional for LLM evaluation
   USE_POSTGRES=False  # Set to True if running Docker PostgreSQL
   ```

5. **Run database migrations:**
   ```bash
   python manage.py migrate
   ```

6. **Start the Django development server:**
   ```bash
   python manage.py runserver 127.0.0.1:8000
   ```
   *The backend will be live at `http://127.0.0.1:8000`.*

---

### Frontend Setup

1. **Navigate to the frontend folder:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   pnpm install  # Or: npm install
   ```

3. **Start the Next.js development server with Turbopack:**
   ```bash
   pnpm dev  # Or: npm run dev
   ```
   *The application will be accessible at `http://localhost:3000`.*

4. **Access the Driver Cockpit:**
   - Go to `http://localhost:3000/login`
   - Use default courier credentials:
     - **Email:** `courier.demo@optigo.ai`
     - **Password:** `OptiGo2024!`
   - Or click **Register** to create a custom vehicle profile (Motorcycle, Bicycle, or Car).

---

## 8. API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :---: |
| `POST` | `/api/v1/auth/register/` | Register new courier account with vehicle config | No |
| `POST` | `/api/v1/auth/login/` | Obtain JWT Access and Refresh tokens | No |
| `POST` | `/api/v1/auth/token/refresh/` | Refresh expired JWT access token | No |
| `GET` | `/api/v1/auth/me/` | Retrieve authenticated courier profile | Bearer JWT |
| `GET` | `/api/v1/simulation/health/` | Backend health & connectivity check | No |
| `POST` | `/api/v1/simulation/shifts/start/` | Start a new tracked shift | Bearer JWT |
| `POST` | `/api/v1/simulation/shifts/telemetry/`| Synchronize real-time minute-by-minute shift state | Bearer JWT |
| `POST` | `/api/v1/simulation/shifts/end/` | Finalize shift and record total earnings & SLA | Bearer JWT |
| `POST` | `/api/v1/optimization/solve-batch/`| Solve PDPTW batch feasibility with Google OR-Tools | Bearer JWT |
| `POST` | `/api/v1/optimization/evaluate-ai/` | Query DeepSeek Strategist & Supervisor Maker-Checker | Bearer JWT |

---

## 9. Driver Cockpit Guide

### Simulation Controls
- **`⚡ Run Both` / `⏸ Pause Both`:** Starts or pauses both OptiGo AI and Greedy Base simulations concurrently with synchronized clock steps.
- **`Start / Pause`:** Granular control over the currently selected tab.
- **`+5m`:** Manually advances the active simulation by 5 minutes.
- **`Summary / Compare Results`:** Displays a head-to-head comparison modal with financial and operational breakdowns.
- **`Reset`:** Resets both couriers back to 12:00 PM for clean re-runs.

### Co-Pilot Mode & Autonomy Directives
Inside the **Active Order Card**, couriers can configure autonomous dispatch directives:
- **Decision Autonomy Mode:** Toggle between `⚡ Auto-Pilot` (AI accepts automatically) and `🤝 Co-Pilot` (AI pauses on incoming order offers, showing an AI recommendation with Accept / Reject buttons).
- **Allow Dual Smart Batches:** Enables or disables combining 2 delivery orders simultaneously.
- **Anti-Deadhead Maximum Distance Slider:** Rejects orders requiring relocation distances exceeding the chosen threshold (2.0 km to 10.0 km).
- **Supervisor Weather Detour Veto:** Automatically routes around flooded avenues (*Av. Gonzalitos*, *Av. Constitución*).

### Device Live GPS Telemetry
- Click **`Read Device GPS`** in the top-right corner of the map.
- The browser will ask for location permission. Once granted, a cyan marker with a live pulse will appear on your device's coordinates.
- A **Device Telemetry Stream HUD** opens in the top-left showing real-time latitude, longitude, satellite accuracy in meters, current speed (km/h), and compass heading.

### Weather & Traffic Scenarios
Click **`Scenario`** in the header to select from preset workday environments:
1. **Average Monterrey Day (Default):** Realistic daily cycle starting at 39°C heat, an unexpected afternoon storm closing *Av. Gonzalitos*, ending in light rain.
2. **Canícula Summer Heatwave:** Extreme 41°C heat, severe traffic, 1.2x surge.
3. **Tropical Storm & Flood:** Flooded *Av. Morones Prieto*, 1.8x storm surge.
4. **Rush Hour Peak:** Severe 1.75x traffic gridlock across all major avenues.
5. **Custom Scenario:** Freely configure temperature, traffic index, road closures, and surge multiplier.

---

## 10. Benchmark Results

Across 10 simulated 120-minute shifts under identical Monterrey demand streams, **OptiGo AI** consistently outperformed the baseline:

| Metric | Greedy Baseline | OptiGo AI | Improvement |
| :--- | :---: | :---: | :---: |
| **Average Net Earnings** | $284.50 MXN | **$412.80 MXN** | **+45.1%** |
| **Fuel Expenses** | $52.40 MXN | **$31.20 MXN** | **-40.5% (Savings)** |
| **SLA Late Penalties** | -$48.00 MXN | **$0.00 MXN** | **100% On-Time** |
| **Deadhead Distance (Empty km)**| 18.6 km | **7.4 km** | **-60.2%** |
| **$80 MXN Block Bonus Unlocked** | 4 / 10 shifts | **10 / 10 shifts** | **+150%** |

*Run the automated benchmark suite anytime using:*
```bash
python backend/benchmark_10_runs.py
```

---

## 11. License & Credits

Developed for the **HackMTY / Infosys Challenge (Track 3: The Courier)**.

- **Team:** OptiGo Engineers
- **License:** MIT License — free for academic, evaluation, and production use.
