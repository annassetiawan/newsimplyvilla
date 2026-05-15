# Features

Status legend: **Live** = fully implemented | **Partial** = skeleton or incomplete | **Planned** = future roadmap

---

## Dashboard (`/dashboard`)

**Status: Live**

- KPI summary cards (occupancy, revenue, tasks — Needs verification on exact metrics)
- Revenue vs. expense line chart (Recharts) with date range filter (Last 30 days / Last 90 days / custom month)
- Maintenance task widget (recent/urgent tasks)
- Activity log feed

---

## Front Desk (`/front-desk`)

**Status: Live**

Four tabs:

### Reservations
- View all reservations in list format
- Filter by status (Confirmed, Pending, Checked In, Checked Out, Cancelled)
- Create new reservation via modal (guest info, room, dates, payment status)
- Edit existing reservation
- View reservation detail in a side sheet
- Cancel reservation

### Calendar
- Visual calendar showing reservation blocks per room per day

### Guests
- Guest directory (name, ID number, phone, email, notes)
- Create and manage guest profiles
- Click-through to individual guest page (`/front-desk/guests/[id]`)
  - Full reservation history for the guest

### Lost & Found
- Log found items (item name, description, location, date found)
- Mark items as Claimed

---

## Rooms (`/rooms`)

**Status: Live**

- Room inventory list (code, name, type, capacity, price/night, status)
- Status management: AVAILABLE / OCCUPIED / CLEANING / MAINTENANCE
- Create and edit rooms via modal
- Room photo support (stored as URL array — Needs verification on upload flow)

---

## Inventory (`/inventory`)

**Status: Live**

- Item registry by category: Linen, Amenity, F&B, Maintenance
- Track `onHand` stock vs. `minLevel` (low-stock alerts — Needs verification on alert mechanism)
- Record stock movements (IN / OUT) with notes
- SKU and unit tracking

---

## Maintenance (`/maintenance`)

**Status: Live**

Three views, switchable:

### Board (Kanban)
- Drag-and-drop tasks between PENDING / IN_PROGRESS / DONE columns
- Local state optimistic updates for smooth DnD

### Calendar
- Task due dates displayed on a monthly calendar

### List
- Sortable/filterable table of all tasks

Task fields: title, type (Maintenance/Cleaning), location, priority (High/Med/Low), status, assigned staff, due date, proof photo upload

---

## Schedule (`/schedule`)

**Status: Live**

- Weekly/monthly staff shift calendar
- Shift types: Morning, Afternoon, Night, Off
- Assign shifts per staff member per day
- Create and edit shifts inline

---

## Reports (`/reports`)

**Status: Live**

- Transaction list (Income / Expense entries)
- Add expense entries manually
- Cancel/void transactions
- Filter by month (dropdown)
- Export to Excel (xlsx)
- Summary totals: gross income, expenses, net

---

## SOP (`/sop`)

**Status: Live (Pro only)**

- Standard Operating Procedures by category: Front Desk, Housekeeping, Maintenance, Inventory, Safety
- Create SOPs with step-by-step JSON structure
- Estimated completion time per SOP

---

## Settings (`/settings`)

**Status: Live**

- Villa profile (name, address, description, contact, facilities)
- Area management (add/edit/delete areas like rooms, pool, lobby)
- (Additional settings — Needs verification on full scope)

---

## Users (`/users`)

**Status: Live**

- List all staff members (name, role, position, email, status)
- Invite new staff via email
- Assign permissions
- Activate / deactivate staff accounts

---

## Pricing (`/pricing`)

**Status: Live**

- Free vs. Pro plan comparison
- Upgrade CTA with waitlist modal (direct payment not yet integrated — Needs verification)
- Dark mode compatible pricing cards

---

## Planned / Skeleton Modules

| Route | Module | Notes |
|---|---|---|
| `/employee` | Employee management | Advanced HR features |
| `/finance` | Finance dashboard | Extended financial analytics |
| `/business` | Business settings | Multi-property, branding |
| `/change-management` | Change logs | Audit/version history |
| `/channel-manager` | OTA integration | Booking.com, Airbnb sync |

---

## Cross-Cutting Features

- **Dark mode** — via `next-themes`, fully supported across all modules
- **Role-based access** — OWNER has full access; STAFF access determined by `permissions` array
- **ProGate** — wraps Pro-only UI; shows upgrade modal to Free users
- **Activity log** — records key actions (module, action, staff name, timestamp) per villa
- **Toast notifications** — Sonner library for success/error feedback
- **Loading skeletons** — `SkeletonCard`, `SkeletonTable`, `SkeletonKanban` per page type
- **Empty states** — `EmptyState` component for zero-data views
- **Network error handling** — `NetworkError` component for failed fetches
- **Session expiry** — `SessionExpired` component shown on auth errors
