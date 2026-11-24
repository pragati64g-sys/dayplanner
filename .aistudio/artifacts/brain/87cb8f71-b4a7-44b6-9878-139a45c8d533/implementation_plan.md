# Dayplanner

Dayplanner is a dark-mode daily agenda and to-do workspace designed around focused time-blocking, priority management, and real-time local temperature awareness, built as a zero-backend static web application ready for instant hosting on Vercel.

---

### User Review & Critical Decisions

> [!IMPORTANT]
> All core product, visual, and technical decisions below reflect your confirmed preferences. Review and approve to begin implementation.

- **Data Persistence (Confirmed)**: Browser `localStorage` persistence with automatic saving and JSON export/import backup so the site deploys statically to Vercel with zero database or environment-key setup.
- **Task Workflow & Layout (Confirmed)**: Daily agenda organized by time blocks (Morning, Afternoon, Evening, Unscheduled), explicit priority levels (High, Medium, Low), and filterable categories (Work, Personal, Health, Errands, Focus).
- **Local Temperature Widget (Confirmed)**: Compact live weather indicator in the workspace header displaying current temperature, weather condition icon, city name, and an interactive `°C / °F` unit toggle.
- **Dark Mode Aesthetic (Confirmed)**: Obsidian charcoal surfaces paired with warm amber accents, crisp typographic hierarchy, and single-elevation hairline borders.

---

### 1. Overview & Core Concept

- **What It Does**: Dayplanner combines a structured daily task agenda with real-time local temperature context in a single high-contrast dark workspace. Users can add tasks with scheduled time windows, priority levels, and categories, reorder or move tasks across time blocks, filter by status or category, track daily completion progress, and switch dates across a multi-day horizon.
- **Target Audience / Persona**: Individual makers, engineers, students, and daily planners who want a fast, distraction-free dark-mode workspace that runs locally in the browser and deploys effortlessly as a static site on Vercel.
- **Key Value**: Replaces cluttered multi-tab to-do apps with a cohesive daily cadence—pairing concrete time blocks with live local weather context so planning errands, deep work, and outdoor breaks happens in one place.

---

### 2. User Experience & Visual Design

- **Key User Flows**:
  1. **First Load & Weather Detection**: The workspace opens immediately on today's agenda with starter sample tasks (easily cleared or checked off) while prompting browser Geolocation for local temperature. If location permission is pending, denied, or unavailable, the compact weather widget degrades gracefully with an inline city search popover to set any location manually.
  2. **Quick Task Capture & Scheduling**: Pressing `+ New Task` (or keyboard shortcut `N`) opens an inline/drawer composer to enter title, optional notes, scheduled time (`HH:MM`), time block (`Morning`, `Afternoon`, `Evening`, `Anytime`), priority (`High`, `Medium`, `Low`), and category.
  3. **Active Day Execution**: Users check off tasks with crisp tactile feedback, inline-edit details, switch time blocks, filter by category/priority/search query, and review completed items cleanly at the bottom of each block or via the status filter.
  4. **Day Navigation & Data Portability**: Users step forward or backward by day via the agenda date selector and can export/import their planner data as JSON or clear completed items in one click.

- **Visual Identity & Theme**:
  - *Aesthetic Direction*: Tactile obsidian studio utility—calm, disciplined, high-contrast dark surfaces inspired by precision desktop scheduling tools.
  - *Color Palette & Mood (60-30-10 Distribution)*:
    - **60% Dominant Neutral Canvas**: `--background: #0B0C0F` (deep obsidian charcoal)
    - **30% Structural Surfaces**: `--surface: #13151A`, `--surface-elevated: #1A1D24`, `--border: #252932`, muted neutral typography (`#F3F4F6` primary text, `#9CA3AF` secondary, `#6B7280` muted)
    - **10% Accent & Semantic Signals**: `--primary: #F59E0B` (warm amber for primary CTAs, active day highlight, focus rings), paired with explicit text/icon semantic indicators (`#10B981` emerald for completed/nominal, `#EF4444` crimson for high-priority/overdue).
  - *Typography & Hierarchy*:
    - Display & Section Headings: `Plus Jakarta Sans` (SemiBold 600, `text-wrap: balance`)
    - Body & Task Copy: `DM Sans` (Regular 400 / Medium 500, subtle `+0.01em` dark-mode optical tracking)
    - Timestamps, Counts & Temperature Readouts: `JetBrains Mono` with strict `tabular-nums` alignment
  - *Component Styling & Layout*:
    - Desktop workspace layout (`1440px` target, `260px` sidebar + main agenda viewport, collapsing cleanly to a single-column drawer layout on mobile/tablet).
    - Top header adheres to a clean 3-zone structure: single-line `Dayplanner` wordmark on the left, compact live temperature widget (`City · 18°C` + `°C/°F` toggle) in the utility zone, and `+ New Task` primary action on the right.
    - Single-elevation flat panels separated by subtle `1px` borders (`#252932`) and generous spacing—no nested card-inside-card stacks, no thick left accent stripes, and no pill-badge clutter on static metadata (metadata rendered as clean unboxed text separated by `·`).

- **Interactive Feedback & Motion**:
  - Subtle compositor-only transitions (`transform`, `opacity`, $\le 180\text{ms}$ `cubic-bezier(0.16, 1, 0.3, 1)`) for task completion checkmarks, modal/drawer reveals, and filter tab switches, honoring `prefers-reduced-motion`.
  - Explicit states for Weather loading skeletons, geolocation permission fallback, empty filtered task lists with clear reset/add actions, and inline confirmation when clearing completed tasks.

