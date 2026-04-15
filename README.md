<div align="center">

<img src="https://img.shields.io/badge/BlockSense-Smart%20Community%20OS-0F6E56?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHBhdGggZmlsbD0id2hpdGUiIGQ9Ik0xMiAyTDIgN2wxMCA1IDEwLTVMMTIgMnpNMiAxN2wxMCA1IDEwLTVNMiAxMmwxMCA1IDEwLTUiLz48L3N2Zz4=" />

# BlockSense — Smart Community Operating System

**Real-time utility monitoring, resident management & automated alerts for gated communities**

[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![Convex](https://img.shields.io/badge/Convex-Realtime%20DB-EE4B2B?style=flat-square)](https://convex.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

</div>

---

## Table of Contents

1. [Overview](#overview)
2. [Live Features](#live-features)
3. [Architecture](#architecture)
4. [Role Hierarchy](#role-hierarchy)
5. [Dashboard Structure](#dashboard-structure)
6. [Data Flow](#data-flow)
7. [Database Schema](#database-schema)
8. [API Reference](#api-reference)
9. [Tech Stack](#tech-stack)
10. [Project Structure](#project-structure)
11. [Getting Started](#getting-started)
12. [Environment Variables](#environment-variables)
13. [Deployment](#deployment)

---

## Overview

BlockSense is a **full-stack community management platform** built for gated residential societies. It provides three distinct dashboard experiences — Platform Admin, RWA Committee, and Resident — with real-time utility monitoring, automated predictive alerts, payment tracking, service request management, and broadcast communications.

```
┌─────────────────────────────────────────────────────────────────┐
│                        BLOCKSENSE PLATFORM                      │
│                                                                 │
│  ┌──────────────┐   ┌──────────────┐   ┌──────────────────┐    │
│  │ PLATFORM     │   │ RWA          │   │ RESIDENT         │    │
│  │ ADMIN        │   │ DASHBOARD    │   │ PORTAL           │    │
│  │ /admin       │   │ /dashboard   │   │ /resident        │    │
│  │              │   │              │   │                  │    │
│  │ Cross-society│   │ Society ops  │   │ Read-only view   │    │
│  │ management   │   │ Full CRUD    │   │ + service reqs   │    │
│  └──────────────┘   └──────────────┘   └──────────────────┘    │
│                                                                 │
│                    ┌──────────────────┐                         │
│                    │  CONVEX BACKEND  │                         │
│                    │  Real-time sync  │                         │
│                    │  WebSocket push  │                         │
│                    └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

---

## Live Features

| Module | Feature | Status |
|---|---|---|
| **Water** | Tank level monitoring, 7-day trend, tanker prediction | ✅ |
| **Power** | DG unit diesel level, runtime prediction, refuel alerts | ✅ |
| **Gas** | Pressure monitoring, supply status, monthly summaries | ✅ |
| **Sewage** | STP status, sludge tank %, desludge scheduling | ✅ |
| **Waste** | Segregation compliance, block leaderboard, scoring | ✅ |
| **Garbage** | Collection tracking, missed collections, scheduling | ✅ |
| **Alerts** | Real-time critical/warning/info alerts, auto-dismiss | ✅ |
| **Staff** | Shift scheduling, attendance, vendor management | ✅ |
| **Reports** | Monthly PDF export, gas/sewage/water summaries | ✅ |
| **Residents** | Directory, role management, block assignment | ✅ |
| **Payments** | Maintenance dues, confirmation flow, overdue tracking | ✅ |
| **Service Requests** | Submit, track, rate resolution | ✅ |
| **Tickets** | RWA → Platform admin support ticket system | ✅ |
| **Broadcasts** | Platform/society-level announcements | ✅ |
| **Notices** | Society board notices by type | ✅ |
| **Predictions** | AI-powered water runout & diesel refuel scheduling | ✅ |
| **Dark Mode** | System-aware, persisted, smooth animated toggle | ✅ |
| **Demo Mode** | One-click role-based demo login, 90 days seeded data | ✅ |

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                          CLIENT (Browser)                           │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                    Next.js 14 App Router                    │   │
│  │                                                             │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │   │
│  │  │ (admin)  │  │  (rwa)   │  │(resident)│  │  (auth)  │  │   │
│  │  │ /admin/* │  │/dashboard│  │/resident │  │  /login  │  │   │
│  │  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │   │
│  │                                                             │   │
│  │  ┌─────────────────────────────────────────────────────┐  │   │
│  │  │              Convex React Client                    │  │   │
│  │  │  useQuery() ──► real-time subscriptions             │  │   │
│  │  │  useMutation() ──► optimistic updates               │  │   │
│  │  └─────────────────────────────────────────────────────┘  │   │
│  └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────┬──────────────────────────────────────┘
                               │  WebSocket (real-time)
                               │  HTTP (mutations)
┌──────────────────────────────▼──────────────────────────────────────┐
│                        CONVEX BACKEND                               │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────────┐  │
│  │   Queries    │  │  Mutations   │  │   Actions (side effects)  │  │
│  │  (real-time) │  │  (writes)    │  │  MSG91 WhatsApp / Resend  │  │
│  └──────────────┘  └──────────────┘  └──────────────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    Convex Database                           │  │
│  │              (Document store with indexes)                   │  │
│  │   26 tables · Auto-synced · ACID transactions               │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌─────────────────┐  ┌─────────────────┐  ┌───────────────────┐  │
│  │   Cron Jobs     │  │  Auth (Resend    │  │  File Storage     │  │
│  │  Weekly digest  │  │   OTP + Anon)   │  │  Receipt uploads  │  │
│  │  Alert sweeper  │  │                 │  │                   │  │
│  └─────────────────┘  └─────────────────┘  └───────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Request Flow

```
User Action
    │
    ▼
Next.js Component
    │
    ├── useQuery(api.module.function)
    │       │
    │       ▼
    │   Convex WebSocket ──► DB read ──► Real-time push to all subscribers
    │
    └── useMutation(api.module.function)
            │
            ▼
        Convex Server
            │
            ├── Validate args (Zod-like validators)
            ├── Auth check (getAuthUserId)
            ├── DB write (ctx.db.insert / patch / delete)
            └── Return result ──► Optimistic UI update
```

---

## Role Hierarchy

```
┌─────────────────────────────────────────────────────┐
│                   ROLE HIERARCHY                    │
│                                                     │
│          ┌─────────────────────┐                   │
│          │   platform_admin    │  ← BlockSense team │
│          │   /admin/*          │                   │
│          └──────────┬──────────┘                   │
│                     │ manages                       │
│          ┌──────────▼──────────┐                   │
│          │       admin         │  ← Society admin  │
│          └──────────┬──────────┘                   │
│                     │ oversees                      │
│          ┌──────────▼──────────┐                   │
│          │        rwa          │  ← RWA committee  │
│          │   /dashboard/*      │                   │
│          └──────────┬──────────┘                   │
│                     │ manages                       │
│     ┌───────────────┴───────────────┐              │
│     │                               │              │
│  ┌──▼──────┐              ┌─────────▼──┐          │
│  │resident │              │   staff    │          │
│  │/resident│              │ (internal) │          │
│  └─────────┘              └────────────┘          │
└─────────────────────────────────────────────────────┘
```

| Role | Access | Default Route |
|---|---|---|
| `platform_admin` | All societies, billing, broadcasts | `/admin` |
| `admin` | Full society management | `/dashboard` |
| `rwa` | Ops, residents, payments, requests | `/dashboard` |
| `resident` | Read utilities + submit requests | `/resident` |
| `staff` | Shift check-in only | Internal |

---

## Dashboard Structure

### Admin Dashboard `/admin`

```
/admin
├── page.tsx              ← KPI overview + society grid
├── societies/            ← Create/edit societies, plan management
├── users/                ← Cross-society user directory
├── utilities/            ← Cross-society utility status matrix
├── tickets/              ← Support tickets with SLA tracking
├── broadcasts/           ← Platform-wide announcements
├── analytics/            ← MRR, plan distribution, city breakdown
└── settings/             ← Admin profile
```

### RWA Dashboard `/dashboard`

```
/dashboard
├── page.tsx              ← Health score + utility overview
├── water/                ← Tank gauges, consumption charts, prediction
├── power/                ← DG units, diesel trend, refuel scheduler
├── gas/                  ← Pressure readings, monthly summaries
├── sewage/               ← STP status, sludge tracking
├── waste/                ← Segregation compliance, leaderboard
├── garbage/              ← Collection schedule, missed alerts
├── alerts/               ← Active alerts, resolve/dismiss
├── staff/                ← Shifts, attendance, vendor list
├── reports/              ← PDF export, monthly summaries
├── residents/            ← Directory, search, filter by role/block
├── vendors/              ← Vendor management, activate/deactivate
├── payments/             ← Dues, charges config, confirm payments
├── service-requests/     ← Advance status, priority view
├── tickets/              ← Create support tickets for platform admin
├── broadcasts/           ← Society-level announcements
├── block-select/         ← Block switcher
└── settings/             ← Society settings
```

### Resident Portal `/resident`

```
/resident
├── page.tsx              ← Home: utility cards + action banners
├── utilities/            ← Read-only: water, power, gas, sewage
├── payments/             ← View dues, pay, history
├── requests/             ← Submit service requests, rate resolution
├── notices/              ← Society notices board
└── profile/              ← Edit name, phone, WhatsApp
```

---

## Data Flow

### Utility Monitoring Flow

```
RWA Staff logs reading
        │
        ▼
  Convex Mutation
  (water/power/gas/sewage/waste)
        │
        ├──► DB insert into readings table
        │
        ├──► Prediction engine triggered
        │         │
        │         ▼
        │    ML-lite prediction:
        │    - Avg daily consumption (7-day rolling)
        │    - Days until critical (tank capacity ÷ avg use)
        │    - Recommended order date
        │    - Stored in predictionLog table
        │
        └──► Alert sweep (cron / inline)
                  │
                  ▼
             If threshold breached:
             - Insert alert record
             - Push real-time to all subscribers
             - Trigger WhatsApp (MSG91) if critical
```

### Payment Flow

```
RWA sets maintenance charge
        │
        ▼
  maintenanceCharges table
  (flat type → monthly amount → due day)
        │
        ▼ (monthly cron generates dues)
  payments table record
  status: "pending"
        │
Resident views in /resident/payments
        │
        ▼
  Resident submits payment screenshot
  status: "pending_confirmation"
        │
        ▼
  RWA confirms in /dashboard/payments
  status: "confirmed"
        │
        ▼
  Receipt URL stored, summary updated
```

### Service Request Flow

```
Resident submits request (/resident/requests)
        │
        ▼
  serviceRequests table
  status: "open"  priority: low/medium/urgent
        │
        ▼
RWA views in /dashboard/service-requests
        │
        ├── Advance → "in_progress"
        ├── Advance → "resolved"
        └── Advance → "closed"
                │
                ▼
        Resident rates resolution (1-5 stars)
        residentRating stored on record
```

### Weekly Digest Cron

```
Every Monday 09:00 IST
        │
        ▼
  notifications.sendWeeklyDigest (Convex Action)
        │
        ├── Query all societies
        ├── Per society: get blocks + RWA members
        ├── Get weekly alert summary
        ├── Get weekly water consumption
        └── Per RWA member with notifWhatsapp=true:
                │
                ▼
          MSG91 WhatsApp API
          Template: weekly_digest
          Variables: [name, society, alertCount, waterUsed]
```

---

## Database Schema

### Core Tables

```
┌─────────────────────────────────────────────────────────────────┐
│                        SCHEMA OVERVIEW                          │
│                                                                 │
│  societies ──────────────────── blocks ──── waterTanks          │
│      │                            │                            │
│      │                            │──── dgUnits                │
│      │                            │                            │
│      ├── users ──────────────────►│──── waterReadings          │
│      │   (role: platform_admin    │──── powerReadings          │
│      │    admin / rwa /           │──── gasReadings            │
│      │    resident / staff)       │──── sewageReadings         │
│      │                            │──── wasteReadings          │
│      ├── vendors                  │──── garbageReadings        │
│      │                            │                            │
│      ├── alerts                   └──── staff                  │
│      │                                                         │
│      ├── serviceRequests                                        │
│      ├── complaints                                             │
│      ├── payments                                               │
│      ├── maintenanceCharges                                     │
│      ├── notices                                                │
│      ├── broadcasts                                             │
│      ├── adminTickets ─── ticketMessages                        │
│      ├── visitors                                               │
│      ├── vehicles                                               │
│      ├── shifts                                                 │
│      └── predictionLog                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Key Table Shapes

```typescript
// societies
{
  name: string
  city: string
  address?: string
  totalFlats?: number
  subscriptionPlan: "free" | "basic" | "pro" | "enterprise"
  isActive?: boolean
  mrr?: number
}

// users
{
  societyId?: Id<"societies">
  blockId?: Id<"blocks">
  role?: "platform_admin" | "admin" | "rwa" | "resident" | "staff"
  name?: string
  email?: string
  phone?: string
  flatNumber?: string
  flatType?: string
  notifWhatsapp?: boolean
  notifInApp?: boolean
}

// waterReadings
{
  societyId: Id<"societies">
  blockId: Id<"blocks">
  tankId: Id<"waterTanks">
  levelPct: number          // 0-100
  volumeKL: number
  source: "borewell" | "municipal" | "tanker" | "rainwater"
  recordedAt: number
}

// payments
{
  societyId: Id<"societies">
  blockId: Id<"blocks">
  residentId: Id<"users">
  type: "monthly_maintenance" | "one_time" | "penalty" | "other"
  amount: number
  dueDate: number
  status: "pending" | "pending_confirmation" | "confirmed" | "overdue"
  paidAt?: number
}

// serviceRequests
{
  societyId: Id<"societies">
  blockId: Id<"blocks">
  residentId: Id<"users">
  category: string
  description: string
  priority: "low" | "medium" | "urgent"
  status: "open" | "in_progress" | "resolved" | "closed"
  assignedTo?: Id<"users">
  residentRating?: number
  resolvedAt?: number
}
```

---

## API Reference

### Water Module (`convex/water.ts`)

| Function | Type | Description |
|---|---|---|
| `getTankLevels` | query | Current level % for all tanks in block |
| `getWaterPrediction` | query | Days until critical, recommended order date |
| `getConsumptionTrend` | query | 7-day daily consumption array |
| `logReading` | mutation | Add new tank reading |
| `orderTanker` | mutation | Log tanker delivery |
| `getTankerHistory` | query | Recent tanker orders |
| `getWeeklyConsumption` | internalQuery | For digest cron |

### Alerts Module (`convex/alerts.ts`)

| Function | Type | Description |
|---|---|---|
| `getActiveAlerts` | query | All unresolved alerts for block |
| `createAlert` | mutation | Raise new alert |
| `resolveAlert` | mutation | Mark resolved |
| `dismissAlert` | mutation | Dismiss without resolving |
| `getWeeklyAlertSummary` | internalQuery | For digest cron |

### Payments Module (`convex/payments.ts`)

| Function | Type | Description |
|---|---|---|
| `getMyDues` | query | Resident's pending payments |
| `getBySociety` | query | All payments for RWA view |
| `getSummary` | query | MoM totals, overdue count |
| `setMaintenanceCharge` | mutation | Configure per-flat-type charge |
| `getMaintenanceCharges` | query | All charge configs |
| `recordPayment` | mutation | Log new payment |
| `confirmPayment` | mutation | RWA confirms resident payment |
| `submitScreenshot` | mutation | Resident uploads proof |

### Service Requests (`convex/serviceRequests.ts`)

| Function | Type | Description |
|---|---|---|
| `create` | mutation | Submit new request |
| `getMyRequests` | query | Resident's own requests |
| `getBySociety` | query | All requests (RWA view) |
| `updateStatus` | mutation | Advance through workflow |
| `rate` | mutation | Resident rates resolution |

---

## Tech Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                        TECH STACK                               │
│                                                                 │
│  FRONTEND                                                       │
│  ├── Next.js 14         App Router, Server Components           │
│  ├── React 18           Concurrent mode, Suspense               │
│  ├── TypeScript 5       Strict mode throughout                  │
│  ├── Tailwind CSS 3     JIT, dark mode via class                │
│  ├── shadcn/ui          Radix primitives + custom tokens        │
│  ├── Recharts           Responsive charts with dark mode        │
│  ├── next-themes        System-aware dark mode, localStorage    │
│  └── Lucide React       Icon system                             │
│                                                                 │
│  BACKEND                                                        │
│  ├── Convex             Real-time DB, serverless functions       │
│  ├── @convex-dev/auth   OTP (Resend) + Anonymous auth           │
│  ├── Resend             Transactional email (OTP codes)         │
│  └── MSG91              WhatsApp Business API (alerts/digest)   │
│                                                                 │
│  FORMS & VALIDATION                                             │
│  ├── React Hook Form    Performant forms                        │
│  ├── Zod                Schema validation                        │
│  └── @hookform/resolvers Zod integration                        │
│                                                                 │
│  EXPORT & DOCS                                                  │
│  ├── jsPDF              PDF report generation                   │
│  └── jspdf-autotable    Formatted tables in PDF                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
BlockSenseAI/
│
├── app/                              # Next.js App Router
│   ├── (admin)/                      # Route group — no URL prefix
│   │   └── admin/
│   │       ├── layout.tsx            # Admin shell (sidebar + header)
│   │       ├── page.tsx              # Platform overview
│   │       ├── societies/
│   │       ├── users/
│   │       ├── utilities/
│   │       ├── tickets/
│   │       ├── broadcasts/
│   │       ├── analytics/
│   │       └── settings/
│   │
│   ├── (rwa)/                        # Route group
│   │   └── dashboard/
│   │       ├── layout.tsx            # RWA shell
│   │       ├── page.tsx              # Society overview
│   │       ├── water/  power/  gas/
│   │       ├── sewage/ waste/  garbage/
│   │       ├── alerts/ staff/  reports/
│   │       ├── residents/  vendors/
│   │       ├── payments/   service-requests/
│   │       ├── tickets/    broadcasts/
│   │       ├── settings/   block-select/
│   │       └── [14 pages total]
│   │
│   ├── (resident)/
│   │   └── resident/
│   │       ├── layout.tsx            # Resident shell
│   │       ├── page.tsx              # Home
│   │       ├── utilities/  payments/
│   │       ├── requests/   notices/
│   │       └── profile/
│   │
│   ├── (dashboard)/                  # Legacy routes (/ root)
│   │   └── [original utility pages]
│   │
│   ├── (auth)/
│   │   └── login/page.tsx            # OTP + demo login
│   │
│   ├── layout.tsx                    # Root: ThemeProvider + ConvexProvider
│   └── globals.css                   # CSS variables, dark mode tokens
│
├── convex/                           # Backend
│   ├── schema.ts                     # 26-table Convex schema
│   ├── auth.ts / auth.config.ts      # Auth configuration
│   ├── crons.ts                      # Scheduled jobs
│   ├── notifications.ts              # WhatsApp digest action
│   ├── predictions.ts                # ML-lite prediction engine
│   ├── demo.ts                       # Demo data seeder (90 days)
│   │
│   ├── water.ts      power.ts        # Utility modules
│   ├── gas.ts        sewage.ts
│   ├── waste.ts      garbage.ts
│   │
│   ├── alerts.ts     staff.ts        # Operations modules
│   ├── vendors.ts    shifts.ts
│   ├── reports.ts
│   │
│   ├── societies.ts                  # Society + block management
│   ├── societies_internal.ts         # Internal + public queries
│   ├── users.ts                      # User profile management
│   │
│   ├── payments.ts                   # Payment + maintenance charges
│   ├── serviceRequests.ts            # Resident requests
│   ├── complaints.ts                 # Complaint system
│   ├── notices.ts                    # Society notices
│   ├── adminTickets.ts               # RWA → Platform support
│   ├── broadcastsService.ts          # Announcements
│   ├── visitors.ts                   # Visitor gate pass
│   └── vehicles.ts                   # Vehicle registry
│
├── components/
│   ├── admin/                        # AdminSidebar, AdminHeader
│   ├── rwa/                          # RwaSidebar, RwaHeader
│   ├── resident/                     # ResidentSidebar, ResidentHeader
│   ├── dashboard/                    # Legacy Sidebar, Header
│   ├── providers/
│   │   ├── convex-client-provider.tsx
│   │   └── theme-provider.tsx        # next-themes wrapper
│   └── ui/                           # shadcn/ui components + ThemeToggle
│
├── hooks/
│   └── use-active-block.ts           # localStorage block persistence
│
├── lib/
│   └── utils.ts                      # cn(), formatDateTime(), levelColor()
│
├── middleware.ts                     # Auth route protection
├── tailwind.config.ts                # CSS variable-mapped tokens
└── package.json
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm
- Convex account ([convex.dev](https://convex.dev))

### 1. Clone & Install

```bash
git clone https://github.com/theyassirkhan/BlockSenseAI.git
cd BlockSenseAI
npm install
```

### 2. Configure Convex

```bash
npx convex dev
```

This creates your `.env.local` with `NEXT_PUBLIC_CONVEX_URL`.

### 3. Start Development

```bash
# Terminal 1 — Convex backend
npx convex dev

# Terminal 2 — Next.js frontend
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Load Demo Data

1. Click **Demo Access → Admin** on login page
2. On the dashboard, click **"Load demo data"**
3. Seeds 90 days of realistic utility readings, alerts, and predictions

---

## Environment Variables

```env
# Auto-generated by `npx convex dev`
NEXT_PUBLIC_CONVEX_URL=https://your-deployment.convex.cloud

# Auth — Resend (for OTP email)
AUTH_RESEND_KEY=re_xxxxxxxxxxxx

# WhatsApp notifications (optional)
MSG91_AUTH_KEY=your_msg91_key
MSG91_TEMPLATE_ID=your_template_id

# Resend (for transactional email)
RESEND_API_KEY=re_xxxxxxxxxxxx
```

---

## Deployment

### Convex (Backend)

```bash
npx convex deploy
```

### Vercel (Frontend)

```bash
npm install -g vercel
vercel --prod
```

Set environment variables in Vercel dashboard matching `.env.local`.

### Convex Crons (Auto-deployed)

Defined in `convex/crons.ts` — deployed automatically with `convex deploy`:

| Job | Schedule | Action |
|---|---|---|
| Weekly digest | Mon 09:00 IST | WhatsApp summary to all RWA members |
| Alert sweep | Every 6h | Check thresholds, auto-create alerts |
| Prediction refresh | Daily 02:00 | Recalculate water/diesel predictions |
| Garbage missed | Daily 20:00 | Flag uncollected schedules |

---

## Contributing

```bash
# Create feature branch
git checkout -b feature/your-feature

# Make changes, then
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature

# Open PR on GitHub
```

---

## License

MIT © 2025 [Yassir Khan](https://github.com/theyassirkhan)

---

<div align="center">

**Built with ❤️ for smarter, safer communities**

[Report Bug](https://github.com/theyassirkhan/BlockSenseAI/issues) · [Request Feature](https://github.com/theyassirkhan/BlockSenseAI/issues) · [Documentation](https://github.com/theyassirkhan/BlockSenseAI/wiki)

</div>
