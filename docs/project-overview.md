# Project Overview

## What is SimplyVilla?

SimplyVilla is a multi-tenant villa and resort management SaaS. Each registered villa gets its own isolated workspace where the owner and staff can manage day-to-day operations: reservations, housekeeping tasks, inventory, staff scheduling, and financial reporting.

## Goals

- Replace manual/spreadsheet-based operations for small-to-medium villas
- Provide a single platform for front-desk, housekeeping, and management roles
- Support multi-user, role-based access with granular permissions
- Offer a freemium subscription model with Pro upgrade path

## Target Users

| Role | Responsibilities in SimplyVilla |
|---|---|
| **Owner** | Full access — settings, reports, staff management, billing |
| **Staff** | Module access defined by assigned permissions |

## Subscription Tiers

| Feature | Free | Pro |
|---|---|---|
| Reservations (list view) | Yes | Yes |
| Guest management | Yes | Yes |
| Reservation calendar | No | Yes |
| Lost & Found | No | Yes |
| Room management | Max 10 rooms | Unlimited |
| Area management | No | Yes |
| Inventory tracking | Yes | Yes |
| Maintenance (list view) | Yes | Yes |
| Maintenance Kanban & Calendar | No | Yes |
| Staff scheduling | Yes | Yes |
| Staff accounts | Max 2 active | Unlimited |
| Financial reports (basic) | Yes | Yes |
| Export reports (xlsx) | No | Yes |
| Activity log | No | Yes |
| SOP management | No | Yes |
| Business & POS | No | Yes |
| Employee Management | No | Yes (planned) |
| Finance & Account | No | Yes (planned) |
| Channel Manager (OTA sync) | No | Yes (planned) |

Subscription state is stored in the `Subscription` model linked to the villa.

**Gating mechanisms:**
- `ProGate` component wraps section-level Pro-only UI (tabs, view content); shows a lock screen with a link to `/pricing` for Free users
- Button-level gate pattern: `useSubscription` + `useRouter` redirect to `/pricing` on click (used for Export xlsx button); amber lock icon shown inline
- Server actions enforce hard limits (max 10 rooms, max 2 active staff) and return structured errors surfaced via Sonner toast

## Onboarding Flow

New users go through a guided onboarding at `/onboarding` before accessing the main dashboard:
1. Create villa profile (name, address, description, contact)
2. Define areas (rooms, common areas)
3. Set `isOnboarded = true` on the Villa record

Once onboarded, users are redirected to `/dashboard`.

## Multi-tenancy Model

All data is scoped to a `villaId`. There is no shared data between villas. Staff are associated with exactly one villa via the `Staff.villaId` field and linked to their Supabase Auth account via `Staff.supabaseUserId`.

## Current State (as of May 2026)

- Core modules live: dashboard, front-desk, rooms, inventory, maintenance, schedule, reports, SOP, settings, users, business (Pro)
- Skeleton/planned modules: employee, finance, change-management, channel-manager
- Authentication, onboarding, and subscription gates are functional