---

### 3. Key Product Decisions & Trade-Offs

- **Decision 1: Client-Side `localStorage` + JSON Backup**
  - *Chosen Approach*: Persist all tasks, selected temperature unit (`°C`/`°F`), and saved location preferences in browser `localStorage` with instant state hydration, plus JSON export/import controls in the sidebar.
  - *Why*: Enables immediate zero-latency offline responsiveness and effortless static hosting on Vercel without requiring backend servers, databases, or authentication setup.
  - *Alternatives Considered*: Server-side database or Firebase Firestore—deferred because it requires user sign-in and cloud configuration that adds friction to personal static Vercel hosting.

- **Decision 2: Keyless Open-Meteo Weather & Geocoding Integration**
  - *Chosen Approach*: Use the browser Geolocation API paired with the Open-Meteo Forecast API (`temperature_2m`, `weather_code`) and BigDataCloud/Open-Meteo Geocoding for city names and manual city lookup.
  - *Why*: Requires zero API keys or server-side secrets, keeping the Vercel deployment 100% static and client-safe with no exposed credentials, while still providing real, live temperature for the user's current location.
  - *Alternatives Considered*: OpenWeatherMap—rejected because it requires an API key that would either expose secrets in a static bundle or require serverless proxy functions.

- **Decision 3: Structured Time-Block Agenda Over Flat List**
  - *Chosen Approach*: Group daily tasks into four collapsible/clear time blocks (`Morning`, `Afternoon`, `Evening`, `Anytime`) alongside priority tags and category filters in the sidebar.
  - *Why*: Matches daily intentional planning better than an ungrouped checklist while keeping quick task entry fast (time block defaults intelligently or can be left as `Anytime`).

---

### 4. Technical Architecture & Data Strategy *(Technical Reference)*

- **Architecture & Component Diagram**:

```text
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser & Static Host                          │
│  ┌──────────────────────┐              ┌─────────────────────────────┐  │
│  │ localStorage Engine  │◄────────────►│ Open-Meteo + Geolocation    │  │
│  │ (Tasks, Unit, City)  │              │ (Live Temp, WMO Code, City) │  │
│  └──────────┬───────────┘              └──────────────┬──────────────┘  │
└─────────────┼─────────────────────────────────────────┼─────────────────┘
              │                                         │
              ▼                                         ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                        Dayplanner App Shell                             │
│                                                                         │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ Top Bar: [Dayplanner]  ───  [Live Weather + °C/°F]  ───  [+ Task] │  │
│  └───────────────────────────────────────────────────────────────────┘  │
│  ┌───────────────────────┬───────────────────────────────────────────┐  │
│  │ Sidebar (260px)       │ Main Agenda Viewport                      │  │
│  │ • Mini Date Picker    │ • Active Date Header & Progress Summary   │  │
│  │ • Category Filters    │ • Search & Priority Filter Bar            │  │
│  │ • Priority Breakdown  │ • Time-Block Sections:                    │  │
│  │ • Data Export/Import  │     Morning / Afternoon / Evening / Any   │  │
│  └───────────────────────┴───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘
```

- **Data Model & State**:
  - `TaskItem`: `{ id, title, notes?, date (YYYY-MM-DD), timeSlot ('morning' | 'afternoon' | 'evening' | 'anytime'), scheduledTime? (HH:MM), priority ('high' | 'medium' | 'low'), category ('work' | 'personal' | 'health' | 'errands' | 'focus'), completed (boolean), createdAt, completedAt? }`
  - `WeatherState`: `{ status ('idle' | 'loading' | 'ready' | 'error'), temperatureC: number | null, weatherCode: number | null, cityName: string, latitude: number | null, longitude: number | null, unit: 'C' | 'F', lastUpdated: number | null }`
  - `FilterState`: `{ selectedDate, categoryFilter ('all' | Category), priorityFilter ('all' | Priority), statusFilter ('all' | 'active' | 'completed'), searchQuery }`

- **Interactive Component & State Mapping**:
  - **Header Weather Widget**: Automatically resolves coordinates via `navigator.geolocation` on load (cached briefly to avoid redundant requests), fetches live `temperature_2m` and `weather_code`, toggles between `°C` and `°F` instantaneously without re-fetching, provides a manual refresh trigger, and opens an inline city search popover when clicked so users can override or recover from denied location permissions.
  - **Sidebar Navigation & Filters**: Switches the active planning date (Today, Tomorrow, or custom date picker), filters tasks by category with live unboxed task counts, and provides JSON export/import and "Clear Completed" utilities.
  - **Task Composer & Inline Editor**: Validates non-empty titles, assigns date/time block/priority/category, and supports keyboard submit (`Enter`) and quick edits directly on any agenda row.
  - **Time-Block Agenda Sections**: Renders filtered tasks grouped chronologically within `Morning`, `Afternoon`, `Evening`, and `Anytime`; supports instant completion toggle, priority cycling or full edit modal, time-block reassignment, and deletion, with explicit empty states per view.

- **Vercel Deployment Readiness**:
  - Configured as a pure Vite React static SPA with a `vercel.json` rewrite rule (`/* -> /index.html`), strict TypeScript build (`npm run build` outputting to `dist/`), and zero required environment variables or server runtime dependencies.
