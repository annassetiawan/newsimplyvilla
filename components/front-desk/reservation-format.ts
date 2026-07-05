export const STATUS_STYLE: Record<string, string> = {
  CONFIRMED: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  PENDING: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
  CHECKEDIN: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  CHECKEDOUT: 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500',
  CANCELLED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
}

export const STATUS_LABEL: Record<string, string> = {
  CONFIRMED: 'Confirmed',
  PENDING: 'Pending',
  CHECKEDIN: 'Checked In',
  CHECKEDOUT: 'Checked Out',
  CANCELLED: 'Cancelled',
}

export function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function fmtRp(n: number) {
  return `Rp ${n.toLocaleString('id-ID')}`
}

export function nightCount(ci: string, co: string) {
  return Math.ceil((new Date(co).getTime() - new Date(ci).getTime()) / 86400000)
}
