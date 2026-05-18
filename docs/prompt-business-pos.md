# Implementation Prompt: Business & POS Module — SimplyVilla

## Context

SimplyVilla adalah multi-tenant villa management SaaS (Next.js 16 App Router + React 19, TypeScript 5.7, Tailwind CSS v4, shadcn/ui, Prisma 5, Supabase Auth, Zustand). Semua data di-scope ke `villaId`. Mutations via Server Actions di `app/actions/`. Session via `getSessionUser()`. Pro features di-gate dengan `ProGate` component.

---

## Goal

Implement modul **Business** di route `/business` sebagai **Pro-only feature**. Modul ini memungkinkan villa menambahkan unit bisnis tambahan (cafe, laundry, spa, dll) dan mengelola transaksi penjualan via POS.

---

## Database Schema (Prisma)

Tambahkan model-model berikut ke `prisma/schema.prisma`:

```prisma
model Business {
  id          String         @id @default(cuid())
  name        String
  type        String         // "Cafe", "Laundry", "Spa", dll (free-text)
  description String?
  status      BusinessStatus @default(ACTIVE)
  villaId     String
  villa       Villa          @relation(fields: [villaId], references: [id])
  items       BusinessItem[]
  transactions PosTransaction[]
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
}

model BusinessItem {
  id         String   @id @default(cuid())
  businessId String
  business   Business @relation(fields: [businessId], references: [id])
  name       String
  price      Float
  category   String   // free-text
  photo      String?  // URL
  stock      Int      @default(0)
  villaId    String
}

model PosTransaction {
  id            String        @id @default(cuid())
  businessId    String
  business      Business      @relation(fields: [businessId], references: [id])
  items         Json          // Array of { itemId, name, price, qty, subtotal }
  total         Float
  paymentMethod PaymentMethod
  note          String?
  villaId       String
  createdAt     DateTime      @default(now())

  @@index([businessId, createdAt])
  @@index([villaId, createdAt])
}

enum BusinessStatus {
  ACTIVE
  INACTIVE
}

enum PaymentMethod {
  CASH
  TRANSFER
}
```

Tambahkan relasi di model `Villa`:
```prisma
businesses   Business[]
```

Jalankan:
```bash
npx prisma migrate dev --name add-business-pos
npx prisma generate
```

---

## File Structure

```
app/(app)/business/
  page.tsx                    ← server component, fetch businesses + items
  loading.tsx                 ← skeleton

app/actions/
  business.ts                 ← CRUD business & items
  pos.ts                      ← create PosTransaction, fetch history

components/business/
  business-client.tsx         ← "use client", tabs: Manage | POS
  manage/
    business-list.tsx         ← grid/list of businesses
    business-modal.tsx        ← create/edit business
    item-list.tsx             ← catalog items per business
    item-modal.tsx            ← create/edit item
  pos/
    pos-client.tsx            ← POS interface
    business-selector.tsx     ← dropdown pilih business
    item-grid.tsx             ← catalog grid
    cart.tsx                  ← cart panel
    transaction-history.tsx   ← riwayat transaksi
```

---

## Page Component (`app/(app)/business/page.tsx`)

```tsx
import { getSessionUser } from "@/lib/session"
import { prisma } from "@/lib/prisma"
import { ProGate } from "@/components/pro-gate"
import BusinessClient from "@/components/business/business-client"

export default async function BusinessPage() {
  const user = await getSessionUser()

  const businesses = await prisma.business.findMany({
    where: { villaId: user.villaId },
    include: { items: true },
    orderBy: { createdAt: "desc" },
  })

  return (
    <ProGate>
      <BusinessClient businesses={businesses} villaId={user.villaId} />
    </ProGate>
  )
}
```

---

## Server Actions

### `app/actions/business.ts`

```ts
"use server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

// --- Business CRUD ---

export async function createBusiness(data: {
  name: string
  type: string
  description?: string
}) {
  const user = await getSessionUser()
  await prisma.business.create({
    data: { ...data, villaId: user.villaId },
  })
  revalidatePath("/business")
}

export async function updateBusiness(id: string, data: {
  name?: string
  type?: string
  description?: string
  status?: "ACTIVE" | "INACTIVE"
}) {
  const user = await getSessionUser()
  await prisma.business.update({
    where: { id, villaId: user.villaId },
    data,
  })
  revalidatePath("/business")
}

export async function deleteBusiness(id: string) {
  const user = await getSessionUser()
  await prisma.business.delete({ where: { id, villaId: user.villaId } })
  revalidatePath("/business")
}

// --- Item CRUD ---

export async function createBusinessItem(data: {
  businessId: string
  name: string
  price: number
  category: string
  photo?: string
  stock: number
}) {
  const user = await getSessionUser()
  await prisma.businessItem.create({
    data: { ...data, villaId: user.villaId },
  })
  revalidatePath("/business")
}

export async function updateBusinessItem(id: string, data: {
  name?: string
  price?: number
  category?: string
  photo?: string
  stock?: number
}) {
  const user = await getSessionUser()
  await prisma.businessItem.update({
    where: { id, villaId: user.villaId },
    data,
  })
  revalidatePath("/business")
}

export async function deleteBusinessItem(id: string) {
  const user = await getSessionUser()
  await prisma.businessItem.delete({ where: { id, villaId: user.villaId } })
  revalidatePath("/business")
}
```

