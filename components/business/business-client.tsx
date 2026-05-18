'use client'

import { useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Store, ShoppingCart, ChevronUp } from 'lucide-react'
import { BusinessType, BusinessItemType } from './types'
import BusinessManage from './manage/business-list'
import PosLeftPanel from './pos/pos-left-panel'
import { Cart, CartEntry } from './pos/cart'

interface Props {
  businesses: BusinessType[]
  villaId: string
}

export default function BusinessClient({ businesses, villaId: _villaId }: Props) {
  const [activeTab, setActiveTab] = useState('manage')
  const [mobileCartOpen, setMobileCartOpen] = useState(false)

  // ── POS state ────────────────────────────────────────────────────────────
  const [selectedBizId, setSelectedBizId] = useState('')
  const [cart, setCart] = useState<CartEntry[]>([])
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'TRANSFER'>('CASH')
  const [note, setNote] = useState('')
  const [historyKey, setHistoryKey] = useState(0)

  const selectedBiz = businesses.find((b) => b.id === selectedBizId) ?? null
  const cartCount = cart.reduce((s, c) => s + c.qty, 0)
  const cartTotal = cart.reduce((s, c) => s + c.subtotal, 0)

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
    setMobileCartOpen(false)
  }

  const cartProps = {
    businessId: selectedBizId,
    cart,
    paymentMethod,
    note,
    onUpdateQty: updateQty,
    onRemove: removeFromCart,
    onPaymentMethodChange: setPaymentMethod,
    onNoteChange: setNote,
    onClearCart: clearCart,
  }

  const showMobileCartBar = activeTab === 'pos'

  return (
    <>
      <div className="-mx-4 -mb-4 -mt-4 lg:-mx-6 lg:-mb-6 lg:-mt-6 flex h-[calc(100dvh-3.5rem)] overflow-hidden">

        {/* ── Left: page content ──────────────────────────────────────── */}
        <div className="flex min-w-0 flex-1 flex-col overflow-hidden">

          {/* Page header */}
          <div className="shrink-0 border-b border-border px-4 py-5 lg:px-6">
            <h1 className="text-2xl font-bold tracking-tight">Business</h1>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Kelola unit bisnis dan transaksi penjualan villa
            </p>
          </div>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex min-h-0 flex-1 flex-col gap-0"
          >
            <div className="shrink-0 border-b border-border px-4 py-2 lg:px-6">
              <TabsList className="h-9">
                <TabsTrigger value="manage" className="gap-2">
                  <Store className="h-4 w-4" />
                  Manage
                </TabsTrigger>
                <TabsTrigger value="pos" className="gap-2">
                  <ShoppingCart className="h-4 w-4" />
                  POS
                  {activeTab !== 'pos' && cartCount > 0 && (
                    <span className="ml-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-foreground text-[10px] font-bold text-background">
                      {cartCount}
                    </span>
                  )}
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Manage tab */}
            <TabsContent value="manage" className="flex-1 overflow-y-auto p-4 lg:p-6">
              <BusinessManage initialBusinesses={businesses} />
            </TabsContent>

            {/* POS tab — extra bottom padding on mobile for the fixed cart bar */}
            <TabsContent value="pos" className="min-h-0 flex-1 overflow-hidden">
              <PosLeftPanel
                businesses={businesses}
                selectedBiz={selectedBiz}
                onSelectBiz={(id) => {
                  setSelectedBizId(id)
                  setCart([])
                  setNote('')
                }}
                onAddToCart={addToCart}
                historyKey={historyKey}
                mobileCartBarVisible
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* ── Right: cart sidebar — desktop only ──────────────────────── */}
        {activeTab === 'pos' && (
          <div className="hidden w-80 shrink-0 flex-col overflow-hidden border-l border-border lg:flex">
            <div className="shrink-0 border-b border-border px-5 py-5">
              <p className="text-base font-semibold">Keranjang</p>
            </div>
            <div className="flex min-h-0 flex-1 flex-col p-4">
              <Cart {...cartProps} />
            </div>
          </div>
        )}
      </div>

      {/* ── Mobile: fixed bottom cart bar ─────────────────────────────── */}
      {showMobileCartBar && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background px-4 pb-safe pt-3 pb-4 lg:hidden">
          <button
            onClick={() => setMobileCartOpen(true)}
            className="flex w-full items-center gap-3 rounded-xl bg-neutral-800 px-4 py-3 text-white dark:bg-neutral-200 dark:text-neutral-900"
          >
            <div className="relative">
              <ShoppingCart className="h-5 w-5" />
              {cartCount > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[9px] font-bold text-neutral-900 dark:bg-neutral-900 dark:text-white">
                  {cartCount}
                </span>
              )}
            </div>
            <span className="flex-1 text-left text-sm font-medium">
              {cartCount === 0 ? 'Keranjang kosong' : `${cartCount} item`}
            </span>
            {cartCount > 0 && (
              <span className="text-sm font-semibold">
                Rp{cartTotal.toLocaleString('id-ID')}
              </span>
            )}
            <ChevronUp className="h-4 w-4 opacity-70" />
          </button>
        </div>
      )}

      {/* ── Mobile: cart bottom sheet ──────────────────────────────────── */}
      <Sheet open={mobileCartOpen} onOpenChange={setMobileCartOpen}>
        <SheetContent side="bottom" className="flex h-[85dvh] flex-col rounded-t-2xl px-0 pb-0">
          <SheetHeader className="shrink-0 border-b border-border px-4 pb-3">
            <SheetTitle className="text-left">Keranjang</SheetTitle>
          </SheetHeader>
          <div className="flex min-h-0 flex-1 flex-col overflow-hidden px-4 pb-4 pt-2">
            <Cart {...cartProps} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
