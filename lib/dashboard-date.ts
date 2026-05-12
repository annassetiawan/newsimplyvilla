export const PRESETS = [
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'last_7', label: 'Last 7 days' },
  { value: 'last_30', label: 'Last 30 days' },
  { value: 'last_90', label: 'Last 90 days' },
] as const

export type Preset = (typeof PRESETS)[number]['value']

export function getDateRange(preset: string) {
  const now = new Date()
  switch (preset) {
    case 'last_month': {
      const from = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const to = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 2, 1)
      const prevTo = new Date(now.getFullYear(), now.getMonth() - 1, 0, 23, 59, 59)
      return { from, to, prevFrom, prevTo }
    }
    case 'last_7': {
      const from = new Date(now.getTime() - 7 * 86_400_000)
      const prevFrom = new Date(now.getTime() - 14 * 86_400_000)
      const prevTo = new Date(from.getTime() - 1)
      return { from, to: now, prevFrom, prevTo }
    }
    case 'last_30': {
      const from = new Date(now.getTime() - 30 * 86_400_000)
      const prevFrom = new Date(now.getTime() - 60 * 86_400_000)
      const prevTo = new Date(from.getTime() - 1)
      return { from, to: now, prevFrom, prevTo }
    }
    case 'last_90': {
      const from = new Date(now.getTime() - 90 * 86_400_000)
      const prevFrom = new Date(now.getTime() - 180 * 86_400_000)
      const prevTo = new Date(from.getTime() - 1)
      return { from, to: now, prevFrom, prevTo }
    }
    default: {
      const from = new Date(now.getFullYear(), now.getMonth(), 1)
      const prevFrom = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const prevTo = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59)
      return { from, to: now, prevFrom, prevTo }
    }
  }
}
