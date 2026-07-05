import Link from 'next/link'
import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
  actionHref?: string
  iconColor?: string
  minHeight?: string
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  actionLabel,
  onAction,
  actionHref,
  iconColor,
  minHeight = 'min-h-[320px]',
}: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center px-6 text-center', minHeight)}>
      <Icon
        className={cn('h-12 w-12', iconColor ?? 'text-neutral-300 dark:text-neutral-600')}
        strokeWidth={1.5}
      />
      <p className="mt-4 text-[15px] font-medium text-neutral-700 dark:text-neutral-300">
        {title}
      </p>
      <p
        className="mt-2 max-w-[280px] text-[13px] text-neutral-400 dark:text-neutral-500"
        style={{ lineHeight: 1.6 }}
      >
        {description}
      </p>
      {actionLabel && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
        >
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button"
          onClick={onAction}
          className="mt-5 rounded-lg bg-neutral-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-neutral-700 dark:bg-neutral-700 dark:hover:bg-neutral-600"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}
