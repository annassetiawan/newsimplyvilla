'use client'

import { BusinessSelector } from './business-selector'
import { ItemGrid } from './item-grid'
import { TransactionHistory } from './transaction-history'
import type { BusinessType, BusinessItemType } from '../types'

interface Props {
  businesses: BusinessType[]
  selectedBiz: BusinessType | null
  onSelectBiz: (id: string) => void
  onAddToCart: (item: BusinessItemType) => void
  historyKey: number
  mobileCartBarVisible?: boolean
}

export default function PosLeftPanel({
  businesses,
  selectedBiz,
  onSelectBiz,
  onAddToCart,
  historyKey,
  mobileCartBarVisible,
}: Props) {
  const activeBusinesses = businesses.filter((b) => b.status === 'ACTIVE')

  if (activeBusinesses.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-muted-foreground">
          Belum ada unit bisnis aktif. Aktifkan bisnis di tab Manage terlebih dahulu.
        </p>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Sticky selector bar */}
      <div className="shrink-0 border-b border-border bg-background px-4 py-3 lg:px-6">
        <BusinessSelector
          businesses={businesses}
          value={selectedBiz?.id ?? ''}
          onChange={onSelectBiz}
        />
      </div>

      {!selectedBiz ? (
        <div className="flex flex-1 items-center justify-center">
          <p className="text-sm text-muted-foreground">Pilih unit bisnis untuk mulai transaksi.</p>
        </div>
      ) : (
        <div className={`flex-1 overflow-y-auto${mobileCartBarVisible ? ' pb-20 lg:pb-0' : ''}`}>
          {/* Catalog */}
          <div className="space-y-3 p-4 lg:p-6">
            <p className="text-sm font-medium text-muted-foreground">
              Katalog — {selectedBiz.name}
            </p>
            <ItemGrid items={selectedBiz.items} onAdd={onAddToCart} />
          </div>

          {/* Transaction history */}
          <div className="border-t border-border px-4 py-4 space-y-3 lg:px-6">
            <p className="text-sm font-medium text-muted-foreground">Riwayat Transaksi</p>
            <TransactionHistory businessId={selectedBiz.id} refreshKey={historyKey} />
          </div>
        </div>
      )}
    </div>
  )
}
