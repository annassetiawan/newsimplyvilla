const RP_FORMATTER = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  maximumFractionDigits: 0,
})

export function formatRp(n: number) {
  return RP_FORMATTER.format(n)
}

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
]

export const MONTH_NAMES_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
]

export interface MonthlyPL {
  roomRevenue: number
  posRevenue: number
  otherIncome: number
  grossRevenue: number
  expenses: number
  netProfit: number
}

export function calcMonthlyPL(
  transactions: { date: string | Date; type: string; amount: number }[],
  reservations: { checkIn: string | Date; totalAmount: number; status: string }[],
  posTransactions: { createdAt: string | Date; total: number }[],
  month: number,
  year: number,
): MonthlyPL {
  const inRange = (date: string | Date) => {
    const d = new Date(date)
    return d.getMonth() + 1 === month && d.getFullYear() === year
  }

  const roomRevenue = reservations
    .filter((r) => inRange(r.checkIn))
    .reduce((sum, r) => sum + r.totalAmount, 0)

  const posRevenue = posTransactions
    .filter((t) => inRange(t.createdAt))
    .reduce((sum, t) => sum + t.total, 0)

  const otherIncome = transactions
    .filter((t) => t.type === 'INCOME' && inRange(t.date))
    .reduce((sum, t) => sum + t.amount, 0)

  const expenses = transactions
    .filter((t) => t.type === 'EXPENSE' && inRange(t.date))
    .reduce((sum, t) => sum + t.amount, 0)

  const grossRevenue = roomRevenue + posRevenue + otherIncome

  return { roomRevenue, posRevenue, otherIncome, grossRevenue, expenses, netProfit: grossRevenue - expenses }
}

export function calcLast6MonthsPL(
  transactions: { date: string | Date; type: string; amount: number }[],
  reservations: { checkIn: string | Date; totalAmount: number; status: string }[],
  posTransactions: { createdAt: string | Date; total: number }[],
  currentMonth: number,
  currentYear: number,
) {
  const months: { month: number; year: number; label: string }[] = []
  for (let i = 5; i >= 0; i--) {
    let m = currentMonth - i
    let y = currentYear
    if (m <= 0) { m += 12; y -= 1 }
    months.push({ month: m, year: y, label: MONTH_NAMES[m - 1] })
  }

  return months.map(({ month, year, label }) => ({
    label,
    month,
    year,
    ...calcMonthlyPL(transactions, reservations, posTransactions, month, year),
  }))
}

export function calcPettyCashBalance(pettyCash: { type: string; amount: number }[]) {
  return pettyCash.reduce((sum, p) => (p.type === 'IN' ? sum + p.amount : sum - p.amount), 0)
}
