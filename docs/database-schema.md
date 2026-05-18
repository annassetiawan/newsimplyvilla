# Database Schema

Database: **PostgreSQL** hosted on Supabase  
ORM: **Prisma 5**  
Schema file: [`prisma/schema.prisma`](../prisma/schema.prisma)

---

## Entity Relationship Summary

```
Villa
 ├── Room[]           → Reservation[]
 ├── Area[]
 ├── Staff[]          → Shift[]
 ├── Guest            → Reservation[]
 ├── InventoryItem[]  → StockMovement[]
 ├── Task[]
 ├── Transaction[]
 ├── SOP[]
 ├── LostAndFound[]
 ├── Business[]       → BusinessItem[] → PosTransaction[]
 ├── Subscription (1:1)
 └── ActivityLog[]
```

All primary entities are scoped to a `Villa` via `villaId`. `Guest` is the only model without a direct `villaId` (guests are linked through `Reservation`).

---

## Models

### Villa

The root entity. Each registered property is one Villa.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | Primary key |
| `name` | String | Villa display name |
| `address` | String | |
| `description` | String? | Optional |
| `contact` | String? | Phone or email |
| `facilities` | String[] | Array of facility tags |
| `isOnboarded` | Boolean | `false` until onboarding complete |
| `updatedAt` | DateTime | Auto-updated |

---

### Room

Bookable accommodation units within a villa.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `code` | String | Room identifier (e.g. "101") |
| `name` | String | Display name |
| `type` | String | Room type (e.g. "Deluxe", "Suite") |
| `capacity` | Int | Max occupants |
| `pricePerNight` | Float | Base price |
| `status` | RoomStatus | AVAILABLE / OCCUPIED / CLEANING / MAINTENANCE |
| `photos` | String[] | URLs |
| `villaId` | String | FK → Villa |

---

### Area

Common areas within the villa (pool, lobby, restaurant, etc.).

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `name` | String | |
| `description` | String? | |
| `villaId` | String | FK → Villa |

---

### Guest

Guest profiles. Shared across reservations (one guest can have multiple stays).

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `name` | String | |
| `idNumber` | String? | National ID or passport |
| `phone` | String? | |
| `email` | String? | |
| `notes` | String? | Internal notes |
| `createdAt` | DateTime | |

---

### Reservation

A booking linking a Guest to a Room for a date range.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `guestId` | String | FK → Guest |
| `roomId` | String | FK → Room |
| `checkIn` | DateTime | |
| `checkOut` | DateTime | |
| `status` | ReservationStatus | CONFIRMED / PENDING / CHECKEDIN / CHECKEDOUT / CANCELLED |
| `paymentStatus` | PaymentStatus | PAID / UNPAID |
| `pricePerNight` | Float | Snapshot of price at booking time |
| `totalAmount` | Float | Computed total |
| `createdAt` | DateTime | |

**Indexes:** `(roomId, status)`, `(checkOut, status)`, `(createdAt)`

---

### InventoryItem

Stock items tracked for the villa.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `sku` | String | Stock keeping unit |
| `name` | String | |
| `category` | ItemCategory | LINEN / AMENITY / FNB / MAINTENANCE |
| `onHand` | Int | Current quantity |
| `minLevel` | Int | Reorder threshold |
| `unit` | String | e.g. "pcs", "kg", "bottle" |
| `villaId` | String | FK → Villa |

---

### StockMovement

Audit trail of inventory changes.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `itemId` | String | FK → InventoryItem |
| `type` | MovementType | IN / OUT |
| `quantity` | Int | |
| `date` | DateTime | Default: now() |
| `note` | String? | Reason/context |

**Index:** `(itemId, date)`

---

### Task

Maintenance or cleaning tasks assigned to staff.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `title` | String | |
| `type` | TaskType | MAINTENANCE / CLEANING |
| `location` | String | Room or area name |
| `priority` | TaskPriority | HIGH / MED / LOW |
| `status` | TaskStatus | PENDING / IN_PROGRESS / DONE |
| `assignedTo` | String? | Staff name (Needs verification: name string vs FK) |
| `dueDate` | DateTime? | |
| `proofPhoto` | String? | URL of completion proof photo |
| `villaId` | String | FK → Villa |

**Indexes:** `(villaId, status)`, `(villaId, type)`

---

### Staff

Team members. Linked to Supabase Auth users.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `supabaseUserId` | String? (unique) | Links to auth.users |
| `name` | String | |
| `role` | StaffRole | OWNER / STAFF |
| `position` | String | Job title |
| `email` | String? (unique) | |
| `isActive` | Boolean | Default: true |
| `permissions` | String[] | Module permission keys |
| `villaId` | String | FK → Villa |
| `createdAt` | DateTime | |

---

### Shift

Work schedule entries per staff per day.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `staffId` | String | FK → Staff |
| `date` | DateTime | Day of the shift |
| `shiftType` | ShiftType | MORNING / AFTERNOON / NIGHT / OFF |

---

### Transaction