### `app/actions/pos.ts`

```ts
"use server"
import { prisma } from "@/lib/prisma"
import { getSessionUser } from "@/lib/session"
import { revalidatePath } from "next/cache"

type CartItem = {
  itemId: string
  name: string
  price: number
  qty: number
  subtotal: number
}

export async function createPosTransaction(data: {
  businessId: string
  items: CartItem[]
  total: number
  paymentMethod: "CASH" | "TRANSFER"
  note?: string
}) {
  const user = await getSessionUser()

  // Deduct stock for each item
  for (const item of data.items) {
    await prisma.businessItem.updateMany({
      where: { id: item.itemId, villaId: user.villaId },
      data: { stock: { decrement: item.qty } },
    })
  }

  await prisma.posTransaction.create({
    data: {
      businessId: data.businessId,
      items: data.items,
      total: data.total,
      paymentMethod: data.paymentMethod,
      note: data.note,
      villaId: user.villaId,
    },
  })

  revalidatePath("/business")
}

export async function getPosTransactions(businessId: string) {
  const user = await getSessionUser()
  return prisma.posTransaction.findMany({
    where: { businessId, villaId: user.villaId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })
}
```

---

## Client Component (`components/business/business-client.tsx`)

```tsx
"use client"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Store, ShoppingCart } from "lucide-react"
// import sub-components

export default function BusinessClient({ businesses, villaId }) {
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Business</h1>
        <p className="text-sm text-muted-foreground">
          Kelola unit bisnis dan transaksi penjualan villa
        </p>
      </div>

      <Tabs defaultValue="manage">
        <TabsList>
          <TabsTrigger value="manage">
            <Store className="w-4 h-4 mr-2" /> Manage
          </TabsTrigger>
          <TabsTrigger value="pos">
            <ShoppingCart className="w-4 h-4 mr-2" /> POS
          </TabsTrigger>
        </TabsList>

        <TabsContent value="manage">
          {/* BusinessList + ItemList per bisnis */}
        </TabsContent>

        <TabsContent value="pos">
          {/* BusinessSelector + ItemGrid + Cart + TransactionHistory */}
        </TabsContent>
      </Tabs>
    </div>
  )
}
```

---

## UI/UX Spec

### Tab: Manage
- **Business cards** — grid 3 kolom, tiap card: nama, tipe badge, status badge (Active/Inactive), tombol Edit + Delete + "Lihat Item"
- **Expand/Click business** → tampilkan item catalog di bawahnya atau slide panel
- **Item catalog** — table: foto thumbnail | nama | kategori | harga | stok | actions
- Stock 0 → badge merah "Habis"
- Tombol "Tambah Bisnis" di kanan atas (neutral-800 button)
- Modal create/edit business: nama, tipe (input), deskripsi (textarea), status toggle

### Tab: POS
- **Business selector** — dropdown di atas, hanya tampilkan ACTIVE businesses
- **Item grid** — card per item: foto, nama, kategori, harga, stok. Disabled jika stok 0
- **Cart panel** — di kanan (atau bottom sheet di mobile): list item dipilih, qty controls, total
- **Checkout** — payment method toggle (Cash / Transfer), optional note, tombol "Konfirmasi Transaksi"
- **Transaction history** — accordion atau table di bawah POS: tanggal, items summary, total, payment method

---

## Sidebar Navigation

Di `components/layout/sidebar.tsx`, tambahkan entry Business di section Pro:

```tsx
{
  label: "Business",
  href: "/business",
  icon: Store,
  pro: true,
}
```

---

## Conventions yang Harus Diikuti

- Path alias `@/` untuk semua imports
- Semua icons dari `lucide-react` saja
- Action buttons gunakan `neutral-800`, bukan amber
- Amber hanya untuk ProGate / upgrade UI
- Zod validation di semua form inputs sebelum memanggil server action
- `revalidatePath("/business")` dipanggil setelah setiap mutasi
- Selalu scope query dengan `villaId: user.villaId`
- Gunakan Sonner toast untuk feedback sukses/error
- Dark mode: test semua komponen dengan `dark:` variants
- Loading state: buat `loading.tsx` dengan `SkeletonCard` atau `SkeletonTable`

---

## Checklist Implementasi

- [ ] Prisma schema updated + migration dijalankan
- [ ] `app/actions/business.ts` — CRUD business & items
- [ ] `app/actions/pos.ts` — create transaction + fetch history
- [ ] `app/(app)/business/page.tsx` — server component + ProGate
- [ ] `app/(app)/business/loading.tsx` — skeleton
- [ ] `components/business/business-client.tsx` — tabs wrapper
- [ ] `components/business/manage/business-list.tsx`
- [ ] `components/business/manage/business-modal.tsx`
- [ ] `components/business/manage/item-list.tsx`
- [ ] `components/business/manage/item-modal.tsx`
- [ ] `components/business/pos/pos-client.tsx`
- [ ] `components/business/pos/business-selector.tsx`
- [ ] `components/business/pos/item-grid.tsx`
- [ ] `components/business/pos/cart.tsx`
- [ ] `components/business/pos/transaction-history.tsx`
- [ ] Sidebar entry ditambahkan
- [ ] Dark mode tested
