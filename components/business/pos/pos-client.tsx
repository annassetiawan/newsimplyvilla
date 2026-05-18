'use client'

import { useState } from 'react'
import { BusinessSelector } from './business-selector'
import { ItemGrid } from './item-grid'
import { Cart, CartEntry } from './cart'
import { TransactionHistory } from './transaction-history'
import type { BusinessType, BusinessItemType } from '../types'

interface Props {
  businesses: BusinessType[]
}

// Viewport height minus: header(56px) + main-padding(48px) + page-title(52px)
// + gap(24px) + tabs-bar(36px) + tabs-margin(20px) + selector-row(36px) + gap(20px)
// ≈ 292px = 18.25rem  →  use 18.5rem for a little breathing room
const GRID_HEIGHT = 'calc(100dvh - 18.5rem)'

export default function PosClient({ businesses }: Props) {
  const [selectedBizId, setSelectedBizId] = useState<string>('')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
  const [note, setNote] = useState('')
  const [historyKey, setHistoryKey] = useState(0)

  const selectedBiz = businesses.find((b) => b.id === selectedBizId) ?? null
  const activeBusinesses = businesses.filter((b) => b.status === 'ACTIVE')

  function addToCart(item: BusinessItemType) {
    setCart((prev) => {
      const existing = prev.find((e) => e.itemId === item.id)
      if (existing) {
        return prev.map((e) =>
          e.itemId === item.id
            ? { ...e, qty: e.qty + 1, subtotal: (e.qty + 1) * item.price }
            : e
        )
      }
      return [
        ...prev,
        { itemId: item.id, name: item.name, price: item.price, qty: 1, subtotal: item.price },
      ]
    })
  }

  function updateQty(itemId: string, delta: number) {
    setCart((prev) => {
      const entry = prev.find((e) => e.itemId === itemId)
      if (!entry) return prev
      const newQty = entry.qty + delta
      if (newQty <= 0) return prev.filter((e) => e.itemId !== itemId)
      return prev.map((e) =>
        e.itemId === itemId ? { ...e, qty: newQty, subtotal: newQty * e.price } : e
      )
    })
  }

  function removeFromCart(itemId: string) {
    setCart((prev) => prev.filter((e) => e.itemId !== itemId))
  }

  function clearCart() {
    setCart([])
    setNote('')
    setHistoryKey((k) => k + 1)
  }

  if (activeBusinesses.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-muted-foreground">
        Belum ada unit bisnis aktif. Aktifkan bisnis di tab Manage terlebih dahulu.
      </p>
    )
  }

  return (
    <div
      className="flex min-h-[480px] gap-5 overflow-hidden rounded-xl border border-border"
      style={{ height: GRID_HEIGHT }}
    >
      {/* ── Left panel: item catalog + history ── */}
      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        {/* Selector bar */}
        <div className="shrink-0 border-b border-border px-4 py-3">
          <BusinessSelector
            businesses={businesses}
            value={selectedBizId}
            onChange={(id) => {
              setSelectedBizId(id)
              setCart([])
              setNote('')
            }}
          />
        </div>

        {!selectedBiz ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="text-sm text-muted-foreground">Pilih unit bisnis untuk mulai transaksi.</p>
          </div>
        ) : (
          <div className="flex flex-1 flex-col overflow-y-auto">
            {/* Catalog */}
            <div className="space-y-3 p-4">
              <p className="text-sm font-medium">Katalog — {selectedBiz.name}</p>
              <ItemGrid items={selectedBiz.items} onAdd={addToCart} />
            </div>

            {/* Divider + history */}
            <div className="border-t border-border px-4 py-3 space-y-3">
              <p className="text-sm font-medium">Riwayat Transaksi</p>
              <TransactionHistory businessId={selectedBizId} refreshKey={historyKey} />
            </div>
          </div>
        )}
      </div>

      {/* ── Right panel: cart (full height, never scrolls with page) ── */}
      <div className="flex w-80 shrink-0 flex-col overflow-hidden border-l border-border">
        <div className="shrink-0 border-b border-border px-4 py-3">
          <p className="text-sm font-medium">Keranjang</p>
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-4">
          <Cart
            businessId={selectedBizId}
            cart={cart}
            paymentMethod={paymentMethod}
            note={note}
            onUpdateQty={updateQty}
            onRemove={removeFromCart}
            onPaymentMethodChange={setPaymentMethod}
            onNoteChange={setNote}
            onClearCart={clearCart}
          />
        </div>
      </div>
    </div>
  )
}
