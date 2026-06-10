'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import { PlanToggle } from './plan-toggle'

interface VillaData {
  id: string
  name: string
  slug: string | null
  email: string | null
  ownerName: string | null
  plan: string
  status: string
  createdAt: string
}

interface VillaTableProps {
  villas: VillaData[]
}

export function VillaTable({ villas }: VillaTableProps) {
  const [search, setSearch] = useState('')

  const filtered = villas.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      (v.slug ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (v.ownerName ?? '').toLowerCase().includes(search.toLowerCase()) ||
      (v.email ?? '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search villas..."
          className="pl-8"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-sm text-muted-foreground">
            {search ? 'No villas match your search.' : 'No villas registered yet.'}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Villa</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Owner</th>
                <th className="px-4 py-3 text-left font-medium text-muted-foreground">Email</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Plan</th>
                <th className="px-4 py-3 text-center font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3 text-right font-medium text-muted-foreground">Registered</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-border last:border-0 transition-colors hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/villas/${v.id}`}
                      className="font-medium hover:text-primary transition-colors"
                    >
                      {v.name}
                    </Link>
                    <p className="text-xs text-muted-foreground">/{v.slug}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{v.ownerName ?? '—'}</td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">{v.email ?? '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-center">
                      <PlanToggle villa={v} />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Badge
                      variant="outline"
                      className={
                        v.status === 'ACTIVE'
                          ? 'border-emerald-200 text-emerald-700'
                          : 'border-red-200 text-red-700'
                      }
                    >
                      {v.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                    {new Date(v.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="text-xs text-muted-foreground">
        {filtered.length} of {villas.length} villas
      </p>
    </div>
  )
}
