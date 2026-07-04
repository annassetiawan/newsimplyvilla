'use client'

import Link from 'next/link'
import { Lock, Wallet, UserCheck, Globe, TrendingUp, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const proFeatures = [
  { label: 'Business', href: '/business', key: 'business', icon: TrendingUp },
  { label: 'Finance & Account', href: '/finance', key: 'finance', icon: Wallet },
  { label: 'Employee Management', href: '/employee', key: 'employee', icon: UserCheck },
  { label: 'Channel Manager', href: '/channel-manager', key: 'channel-manager', icon: Globe },
]

interface SidebarProSectionProps {
  pathname: string
  collapsed: boolean
  isPro: boolean
  isOwner: boolean
  canAccess: (key: string) => boolean
  onUpgrade: (feature: string) => void
}

export function SidebarProSection({
  pathname,
  collapsed,
  isPro,
  isOwner,
  canAccess,
  onUpgrade,
}: SidebarProSectionProps) {
  const visiblePro = proFeatures.filter((f) => canAccess(f.key))
  if (visiblePro.length === 0) return null

  return (
    <div className="mt-4">
      {!collapsed && (
        <div className="mb-1 flex items-center gap-2 px-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground/60">
            Pro Features
          </p>
        </div>
      )}
      {collapsed && <div className="mx-3 mb-3 mt-1 h-px bg-border" />}
      <div className="space-y-0.5 px-2">
        {visiblePro.map((item) => {
          const Icon = item.icon
          const isActive =
            isPro && (pathname === item.href || pathname.startsWith(item.href + '/'))

          if (isPro) {
            return (
              <Tooltip key={item.label}>
                <TooltipTrigger asChild>
                  <Link
                    href={item.href}
                    className={cn(
                      'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                      isActive
                        ? 'bg-muted text-foreground'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                      collapsed && 'justify-center px-2'
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                </TooltipTrigger>
                {collapsed && (
                  <TooltipContent side="right" className="font-medium">
                    {item.label}
                  </TooltipContent>
                )}
              </Tooltip>
            )
          }

          return (
            <Tooltip key={item.label}>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  onClick={() => onUpgrade(item.label)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition-colors',
                    'cursor-pointer text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground',
                    collapsed && 'justify-center px-2'
                  )}
                >
                  <Lock className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">{item.label}</span>
                      <span
                        className="shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                        style={{ background: '#E1A62F22', color: '#E1A62F' }}
                      >
                        PRO
                      </span>
                    </>
                  )}
                </button>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right" className="font-medium">
                  {item.label}{' '}
                  <span className="ml-1 text-[10px] font-bold text-[#E1A62F]">PRO</span>
                </TooltipContent>
              )}
            </Tooltip>
          )
        })}
      </div>
      {!collapsed && !isPro && isOwner && (
        <div className="px-2 pt-2">
          <Link
            href="/pricing"
            className="flex w-full items-center justify-center rounded-lg border border-border bg-muted py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:bg-muted/80 hover:text-foreground"
          >
            Pelajari lebih lanjut
          </Link>
        </div>
      )}
    </div>
  )
}

export function SidebarUpgradeBanner({ collapsed }: { collapsed: boolean }) {
  return (
    <div className="shrink-0 px-2 pb-2">
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>
            <Link
              href="/pricing"
              className="flex h-9 w-full items-center justify-center rounded-lg border border-[#E1A62F33] bg-[#E1A62F0D] text-[#E1A62F] transition-colors hover:bg-[#E1A62F1A]"
            >
              <Crown className="h-4 w-4 shrink-0" />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="right" className="font-medium">
            Upgrade ke Pro
          </TooltipContent>
        </Tooltip>
      ) : (
        <div className="flex items-center gap-2.5 rounded-lg bg-[#E1A62F0D] px-3 py-2.5">
          <Crown className="h-4 w-4 shrink-0 text-[#E1A62F]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13px] font-semibold leading-tight text-foreground">
              Upgrade ke Pro
            </p>
            <p className="text-[11px] text-muted-foreground">Unlock 6 fitur eksklusif</p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 rounded-md border border-[#E1A62F] px-2.5 py-1 text-[11px] font-semibold text-[#E1A62F] transition-colors hover:bg-[#E1A62F] hover:text-white"
          >
            Upgrade
          </Link>
        </div>
      )}
    </div>
  )
}