Financial records (income and expenses).

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `date` | DateTime | Transaction date |
| `type` | TransactionType | INCOME / EXPENSE |
| `description` | String | |
| `amount` | Float | |
| `category` | String | Free-text category (Needs verification: enum vs string) |
| `paymentStatus` | PaymentStatus | PAID / UNPAID |
| `reservationId` | String? | FK → Reservation (nullable) |
| `villaId` | String | FK → Villa |

**Indexes:** `(villaId, date)`, `(villaId, type, date)`

---

### SOP

Standard Operating Procedures for villa operations.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `title` | String | |
| `category` | SOPCategory | FRONT_DESK / HOUSEKEEPING / MAINTENANCE / INVENTORY / SAFETY |
| `steps` | Json | Array of step objects (Needs verification on structure) |
| `estimatedMinutes` | Int | |
| `villaId` | String | FK → Villa |
| `updatedAt` | DateTime | Auto-updated |

---

### LostAndFound

Items found on the property.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `item` | String | Item name |
| `description` | String? | |
| `location` | String | Where it was found |
| `foundDate` | DateTime | |
| `status` | LostAndFoundStatus | FOUND / CLAIMED |
| `villaId` | String | FK → Villa |

---

### Subscription

One-to-one billing record per villa.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `villaId` | String (unique) | FK → Villa (1:1) |
| `plan` | Plan | FREE / PRO |
| `status` | SubscriptionStatus | ACTIVE / INACTIVE / TRIAL |
| `startDate` | DateTime | |
| `endDate` | DateTime? | Null for ongoing subscriptions |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | |

---

### Business

A business unit operated within or alongside the villa (cafe, laundry, spa, etc.).

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `name` | String | Display name |
| `type` | String | Category label (e.g. "Cafe", "Laundry", "Spa") |
| `description` | String? | Optional |
| `status` | BusinessStatus | ACTIVE / INACTIVE |
| `villaId` | String | FK → Villa |
| `createdAt` | DateTime | |
| `updatedAt` | DateTime | Auto-updated |

---

### BusinessItem

Catalog items belonging to a business (menu items, services, products).

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `businessId` | String | FK → Business |
| `name` | String | Item name |
| `price` | Float | Selling price |
| `category` | String | Free-text category |
| `photo` | String? | URL |
| `stock` | Int | Current stock quantity |
| `villaId` | String | FK → Villa (for scoped queries) |

---

### PosTransaction

A sales transaction recorded via the POS module.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `businessId` | String | FK → Business |
| `items` | Json | Array of `{ itemId, name, price, qty, subtotal }` |
| `total` | Float | Grand total |
| `paymentMethod` | PaymentMethod | CASH / TRANSFER |
| `note` | String? | Optional cashier note |
| `villaId` | String | FK → Villa |
| `createdAt` | DateTime | Transaction timestamp |

**Indexes:** `(businessId, createdAt)`, `(villaId, createdAt)`

---

### Waitlist

Email signups for upcoming plan features.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `email` | String (unique) | |
| `plan` | Plan | FREE / PRO |
| `createdAt` | DateTime | |

---

### ActivityLog

Audit log of significant user actions.

| Field | Type | Notes |
|---|---|---|
| `id` | String (cuid) | |
| `villaId` | String | FK → Villa |
| `staffName` | String? | Who performed the action |
| `action` | String | Description of the action |
| `module` | String | Which module (e.g. "reservations", "inventory") |
| `createdAt` | DateTime | |

**Index:** `(villaId, createdAt)`

---

## Enums

| Enum | Values |
|---|---|
| `RoomStatus` | AVAILABLE, OCCUPIED, CLEANING, MAINTENANCE |
| `ReservationStatus` | CONFIRMED, PENDING, CHECKEDIN, CHECKEDOUT, CANCELLED |
| `PaymentStatus` | PAID, UNPAID |
| `ItemCategory` | LINEN, AMENITY, FNB, MAINTENANCE |
| `MovementType` | IN, OUT |
| `TaskType` | MAINTENANCE, CLEANING |
| `TaskPriority` | HIGH, MED, LOW |
| `TaskStatus` | PENDING, IN_PROGRESS, DONE |
| `StaffRole` | OWNER, STAFF |
| `ShiftType` | MORNING, AFTERNOON, NIGHT, OFF |
| `TransactionType` | INCOME, EXPENSE |
| `SOPCategory` | FRONT_DESK, HOUSEKEEPING, MAINTENANCE, INVENTORY, SAFETY |
| `LostAndFoundStatus` | FOUND, CLAIMED |
| `BusinessStatus` | ACTIVE, INACTIVE |
| `PaymentMethod` | CASH, TRANSFER |
| `Plan` | FREE, PRO |
| `SubscriptionStatus` | ACTIVE, INACTIVE, TRIAL |

---

## Migration Workflow

```bash
# Create a new migration (dev only)
npx prisma migrate dev --name <migration-name>

# Apply pending migrations (production)
npx prisma migrate deploy

# Reset DB and re-apply all migrations (dev only — destructive)
npx prisma migrate reset

# Regenerate Prisma client after schema change
npx prisma generate
```
